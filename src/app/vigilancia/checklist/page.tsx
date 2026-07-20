'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function ChecklistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  
  // Estado para o painel inferior mobile (Bottom Sheet simplificado)
  const [activeItem, setActiveItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Estados para Inteligência Artificial no Checklist
  const [aiLoading, setAiLoading] = useState<string | null>(null); // Armazena o ID do item sendo analisado
  const [aiResult, setAiResult] = useState<Record<string, any>>({}); // Armazena resultados por ID do item

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resItems, resAud] = await Promise.all([
        fetchAPI('/api/vigilancia/rdc-items'),
        fetchAPI('/api/vigilancia/auditoria')
      ]);

      if (resItems.ok && resAud.ok) {
        setItems(await resItems.json());
        const dataAud = await resAud.json();
        const audMap: Record<string, any> = {};
        dataAud.forEach((aud: any) => { audMap[aud.rdcItemId] = aud; });
        setAuditorias(audMap);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async (item: any, status: string) => {
    setSaving(true);
    try {
      const currentAud = auditorias[item.id] || {};
      const payload = { ...currentAud, conforme: status };
      
      const res = await fetchAPI(`/api/vigilancia/auditoria/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const audSalva = await res.json();
        setAuditorias(prev => ({ ...prev, [item.id]: audSalva }));
      }
    } catch (e) {
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleAiAnalysis = async (item: any) => {
    if (!item?.textoIntegral || aiLoading === item.id) return;
    
    // Se já temos o resultado, apenas limpa para ocultar (toggle)
    if (aiResult[item.id]) {
      const newResults = {...aiResult};
      delete newResults[item.id];
      setAiResult(newResults);
      return;
    }

    setAiLoading(item.id);
    try {
      const res = await fetch('/api/ai/analyze-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textoIntegral: item.textoIntegral })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResult(prev => ({ ...prev, [item.id]: data }));
      } else {
        alert('Erro ao analisar com a IA.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão com a IA.');
    } finally {
      setAiLoading(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (filtroCategoria && item.categoria !== filtroCategoria) return false;
    return true;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="pb-20 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
          </svg>
          Checklist de Campo
        </h2>
        <p className="text-sm text-slate-500">Avaliação rápida para uso em tablets e celulares durante a auditoria física.</p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Filtrar Categoria</label>
        <select 
          value={filtroCategoria} 
          onChange={e => setFiltroCategoria(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
        >
          <option value="">Todas as Categorias</option>
          <option value="Estrutura Física">Estrutura Física</option>
          <option value="Equipamentos">Equipamentos</option>
          <option value="Biossegurança">Biossegurança</option>
          <option value="Gestão">Gestão</option>
          <option value="Serviços e Infraestrutura">Serviços e Infraestrutura</option>
          <option value="Gestão da Qualidade">Gestão da Qualidade</option>
          <option value="Gestão de Documentos">Gestão de Documentos</option>
          <option value="Pessoal e Educação">Pessoal e Educação</option>
        </select>
      </div>

      <div className="flex flex-col gap-4">
        {filteredItems.map(item => {
          const aud = auditorias[item.id];
          const isConforme = aud?.conforme === 'S';
          const isNaoConforme = aud?.conforme === 'N';
          const isNA = aud?.conforme === 'NA';
          
          return (
            <div 
              key={item.id} 
              className={`p-5 rounded-xl border-l-4 shadow-sm bg-white border border-slate-100 transition-colors ${
                isConforme ? 'border-l-green-500 bg-green-50/30' : 
                isNaoConforme ? 'border-l-red-500 bg-red-50/30' : 
                isNA ? 'border-l-yellow-500 bg-yellow-50/30' : 'border-l-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{item.referencia}</span>
                  {item.criticidade === 'Crítico' && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">CRÍTICO</span>}
                </div>
                <button 
                  onClick={() => handleAiAnalysis(item)}
                  disabled={aiLoading === item.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-lg transition-colors border shadow-sm ${
                    aiResult[item.id] ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                  title="Análise com Inteligência Artificial"
                >
                  {aiLoading === item.id ? (
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-200 border-t-current animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  )}
                  {aiResult[item.id] ? 'Fechar IA' : 'Analisar com IA'}
                </button>
              </div>
              
              <p className="text-sm font-medium text-slate-800 mb-4">{item.textoIntegral}</p>
              
              {aiResult[item.id] && (
                <div className="mb-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 shadow-inner animate-fade-in">
                  <div className="mb-2">
                    <strong className="text-[0.7rem] uppercase text-indigo-800 tracking-wider font-bold">Interpretação Simplificada</strong>
                    <p className="text-xs text-slate-700 mt-1">{aiResult[item.id].traducaoSimplificada}</p>
                  </div>
                  <div className="mb-2">
                    <strong className="text-[0.7rem] uppercase text-indigo-800 tracking-wider font-bold">Evidências Sugeridas</strong>
                    <ul className="list-disc list-inside text-xs text-slate-700 mt-0.5">
                      {aiResult[item.id].sugestoesEvidencias?.map((ev: string, idx: number) => <li key={idx}>{ev}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[0.7rem] uppercase text-red-800 tracking-wider font-bold">Riscos de Não Conformidade</strong>
                    <p className="text-xs text-slate-700 mt-1">{aiResult[item.id].riscosNaoConformidade}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleSaveStatus(item, 'S')}
                  disabled={saving}
                  className={`py-2 px-1 rounded-lg text-xs md:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1
                    ${isConforme ? 'bg-green-600 text-white shadow-green-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                  `}
                >
                  {isConforme && '✅'} CONFORME
                </button>
                <button 
                  onClick={() => handleSaveStatus(item, 'N')}
                  disabled={saving}
                  className={`py-2 px-1 rounded-lg text-xs md:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1
                    ${isNaoConforme ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'}
                  `}
                >
                  {isNaoConforme && '❌'} NÃO CONFORME
                </button>
                <button 
                  onClick={() => handleSaveStatus(item, 'NA')}
                  disabled={saving}
                  className={`py-2 px-1 rounded-lg text-xs md:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1
                    ${isNA ? 'bg-yellow-500 text-white shadow-yellow-500/30' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-100'}
                  `}
                  title="Não se aplica ao estabelecimento"
                >
                  {isNA && '⚠️'} N/A
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
