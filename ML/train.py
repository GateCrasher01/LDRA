import os
import joblib
import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

def get_mongodb_loan_dataset() -> tuple[pd.DataFrame, np.ndarray]:

    backend_env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    load_dotenv(dotenv_path=backend_env_path)

    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI is missing. Please ensure the backend/.env is accessible.")

    print("Connecting to MongoDB Atlas...")
    client = MongoClient(mongo_uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["lendingRiskDB"]

    collection = db["loanapplications"]

    cursor = collection.find({"status": {"$in": ["approved", "rejected"]}})
    records = list(cursor)

    if not records:
        print("No historically approved/rejected records found in MongoDB.")
        return pd.DataFrame(), np.array([])

    data_rows = []
    labels = []

    for rec in records:
        try:

            row = {
                "credit_score": float(rec.get("creditScore", 0)),
                "income": float(rec.get("income", 0)),
                "age": float(rec.get("age", 0)),
                "loan_amount": float(rec.get("loanAmount", 0)),
                "loan_term": float(rec.get("loanTerm", 0)),
                "employment_status": str(rec.get("employmentStatus", "employed")),
            }
            data_rows.append(row)

            label = 1 if rec.get("status") == "rejected" else 0
            labels.append(label)
        except (TypeError, ValueError):
            continue 

    X = pd.DataFrame(data_rows)
    y = np.array(labels)

    return X, y

def train_and_save(model_path: str) -> None:
    X, y = get_mongodb_loan_dataset()

    if len(X) < 10:
        print(f"Warning: Only {len(X)} records found. Skipping training to avoid destroying the existing model. Database lacks minimum data requirements (10+ records needed).")
        return

    unique_classes = np.unique(y)
    if len(unique_classes) < 2:
        print("Warning: All retrieved records have the EXACT same status (either all approved, or all rejected). Random forest requires mixed sets to derive insights. Skipping training until variance occurs.")
        return

    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=52, stratify=y)
    except ValueError:
        print("Fallback to unstratified split due to extreme class imbalance in minimal dataset.")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=52)

    numeric_features = ["credit_score", "income", "age", "loan_amount", "loan_term"]
    categorical_features = ["employment_status"]

    numeric_transformer = Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))])
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
    )

    calibrated_clf = CalibratedClassifierCV(clf, method="isotonic", cv=5)

    model = Pipeline(steps=[("preprocess", preprocessor), ("clf", calibrated_clf)])
    model.fit(X_train, y_train)

    test_pred = model.predict(X_test)
    acc = (test_pred == y_test).mean()

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    non_zero_mask = y_test != 0
    if np.any(non_zero_mask):
        mape = np.mean(np.abs(y_test[non_zero_mask] - y_pred_proba[non_zero_mask]) / np.abs(y_test[non_zero_mask])) * 100
    else:
        mape = 0.0

    print(f"\nTrained model on {len(X_train)} samples, tested on {len(X_test)} samples.")
    print(f"Test Accuracy : {acc * 100:.2f}%")
    print(f"MAPE          : {mape:.2f}%")

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    print(f"Saved model to: {model_path}")

def main() -> None:
    root = os.path.dirname(__file__)
    model_path = os.environ.get("MODEL_PATH", os.path.join(root, "loan_model.pkl"))
    train_and_save(model_path)

if __name__ == "__main__":
    main()
