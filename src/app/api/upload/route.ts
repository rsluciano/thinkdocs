import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const empresa = formData.get('empresa') as String | 'ThinkDocs';
    const categoria = formData.get('categoria') as String | 'Geral';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Organização de pastas exigida pelo cliente: Empresa > Categoria
    // Mapeamento para nomes de pastas amigáveis e organizadas
    const catString = String(categoria);
    let folderCategoria = catString.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    if (catString === 'Formulários') folderCategoria = 'Formularios';
    else if (catString === 'Instruções de Trabalho') folderCategoria = 'Instrucao_de_Trabalho_de_Servico_ITS';
    else if (catString === 'Procedimentos (POP)') folderCategoria = 'Procedimentos_POP';
    else if (catString === 'Manuais') folderCategoria = 'Manuais';

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePathPath = `${empresa}/${folderCategoria}/${safeFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('documentos')
      .upload(filePathPath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Falha ao fazer upload para o Storage' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('documentos')
      .getPublicUrl(filePathPath);

    return NextResponse.json({ 
      message: 'Upload concluído com sucesso', 
      filename: safeFilename,
      url: publicUrlData.publicUrl
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Falha ao processar o upload' }, { status: 500 });
  }
}
