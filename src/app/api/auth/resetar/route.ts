import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) return { usuarios: [] };
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { token, novaSenha } = await req.json();

    if (!token || !novaSenha) {
      return NextResponse.json({ error: 'Token ou senha não fornecidos' }, { status: 400 });
    }

    const db = getDb();
    
    // Procura por token de ativação ou token de recuperação
    const userIndex = db.usuarios.findIndex((u: any) => 
      u.activationToken === token || u.resetToken === token
    );

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Link expirado ou inválido' }, { status: 400 });
    }

    const usuario = db.usuarios[userIndex];
    
    // Atualiza a senha e limpa tokens
    usuario.senha = novaSenha;
    
    if (usuario.activationToken === token) {
      usuario.status = 'Ativo'; // Se estava pendente, agora ativou
      usuario.activationToken = null;
    }
    
    if (usuario.resetToken === token) {
      usuario.resetToken = null; // Limpa o token de recuperação usado
    }

    saveDb(db);

    return NextResponse.json({ message: 'Senha atualizada com sucesso. Sua conta está pronta para uso!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
