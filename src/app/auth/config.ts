import Google from "next-auth/providers/google";

function parseRecruiterAllowlist(): Set<string> {
  const raw = process.env.RECRUITER_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getAuthOptions() {
  const recruiters = parseRecruiterAllowlist();
  return {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    secret: process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET,
    callbacks: {
      async jwt({ token, profile }: any) {
        const email = (profile as any)?.email ?? token.email ?? "";
        const isRecruiter = email ? recruiters.has(email.toLowerCase()) : false;
        (token as any).role = isRecruiter ? "recruiter" : "candidate";
        return token;
      },
      async session({ session, token }: any) {
        (session as any).role = (token as any).role || "candidate";
        return session;
      },
    },
  };
}

// Backward export used elsewhere if needed
export const auth = getAuthOptions();
