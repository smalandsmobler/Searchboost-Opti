import { Router } from "express";
import { getAllBabies, getBabyById, createBaby } from "../models/Baby.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getAllBabies());
});

router.get("/:id", (req, res) => {
  const baby = getBabyById(Number(req.params.id));
  if (!baby) return res.status(404).json({ error: "Barnet hittades inte" });
  res.json(baby);
});

router.post("/", (req, res) => {
  const { name, birthDate, gender } = req.body;
  if (!name || !birthDate) {
    return res.status(400).json({ error: "name och birthDate krävs" });
  }
  if (gender && !["boy", "girl"].includes(gender)) {
    return res.status(400).json({ error: "gender måste vara 'boy' eller 'girl'" });
  }
  const baby = createBaby({ name, birthDate, gender: gender || null });
  res.status(201).json(baby);
});

export default router;
