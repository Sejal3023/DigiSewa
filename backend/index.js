import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables FIRST, before any other imports that might use them
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
console.log('🔧 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// Import routes AFTER dotenv is loaded
import authRoutes from "./src/routes/auth.js";
import applicationsRoutes from "./src/routes/applications.js";

import blockchainRoutes from "./src/routes/blockchain.js";
import licensesRoutes from "./src/routes/licenses.js";
import officerRoutes from "./src/routes/officer.js";
import adminRoutes from "./src/routes/admin.js";
import documentsRoutes from "./src/routes/documents.js";
import departmentsRoutes from "./src/routes/departments.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import profileRoutes from './src/routes/profile.js';
import transfersRoutes from "./src/routes/transfers.js";
import approvalsRoutes from "./src/routes/approvals.js";
import notificationsRoutes from "./src/routes/notifications.js";

// Debug environment variables (with better formatting)
console.log('📋 Environment variables loaded:');
console.log('POSTGRES_USER:', process.env.POSTGRES_USER || 'not set');
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '*** (set)' : 'not set');
console.log('POSTGRES_PASSWORD type:', typeof process.env.POSTGRES_PASSWORD);
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST || 'not set');
console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT || 'not set');
console.log('POSTGRES_DB:', process.env.POSTGRES_DB || 'not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('---');

const app = express();
const PORT = process.env.PORT || 5002; // Use port from .env, with a fallback just in case.

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));



// Root route
app.get("/", (_req, res) => {
  res.json({ 
    message: "DigiSewa Backend API is running!", 
    version: "1.0.0",
    time: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: "/auth",
      applications: "/applications",
      blockchain: "/blockchain",
      licenses: "/licenses",
      officer: "/officer",
      admin: "/admin",
      documents: "/documents",
      departments: "/departments"
    }
  });
});


app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API info route
app.get("/api", (_req, res) => {
  res.json({
    name: "DigiSewa API",
    description: "Blockchain-Based Digital Government License & Registration System",
    version: "1.0.0",
    status: "running"
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/licenses", licensesRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/profile', profileRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 DigiSewa backend listening on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
