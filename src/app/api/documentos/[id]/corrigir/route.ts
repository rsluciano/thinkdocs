import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) return { documentos: [] };
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { codigo, titulo, categoria, arquivo, setor, dataAtualizacao, dataProximaAtualizacao } = data;

    const db = getDb();
    const docIndex = db.documentos.findIndex((d: any) => d.id === id);

    if (docIndex === -1) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const doc = db.documentos[docIndex];
    
    if (doc.status !== 'Reprovado') {
      return NextResponse.json({ error: 'Apenas documentos reprovados podem ser corrigidos dessa forma.' }, { status: 400 });
    }

    // Atualiza os dados que vieram do form
    if (codigo) doc.codigo = codigo;
    if (titulo) doc.titulo = titulo;
    if (categoria) doc.categoria = categoria;
    if (setor) doc.setor = setor;
    if (arquivo) doc.arquivoUrl = arquivo;
    
    if (dataAtualizacao) doc.dataAtualizacao = new Date(dataAtualizacao).toISOString();
    if (dataProximaAtualizacao) doc.dataVencimento = new Date(dataProximaAtualizacao).toISOString();

    // Remove o motivo de reprovação e volta para a fila
    delete doc.motivoReprovacao;
    doc.status = 'Aguardando Aprovação';
    doc.dataEnvio = new Date().toISOString();
    doc.aprovadoPor = null;
    doc.dataAprovacao = null;

    saveDb(db);

    return NextResponse.json({
      message: 'Documento corrigido e enviado para aprovação',
      documento: doc
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao atualizar documento' }, { status: 500 });
  }
}
