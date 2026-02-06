import { Router } from "express";
import { getBabyById } from "../models/Baby.js";
import { getGrowthByBabyId, addGrowthRecord } from "../models/Growth.js";
import { getPercentileData } from "../data/who-percentiles.js";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const babyId = Number(req.params.id);
  const baby = getBabyById(babyId);
  if (!baby) return res.status(404).json({ error: "Barnet hittades inte" });
  res.json(getGrowthByBabyId(babyId));
});

router.post("/", (req, res) => {
  const babyId = Number(req.params.id);
  const baby = getBabyById(babyId);
  if (!baby) return res.status(404).json({ error: "Barnet hittades inte" });

  const { date, weightKg, heightCm, headCircumferenceCm } = req.body;
  if (!date) {
    return res.status(400).json({ error: "date krävs" });
  }
  if (!weightKg && !heightCm && !headCircumferenceCm) {
    return res.status(400).json({ error: "Minst ett mätvärde krävs (weightKg, heightCm, headCircumferenceCm)" });
  }

  const record = addGrowthRecord(babyId, { date, weightKg, heightCm, headCircumferenceCm });
  res.status(201).json(record);
});

router.get("/chart", (req, res) => {
  const babyId = Number(req.params.id);
  const baby = getBabyById(babyId);
  if (!baby) return res.status(404).json({ error: "Barnet hittades inte" });

  const records = getGrowthByBabyId(babyId);
  const gender = baby.gender;
  const birthDate = new Date(baby.birthDate);

  const dataPoints = records.map((r) => {
    const ageMonths = (new Date(r.date) - birthDate) / (1000 * 60 * 60 * 24 * 30.44);
    return {
      date: r.date,
      ageMonths: Math.round(ageMonths * 10) / 10,
      weightKg: r.weightKg,
      heightCm: r.heightCm,
    };
  });

  const result = { baby: { id: baby.id, name: baby.name, gender }, dataPoints };

  if (gender) {
    result.percentiles = {
      weight: getPercentileData(gender, "weight"),
      height: getPercentileData(gender, "height"),
    };
  }

  res.json(result);
});

export default router;
