import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDuration(durationStr: string | null | undefined): number {
  if (!durationStr) return 30;
  const str = String(durationStr).toLowerCase().trim();

  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length >= 2) {
      return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    }
  }

  let minutes = 0;
  let foundUnit = false;

  const hMatch = str.match(/(\d+)\s*(h|hora|horas)/);
  if (hMatch) {
    minutes += (parseInt(hMatch[1], 10) || 0) * 60;
    foundUnit = true;
  }

  const mMatch = str.match(/(\d+)\s*(m|min|minuto|minutos)/);
  if (mMatch) {
    minutes += parseInt(mMatch[1], 10) || 0;
    foundUnit = true;
  }

  if (foundUnit) {
    return minutes > 0 ? minutes : 30;
  }

  const num = parseInt(str.replace(/\D/g, ''), 10);
  return !isNaN(num) && num > 0 ? num : 30;
}
