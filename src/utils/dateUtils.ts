/**
 * Utility functions for local date handling without UTC shifts.
 */

// Format a Date object to "YYYY-MM-DD" using local year, month, day
export function formatDateLocal(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Get today's date string "YYYY-MM-DD" in local time
export function getTodayString(): string {
  return formatDateLocal(new Date());
}

// Parse a "YYYY-MM-DD" string into a local Date object (midnight local time)
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
}
