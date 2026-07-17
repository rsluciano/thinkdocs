import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    // Retorna todos os planos de ação da empresa
    const planos = await prisma.planoAcao5W2H.findMany({
      where: {
        auditoriaRdc: {
          empresaId: session.empresaId
        }
      },
      include: {
        auditoriaRdc: {
          include: {
            rdcItem: true
          }
        }
      }
    });

    return NextResponse.json(planos);
  } catch (error: any) {
    console.error("Erro ao buscar planos de ação:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const data = await req.json();
    const {
      auditoriaRdcId,
      what,
      why,
      where,
      when,
      who,
      how,
      howMuch,
      status
    } = data;

    // Garante que a auditoria pertence a empresa do user
    const aud = await prisma.auditoriaRdc.findUnique({
      where: { id: auditoriaRdcId }
    });

    if (!aud || aud.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado à auditoria' }, { status: 403 });
    }

    const plano = await prisma.planoAcao5W2H.create({
      data: {
        auditoriaRdcId,
        what,
        why,
        where,
        when: when ? new Date(when) : null,
        who,
        how,
        howMuch,
        status: status || 'Pendente'
      }
    });

    return NextResponse.json(plano, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar plano de ação:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
