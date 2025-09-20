import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pairRouter from "./pair.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use("/code", pairRouter);

// Serve HTML UI
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "pair.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`⏩ Server running on http://localhost:${PORT}`);
});
