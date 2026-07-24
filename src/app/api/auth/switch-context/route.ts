import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { empresaId, empresaNome } = await req.json();

    if (!empresaId) {
      return NextResponse.json({ error: 'ID da empresa não fornecido' }, { status: 400 });
    }

    // Busca o usuário no DB para checar se ele tem acesso a essa empresa
    const user = await prisma.usuario.findUnique({
      where: { id: session.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se ele for Consultor Master, tem acesso livre. Se não, verifica se está nas empresas permitidas
    const isMaster = user.funcao === 'Consultor Master' || user.funcao === 'Administrador';
    
    let temAcesso = false;
    
    if (isMaster) {
      temAcesso = true;
    } else {
      try {
        const permitidas = JSON.parse(user.empresasPermitidas || '[]');
        temAcesso = permitidas.some((emp: any) => emp.id === empresaId);
      } catch(e) {
        temAcesso = false;
      }
    }

    if (!temAcesso) {
      return NextResponse.json({ error: 'Sem acesso a este ambiente' }, { status: 403 });
    }

    // Assina um NOVO token para esta sessão com o novo empresaId
    const newToken = await signToken({
      userId: user.id,
      empresaId: empresaId,
      funcao: user.funcao,
      nome: user.nome,
      email: user.email,
      setor: user.setor || 'Geral'
    });

    return NextResponse.json({ token: newToken, message: 'Contexto alterado com sucesso' });

  } catch (error) {
    console.error('Erro ao trocar contexto:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
