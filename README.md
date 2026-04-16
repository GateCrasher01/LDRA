# 🖥️ Lending Risk Assessment Platform (LDRA)
An intelligent, cloud-native banking and risk-assessment dashboard. LDRA replaces manual spreadsheet analysis by bridging a modern **React web app** with a **Python Machine Learning microservice** to instantly predict loan default probabilities in real-time.

---

## ✨ Key Features
- **🧠 Predictive Analytics:** Uses a trained `scikit-learn` Random Forest to output a live _Default Probability_ and _Risk Level_ (Low, Medium, High).
- **📊 Real-time Dashboard:** Built iteratively with `Recharts` providing live macro-metrics on Approval Rates, Debt-to-Income distributions, and aggregate portfolio values modeled for Indian limits.
- **🔒 Secure Banking Standards:** Requires strict password architecture and protects routes with hardened JSON Web Tokens (JWT).
- **☁️ Cloud-Native Microservices:** Architected specifically to decouple the heavy Machine Learning pipeline from standard database CRUD operations.

---

## 🏗 Architecture & Stack 

### 1. Frontend (Vite + React)
- Hosted on **Vercel** for lightning-fast Edge-CDN delivery.
- Uses `wouter` for lightweight routing, `@tanstack/react-query` for server synchronization, and `lucide-react` for scalable UI.

### 2. Core Backend API (Node.js + Express)
- Hosted on **Render**, orchestrating records into **MongoDB Atlas**.
- Responsible for authentication, fetching dynamic chart mappings, and proxying data securely to the Python ML Engine.

### 3. ML Risk Microservice (Python + Flask)
- Hosted on **Render** utilizing `gunicorn`. 
- Evaluates borrower parameters (Credit Score, Term, Income, Age, Debt Constraints) against a pre-trained `.pkl` model to catch bad loans before they happen.

---

## ☁️ Deployment Strategy 

This repository includes a highly-calibrated `.gitignore` optimized for auto-deployments. 
1. The **React UI** can be directly connected to **Vercel**.
2. The **Node Backend** can be deployed as a **Render Web Service** (Command: `npm start`).
3. The **Flask ML Server** can be deployed as a **Render Web Service** (Build Command: `pip install -r requirements.txt`, Start Command: `gunicorn app:app`).
