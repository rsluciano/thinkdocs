import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const session = await verifyToken(token);
    
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { id } = await params;
    const { documentoId } = await req.json();

    if (!documentoId) {
      return NextResponse.json({ error: "Documento ID não fornecido" }, { status: 400 });
    }

    const requisito = await prisma.requisitoVigilancia.findUnique({ where: { id } });

    if (!requisito || requisito.empresaId !== session.empresaId) {
      return NextResponse.json({ error: "Requisito não encontrado ou acesso negado" }, { status: 404 });
    }

    const vinculo = await prisma.documentoRequisito.create({
      data: {
        requisitoId: id,
        documentoId
      }
    });

    return NextResponse.json({ message: "Documento vinculado com sucesso", vinculo }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao vincular documento:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Documento já vinculado a este requisito" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const session = await verifyToken(token);
    
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const documentoId = searchParams.get("documentoId");

    if (!documentoId) {
      return NextResponse.json({ error: "Documento ID não fornecido" }, { status: 400 });
    }

    const vinculo = await prisma.documentoRequisito.findUnique({
      where: {
        requisitoId_documentoId: {
          requisitoId: id,
          documentoId
        }
      }
    });

    if (!vinculo) {
      return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });
    }

    await prisma.documentoRequisito.delete({
      where: {
        id: vinculo.id
      }
    });

    return NextResponse.json({ message: "Vínculo removido com sucesso" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao desvincular documento:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
