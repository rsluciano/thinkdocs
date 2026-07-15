import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ error: 'Preencha e-mail e senha' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Compara senha criptografada
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // TODO: Adicionar campos de status no Prisma se houver.
    // if (usuario.status === 'Pendente') ...

    const token = await signToken({
      userId: usuario.id,
      empresaId: usuario.empresaId,
      funcao: usuario.funcao,
      nome: usuario.nome,
      email: usuario.email,
      setor: usuario.setor
    });

    const { senha: _, ...safeUser } = usuario;

    return NextResponse.json({
      message: 'Login bem-sucedido',
      usuario: safeUser,
      token
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
