import { redirect } from "next/navigation";
import { SignInButton } from "@/components/shell/auth-buttons";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">One link for everything you&apos;ve built.</h1>
      <p className="text-lg text-muted-foreground">
        Put your Folio on your resume instead of choosing between a code link and a hackathon link. Every project, with
        demos, screenshots, stack, and collaborators, on one page.
      </p>
      <SignInButton size="lg" />
    </section>
  );
}
