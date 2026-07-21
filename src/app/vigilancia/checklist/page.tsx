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

      <div className="flex flex-col gap-2">
        {filteredItems.map(item => {
          const aud = auditorias[item.id];
          const isConforme = aud?.conforme === 'S';
          const isNaoConforme = aud?.conforme === 'N';
          const isNA = aud?.conforme === 'NA';
          
          return (
            <div key={item.id} className="flex flex-col relative">
              <div 
                className={`group py-4 px-3 md:px-4 rounded-xl flex flex-col lg:flex-row gap-4 lg:items-center transition-all border ${
                  isConforme ? 'bg-green-50/30 border-green-200' : 
                  isNaoConforme ? 'bg-red-50/30 border-red-200' : 
                  isNA ? 'bg-yellow-50/30 border-yellow-200' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Esquerda: Referência e Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 tracking-wide">
                      {item.referencia}
                    </span>
                    {item.criticidade === 'Crítico' && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        Crítico
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed pr-4">
                    {item.textoIntegral}
                  </p>
                </div>
                
                {/* Direita: Ações Inline */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap lg:flex-nowrap mt-2 lg:mt-0">
                  <button 
                    onClick={() => handleAiAnalysis(item)}
                    disabled={aiLoading === item.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shadow-sm ${
                      aiResult[item.id] 
                        ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' 
                        : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                    }`}
                    title="Explicar requisito com Inteligência Artificial"
                  >
                    {aiLoading === item.id ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-200 border-t-current animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                      </svg>
                    )}
                    {aiResult[item.id] ? 'Ocultar IA' : 'IA'}
                  </button>

                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner items-center gap-1">
                    <button 
                      onClick={() => handleSaveStatus(item, 'S')}
                      disabled={saving}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        isConforme 
                          ? 'bg-green-500 text-white shadow-sm ring-1 ring-green-600' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      SIM
                    </button>
                    <button 
                      onClick={() => handleSaveStatus(item, 'N')}
                      disabled={saving}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        isNaoConforme 
                          ? 'bg-red-500 text-white shadow-sm ring-1 ring-red-600' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      NÃO
                    </button>
                    <button 
                      onClick={() => handleSaveStatus(item, 'NA')}
                      disabled={saving}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        isNA 
                          ? 'bg-yellow-400 text-yellow-900 shadow-sm ring-1 ring-yellow-500' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                      title="Não Aplicável"
                    >
                      N/A
                    </button>
                  </div>
                </div>
              </div>

              {/* Caixa da IA (Abre abaixo do item) */}
              {aiResult[item.id] && (
                <div className="mt-2 mb-4 ml-0 lg:ml-4 p-5 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-md animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  
                  <div className="mb-4">
                    <h4 className="text-[11px] uppercase text-indigo-600 tracking-widest font-extrabold flex items-center gap-1.5 mb-1.5">
                      <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" />
                      </svg>
                      Interpretação Simplificada
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{aiResult[item.id].traducaoSimplificada}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <h4 className="text-[11px] uppercase text-slate-500 tracking-widest font-extrabold mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Evidências Sugeridas
                      </h4>
                      <ul className="space-y-1.5">
                        {aiResult[item.id].sugestoesEvidencias?.map((ev: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-indigo-400 mt-0.5">•</span> {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-red-50/50 p-3 rounded-lg border border-red-100 shadow-sm">
                      <h4 className="text-[11px] uppercase text-red-600 tracking-widest font-extrabold mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Riscos de Não Conformidade
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{aiResult[item.id].riscosNaoConformidade}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
