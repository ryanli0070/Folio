import { signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SignInButton({ size = "default" }: { size?: "default" | "sm" | "lg" }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/dashboard" });
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
