import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { initWebSocket } from "./ws/socket.js";
import metricsRouter from "./routes/metrics.js";
import healthRouter from "./routes/health.js";
import configRouter from "./routes/config.js";
import securityRouter from "./routes/security.js";
import { startScheduler } from "./services/scheduler.js";
import { securityLogger } from "./middleware/securityLogger.js";

dotenv.config();

const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(securityLogger());

app.use("/api/health", healthRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/config", configRouter);
app.use("/api/security", securityRouter);

const port = process.env.PORT || 4000;

const server = http.createServer(app);
const wss = initWebSocket(server);

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/realmonitor";

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("MongoDB connected");
    startScheduler({ wss });
    server.listen(port, () => {
      console.log(`Backend listening on :${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
