import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const empresa = searchParams.get('empresa');
  const categoria = searchParams.get('categoria');
  const fileName = searchParams.get('file');

  if (!fileName || !empresa || !categoria) {
    return new NextResponse('Parâmetros de arquivo inválidos', { status: 400 });
  }

  // Prevenir directory traversal de segurança
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return new NextResponse('Acesso negado: Nome de arquivo inválido', { status: 403 });
  }

  const catString = String(categoria);
  let folderCategoria = catString.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
  
  if (catString === 'Formulários') folderCategoria = 'Formularios';
  else if (catString === 'Instruções de Trabalho') folderCategoria = 'Instrucao_de_Trabalho_de_Servico_ITS';
  else if (catString === 'Procedimentos (POP)') folderCategoria = 'Procedimentos_POP';
  else if (catString === 'Manuais') folderCategoria = 'Manuais';

  const filePath = `${empresa}/${folderCategoria}/${fileName}`;

  try {
    const { data } = supabase.storage.from('documentos').getPublicUrl(filePath);
    
    if (data && data.publicUrl) {
      return NextResponse.redirect(data.publicUrl);
    }
    
    return new NextResponse('Arquivo não encontrado no storage', { status: 404 });
  } catch (error) {
    return new NextResponse('Erro ao buscar o arquivo', { status: 500 });
  }
}
