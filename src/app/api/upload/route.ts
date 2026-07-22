import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'image/jpeg',
  'image/png'
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado para upload' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoria = formData.get('categoria') as String | 'Geral';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O arquivo excede o limite de 20MB.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato de arquivo não suportado. Envie apenas PDF, Word, Excel ou Imagens.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Organização de pastas
    const catString = String(categoria);
    let folderCategoria = catString.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    if (catString === 'Formulários') folderCategoria = 'Formularios';
    else if (catString === 'Instruções de Trabalho') folderCategoria = 'Instrucao_de_Trabalho_de_Servico_ITS';
    else if (catString === 'Procedimentos (POP)') folderCategoria = 'Procedimentos_POP';
    else if (catString === 'Manuais') folderCategoria = 'Manuais';

    // Anti-spoofing: a pasta principal SEMPRE será o empresaId do token validado.
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePathPath = `${session.empresaId}/${folderCategoria}/${safeFilename}`;

    const { data, error } = await supabase
      .storage
      .from('documentos')
      .upload(filePathPath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Falha ao fazer upload para o Storage' }, { status: 500 });
    }

    // URL pública removida por segurança. Usar sempre o proxy interno /api/download
    return NextResponse.json({ 
      message: 'Upload concluído com sucesso', 
      filename: safeFilename,
      url: `/api/download?empresa=${session.empresaId}&categoria=${encodeURIComponent(String(categoria))}&file=${encodeURIComponent(safeFilename)}`
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Falha ao processar o upload' }, { status: 500 });
  }
}
