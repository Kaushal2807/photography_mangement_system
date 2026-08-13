"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvoiceRedirectPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    // Redirect to dashboard invoice preview route
    void router.replace(`/dashboard/invoices/${id}`);
  }, [params, router]);

  return null;
}

