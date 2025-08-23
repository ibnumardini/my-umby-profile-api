import express from "express";
import cors from "cors"
import env from "./env.js";
import * as handler from "./handler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", handler.welcome);
app.get("/student/pict/:nim", handler.getStudentPict);
app.post("/student/batch", handler.getStudentBatch);

app.listen(env.appPort, () => {
  console.log(`App listening on port ${env.appPort}`);
});
