const growthRecords = new Map();

export function getGrowthByBabyId(babyId) {
  return growthRecords.get(babyId) || [];
}

export function addGrowthRecord(babyId, { date, weightKg, heightCm, headCircumferenceCm }) {
  if (!growthRecords.has(babyId)) {
    growthRecords.set(babyId, []);
  }
  const record = {
    date,
    weightKg: weightKg ?? null,
    heightCm: heightCm ?? null,
    headCircumferenceCm: headCircumferenceCm ?? null,
    createdAt: new Date().toISOString(),
  };
  growthRecords.get(babyId).push(record);
  growthRecords.get(babyId).sort((a, b) => new Date(a.date) - new Date(b.date));
  return record;
}
