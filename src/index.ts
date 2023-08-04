import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import instancesRouter from "./app/routers/instances";

dotenv.config();

const app = express();
const port = process.env.PORT || 6544;

export const client =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5990"
    : "https://admin.failean.com";

app.use(express.json());

app.use(
  cors({
    origin: [client],
    credentials: true,
  })
);

app.get("/areyoualive", (_, res) => {
  res.json({ answer: "yes", version: process.env.npm_package_version });
});

app.listen(port as any, "0.0.0.0", () => {
  console.log(`Server ready at http://0.0.0.0:${port}`);
});

app.use("/instances", instancesRouter);
