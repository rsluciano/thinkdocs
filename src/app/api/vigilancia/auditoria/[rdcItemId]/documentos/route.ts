import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Buscar documentos vinculados a um item
export async function GET(
  req: NextRequest,
  { params }: { params: { rdcItemId: string } }
) {
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

    const auditoria = await prisma.auditoriaRdc.findUnique({
      where: {
        empresaId_rdcItemId: {
          empresaId: session.empresaId,
          rdcItemId: params.rdcItemId
        }
      },
      include: {
        documentos: {
          include: {
            documento: true
          }
        }
      }
    });

    if (!auditoria) {
      return NextResponse.json([]);
    }

    return NextResponse.json(auditoria.documentos.map((ad: any) => ad.documento));
  } catch (error: any) {
    console.error("Erro ao buscar documentos da auditoria:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Vincular um documento a um item
export async function POST(
  req: NextRequest,
  { params }: { params: { rdcItemId: string } }
) {
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

    const { documentoId } = await req.json();

    if (!documentoId) {
      return NextResponse.json({ error: 'ID do documento é obrigatório' }, { status: 400 });
    }

    // Primeiro garantimos que a auditoria existe
    let auditoria = await prisma.auditoriaRdc.findUnique({
      where: {
        empresaId_rdcItemId: {
          empresaId: session.empresaId,
          rdcItemId: params.rdcItemId
        }
      }
    });

    if (!auditoria) {
      auditoria = await prisma.auditoriaRdc.create({
        data: {
          empresaId: session.empresaId,
          rdcItemId: params.rdcItemId,
          status: 'Pendente'
        }
      });
    }

    // Cria o vínculo
    const vinculo = await prisma.auditoriaDocumento.create({
      data: {
        auditoriaId: auditoria.id,
        documentoId
      }
    });

    // Se o item não estava Conforme, atualiza para Conforme automaticamente
    if (auditoria.conforme !== 'S') {
      await prisma.auditoriaRdc.update({
        where: { id: auditoria.id },
        data: { conforme: 'S', atualizadoEm: new Date() }
      });
    }

    return NextResponse.json({ message: 'Documento vinculado com sucesso', vinculo }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Documento já vinculado a este requisito' }, { status: 400 });
    }
    console.error("Erro ao vincular documento:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Desvincular um documento
export async function DELETE(
  req: NextRequest,
  { params }: { params: { rdcItemId: string } }
) {
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
    const documentoId = searchParams.get('documentoId');

    if (!documentoId) {
      return NextResponse.json({ error: 'ID do documento é obrigatório' }, { status: 400 });
    }

    const auditoria = await prisma.auditoriaRdc.findUnique({
      where: {
        empresaId_rdcItemId: {
          empresaId: session.empresaId,
          rdcItemId: params.rdcItemId
        }
      }
    });

    if (!auditoria) {
      return NextResponse.json({ error: 'Auditoria não encontrada' }, { status: 404 });
    }

    await prisma.auditoriaDocumento.delete({
      where: {
        auditoriaId_documentoId: {
          auditoriaId: auditoria.id,
          documentoId
        }
      }
    });

    return NextResponse.json({ message: 'Documento desvinculado com sucesso' });
  } catch (error: any) {
    console.error("Erro ao desvincular documento:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
