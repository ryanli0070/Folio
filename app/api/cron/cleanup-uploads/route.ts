import { NextResponse, type NextRequest } from "next/server";
import { cleanupStaleUploads } from "@/lib/uploads";

// Invoked daily by Vercel Cron (vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await cleanupStaleUploads();
  console.log("cleanup-uploads", result);
  return NextResponse.json(result);
}
