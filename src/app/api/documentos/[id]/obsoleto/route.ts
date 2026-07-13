import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const docIndex = db.documentos.findIndex((d: any) => d.id === id);

    if (docIndex === -1) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    db.documentos[docIndex].status = 'Obsoleto';
    db.documentos[docIndex].dataVencimento = null; // Clear validity

    saveDb(db);

    return NextResponse.json({ message: 'Documento movido para Arquivo Morto (Obsoleto)' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
