import { jwtVerify, SignJWT } from 'jose';

// Utiliza a variável de ambiente ou um fallback para desenvolvimento.
// Em produção, isso deve obrigatoriamente estar configurado no Vercel.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-thinkdocs-key-2026';
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  empresaId: string;
  funcao: string;
  nome: string;
  email: string;
  setor: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}
