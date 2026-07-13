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

function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const db = getDb();
    const userIndex = db.usuarios.findIndex((u: any) => u.email === email);

    if (userIndex === -1) {
      // Para segurança, em sistemas reais não informamos se o e-mail existe ou não, 
      // mas no protótipo vamos avisar para facilitar os testes.
      return NextResponse.json({ error: 'Nenhum usuário encontrado com este e-mail.' }, { status: 404 });
    }

    const resetToken = generateToken();
    db.usuarios[userIndex].resetToken = resetToken;
    saveDb(db);

    const resetLink = `http://localhost:3000/nova-senha?token=${resetToken}`;

    // Simulando envio de e-mail no backend
    console.log(`\n==============================================`);
    console.log(`📩 SIMULAÇÃO DE E-MAIL - RECUPERAÇÃO DE SENHA`);
    console.log(`Para: ${email}`);
    console.log(`Assunto: Redefinição de Senha - ThinkDocs`);
    console.log(`Link seguro: ${resetLink}`);
    console.log(`==============================================\n`);

    return NextResponse.json({
      message: 'Instruções enviadas',
      _simulatedEmailLink: resetLink
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
