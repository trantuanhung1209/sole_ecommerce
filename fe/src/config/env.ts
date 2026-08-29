export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

export const isGoogleAuthEnabled = googleClientId.length > 0;
