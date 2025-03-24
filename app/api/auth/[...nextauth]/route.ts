import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { Session } from "next-auth";

interface ExtendedSession extends Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
}

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // Only allow @bbyo.org emails
      return profile?.email?.endsWith("@bbyo.org") ?? false;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedSession = session as ExtendedSession;
      if (extendedSession.user) {
        extendedSession.user.id = token.sub;
      }
      return extendedSession;
    },
  },
  pages: {
    signIn: "/",
    error: "/error",
  },
});

export { handler as GET, handler as POST };
