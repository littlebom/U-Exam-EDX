import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-utils";
import { loginSchema } from "@/lib/validations/auth";

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Removed allowDangerousEmailAccountLinking — account linking handled in signIn callback
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
      // Google OAuth: find or link user
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (existingUser) {
          // Link Google to existing user if not already linked
          if (existingUser.provider === "credentials") {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                provider: "google",
                providerId: account.providerAccountId,
                imageUrl: user.image ?? existingUser.imageUrl,
                lastLoginAt: new Date(),
              },
            });
          }
          // Use the existing user ID for JWT
          user.id = existingUser.id;
          return true;
        }

        // New Google user without registration — block
        return "/login?error=NoAccount";
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
