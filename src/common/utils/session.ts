export function get_sessionConfig() {
  return {
    cookieName: process.env.SESSION_NAME!,
    password: process.env.SESSION_PASSWORD!,
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
  };
}
