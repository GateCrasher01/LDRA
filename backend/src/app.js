import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import loanRoutes from "./routes/loan.js";
import analyticsRoutes from "./routes/analytics.js";
dotenv.config();
const app = express();
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", loanRoutes);
app.use("/api/analytics", analyticsRoutes);
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
const PORT = process.env.PORT || 5000;
const DEFAULT_DB = process.env.MONGO_DB_NAME || "lendingRiskDB";
const RAW_MONGO_URI = process.env.MONGO_URI || `mongodb://localhost:27017/${DEFAULT_DB}`;
function normalizeMongoUri(uri) {
  try {
    const u = new URL(uri);
    const isMongoSrv = u.protocol === "mongodb+srv:" || u.protocol === "mongodb:";
    if (!isMongoSrv) return uri;
    if (!u.pathname || u.pathname === "/") {
      u.pathname = `/${DEFAULT_DB}`;
      return u.toString();
    }
    return uri;
  } catch {
    return uri;
  }
}
const MONGO_URI = normalizeMongoUri(RAW_MONGO_URI);
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
export default app;