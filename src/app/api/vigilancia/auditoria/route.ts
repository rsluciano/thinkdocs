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

    const auditorias = await prisma.auditoriaRdc.findMany({
      where: { empresaId: session.empresaId },
      include: {
        planosAcao: true
      }
    });

    return NextResponse.json(auditorias);
  } catch (error: any) {
    console.error("Erro ao buscar auditoria:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
