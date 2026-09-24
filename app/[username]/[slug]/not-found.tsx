import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Project not found</h1>
      <p className="text-sm text-muted-foreground">This project doesn&apos;t exist or has been removed.</p>
      <Link href="/" className="text-sm text-link hover:underline">
        Go home
      </Link>
    </div>
  );
}
