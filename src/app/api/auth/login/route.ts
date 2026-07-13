import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) return { usuarios: [] };
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ error: 'Preencha e-mail e senha' }, { status: 400 });
    }

    const db = getDb();
    const usuario = db.usuarios.find((u: any) => u.email === email && u.senha === senha);

    if (!usuario) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (usuario.status === 'Pendente') {
      return NextResponse.json({ error: 'Conta ainda não ativada. Verifique seu e-mail.' }, { status: 403 });
    }
    
    if (usuario.status === 'Bloqueado') {
      return NextResponse.json({ error: 'Esta conta foi bloqueada pelo administrador.' }, { status: 403 });
    }

    // Removendo senha do payload por segurança
    const { senha: _, activationToken, resetToken, ...safeUser } = usuario;

    return NextResponse.json({
      message: 'Login bem-sucedido',
      usuario: safeUser
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
