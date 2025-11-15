import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET || "mysecretkey123";

// TODO: replace with proper auth flow
export function verifyToken(token: string | undefined) {
  if (!token) {
    console.log("[Auth] verifyToken: No token provided."); // 日志1
    return null;
  }
  try {
    const payload = jwt.verify(token.replace("Bearer ", ""), SECRET);
    console.log("[Auth] verifyToken: Success! Payload:", payload); // 日志2
    return payload;
  } catch (e) {
    console.error("[Auth] verifyToken: FAILED!", e.message); // 日志3
    return null;
  }
}
