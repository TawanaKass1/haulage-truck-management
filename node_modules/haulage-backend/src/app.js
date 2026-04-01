import cors from "cors";
import express from "express";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import truckRoutes from "./routes/truckRoutes.js";
import { adminOnly } from "./middleware/auth.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(",") || "*"
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/trucks", adminOnly, truckRoutes);
app.use("/api/drivers", adminOnly, driverRoutes);
app.use("/api/jobs", adminOnly, jobRoutes);

app.use(errorMiddleware);

export default app;
