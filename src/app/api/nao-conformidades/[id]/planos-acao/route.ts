import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const nc = await prisma.naoConformidade.findUnique({
      where: { id },
      include: {
        planosAcao: true
      }
    });

    if (!nc || nc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(nc.planosAcao);
  } catch (error: any) {
    console.error("Erro ao buscar planos de ação da NC:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const nc = await prisma.naoConformidade.findUnique({
      where: { id }
    });

    if (!nc || nc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await req.json();
    const acoes = data.acoes; // Esperado array de ações

    if (!Array.isArray(acoes)) {
      return NextResponse.json({ error: 'Formato inválido. Esperado array de ações.' }, { status: 400 });
    }

    const planos = await Promise.all(acoes.map(acao => 
      prisma.planoAcao5W2H.create({
        data: {
          naoConformidadeId: id,
          what: acao.what,
          why: acao.why,
          where: acao.where,
          when: acao.when ? new Date(acao.when) : null,
          who: acao.who,
          how: acao.how,
          howMuch: acao.howMuch,
          status: 'Pendente'
        }
      })
    ));

    return NextResponse.json(planos, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao salvar planos de ação da NC:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
