import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID não fornecido' }, { status: 400 });
    }

    const leituras = await prisma.leitura.findMany({
      where: {
        empresaId
      }
    });
    
    return NextResponse.json(leituras);
  } catch (error) {
    console.error("Erro ao buscar leituras:", error);
    return NextResponse.json({ error: 'Erro ao buscar leituras' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { empresaId, usuarioId, usuarioNome, usuarioSetor, documentoId, documentoCodigo, documentoTitulo, documentoVersao } = data;

    if (!empresaId || !usuarioId || !documentoId || !documentoVersao) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }
    
    // Evita duplicidade se o usuário já leu esta versão específica
    const jaLeu = await prisma.leitura.findFirst({
      where: {
        usuarioId,
        documentoId,
        documentoVersao
      }
    });

    if (jaLeu) {
      return NextResponse.json({ message: 'Leitura já estava registrada', leitura: jaLeu }, { status: 200 });
    }

    const novaLeitura = await prisma.leitura.create({
      data: {
        empresaId,
        usuarioId,
        usuarioNome,
        usuarioSetor,
        documentoId,
        documentoCodigo,
        documentoTitulo,
        documentoVersao
      }
    });

    return NextResponse.json({ message: 'Ciente registrado com sucesso', leitura: novaLeitura }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao registrar leitura:", error);
    return NextResponse.json({ error: 'Erro interno ao salvar leitura' }, { status: 500 });
  }
}
