import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import TwitterProvider from "next-auth/providers/twitter"
import LinkedInProvider from "next-auth/providers/linkedin"
import { createUser } from "@/lib/db"

export const authOptions = {
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
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token
      if (account) {
        token.accessToken = account.access_token
        token.id = profile?.id
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub
        session.accessToken = token.accessToken
      }
      return session
    },
    async signIn({ user }) {
      try {
        // Create or update user in database when they sign in
        if (user.id && user.email) {
          await createUser({
            id: user.id,
            name: user.name || user.email.split("@")[0],
            email: user.email,
            image: user.image || null,
          })
          console.log(`User created/updated: ${user.email}`)
        }
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return true // Still allow sign in even if DB operation fails
      }
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
