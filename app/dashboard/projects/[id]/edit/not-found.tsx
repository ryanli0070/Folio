import Link from "next/link";

export default function EditProjectNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-xl font-semibold">Project not found</h1>
      <p className="text-sm text-muted-foreground">It may have been deleted, or you don&apos;t have access to it.</p>
      <Link href="/dashboard" className="text-sm text-link hover:underline">
        Back to your projects
      </Link>
    </div>
  );
}
