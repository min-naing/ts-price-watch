export function getMyanmarDate(): string {
  // Always reads the absolute current timestamp
  const date = new Date(); 
  
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}