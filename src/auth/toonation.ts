import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface ToonationProfile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

export function ToonationProvider(
  options: OAuthUserConfig<ToonationProfile>
): OAuthConfig<ToonationProfile> {
  return {
    id: "toonation",
    name: "Toonation",
    type: "oauth",
    authorization: {
      url: process.env.TOONATION_AUTH_URL ?? "https://toonation.co.kr/oauth/authorize",
      params: { scope: "openid profile" },
    },
    token: process.env.TOONATION_TOKEN_URL ?? "https://toonation.co.kr/oauth/token",
    userinfo: process.env.TOONATION_USERINFO_URL ?? "https://toonation.co.kr/oauth/userinfo",
    profile(profile: ToonationProfile) {
      return {
        id: profile.id,
        name: profile.username,
        email: profile.email ?? null,
        image: profile.avatar_url ?? null,
      };
    },
    ...options,
  };
}
