import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — the classnames helper used throughout the app (minified to `G`).
 * In the bundle it is `lS(tS(...))`: clsx feeding a tailwind-merge pass.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
