const milestoneRecords = new Map();

export function getMilestonesByBabyId(babyId) {
  return milestoneRecords.get(babyId) || [];
}

export function addMilestone(babyId, { date, title, description }) {
  if (!milestoneRecords.has(babyId)) {
    milestoneRecords.set(babyId, []);
  }
  const milestone = {
    date,
    title,
    description: description || "",
    createdAt: new Date().toISOString(),
  };
  milestoneRecords.get(babyId).push(milestone);
  milestoneRecords.get(babyId).sort((a, b) => new Date(a.date) - new Date(b.date));
  return milestone;
}
