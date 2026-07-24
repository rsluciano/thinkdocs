import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    // Buscando todas as NCs da empresa
    const rncs = await prisma.naoConformidade.findMany({
      where: { empresaId: session.empresaId },
      include: {
        analises: true,
      }
    });

    const total = rncs.length;
    const abertas = rncs.filter(r => ['Registrada', 'Aberta'].includes(r.status)).length;
    const emAnalise = rncs.filter(r => r.status === 'Em Análise').length;
    const emAcao = rncs.filter(r => ['Ação Pendente', 'Em Ação'].includes(r.status)).length;
    const concluidas = rncs.filter(r => r.status === 'Concluída').length;
    const criticas = rncs.filter(r => r.criticidade === 'Alta').length;

    // Agrupamento por Setor
    const setorCounts: Record<string, number> = {};
    rncs.forEach(r => {
      const s = r.setor || 'Geral';
      setorCounts[s] = (setorCounts[s] || 0) + 1;
    });
    const porSetor = Object.entries(setorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Agrupamento por Criticidade
    const critCounts: Record<string, number> = {
      'Alta': 0, 'Média': 0, 'Baixa': 0, 'Observação': 0
    };
    rncs.forEach(r => {
      const c = r.criticidade || 'Observação';
      if (critCounts[c] !== undefined) critCounts[c]++;
    });
    const porCriticidade = [
      { name: 'Alta',       value: critCounts['Alta'],       fill: '#EF4444' },
      { name: 'Média',      value: critCounts['Média'],      fill: '#F59E0B' },
      { name: 'Baixa',      value: critCounts['Baixa'],      fill: '#22C55E' },
      { name: 'Observação', value: critCounts['Observação'], fill: '#94A3B8' },
    ].filter(c => c.value > 0);

    // Agrupamento de Metodologias (Contar quantas analises de cada tipo existem)
    const metCounts: Record<string, number> = {
      'Diagrama de Ishikawa': 0,
      '5 Porquês': 0,
      'FMEA': 0,
      'Brainstorming': 0,
      'Outros': 0
    };
    let totalMet = 0;

    rncs.forEach(r => {
      r.analises.forEach(a => {
        const m = a.metodologia;
        totalMet++;
        if (m.toLowerCase().includes('ishikawa')) metCounts['Diagrama de Ishikawa']++;
        else if (m.toLowerCase().includes('porquês') || m.toLowerCase().includes('porques') || m.toLowerCase().includes('5whys')) metCounts['5 Porquês']++;
        else if (m.toLowerCase().includes('fmea')) metCounts['FMEA']++;
        else if (m.toLowerCase().includes('brainstorm')) metCounts['Brainstorming']++;
        else metCounts['Outros']++;
      });
    });

    const metodologias = [
      { name: 'Diagrama Ishikawa', count: metCounts['Diagrama de Ishikawa'], pct: 0, color: '#7C3AED', emoji: '⚗️' },
      { name: '5 Porquês',         count: metCounts['5 Porquês'],            pct: 0, color: '#C2410C', emoji: '❓' },
      { name: 'FMEA',              count: metCounts['FMEA'],                 pct: 0, color: '#1D4ED8', emoji: '🔬' },
      { name: 'Outros',            count: metCounts['Outros'] + metCounts['Brainstorming'], pct: 0, color: '#166534', emoji: '💡' }
    ];
    
    if (totalMet > 0) {
      metodologias.forEach(m => {
        m.pct = Math.round((m.count / totalMet) * 100);
      });
    }

    // Tendencia mensal (últimos 6 meses)
    const historicoMensal: number[] = [0, 0, 0, 0, 0, 0, 0];
    const hoje = new Date();
    rncs.forEach(r => {
      const rDate = new Date(r.dataRegistro);
      const diffTime = Math.abs(hoje.getTime() - rDate.getTime());
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
      if (diffMonths >= 0 && diffMonths < 7) {
         historicoMensal[6 - diffMonths]++;
      }
    });

    return NextResponse.json({
      stats: { total, abertas, emAnalise, emAcao, concluidas, criticas },
      porSetor,
      porCriticidade,
      metodologias,
      historicoMensal
    });
  } catch (error: any) {
    console.error("Erro ao gerar dashboard:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
