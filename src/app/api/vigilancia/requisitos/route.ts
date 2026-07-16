import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get("empresaId");

    if (!empresaId) {
      return NextResponse.json({ error: "Empresa ID não fornecido" }, { status: 400 });
    }

    const requisitos = await prisma.requisitoVigilancia.findMany({
      where: { empresaId },
      include: {
        documentos: {
          include: {
            documento: true
          }
        }
      },
      orderBy: {
        criadoEm: 'asc'
      }
    });

    return NextResponse.json(requisitos, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao buscar requisitos:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { empresaId, norma, artigo, descricao } = await req.json();

    if (!empresaId || !artigo || !descricao) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const novoRequisito = await prisma.requisitoVigilancia.create({
      data: {
        empresaId,
        norma: norma || "RDC 978/2025",
        artigo,
        descricao
      }
    });

    return NextResponse.json({ message: "Requisito criado com sucesso", requisito: novoRequisito }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao criar requisito:", error);
    return NextResponse.json({ error: "Erro interno ao criar requisito" }, { status: 500 });
  }
}
