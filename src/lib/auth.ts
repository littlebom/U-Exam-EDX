import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-utils";
import { loginSchema } from "@/lib/validations/auth";

// ─── OAuth provider config from DB (cached) ─────────────────────────
let _oauthCache: Record<string, Record<string, unknown>> | null = null;

export async function getOAuthProviders(): Promise<Record<string, Record<string, unknown>>> {
  if (_oauthCache) return _oauthCache;
  try {
    const tenant = await prisma.tenant.findFirst({
      select: { settings: true },
    });
    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const authSettings = (settings.auth ?? {}) as Record<string, unknown>;
    _oauthCache = (authSettings.providers ?? {}) as Record<string, Record<string, unknown>>;
    return _oauthCache;
  } catch {
    return {};
  }
}

export function clearOAuthCache() {
  _oauthCache = null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // Google OAuth — .env credentials (DB controls enabled/disabled via signIn callback)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        // IP is not available in authorize() — logged at middleware/route level instead
        const authIpEarly: string | null = null;

        if (!user || !user.passwordHash) {
          const { logAuthEvent } = await import("@/services/audit-log.service");
          logAuthEvent("AUTH_LOGIN_FAILED", { ipAddress: authIpEarly, detail: { email, reason: "user_not_found" } });
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          const { logAuthEvent } = await import("@/services/audit-log.service");
          logAuthEvent("AUTH_LOGIN_FAILED", { userId: user.id, ipAddress: authIpEarly, detail: { email, reason: "wrong_password" } });
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log successful login
        const { logAuthEvent } = await import("@/services/audit-log.service");
        const authIp: string | null = null; // IP logged at route level
        logAuthEvent("AUTH_LOGIN", {
          userId: user.id,
          ipAddress: authIp,
          detail: { email, provider: "credentials" },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.imageUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // OAuth providers: find or link user
      const oauthProviders = ["google", "microsoft-entra-id", "facebook", "line", "keycloak"];
      if (account?.provider && oauthProviders.includes(account.provider) && user.email) {
        // Check if provider is enabled in DB
        const providers = await getOAuthProviders();
        const providerKey = account.provider === "microsoft-entra-id" ? "microsoft" : account.provider;
        const providerConfig = providers[providerKey];
        if (!providerConfig?.enabled) {
          return "/login?error=ProviderDisabled";
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (existingUser) {
          // Link OAuth to existing user if currently credentials-only
          if (existingUser.provider === "credentials") {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                provider: providerKey,
                providerId: account.providerAccountId,
                imageUrl: user.image ?? existingUser.imageUrl,
                lastLoginAt: new Date(),
              },
            });
          } else {
            // Update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() },
            });
          }
          // Use the existing user ID for JWT
          user.id = existingUser.id;
          return true;
        }

        // Auto-register new OAuth user as CANDIDATE
        // Find default tenant + CANDIDATE role
        const defaultTenant = await prisma.tenant.findFirst();
        const candidateRole = await prisma.role.findFirst({
          where: { name: "CANDIDATE" },
        });

        if (!defaultTenant || !candidateRole) {
          return "/login?error=SetupIncomplete";
        }

        const newUser = await prisma.user.create({
          data: {
            email: user.email.toLowerCase(),
            name: user.name ?? user.email.split("@")[0],
            imageUrl: user.image ?? undefined,
            provider: providerKey,
            providerId: account.providerAccountId,
            isActive: true,
            lastLoginAt: new Date(),
            userTenants: {
              create: {
                tenantId: defaultTenant.id,
                roleId: candidateRole.id,
                isDefault: true,
                isActive: true,
              },
            },
          },
        });

        user.id = newUser.id;
        return true;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: populate token with user + tenant + role
      if (user) {
        token.userId = user.id;

        // Load default tenant + role
        const userTenant = await prisma.userTenant.findFirst({
          where: {
            userId: user.id!,
            isActive: true,
            isDefault: true,
          },
          include: {
            tenant: true,
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        if (userTenant) {
          token.tenantId = userTenant.tenantId;
          token.tenantName = userTenant.tenant.name;
          token.roleId = userTenant.roleId;
          token.roleName = userTenant.role.name;
          token.permissions = userTenant.role.rolePermissions.map(
            (rp) => rp.permission.code
          );
        }
      }

      // Handle session update (e.g., tenant switch, name/image change)
      if (trigger === "update" && session) {
        // Update name in token if provided
        if (session.name) {
          token.name = session.name;
        }
        // Update image in token if provided
        if (session.image !== undefined) {
          token.picture = session.image;
        }

        if (session.tenantId) {
          const userTenant = await prisma.userTenant.findFirst({
            where: {
              userId: token.userId as string,
              tenantId: session.tenantId,
              isActive: true,
            },
            include: {
              tenant: true,
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          });

          if (userTenant) {
            token.tenantId = userTenant.tenantId;
            token.tenantName = userTenant.tenant.name;
            token.roleId = userTenant.roleId;
            token.roleName = userTenant.role.name;
            token.permissions = userTenant.role.rolePermissions.map(
              (rp) => rp.permission.code
            );
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Surface JWT data into the session object
      session.user.id = token.userId as string;
      // Explicitly sync name from token (needed for session update to reflect)
      session.user.name = (token.name as string) ?? session.user.name;
      // Sync image (avatar) from token
      session.user.image = (token.picture as string) ?? undefined;

      session.tenant = {
        id: (token.tenantId as string) ?? "",
        name: (token.tenantName as string) ?? "",
      };

      session.role = {
        id: (token.roleId as string) ?? "",
        name: (token.roleName as string) ?? "",
        permissions: (token.permissions as string[]) ?? [],
      };

      return session;
    },
  },
});
