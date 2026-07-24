import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializa o SDK da OpenAI apontando para a base URL do DeepSeek
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || 'MISSING_KEY', // O usuário configurará no .env
});

export async function POST(req: NextRequest) {
  try {
    const { action, ncData } = await req.json();

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ 
        error: 'Chave de API do DeepSeek não configurada.', 
        needsApiKey: true 
      }, { status: 400 });
    }

    let systemPrompt = '';
    let userPrompt = JSON.stringify(ncData);

    if (action === 'SUGGEST_METHODOLOGY') {
      systemPrompt = `Você é o Think Quality AI, um assistente especialista em Sistemas de Gestão da Qualidade (ISO 9001, RDC 978, etc.).
Analise a Não Conformidade fornecida (JSON) e sugira a melhor ferramenta de análise de causa raiz (Ishikawa, 5 Porquês, FMEA ou Brainstorming).
Retorne ESTRITAMENTE em formato JSON com esta estrutura:
{
  "suggestion": "Nome da(s) Metodologia(s)",
  "primaryMethod": "Nome exato (ISHIKAWA, 5WHYS, FMEA, BRAINSTORM)",
  "confidence": número (0 a 100),
  "reasoning": "Explicação detalhada e profissional da sua sugestão baseada no setor, criticidade e descrição."
}`;
    } 
    else if (action === 'FILL_ISHIKAWA') {
      systemPrompt = `Você é o Think Quality AI. Mapeie a causa da Não Conformidade fornecida utilizando o Diagrama de Ishikawa (6M).
Retorne ESTRITAMENTE em formato JSON com esta estrutura (arrays de strings curtas):
{
  "maoDeObra": ["causa1", "causa2"],
  "maquina": [...],
  "metodo": [...],
  "material": [...],
  "medicao": [...],
  "meioAmbiente": [...]
}
Se uma categoria não se aplicar, retorne um array vazio. Preencha causas super realistas e precisas ao problema.`;
    } 
    else if (action === 'FILL_5_WHYS') {
      systemPrompt = `Você é o Think Quality AI. Aplique a técnica dos 5 Porquês para a Não Conformidade fornecida.
Descubra a cadeia causal aprofundando o porquê 5 vezes até chegar à causa raiz.
Retorne ESTRITAMENTE em formato JSON, como um array de objetos:
[
  { "id": 1, "pergunta": "Por que [efeito]?", "resposta": "Porque [causa 1]" },
  { "id": 2, "pergunta": "Por que [causa 1]?", "resposta": "Porque [causa 2]" },
  ...até 5
]`;
    }
    else if (action === 'FILL_FMEA') {
      systemPrompt = `Você é o Think Quality AI. Faça um esboço inicial de FMEA (Failure Mode and Effects Analysis) para a Não Conformidade.
Retorne ESTRITAMENTE em formato JSON:
{
  "modoFalha": "Descrição do modo de falha",
  "efeito": "Efeito potencial",
  "causa": "Causa potencial",
  "controles": "Controles atuais",
  "severidade": número(1-10),
  "ocorrencia": número(1-10),
  "deteccao": número(1-10),
  "rpn": cálculo(S*O*D)
}`;
    }
    else if (action === 'FILL_BRAINSTORMING') {
      systemPrompt = `Você é o Think Quality AI. Gere ideias de brainstorming (possíveis causas e ações imediatas) para a Não Conformidade.
Retorne ESTRITAMENTE em formato JSON:
{
  "ideias": ["Ideia 1", "Ideia 2", "Ideia 3", "Ideia 4"]
}`;
    }
    else {
      return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
    }

    // Chama a API do DeepSeek
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }, // Força retorno JSON
      temperature: 0.7,
    });

    const aiContent = completion.choices[0].message.content;
    if (!aiContent) throw new Error("A IA não retornou conteúdo.");

    const jsonResult = JSON.parse(aiContent);

    return NextResponse.json(jsonResult);

  } catch (error: any) {
    console.error("Erro na API da Think Quality AI (DeepSeek):", error);
    
    // Tratamento específico de erro de API KEY
    if (error?.status === 401 || error?.error?.message?.includes('API key')) {
       return NextResponse.json({ 
         error: 'Chave de API do DeepSeek inválida ou não configurada.', 
         needsApiKey: true 
       }, { status: 401 });
    }

    return NextResponse.json({ error: 'Erro interno ao processar IA' }, { status: 500 });
  }
}
