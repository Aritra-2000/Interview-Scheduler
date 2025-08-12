"use client";
import { useSession } from "next-auth/react";

export function useAuth() {
  const { data, status } = useSession();
  return { session: data, status };
}
