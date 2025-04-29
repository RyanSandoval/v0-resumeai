import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import TwitterProvider from "next-auth/providers/twitter"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getPrismaClient } from "@/lib/db"

// Create a function to initialize auth options
async function getAuthOptions() {
  // Dynamically get the Prisma client
  const prisma = await getPrismaClient()

  return {
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
    ],
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id
        }
        return session
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    session: {
      strategy: "jwt",
    },
  }
}

// Export a dynamic handler for NextAuth
export async function GET(req, res) {
  const authOptions = await getAuthOptions()
  const handler = NextAuth(authOptions)
  return handler(req, res)
}

export async function POST(req, res) {
  const authOptions = await getAuthOptions()
  const handler = NextAuth(authOptions)
  return handler(req, res)
}
