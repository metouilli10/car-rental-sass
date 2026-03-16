import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeClientIp, normalizeEmail } from "@/lib/auth-utils";
import { logSecurityAudit } from "@/lib/security/audit-log";
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rate-limit-store";

const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const AUTH_RATE_LIMIT_ENABLED = envFlag("FEATURE_AUTH_RATE_LIMIT");
const AUTH_LOCKOUT_ENABLED = envFlag("FEATURE_AUTH_LOCKOUT");
const AUTH_RATE_LIMIT_WINDOW_MS = envNumber(
  "AUTH_RATE_LIMIT_WINDOW_MS",
  DEFAULT_RATE_LIMIT_WINDOW_MS
);
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = envNumber(
  "AUTH_RATE_LIMIT_MAX_ATTEMPTS",
  DEFAULT_RATE_LIMIT_MAX_ATTEMPTS
);
const AUTH_LOCKOUT_MS = envNumber("AUTH_LOCKOUT_MS", DEFAULT_LOCKOUT_MS);

function getAuthLimiterKey(email: string, ip: string): string {
  return `${email.toLowerCase()}::${ip}`;
}

async function assertNotBlocked(key: string): Promise<void> {
  if (!AUTH_RATE_LIMIT_ENABLED && !AUTH_LOCKOUT_ENABLED) return;

  const result = await consumeRateLimit({
    scope: "auth-login",
    key,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    maxRequests: AUTH_RATE_LIMIT_MAX_ATTEMPTS,
    lockoutMs: AUTH_LOCKOUT_ENABLED ? AUTH_LOCKOUT_MS : undefined,
  });

  if (!result.allowed) {
    throw new Error("Trop de tentatives. Réessayez plus tard.");
  }
}

async function recordSuccessfulAttempt(key: string): Promise<void> {
  if (!AUTH_RATE_LIMIT_ENABLED && !AUTH_LOCKOUT_ENABLED) return;
  await resetRateLimit("auth-login", key);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = normalizeEmail(credentials.email);
        const clientIp = normalizeClientIp(req?.headers);
        const limiterKey = getAuthLimiterKey(email, clientIp);

        await assertNotBlocked(limiterKey);

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
          include: {
            agency: true,
          },
        });

        if (!user) {
          return null;
        }

        if (user.role === "OWNER" && !user.emailVerifiedAt) {
          await logSecurityAudit({
            actor: {
              userId: user.id,
              role: user.role,
              email: user.email,
            },
            context: {
              agencyId: user.agencyId,
              ip: clientIp,
              userAgent:
                typeof req?.headers?.["user-agent"] === "string"
                  ? req.headers["user-agent"]
                  : null,
            },
            event: {
              action: "OWNER_LOGIN_BLOCKED_UNVERIFIED",
              entityType: "USER",
              entityId: user.id,
              outcome: "DENIED",
            },
          });
          throw new Error("Email non verifie");
        }

        if (user.role === "OWNER" && user.approvalStatus === "PENDING") {
          await logSecurityAudit({
            actor: {
              userId: user.id,
              role: user.role,
              email: user.email,
            },
            context: {
              agencyId: user.agencyId,
              ip: clientIp,
              userAgent:
                typeof req?.headers?.["user-agent"] === "string"
                  ? req.headers["user-agent"]
                  : null,
            },
            event: {
              action: "OWNER_LOGIN_BLOCKED_PENDING_APPROVAL",
              entityType: "USER",
              entityId: user.id,
              outcome: "DENIED",
            },
          });
          throw new Error("En attente d'approbation");
        }

        if (user.role === "OWNER" && user.approvalStatus === "REJECTED") {
          await logSecurityAudit({
            actor: {
              userId: user.id,
              role: user.role,
              email: user.email,
            },
            context: {
              agencyId: user.agencyId,
              ip: clientIp,
              userAgent:
                typeof req?.headers?.["user-agent"] === "string"
                  ? req.headers["user-agent"]
                  : null,
            },
            event: {
              action: "OWNER_LOGIN_BLOCKED_REJECTED",
              entityType: "USER",
              entityId: user.id,
              outcome: "DENIED",
            },
          });
          throw new Error("Compte refuse");
        }

        if (!user.isActive) {
          throw new Error("Compte désactivé");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        await recordSuccessfulAttempt(limiterKey);

        await prisma.user.updateMany({
          where: {
            id: user.id,
            agencyId: user.agencyId,
          },
          data: {
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agencyId: user.agencyId,
          agencyName: user.agency.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
        token.agencyName = user.agencyName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.agencyId = token.agencyId as string;
        session.user.agencyName = token.agencyName as string;
      }
      return session;
    },
  },
};
