import NextAuth from "next-auth";
import { getAuthOptions } from "@/app/auth/config";

export const { handlers, auth, signIn, signOut } = NextAuth(getAuthOptions() as any);
