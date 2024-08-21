import express from "express";
import env from "./env.js";
import * as handler from "./handler.js";

const app = express();

app.get("/", handler.welcome);
app.get("/student/pict/:nim", handler.getStudentPict);
app.get("/student/:nim", handler.getStudent);

app.listen(env.appPort, () => {
  console.log(`App listening on port ${env.appPort}`);
});
