import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PasswordField } from "@/components/password-field";
import { signUpAction } from "@/lib/actions/auth";

export default async function SignUpPage({
  searchParams
}: {
  searchParams?: Promise<{ type?: string; error?: string }>;
}) {
  const params = await searchParams;
  const defaultType = params?.type === "agent" ? "agent" : "home_seeker";

  return (
    <>
      <Header />
      <main className="auth-wrap">
        <form className="panel auth-card" action={signUpAction}>
        <p className="kicker">Create account</p>
        <h2>Choose Home Seeker or Agent</h2>
        {params?.error ? <p className="badge rejected">{params.error}</p> : null}
        <label>
          Account type
          <select name="account_type" defaultValue={defaultType} required>
            <option value="home_seeker">Home Seeker</option>
            <option value="agent">Agent</option>
          </select>
        </label>
        <label>
          Full name
          <input name="full_name" required />
        </label>
        <label>
          Agency name, for agents
          <input name="agency_name" placeholder="Mainland Homes" />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <PasswordField />
        <button className="button primary full" type="submit">
          Sign Up
        </button>
        <p>
          Already registered? <Link href="/auth/login">Login</Link>
        </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
