import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { codigo, titulo, categoria, arquivo } = data;

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }
    
    // Calcula nova versão/revisão
    const revisaoAtual = doc.revisao || 1;
    const novaRevisao = revisaoAtual + 1;
    
    // Cria o clone (novo registro)
    const novoDoc = await prisma.documento.create({
      data: {
        empresaId: doc.empresaId,
        codigo: codigo || doc.codigo,
        titulo: titulo || doc.titulo,
        categoria: categoria || doc.categoria,
        setor: doc.setor,
        autor: doc.autor,
        dataEnvio: new Date(),
        arquivoUrl: arquivo || doc.arquivoUrl,
        status: 'Aguardando Aprovação',
        revisao: novaRevisao,
      }
    });

    // ============================================================
    // SIMULAÇÃO DE ENVIO DE E-MAIL
    // ============================================================
    const diretores = await prisma.usuario.findMany({
      where: {
        empresaId: novoDoc.empresaId,
        funcao: { in: ['Diretor', 'Administrador', 'Gestor da Qualidade'] }
      }
    });
    const emails = diretores.map((d: any) => d.email);

    await emailService.notificarAprovacaoPendente(
      emails,
      novoDoc.autor,
      novoDoc.codigo,
      novoDoc.titulo,
      true
    );

    return NextResponse.json({
      message: 'Revisão enviada com sucesso',
      documento: novoDoc
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao atualizar documento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const excluidoDoc = await prisma.documento.findUnique({ where: { id } });

    if (!excluidoDoc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    await prisma.documento.delete({ where: { id } });

    // ============================================================
    // SIMULAÇÃO DE ENVIO DE E-MAIL DE EXCLUSÃO
    // ============================================================
    const diretores = await prisma.usuario.findMany({
      where: {
        empresaId: excluidoDoc.empresaId,
        OR: [
          { funcao: { in: ['Diretor', 'Administrador', 'Gestor da Qualidade'] } },
          { nome: excluidoDoc.autor }
        ]
      }
    });
    const emails = [...new Set(diretores.map((d: any) => d.email))] as string[];

    await emailService.notificarExclusao(
      emails,
      excluidoDoc.codigo,
      excluidoDoc.titulo
    );

    return NextResponse.json({ message: 'Documento excluído com sucesso' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao excluir documento' }, { status: 500 });
  }
}
