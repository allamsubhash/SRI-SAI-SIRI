import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'srisaisiri-super-secret-key-12345';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'OWNER' | 'TENANT';
  name: string;
}

export function extractAuthToken(request: Request): string | null {
  try {
    const rawCookie = request.headers.get('cookie') || '';
    const match = rawCookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {}
  return null;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token) return null;
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
