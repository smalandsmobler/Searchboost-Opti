/**
 * Linnéa schedule — AI-rådgivaren är "online" måndag–fredag 08:00–12:00 och 13:00–17:00
 * Allt baserat på Europe/Stockholm-tid.
 */

export type LinnéaStatus = "online" | "lunch" | "offline";

export interface LinnéaInfo {
  status: LinnéaStatus;
  label: string;         // "Online", "Lunch", "Offline"
  sublabel: string;      // "Svarar direkt", "Tillbaka 13:00", "Öppnar måndag 08:00" etc.
  nextOnline: string;    // ISO-sträng för nästa online-tid, eller "" om redan online
}

const WORK_START = 8;
const LUNCH_START = 12;
const LUNCH_END = 13;
const WORK_END = 17;

/** Returnerar nuvarande Stockholm-tid som ett Date-objekt */
function stockholmNow(): { dow: number; hour: number; minute: number; date: Date } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minStr = parts.find((p) => p.type === "minute")?.value ?? "0";
  const dayStr = parts.find((p) => p.type === "weekday")?.value ?? "mån";

  const dowMap: Record<string, number> = {
    mån: 1, tis: 2, ons: 3, tor: 4, fre: 5, lör: 6, sön: 0,
  };

  return {
    dow: dowMap[dayStr] ?? now.getDay(),
    hour: parseInt(hourStr, 10),
    minute: parseInt(minStr, 10),
    date: now,
  };
}

function isWeekday(dow: number) {
  return dow >= 1 && dow <= 5;
}

export function getLinnéaInfo(): LinnéaInfo {
  const { dow, hour, minute } = stockholmNow();
  const decimalHour = hour + minute / 60;

  if (
    isWeekday(dow) &&
    decimalHour >= WORK_START &&
    decimalHour < LUNCH_START
  ) {
    return {
      status: "online",
      label: "Online",
      sublabel: "Svarar direkt",
      nextOnline: "",
    };
  }

  if (
    isWeekday(dow) &&
    decimalHour >= LUNCH_END &&
    decimalHour < WORK_END
  ) {
    return {
      status: "online",
      label: "Online",
      sublabel: "Svarar direkt",
      nextOnline: "",
    };
  }

  if (isWeekday(dow) && decimalHour >= LUNCH_START && decimalHour < LUNCH_END) {
    return {
      status: "lunch",
      label: "Lunch",
      sublabel: "Tillbaka 13:00",
      nextOnline: "13:00",
    };
  }

  // Offline — räkna ut nästa online-tid
  let nextLabel = "";
  if (isWeekday(dow) && decimalHour < WORK_START) {
    nextLabel = "Öppnar 08:00";
  } else if (dow === 5 && decimalHour >= WORK_END) {
    nextLabel = "Öppnar måndag 08:00";
  } else if (dow === 6) {
    nextLabel = "Öppnar måndag 08:00";
  } else if (dow === 0) {
    nextLabel = "Öppnar måndag 08:00";
  } else {
    // Vardag kväll
    nextLabel = "Öppnar imorgon 08:00";
  }

  return {
    status: "offline",
    label: "Offline",
    sublabel: nextLabel,
    nextOnline: nextLabel,
  };
}

export function isLinnéaOnline(): boolean {
  return getLinnéaInfo().status === "online";
}
