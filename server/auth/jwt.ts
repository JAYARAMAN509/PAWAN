import jwt from "jsonwebtoken";
import { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export function generateToken(user: User): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email!,
    role: user.role!,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
