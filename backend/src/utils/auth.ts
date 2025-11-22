import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET || "mysecretkey123";

/**
 * Verifies the validity of a JWT token.
 * Used by the Context middleware to secure API endpoints.
 * * @param token - The raw Bearer token string.
 * @returns The decoded token payload if valid, or null if verification fails.
 */
export function verifyToken(token: string | undefined) {
  if (!token) {
    console.log("[Auth] verifyToken: No token provided."); 
    return null;
  }
  try {
    // Strip 'Bearer ' prefix if present to ensure standard JWT parsing
    const payload = jwt.verify(token.replace("Bearer ", ""), SECRET);
    console.log("[Auth] verifyToken: Success! Payload:", payload); 
    return payload;
  } catch (e: any) {
    console.error("[Auth] verifyToken: FAILED!", e.message); 
    return null;
  }
}