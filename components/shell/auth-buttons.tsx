import { signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SignInButton({ size = "default" }: { size?: "default" | "sm" | "lg" }) {
  return (
    <form
      action={async () => {
        "use server";
        // Always show GitHub's account picker instead of silently reusing the last account.
        await signIn("github", { redirectTo: "/dashboard/me" }, { prompt: "select_account" });
      }}
    >
      <Button type="submit" size={size}>
        Sign in with GitHub
      </Button>
    </form>
  );
}

export async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}
