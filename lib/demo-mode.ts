import { cache } from "react";
import { cookies } from "next/headers";

export const DEMO_COOKIE = "fluxtrack_demo_mode";

export const isDemoMode = cache(async () => (await cookies()).get(DEMO_COOKIE)?.value === "1");
