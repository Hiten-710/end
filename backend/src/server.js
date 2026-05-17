import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import aiRoutes from "./routes/ai.js";
import candidateRoutes from "./routes/candidates.js";
import matchRoutes from "./routes/match.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(",") || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Candidate Shortlisting API is running." });
});

app.use("/api/candidates", candidateRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/ai", aiRoutes);

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({ message: "Candidate Shortlisting API is running." });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Something went wrong." });
});

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing backend or set a different PORT in .env.`);
    process.exit(1);
  }

  console.error("Server failed to start:", error.message);
  process.exit(1);
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected. Candidate data will be persisted.");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    console.error("Using in-memory candidate storage for this local session.");
  });
