import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nome, email, senha, empresaNome, empresaLogo } = data;

    if (!nome || !email || !senha || !empresaNome) {
      return NextResponse.json({ error: 'Dados incompletos. Nome da empresa é obrigatório.' }, { status: 400 });
    }

    // Verifica e-mail duplicado no banco de dados real
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return NextResponse.json({ error: 'Este e-mail já está em uso no sistema.' }, { status: 400 });
    }

    // Hash the password securely using bcrypt
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    let defaultLogo = '/thinkdocs.png';
    if (empresaNome.toLowerCase().includes('souza')) {
      defaultLogo = '/logo-souza-areas.png';
    }

    // Em uma implementação full Prisma, teríamos uma tabela Empresa.
    // Como o schema atual usa empresaId como String no próprio usuário, geramos um ID:
    const novaEmpresaId = `emp_${Date.now()}`;

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        funcao: 'Administrador', // Auto-promove como Admin master no auto-cadastro
        setor: 'Geral',
        empresaId: novaEmpresaId
      }
    });

    const { senha: _, ...safeUser } = novoUsuario;

    const token = await signToken({
      userId: novoUsuario.id,
      empresaId: novoUsuario.empresaId,
      funcao: novoUsuario.funcao,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      setor: novoUsuario.setor
    });

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso',
      usuario: { ...safeUser, empresaNome, empresaLogo: empresaLogo || defaultLogo },
      token
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar usuário' }, { status: 500 });
  }
}
