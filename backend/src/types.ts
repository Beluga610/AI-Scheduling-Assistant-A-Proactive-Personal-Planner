export interface Context {
  user: { _id: string; email: string; name: string } | null;
}

export interface DecodedToken {
  userId: string;
  iat?: number;
  exp?: number;
}