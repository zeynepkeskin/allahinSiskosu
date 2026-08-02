"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserTimeZone } from "@/lib/timezone";

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = browserTimeZone();
    if (document.cookie.split("; ").includes(`time_zone=${encodeURIComponent(timeZone)}`)) return;
    void fetch("/api/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone }),
    }).then((response) => {
      if (response.ok) router.refresh();
    });
  }, [router]);

  return null;
}
