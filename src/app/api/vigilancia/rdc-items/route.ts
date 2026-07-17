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

    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');

    const where: any = {};
    if (categoria) {
      where.categoria = categoria;
    }

    const items = await prisma.rdcItem.findMany({
      where,
      orderBy: { id: 'asc' }
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Erro ao buscar rdc-items:", error);
    return NextResponse.json({ error: 'Erro interno ao buscar itens' }, { status: 500 });
  }
}
