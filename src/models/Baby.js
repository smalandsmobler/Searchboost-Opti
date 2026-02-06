let babies = [];
let nextId = 1;

export function getAllBabies() {
  return babies;
}

export function getBabyById(id) {
  return babies.find((b) => b.id === id);
}

export function createBaby({ name, birthDate, gender }) {
  const baby = {
    id: nextId++,
    name,
    birthDate,
    gender,
    createdAt: new Date().toISOString(),
  };
  babies.push(baby);
  return baby;
}
