import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./env.js";
import * as rateLimiter from "./middleware/rate-limiter.js";
import * as handler from "./handler.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(rateLimiter.limiter);

app.use(cors());

app.get("/", handler.welcome);
app.get("/student/pict/:nim", handler.getStudentPict);
app.post("/student/batch", rateLimiter.batchLimiter, handler.getStudentBatch);

app.listen(env.appPort, () => {
  console.log(`App listening on port ${env.appPort}`);
});
