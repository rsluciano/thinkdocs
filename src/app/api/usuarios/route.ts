import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Gera um token simples aleatório
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    const usuarios = await prisma.usuario.findMany({
      where: empresaId ? { empresaId } : undefined,
      orderBy: { nome: 'asc' }
    });
    
    // Removemos as senhas antes de retornar para o front-end
    const usuariosSeguros = usuarios.map((u: any) => {
      const { senha, ...rest } = u;
      return rest;
    });

    return NextResponse.json(usuariosSeguros);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nome, email, funcao, setorNome, senha, empresaId, empresaNome, empresaLogo } = data;

    if (!nome || !email || !funcao || !senha || !empresaId) {
      return NextResponse.json({ error: 'Dados incompletos. Faltam informações do tenant.' }, { status: 400 });
    }

    // Verifica e-mail duplicado
    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado no sistema.' }, { status: 400 });
    }

    const activationToken = generateToken();

    const novoUsuario = await prisma.usuario.create({
      data: {
        empresaId,
        nome,
        email,
        senha,
        funcao,
        setor: Array.isArray(setorNome) ? setorNome.join(',') : (setorNome || 'Geral'),
      }
    });

    // Simulando o envio de E-mail (Imprimindo no console do servidor para testes)
    console.log(`\n==============================================`);
    console.log(`📩 SIMULAÇÃO DE E-MAIL ENVIADO PARA: ${email}`);
    console.log(`Assunto: Bem-vindo ao ThinkDocs - Ative sua conta`);
    console.log(`Link de Ativação: http://localhost:3000/nova-senha?token=${activationToken}`);
    console.log(`==============================================\n`);

    return NextResponse.json({
      ...novoUsuario,
      _simulatedEmailLink: `http://localhost:3000/nova-senha?token=${activationToken}` // Retornando para o frontend mostrar
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao salvar usuário' }, { status: 500 });
  }
}
