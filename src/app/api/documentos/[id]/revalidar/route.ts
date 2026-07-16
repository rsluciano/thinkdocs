import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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
    const { dataVencimento } = await req.json();

    if (!dataVencimento) {
      return NextResponse.json({ error: "Nova data de vencimento não fornecida" }, { status: 400 });
    }

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    // Verificação de IDOR
    if (doc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const updatedDoc = await prisma.documento.update({
      where: { id },
      data: {
        dataVencimento: new Date(dataVencimento)
      }
    });

    return NextResponse.json({ message: "Documento revalidado com sucesso", documento: updatedDoc }, { status: 200 });

  } catch (error: any) {
    console.error("Erro na revalidação:", error);
    return NextResponse.json({ error: "Erro interno ao revalidar documento" }, { status: 500 });
  }
}
