/** Calendar helpers for a user's IANA timezone. Timestamps remain UTC. */
export const DEFAULT_TIME_ZONE = "UTC";

export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
}

type DateParts = { year: number; month: number; day: number };

function partsInTimeZone(value: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function keyFromParts({ year, month, day }: DateParts) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyInTimeZone(
  value: Date | string = new Date(),
  timeZone = browserTimeZone(),
) {
  return keyFromParts(
    partsInTimeZone(
      typeof value === "string" ? new Date(value) : value,
      timeZone,
    ),
  );
}

/** Returns the UTC instant at midnight for a calendar date in the supplied zone. */
export function startOfDayInTimeZone(
  value: Date | string = new Date(),
  timeZone = browserTimeZone(),
) {
  const key =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : dateKeyInTimeZone(value, timeZone);
  const [year, month, day] = key.split("-").map(Number);
  let timestamp = Date.UTC(year, month - 1, day);
  for (let index = 0; index < 2; index += 1) {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(timestamp));
    const get = (type: string) =>
      Number(formatted.find((part) => part.type === type)?.value);
    const renderedAsUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    timestamp = Date.UTC(year, month - 1, day) - (renderedAsUtc - timestamp);
  }
  return new Date(timestamp);
}

export function addCalendarDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export function dayOfWeek(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

export function formatInTimeZone(
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
  timeZone = browserTimeZone(),
) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function todayInTimeZone(timeZone = browserTimeZone()) {
  return dateKeyInTimeZone(new Date(), timeZone);
}

/** Replaces an instant's local calendar date while preserving its local time. */
export function moveToLocalDate(value: Date | string, dateKey: string) {
  const original = typeof value === "string" ? new Date(value) : value;
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(
    year,
    month - 1,
    day,
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds(),
  ).toISOString();
}
