import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
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
    const { codigo, titulo, categoria, arquivo, setor, dataAtualizacao, dataProximaAtualizacao } = data;

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }
    
    // Verificação de IDOR
    if (doc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado. Documento pertence a outra empresa.' }, { status: 403 });
    }

    const revisaoAtual = doc.revisao || 1;
    const novaRevisao = revisaoAtual + 1;
    
    const parsedSetores = Array.isArray(setor) ? setor : (setor || doc.setor || 'Geral').split(',').map((s:string)=>s.trim());
    if (!parsedSetores.includes('Qualidade')) {
      parsedSetores.push('Qualidade');
    }

    const novoDoc = await prisma.documento.create({
      data: {
        empresaId: session.empresaId,
        codigo: codigo || doc.codigo,
        titulo: titulo || doc.titulo,
        categoria: categoria || doc.categoria,
        setor: parsedSetores.join(','),
        autor: session.nome || doc.autor,
        dataAtualizacao: dataAtualizacao ? new Date(dataAtualizacao) : null,
        dataVencimento: dataProximaAtualizacao ? new Date(dataProximaAtualizacao) : null,
        dataEnvio: new Date(),
        arquivoUrl: arquivo || doc.arquivoUrl,
        status: 'Aguardando Aprovação',
        revisao: novaRevisao,
      }
    });

    const diretores = await prisma.usuario.findMany({
      where: {
        empresaId: session.empresaId,
        funcao: { in: ['Diretor', 'Administrador', 'Gestor da Qualidade'] }
      }
    });
    const emails = diretores.map((d: any) => d.email);

    await emailService.notificarAprovacaoPendente(emails, novoDoc.autor, novoDoc.codigo, novoDoc.titulo, true);

    return NextResponse.json({ message: 'Revisão enviada com sucesso', documento: novoDoc }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao atualizar documento' }, { status: 500 });
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
    const excluidoDoc = await prisma.documento.findUnique({ where: { id } });

    if (!excluidoDoc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // Verificação de IDOR
    if (excluidoDoc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await prisma.documento.delete({ where: { id } });

    const diretores = await prisma.usuario.findMany({
      where: {
        empresaId: session.empresaId,
        OR: [
          { funcao: { in: ['Diretor', 'Administrador', 'Gestor da Qualidade'] } },
          { nome: excluidoDoc.autor }
        ]
      }
    });
    const emails = [...new Set(diretores.map((d: any) => d.email))] as string[];

    await emailService.notificarExclusao(emails, excluidoDoc.codigo, excluidoDoc.titulo, excluidoDoc.autor);

    return NextResponse.json({ message: 'Documento excluído' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao excluir documento' }, { status: 500 });
  }
}
