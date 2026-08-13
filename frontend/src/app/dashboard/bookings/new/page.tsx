"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewBookingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/bookings");
  }, [router]);

  return null;
}
