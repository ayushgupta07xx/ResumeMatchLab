"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FitRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/compare?mode=single");
  }, [router]);
  return null;
}
