import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    await prisma.documento.update({
      where: { id },
      data: {
        status: 'Obsoleto',
        dataVencimento: null, // Clear validity
        dataObsoletado: new Date()
      }
    });

    return NextResponse.json({ message: 'Documento movido para Arquivo Morto (Obsoleto)' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
