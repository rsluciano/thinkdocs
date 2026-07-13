import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { token, novaSenha } = await req.json();

    if (!token || !novaSenha) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }

    const db = getDb();
    
    // Procura o usuário que tem esse resetToken ou activationToken
    // Permitimos usar o mesmo endpoint para ativar contas novas
    const userIndex = db.usuarios.findIndex((u: any) => u.resetToken === token || u.activationToken === token);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
    }

    const user = db.usuarios[userIndex];
    
    // Atualiza a senha (em plaintext para o protótipo, mas deveria ser hash bcrypt)
    user.senha = novaSenha;
    
    // Ativa a conta caso estivesse pendente
    if (user.status === 'Pendente') {
      user.status = 'Ativo';
    }

    // Apaga os tokens
    user.resetToken = null;
    user.activationToken = null;

    saveDb(db);

    return NextResponse.json({
      message: 'Senha alterada com sucesso.'
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
