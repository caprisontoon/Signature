import NextAuth from "next-auth";
import { ToonationProvider } from "@/auth/toonation";

const handler = NextAuth({
  providers: [
    ToonationProvider({
      clientId: process.env.TOONATION_CLIENT_ID!,
      clientSecret: process.env.TOONATION_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
