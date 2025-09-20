import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import codeRouter from "./pair.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Event listener limit වැඩි කරලා
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 500;

// ✅ Middleware order correct
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ API routes
app.use("/code", codeRouter);

// ✅ Root route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "pair.html"));
});

// ✅ Health check endpoint (Koyeb / Render / Vercel use කරන්නේ මේක check කරන්න)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`⏩ Server running on http://localhost:${PORT}`);
});

export default app;
