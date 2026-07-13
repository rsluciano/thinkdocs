import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const empresaId = searchParams.get('empresaId');
    const userFuncao = searchParams.get('userFuncao');
    const userSetor = searchParams.get('userSetor');

    const whereClause: any = {};
    if (empresaId) whereClause.empresaId = empresaId;
    if (status) whereClause.status = status;

    let docs = await prisma.documento.findMany({
      where: whereClause,
      orderBy: { dataEnvio: 'desc' }
    });

    if (userFuncao && userSetor) {
      const isFullAccess = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico'].includes(userFuncao);
      if (!isFullAccess) {
        // Colaboradores e Líderes de Setor só veem documentos de seus setores ou Geral
        const userSetoresList = userSetor.split(',').map((s: string) => s.trim());
        const hasGeralAccess = userSetoresList.includes('Geral');
        
        if (!hasGeralAccess) {
          docs = docs.filter((d: any) => {
            const docSetorStr = Array.isArray(d.setor) ? d.setor.join(',') : (d.setor || 'Geral');
            const docSetoresList = docSetorStr.split(',').map((s: string) => s.trim());
            
            // Regra de Negócio: Todo documento pertence à Qualidade implicitamente
            if (!docSetoresList.includes('Qualidade')) {
              docSetoresList.push('Qualidade');
            }

            return docSetoresList.includes('Geral') || docSetoresList.some((s: string) => userSetoresList.includes(s));
          });
        }
      }
    }

    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { titulo, codigo, categoria, arquivo, autorNome, setor, empresaId, dataAtualizacao, dataProximaAtualizacao } = data;

    if (!titulo || !codigo || !categoria || !arquivo || !empresaId) {
      return NextResponse.json({ error: 'Dados incompletos do documento. Verifique o tenant.' }, { status: 400 });
    }

    const novoDocumento = await prisma.documento.create({
      data: {
        empresaId,
        codigo,
        titulo,
        categoria,
        setor: Array.isArray(setor) ? setor.join(',') : (setor || 'Geral'),
        autor: autorNome || 'Desconhecido',
        dataAtualizacao: dataAtualizacao ? new Date(dataAtualizacao) : null,
        dataVencimento: dataProximaAtualizacao ? new Date(dataProximaAtualizacao) : null,
        arquivoUrl: arquivo,
        status: 'Aguardando Aprovação',
        revisao: 1
      }
    });

    // Encontrar gestores/diretores para notificar (da mesma empresa)
    const aprovadores = await prisma.usuario.findMany({
      where: {
        empresaId,
        funcao: { in: ['Diretor', 'Gestor da Qualidade', 'Administrador'] }
      }
    });
    const emails = aprovadores.map((a: any) => a.email);

    // Usa o serviço de email para notificar
    await emailService.notificarAprovacaoPendente(
      emails,
      novoDocumento.autor,
      novoDocumento.codigo,
      novoDocumento.titulo,
      false
    );

    return NextResponse.json({ message: 'Documento enviado para aprovação com sucesso.', documento: novoDocumento }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao salvar documento' }, { status: 500 });
  }
}
