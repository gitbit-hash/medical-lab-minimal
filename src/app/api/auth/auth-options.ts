// app/api/auth/auth-options.ts - Updated with translation support
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { Adapter } from "next-auth/adapters";
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

// Function to get client IP address
function getClientIp(request?: any): string | null {
  if (!request) return null;

  const forwarded = request.headers?.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',')[0].trim();
    return ips;
  }

  return request.headers?.get('x-real-ip') || null;
}

// Function to get user agent
function getUserAgent(request?: any): string | null {
  if (!request) return null;
  return request.headers?.get('user-agent') || null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              language: true
            }
          });

          if (!user) return null;

          // ✅ Check if user is active
          if (!user.is_active) {
            // Log the inactive account login attempt
            try {
              const ipAddress = getClientIp(req);
              const userAgent = getUserAgent(req);

              await prisma.auditLog.create({
                data: {
                  user_id: user.id,
                  action: 'USER_LOGIN_DENIED',
                  entity_type: getTranslatedEntityType('User'),
                  entity_id: user.id,
                  description: 'audit.user_login_denied',
                  translation_params: {
                    user_name: user.name || user.email
                  },
                  ip_address: ipAddress,
                  user_agent: userAgent,
                  metadata: {
                    reason: 'account_inactive',
                    attempted_email: credentials.email,
                  },
                  created_at: new Date(),
                },
              });
            } catch (auditError) {
              console.error('Failed to create inactive login audit log:', auditError);
            }

            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValid) {
            // Log failed login attempt for audit
            try {
              const ipAddress = getClientIp(req);
              const userAgent = getUserAgent(req);

              await prisma.auditLog.create({
                data: {
                  user_id: user.id,
                  action: 'USER_LOGIN_FAILED',
                  entity_type: getTranslatedEntityType('User'),
                  entity_id: user.id,
                  description: 'audit.user_login_failed',
                  translation_params: {
                    user_name: user.name || user.email
                  },
                  ip_address: ipAddress,
                  user_agent: userAgent,
                  metadata: {
                    reason: 'invalid_credentials',
                    attempted_email: credentials.email,
                  },
                  created_at: new Date(),
                },
              });
            } catch (auditError) {
              console.error('Failed to create failed login audit log:', auditError);
            }

            return null;
          }

          // Update last login
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              last_login_at: new Date(),
              updated_at: new Date()
            },
          });

          // Create login audit log
          try {
            const ipAddress = getClientIp(req);
            const userAgent = getUserAgent(req);

            await prisma.auditLog.create({
              data: {
                user_id: user.id,
                action: 'USER_LOGIN',
                entity_type: getTranslatedEntityType('User'),
                entity_id: user.id,
                description: 'audit.user_login',
                translation_params: {
                  user_name: user.name || user.email
                },
                ip_address: ipAddress,
                user_agent: userAgent,
                new_values: {
                  last_login_at: updatedUser.last_login_at,
                  login_method: 'credentials'
                },
                created_at: new Date(),
              },
            });
          } catch (auditError) {
            console.error('Failed to create login audit log:', auditError);
          }

          // Return user with discount permissions
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            preferred_language: user.preferred_language,
            language: user.language?.code,
            can_give_discount: user.can_give_discount,
            max_discount_percentage: user.max_discount_percentage,
            max_discount_amount: user.max_discount_amount,
            discount_type: user.discount_type,
            is_active: user.is_active, // Add this to JWT token
            can_create_test_templates: user.can_create_test_templates,
            can_edit_test_templates: user.can_edit_test_templates,
            can_delete_test_templates: user.can_delete_test_templates,
            can_edit_reference_ranges: user.can_edit_reference_ranges,
            can_edit_fees: user.can_edit_fees,
            can_view_test_templates: user.can_view_test_templates,
            can_archive_test_templates: user.can_archive_test_templates,
            can_create_patients: user.can_create_patients,
            can_edit_patients: user.can_edit_patients,
            can_delete_patients: user.can_delete_patients,
            can_view_all_patients: user.can_view_all_patients,
            can_access_medical_history: user.can_access_medical_history,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Initial sign in - user object is available
      if (user) {
        token.role = user.role;
        token.preferred_language = user.preferred_language;
        token.language = user.language;
        token.can_give_discount = user.can_give_discount;
        token.max_discount_percentage = user.max_discount_percentage;
        token.max_discount_amount = user.max_discount_amount;
        token.discount_type = user.discount_type;
        token.is_active = user.is_active;
        token.can_create_test_templates = user.can_create_test_templates;
        token.can_edit_test_templates = user.can_edit_test_templates;
        token.can_delete_test_templates = user.can_delete_test_templates;
        token.can_edit_reference_ranges = user.can_edit_reference_ranges;
        token.can_edit_fees = user.can_edit_fees;
        token.can_view_test_templates = user.can_view_test_templates;
        token.can_archive_test_templates = user.can_archive_test_templates;
        token.can_create_patients = user.can_create_patients;
        token.can_edit_patients = user.can_edit_patients;
        token.can_delete_patients = user.can_delete_patients;
        token.can_view_all_patients = user.can_view_all_patients;
        token.can_access_medical_history = user.can_access_medical_history;
      }
      // Subsequent calls - user object is undefined, fetch from database
      else if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              role: true,
              language: true,
              can_give_discount: true,
              max_discount_percentage: true,
              max_discount_amount: true,
              discount_type: true,
              is_active: true,
              can_create_test_templates: true,
              can_edit_test_templates: true,
              can_delete_test_templates: true,
              can_edit_reference_ranges: true,
              can_edit_fees: true,
              can_view_test_templates: true,
              can_create_patients: true,
              can_edit_patients: true,
              can_delete_patients: true,
              can_view_all_patients: true,
              can_access_medical_history: true
            }
          });

          if (dbUser) {
            // ✅ Check if user is still active on subsequent requests
            if (!dbUser.is_active) {
              // Invalidate the token if user became inactive
              throw new Error('User account is inactive');
            }

            token.role = dbUser.role;
            token.can_give_discount = dbUser.can_give_discount;
            token.max_discount_percentage = dbUser.max_discount_percentage;
            token.max_discount_amount = dbUser.max_discount_amount;
            token.discount_type = dbUser.discount_type;
            token.is_active = dbUser.is_active;
            token.can_create_test_templates = dbUser.can_create_test_templates;
            token.can_edit_test_templates = dbUser.can_edit_test_templates;
            token.can_delete_test_templates = dbUser.can_delete_test_templates;
            token.can_edit_reference_ranges = dbUser.can_edit_reference_ranges;
            token.can_edit_fees = dbUser.can_edit_fees;
            token.can_view_test_templates = dbUser.can_view_test_templates;
            token.can_create_patients = dbUser.can_create_patients;
            token.can_edit_patients = dbUser.can_edit_patients;
            token.can_delete_patients = dbUser.can_delete_patients;
            token.can_view_all_patients = dbUser.can_view_all_patients;
            token.can_access_medical_history = dbUser.can_access_medical_history;
          }
        } catch (error) {
          console.error('🔐 JWT callback - Error fetching user from DB:', error);
          // If error occurs (including inactive user), invalidate the token
          token.error = 'AccountError';
        }
      }

      return token;
    },
    async session({ session, token }) {
      // ✅ Check if token has error or user is inactive
      if (token.error || token.is_active === false) {
        // Return empty session or session with error flag
        session.user = {
          ...session.user,
          error: 'account_inactive',
          is_active: false,
        };
        return session;
      }

      if (session.user) {
        session.user.role = token.role as "SuperAdmin" | "Admin";
        session.user.id = token.sub!;
        session.user.preferred_language = token.preferred_language as string;
        session.user.language = token.language as string;
        // Add discount permissions to session
        session.user.can_give_discount = token.can_give_discount as boolean;
        session.user.max_discount_percentage = token.max_discount_percentage as number | null;
        session.user.max_discount_amount = token.max_discount_amount as number | null;
        session.user.discount_type = token.discount_type as 'Percentage' | 'Fixed' | null;
        session.user.is_active = token.is_active as boolean;
        session.user.can_create_test_templates = token.can_create_test_templates as boolean;
        session.user.can_edit_test_templates = token.can_edit_test_templates as boolean;
        session.user.can_delete_test_templates = token.can_delete_test_templates as boolean;
        session.user.can_edit_reference_ranges = token.can_edit_reference_ranges as boolean;
        session.user.can_edit_fees = token.can_edit_fees as boolean;
        session.user.can_view_test_templates = token.can_view_test_templates as boolean;
        session.user.can_archive_test_templates = token.can_archive_test_templates as boolean;
        session.user.can_create_patients = token.can_create_patients as boolean;
        session.user.can_edit_patients = token.can_edit_patients as boolean;
        session.user.can_delete_patients = token.can_delete_patients as boolean;
        session.user.can_view_all_patients = token.can_view_all_patients as boolean;
        session.user.can_access_medical_history = token.can_access_medical_history as boolean;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        // Additional sign-in audit log
        const existingLog = await prisma.auditLog.findFirst({
          where: {
            user_id: user.id,
            action: 'USER_LOGIN',
            created_at: {
              gte: new Date(Date.now() - 60000) // Last minute
            }
          },
          orderBy: { created_at: 'desc' },
          take: 1
        });

        if (!existingLog) {
          await prisma.auditLog.create({
            data: {
              user_id: user.id,
              action: 'USER_LOGIN',
              entity_type: getTranslatedEntityType('User'),
              entity_id: user.id,
              description: 'audit.user_login',
              translation_params: {
                user_name: user.name || user.email
              },
              new_values: {
                provider: account?.provider || 'credentials',
                isNewUser: isNewUser || false
              },
              created_at: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Failed to create signIn event audit log:', error);
      }
    },
    async signOut({ token }) {
      try {
        // Create logout audit log
        if (token?.sub) {
          await prisma.auditLog.create({
            data: {
              user_id: token.sub,
              action: 'USER_LOGOUT',
              entity_type: getTranslatedEntityType('User'),
              entity_id: token.sub,
              description: 'audit.user_logout',
              translation_params: {
                user_name: token.name || token.email || 'Unknown'
              },
              created_at: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Failed to create logout audit log:', error);
      }
    },
    async createUser({ user }) {
      try {
        // Log user creation
        await prisma.auditLog.create({
          data: {
            user_id: user.id,
            action: 'CREATE_USER',
            entity_type: getTranslatedEntityType('User'),
            entity_id: user.id,
            description: 'audit.user_created',
            translation_params: {
              user_name: user.name || user.email
            },
            new_values: {
              email: user.email,
              name: user.name,
              created_at: new Date()
            },
            created_at: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to create user creation audit log:', error);
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on auth errors
  },
  debug: process.env.NODE_ENV === 'development',
};