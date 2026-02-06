import express from "express";
import babiesRouter from "./routes/babies.js";
import growthRouter from "./routes/growth.js";
import milestonesRouter from "./routes/milestones.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Babylovesgrowth",
    version: "0.1.0",
    endpoints: [
      "GET  /api/babies",
      "POST /api/babies",
      "GET  /api/babies/:id",
      "POST /api/babies/:id/growth",
      "GET  /api/babies/:id/growth",
      "GET  /api/babies/:id/growth/chart",
      "POST /api/babies/:id/milestones",
      "GET  /api/babies/:id/milestones",
    ],
  });
});

app.use("/api/babies", babiesRouter);
app.use("/api/babies/:id/growth", growthRouter);
app.use("/api/babies/:id/milestones", milestonesRouter);

app.listen(PORT, () => {
  console.log(`Babylovesgrowth running on http://localhost:${PORT}`);
});

export default app;
