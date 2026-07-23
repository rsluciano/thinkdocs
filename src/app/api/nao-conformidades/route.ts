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

    const rncs = await prisma.naoConformidade.findMany({
      where: { empresaId: session.empresaId },
      orderBy: { dataRegistro: 'desc' }
    });

    return NextResponse.json(rncs);
  } catch (error: any) {
    console.error("Erro ao buscar não conformidades:", error);
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

    const { titulo, descricao, origem, responsavelAcao, prazoAcao, tipo, setor, criticidade } = await req.json();

    const rnc = await prisma.naoConformidade.create({
      data: {
        empresaId: session.empresaId,
        titulo,
        descricao,
        origem,
        tipo,
        setor,
        criticidade,
        responsavelAcao,
        prazoAcao: prazoAcao ? new Date(prazoAcao) : null,
        criadoPor: session.nome
      }
    });

    return NextResponse.json(rnc, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar RNC:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
