"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY } from "./api";

export function useSessionToken() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const value = localStorage.getItem(TOKEN_KEY);
    if (!value) {
      router.replace("/login");
      return;
    }
    setToken(value);
    setLoading(false);
  }, [router]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    router.push("/login");
  }

  return { token, loading, logout };
}
