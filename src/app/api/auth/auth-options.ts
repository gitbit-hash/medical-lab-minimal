// app/api/auth/auth-options.ts - Updated with translation support
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { Adapter } from "next-auth/adapters";




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


            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValid) {


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

  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on auth errors
  },
  debug: process.env.NODE_ENV === 'development',
};