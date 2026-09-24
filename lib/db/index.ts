import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// A placeholder keeps `next build` working without credentials; queries fail loudly at runtime.
const url = process.env.DATABASE_URL ?? "postgresql://missing:missing@localhost/missing";

// Optional: point the HTTP driver at a local Neon-compatible proxy (see SETUP.md).
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;

export const db = drizzle({ client: neon(url), schema });
export type DB = typeof db;
export { schema };
