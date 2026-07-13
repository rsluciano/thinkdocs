import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Atualiza um usuário (nome, funcao, setor, ou bloqueio)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Filtra undefined e constrói o objeto de atualização
    const dataToUpdate: any = {};
    if (body.nome !== undefined) dataToUpdate.nome = body.nome;
    if (body.email !== undefined) dataToUpdate.email = body.email;
    if (body.funcao !== undefined) dataToUpdate.funcao = body.funcao;
    if (body.setor !== undefined) dataToUpdate.setor = Array.isArray(body.setor) ? body.setor.join(',') : body.setor;
    // status não está no schema prisma de usuario. No sistema real poderiamos apenas não atualizar, ou adicionar status depois.

    const user = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate
    });

    // Retorna seguro (sem senha)
    const { senha, ...seguro } = user;
    return NextResponse.json(seguro, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

// DELETE: Exclui definitivamente um usuário
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.usuario.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Excluído com sucesso' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
