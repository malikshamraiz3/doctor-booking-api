// "09:00" → minutes mein convert karta hai → 540
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// 540 minutes → "09:00" format mein wapas
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// startTime="09:00", endTime="17:00", duration=30
// Result: ["09:00", "09:30", "10:00" ... "16:30"]
export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  slotDuration: number
): string[] => {
  const slots: string[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + slotDuration <= end) {
    slots.push(minutesToTime(current));
    current += slotDuration;
  }

  return slots;
};