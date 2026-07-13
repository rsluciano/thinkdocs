import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ leituras: [] }));
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!db.leituras) db.leituras = [];
  return db;
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Retorna todas as leituras da empresa
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    const db = getDb();
    
    let leituras = db.leituras;
    if (empresaId) {
      leituras = leituras.filter((l: any) => l.empresaId === empresaId);
    }
    
    return NextResponse.json(leituras);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar leituras' }, { status: 500 });
  }
}

// Salva um novo Termo de Ciência
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { empresaId, usuarioId, usuarioNome, usuarioSetor, documentoId, documentoCodigo, documentoTitulo, documentoVersao } = data;

    if (!empresaId || !usuarioId || !documentoId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const db = getDb();
    
    // Evita duplicidade se o usuário já leu esta versão específica
    const jaLeu = db.leituras.find((l: any) => 
      l.usuarioId === usuarioId && 
      l.documentoId === documentoId && 
      l.documentoVersao === documentoVersao
    );

    if (jaLeu) {
      return NextResponse.json({ message: 'Leitura já estava registrada', leitura: jaLeu }, { status: 200 });
    }

    const novaLeitura = {
      id: Date.now().toString(),
      empresaId,
      usuarioId,
      usuarioNome,
      usuarioSetor,
      documentoId,
      documentoCodigo,
      documentoTitulo,
      documentoVersao,
      dataHoraLeitura: new Date().toISOString()
    };

    db.leituras.push(novaLeitura);
    saveDb(db);

    return NextResponse.json({ message: 'Ciente registrado com sucesso', leitura: novaLeitura }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao salvar leitura' }, { status: 500 });
  }
}
