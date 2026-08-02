import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_TIME_ZONE } from "@/lib/timezone";

export async function userTimeZone() {
  const value = (await cookies()).get("time_zone")?.value;
  if (!value) return DEFAULT_TIME_ZONE;
  try {
    Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
