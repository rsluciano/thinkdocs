import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

    const analises = await prisma.analiseCausa.findMany({
      where: { naoConformidadeId: params.id },
      include: {
        sugestoesIA: true
      },
      orderBy: { dataCriacao: 'desc' }
    });

    return NextResponse.json(analises);
  } catch (error) {
    console.error("Erro ao buscar análises:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

    const { metodologia, dadosJson, rpnCalculado } = await req.json();

    const analise = await prisma.analiseCausa.create({
      data: {
        naoConformidadeId: params.id,
        metodologia,
        dadosJson: JSON.stringify(dadosJson),
        rpnCalculado,
        criadoPor: session.nome
      }
    });

    return NextResponse.json(analise, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar análise:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
