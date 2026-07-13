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

function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Forneça o e-mail' }, { status: 400 });
    }

    const db = getDb();
    const userIndex = db.usuarios.findIndex((u: any) => u.email === email);

    if (userIndex === -1) {
      // Para evitar vazamento de dados, sempre retornamos sucesso mesmo se o e-mail não existir
      return NextResponse.json({ message: 'Se o e-mail existir, um link de recuperação foi gerado.' }, { status: 200 });
    }

    const resetToken = generateToken();
    db.usuarios[userIndex].resetToken = resetToken;
    saveDb(db);

    const simulatedLink = `http://localhost:3000/nova-senha?token=${resetToken}`;

    // Simulando o envio de E-mail
    console.log(`\n==============================================`);
    console.log(`🔑 RECUPERAÇÃO DE SENHA - E-MAIL SIMULADO: ${email}`);
    console.log(`Link para redefinir: ${simulatedLink}`);
    console.log(`==============================================\n`);

    return NextResponse.json({
      message: 'Se o e-mail existir, um link de recuperação foi gerado.',
      _simulatedEmailLink: simulatedLink // Retornando para exibição na interface simulada
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
