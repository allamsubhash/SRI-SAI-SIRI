import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'srisaisiri-super-secret-key-12345';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'OWNER' | 'TENANT';
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  if (!password || !hashed) return false;
  try {
    return await bcrypt.compare(password, hashed);
  } catch (error) {
    return false;
  }
}
