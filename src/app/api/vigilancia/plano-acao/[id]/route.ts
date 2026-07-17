import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const data = await req.json();

    const {
      what,
      why,
      where,
      when,
      who,
      how,
      howMuch,
      status
    } = data;

    // Verificar se existe e pertence à empresa
    const existing = await prisma.planoAcao5W2H.findUnique({
      where: { id },
      include: { auditoriaRdc: true }
    });

    if (!existing || existing.auditoriaRdc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Plano não encontrado ou sem permissão' }, { status: 403 });
    }

    const updated = await prisma.planoAcao5W2H.update({
      where: { id },
      data: {
        what,
        why,
        where,
        when: when ? new Date(when) : null,
        who,
        how,
        howMuch,
        status
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao atualizar plano de ação:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    const existing = await prisma.planoAcao5W2H.findUnique({
      where: { id },
      include: { auditoriaRdc: true }
    });

    if (!existing || existing.auditoriaRdc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await prisma.planoAcao5W2H.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Excluído com sucesso' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
