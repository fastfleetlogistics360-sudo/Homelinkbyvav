import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-wrap">
      <form className="panel auth-card" action={loginAction}>
        <p className="kicker">Login</p>
        <h2>Welcome back to HomeLink by V-A.V</h2>
        {params?.error ? <p className="badge rejected">{params.error}</p> : null}
        {params?.message ? <p className="badge pending">{params.message}</p> : null}
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        <button className="button primary full" type="submit">
          Login
        </button>
        <p>
          Need an account? <Link href="/auth/signup">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
