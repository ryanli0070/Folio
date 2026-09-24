import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Profile not found</h1>
      <p className="text-sm text-muted-foreground">There&apos;s no Folio page at this address.</p>
      <Button asChild variant="outline" size="sm">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
