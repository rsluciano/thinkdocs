import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { 
      status, 
      analiseCausa, 
      acaoCorretiva, 
      responsavelAcao, 
      prazoAcao, 
      observacoesFinais 
    } = await req.json();

    const dataAtualizacao: any = {
      status,
      analiseCausa,
      acaoCorretiva,
      responsavelAcao,
      observacoesFinais,
    };

    if (prazoAcao) {
      dataAtualizacao.prazoAcao = new Date(prazoAcao);
    }

    if (status === 'Concluída') {
      dataAtualizacao.dataFechamento = new Date();
    } else {
      dataAtualizacao.dataFechamento = null;
    }

    const rnc = await prisma.naoConformidade.updateMany({
      where: { 
        id: params.id,
        empresaId: session.empresaId
      },
      data: dataAtualizacao
    });

    if (rnc.count === 0) {
      return NextResponse.json({ error: 'RNC não encontrada ou sem permissão' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao atualizar RNC:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
