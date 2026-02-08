import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Cached version of getServerSession.
 * React's cache() deduplicates this call within a single request,
 * so layout + page only trigger one session lookup instead of two.
 */
export const getSession = cache(() => getServerSession(authOptions));
