export type Role = "recruiter" | "candidate";

export interface AppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}
