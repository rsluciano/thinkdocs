import { NextRequest, NextResponse } from 'next/server';

// Mock inteligente para simular a Think Quality AI
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ncData } = body;

    // Simulação de delay de processamento LLM (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (action === 'SUGGEST_METHODOLOGY') {
      const isComplex = ncData?.criticidade === 'Alta' || ncData?.setor === 'Hematologia';
      return NextResponse.json({
        suggestion: isComplex ? 'Ishikawa + 5 Porquês' : '5 Porquês',
        primaryMethod: isComplex ? 'Ishikawa' : '5 Porquês',
        confidence: 93,
        reasoning: `Analisei a descrição desta Não Conformidade do setor ${ncData?.setor || 'Geral'}. Como a criticidade é ${ncData?.criticidade || 'Média'}, o problema provavelmente envolve processos, equipamentos e equipe. Sugiro começar estruturando as causas e aprofundando o porquê raiz.`,
      });
    }

    if (action === 'FILL_ISHIKAWA') {
      return NextResponse.json({
        maoDeObra: ['Falta de treinamento específico', 'Não conferência do material antes do uso'],
        maquina: ['Equipamento sem manutenção preventiva atualizada'],
        metodo: ['POP desatualizado', 'Ausência de dupla checagem exigida'],
        material: ['Lote do insumo próximo ao vencimento'],
        medicao: ['Desvio na calibração do instrumento de leitura'],
        meioAmbiente: ['Variação de temperatura na sala de coleta'],
      });
    }

    if (action === 'FILL_5_WHYS') {
      return NextResponse.json([
        { id: 1, pergunta: 'Por que o erro ocorreu?', resposta: 'Porque o material inadequado foi utilizado no procedimento.' },
        { id: 2, pergunta: 'Por que o material inadequado foi utilizado?', resposta: 'Porque ele estava armazenado junto com os materiais liberados para uso.' },
        { id: 3, pergunta: 'Por que estava armazenado ali?', resposta: 'Porque o setor não possui segregação física para itens em quarentena.' },
        { id: 4, pergunta: 'Por que não há segregação física?', resposta: 'Porque o layout foi alterado recentemente e a área de quarentena foi desativada temporariamente.' },
        { id: 5, pergunta: 'Por que a área foi desativada sem plano de contingência?', resposta: 'Porque a gestão de mudanças não avaliou o impacto de espaço (Causa Raiz).' }
      ]);
    }

    if (action === 'FILL_FMEA') {
      return NextResponse.json({
        modoFalha: 'Falha na identificação correta da amostra',
        efeito: 'Troca de resultados de pacientes',
        causa: 'Fadiga do operador e ausência de biometria',
        controles: 'Conferência manual por código de barras',
        severidade: 9,
        ocorrencia: 4,
        deteccao: 5,
        rpn: 180
      });
    }

    if (action === 'FILL_BRAINSTORMING') {
      return NextResponse.json({
        ideias: [
          'Revisar POP-COL-001',
          'Treinar equipe técnica urgente',
          'Alterar layout do guichê',
          'Instalar novo leitor de código de barras',
          'Implementar dupla checagem obrigatória no sistema'
        ]
      });
    }

    if (action === 'GENERATE_CAPA') {
      return NextResponse.json({
        what: 'Revisão do Procedimento de Identificação (POP) e Treinamento',
        why: 'Para eliminar a causa raiz de falha na segregação/identificação',
        where: 'Setor de Triagem e Coleta',
        who: 'Coordenador da Qualidade',
        when: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        how: 'Conduzir reunião, aprovar nova versão no sistema e aplicar prova de eficácia',
        howMuch: '0.00 (Recursos Internos)',
      });
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });

  } catch (error) {
    console.error("Erro na API da Think Quality AI:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
