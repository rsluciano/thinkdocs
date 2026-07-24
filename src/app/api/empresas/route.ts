import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nome, logoUrl, adminId, originalEmpresaId, originalEmpresaNome } = data;

    if (!nome || !adminId) {
      return NextResponse.json({ error: 'Nome do laboratório e ID do Admin são obrigatórios.' }, { status: 400 });
    }

    // Criar nova Empresa no PostgreSQL via Prisma
    const novaEmpresa = await prisma.empresa.create({
      data: {
        nome,
        logoUrl: logoUrl || '/thinkdocs.png'
      }
    });

    // Adicionar à lista de empresas permitidas do Admin Logado
    const admin = await prisma.usuario.findUnique({
      where: { id: adminId }
    });

    let updatedPermitidas: any[] = [];
    
    if (admin) {
      const existing = Array.isArray(admin.empresasPermitidas) ? admin.empresasPermitidas : [];
      updatedPermitidas = [...existing];
      
      // Se estiver vazio (primeiro laboratório criado), adiciona o laboratório original do admin também
      if (updatedPermitidas.length === 0 && originalEmpresaId && originalEmpresaNome) {
        updatedPermitidas.push({ id: originalEmpresaId, nome: originalEmpresaNome });
      }
      
      // Adiciona a nova empresa criada
      updatedPermitidas.push({ id: novaEmpresa.id, nome: novaEmpresa.nome, logoUrl: novaEmpresa.logoUrl });

      await prisma.usuario.update({
        where: { id: adminId },
        data: {
          empresasPermitidas: updatedPermitidas
        }
      });
    }

    return NextResponse.json({
      message: 'Laboratório criado com sucesso',
      empresa: novaEmpresa,
      empresasPermitidas: updatedPermitidas
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar laboratório:', error);
    return NextResponse.json({ error: 'Erro interno ao criar laboratório' }, { status: 500 });
  }
}
