import { HomeSeekerSignupFlow } from "@/components/home-seeker-signup-flow";

export default async function SignUpPage({
  searchParams
}: {
  searchParams?: Promise<{ type?: string; error?: string }>;
}) {
  const params = await searchParams;
  const defaultType = params?.type === "agent" ? "agent" : "home_seeker";

  return <HomeSeekerSignupFlow defaultType={defaultType} error={params?.error} />;
}
