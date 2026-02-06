import { Router } from "express";
import { getBabyById } from "../models/Baby.js";
import { getMilestonesByBabyId, addMilestone } from "../models/Milestone.js";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const babyId = Number(req.params.id);
  const baby = getBabyById(babyId);
  if (!baby) return res.status(404).json({ error: "Barnet hittades inte" });
  res.json(getMilestonesByBabyId(babyId));
});

router.post("/", (req, res) => {
  const babyId = Number(req.params.id);
  const baby = getBabyById(babyId);
  if (!baby) return res.status(404).json({ error: "Barnet hittades inte" });

  const { date, title, description } = req.body;
  if (!date || !title) {
    return res.status(400).json({ error: "date och title krävs" });
  }

  const milestone = addMilestone(babyId, { date, title, description });
  res.status(201).json(milestone);
});

export default router;
