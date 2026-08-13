"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditingNewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/editing");
  }, [router]);

  return null;
}