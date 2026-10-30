/**
 * Clamps a value given 2 boundaries
 * If the value is less than the minimum, it returns the minimum.
 * If the value is greater than the maximum, it returns the maximum.
 * If the value is in between, it leaves the number as it is.
 * @param a the lower boundary
 * @param x the numer to clamp
 * @param b the higher boundary
 * @returns {number} The clamped value
 */
export function clamp(a: number, x: number, b: number): number {
  return Math.max(a, Math.min(x, b));
}

/**
 * Formats seconds in the format of 0h 0m 0s.
 * @param seconds The seconds to format
 * @returns {string} The formatted string
 */
export function formatSeconds(seconds: number): string {
  if (seconds <= 0) {
    return "0s";
  }
  let formattedString = "";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor(seconds / 60 - hrs * 60);
  const secs = Math.floor(seconds - hrs * 3600 - mins * 60);

  if (hrs > 0) {
    formattedString += `${hrs}h `;
  }

  if (mins > 0) {
    formattedString += `${mins}m `;
  }

  if (secs > 0) {
    formattedString += `${secs}s`;
  }

  return formattedString.trim();
}

/**
 * Floors a number to 1 decimal digit
 * @param num The number to floor
 * @returns The floored number
 */
export function floorTo1(num: number): number {
  return Math.floor(num * 10) / 10;
}
