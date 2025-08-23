import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import env from "./config/env.js";
import * as rateLimiter from "./middleware/rate-limiter.js";
import * as handler from "./handler.js";

const app = express();

app.use(helmet());
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: "10mb" }));
app.use(rateLimiter.limiter);

app.use(cors("*"));

app.get("/", handler.welcome);
app.get("/student/pict/:nim", handler.getStudentPict);
app.post("/student/batch", rateLimiter.batchLimiter, handler.getStudentBatch);

// Health check endpoint for monitoring
app.get("/health", (_req, res) => {
  res.json({ 
    ok: true, 
    msg: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(env.appPort, () => {
  console.log(`App listening on port ${env.appPort}`);
});
