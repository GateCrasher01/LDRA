# Machine Learning Service (Flask + Random Forest)

This folder contains:
- `train.py`: trains a **RandomForestClassifier** model and saves it as `loan_model.pkl`
- `app.py`: Flask prediction API exposing `POST /predict`

## Model file

The Flask app expects `loan_model.pkl` to exist in this folder. If it doesn't:

```bash
python train.py
```

## Run the ML API

```bash
pip install -r requirements.txt
python app.py
```

Default port is `5001`.

## Prediction API

Endpoint: `POST /predict`

Request body (minimum required):
```json
{
  "credit_score": 650,
  "income": 60000,
  "age": 30,
  "loan_amount": 100000,
  "loan_term": 36
}
```

Optional:
```json
{ "employment_status": "unemployed" }
```

Response:
```json
{ "prediction": 0, "probability": 0.12 }
```

## Dataset note

Because you don't have a real dataset yet, `train.py` trains on a **synthetic demo dataset** that preserves realistic relationships between features and default risk.

When you have a real loan default dataset, update `make_synthetic_loan_dataset()` to load and preprocess your dataset, then re-run `python train.py`.

