import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import TwitterProvider from "next-auth/providers/twitter"
import LinkedInProvider from "next-auth/providers/linkedin"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

// Initialize Prisma Client
const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0",
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Add user ID to token for session callback
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = token.userId
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
