import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET || "dev_secret";

// TODO: replace with proper auth flow
export function verifyToken(token: string | undefined) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token.replace("Bearer ", ""), SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}
