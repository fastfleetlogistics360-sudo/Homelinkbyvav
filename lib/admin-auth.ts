import { redirect } from "next/navigation";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";

export function getAdminEmails() {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([DEFAULT_ADMIN_EMAIL.toLowerCase(), ...configured]));
}

export function isAdminEmail(email?: string | null) {
  return Boolean(email && getAdminEmails().includes(email.toLowerCase()));
}

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin");
  if (!isAdminEmail(user.email)) redirect("/admin?error=Use the approved admin email to continue.");
  return user;
}
