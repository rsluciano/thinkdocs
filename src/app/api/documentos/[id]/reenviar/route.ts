import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { codigo, titulo, categoria, arquivo, setor, dataAtualizacao, dataProximaAtualizacao } = data;

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    if (doc.status !== 'Reprovado') {
      return NextResponse.json({ error: 'Apenas documentos reprovados podem ser corrigidos dessa forma.' }, { status: 400 });
    }

    // Atualiza os dados que vieram do form e remove motivoReprovacao (seta null)
    const updatedDoc = await prisma.documento.update({
      where: { id },
      data: {
        codigo: codigo || undefined,
        titulo: titulo || undefined,
        categoria: categoria || undefined,
        setor: setor ? (Array.isArray(setor) ? setor.join(', ') : setor) : undefined,
        arquivoUrl: arquivo || undefined,
        dataAtualizacao: dataAtualizacao ? new Date(dataAtualizacao) : undefined,
        dataVencimento: dataProximaAtualizacao ? new Date(dataProximaAtualizacao) : undefined,
        motivoReprovacao: null,
        status: 'Aguardando Aprovação',
        dataEnvio: new Date(),
        aprovadoPor: null,
        dataAprovacao: null
      }
    });

    return NextResponse.json({
      message: 'Documento corrigido e enviado para aprovação',
      documento: updatedDoc
    }, { status: 200 });

  } catch (error: any) {
    console.error("ERRO NO CORRIGIR:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar documento', details: error.message || error.toString() }, { status: 500 });
  }
}
