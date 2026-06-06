import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";

const ADMIN_SESSION_COOKIE = "homelink_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSession = {
  email: string;
  exp: number;
};

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

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "homelink-admin-session";
}

function signAdminSession(payload: AdminSession) {
  return createHmac("sha256", getAdminSessionSecret()).update(JSON.stringify(payload)).digest("hex");
}

function constantTimeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function adminPasswordMatches(password: string) {
  return constantTimeEqual(password, getAdminPassword());
}

export async function createAdminSession(email: string) {
  const payload = {
    email: email.toLowerCase(),
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  };
  const token = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${signAdminSession(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const sessionUser = await getSessionUser();
  if (isAdminEmail(sessionUser?.email)) {
    return {
      email: sessionUser?.email || DEFAULT_ADMIN_EMAIL,
      source: "supabase" as const
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as AdminSession;
    if (!payload.email || payload.exp < Date.now() || !isAdminEmail(payload.email)) return null;
    if (!constantTimeEqual(signature, signAdminSession(payload))) return null;
    return {
      email: payload.email,
      source: "cookie" as const
    };
  } catch {
    return null;
  }
}

export async function requireAdminUser() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin");
  return admin;
}
