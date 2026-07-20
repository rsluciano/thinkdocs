'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function MatrizRDC() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroConformidade, setFiltroConformidade] = useState('');

  // Estados para edição in-line (Modal)
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Estados para a Inteligência Artificial
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

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
        const dataItems = await resItems.json();
        const dataAud = await resAud.json();

        setItems(dataItems);

        const audMap: Record<string, any> = {};
        dataAud.forEach((aud: any) => {
          audMap[aud.rdcItemId] = aud;
        });
        setAuditorias(audMap);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar matriz.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any) => {
    const aud = auditorias[item.id] || {};
    setActiveItem(item);
    setEditData({
      conforme: aud.conforme || '',
      evidenciaEncontrada: aud.evidenciaEncontrada || '',
      acaoCorretiva: aud.acaoCorretiva || '',
      prazo: aud.prazo ? aud.prazo.substring(0,10) : '',
      status: aud.status || 'Pendente',
      observacoes: aud.observacoes || ''
    });
    setModalOpen(true);
    setAiResult(null); // Limpar análise anterior ao abrir um novo
  };

  const handleAiAnalysis = async () => {
    if (!activeItem?.textoIntegral) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textoIntegral: activeItem.textoIntegral })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
      } else {
        alert('Erro ao analisar com a IA.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão com a IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeItem) return;
    setSaving(true);
    try {
      const res = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        const audSalva = await res.json();
        setAuditorias(prev => ({ ...prev, [activeItem.id]: audSalva }));
        setModalOpen(false);
      } else {
        alert('Erro ao salvar auditoria.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const toggleNA = async (item: any) => {
    const aud = auditorias[item.id] || {};
    const isNA = aud.conforme === 'NA';
    const newConforme = isNA ? '' : 'NA';
    
    // Preparar payload mantendo os dados existentes ou criando novos
    const payload = {
      conforme: newConforme,
      status: newConforme === 'NA' ? 'Concluído' : (aud.status || 'Pendente'),
      evidenciaEncontrada: aud.evidenciaEncontrada || '',
      acaoCorretiva: aud.acaoCorretiva || '',
      prazo: aud.prazo || '',
      observacoes: aud.observacoes || ''
    };

    try {
      const res = await fetchAPI(`/api/vigilancia/auditoria/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const audSalva = await res.json();
        setAuditorias(prev => ({ ...prev, [item.id]: audSalva }));
      } else {
        alert('Erro ao atualizar status N/A.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    }
  };

  // Filtragem
  const filteredItems = items.filter(item => {
    const aud = auditorias[item.id];
    let passCat = true;
    let passConf = true;

    if (filtroCategoria && item.categoria !== filtroCategoria) passCat = false;
    
    if (filtroConformidade) {
      const isConf = aud?.conforme;
      if (filtroConformidade === 'NaoAvaliado' && isConf) passConf = false;
      if (filtroConformidade !== 'NaoAvaliado' && isConf !== filtroConformidade) passConf = false;
    }

    return passCat && passConf;
  });

  const getCriticidadeColor = (crit: string) => {
    switch(crit?.toLowerCase()) {
      case 'crítico': return '#dc2626'; // Red
      case 'alto': return '#ea580c'; // Orange
      case 'médio': return '#eab308'; // Yellow
      case 'baixo': return '#22c55e'; // Green
      default: return '#94a3b8';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          Matriz RDC 978 - Requisitos
        </h2>
      </div>
      
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria</label>
          <select 
            value={filtroCategoria} 
            onChange={e => setFiltroCategoria(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
          >
            <option value="">Todas as Categorias</option>
            <option value="Gestão">Gestão</option>
            <option value="Estrutura Física">Estrutura Física</option>
            <option value="Recursos Humanos">Recursos Humanos</option>
            <option value="Documentação">Documentação</option>
            <option value="Serviços e Infraestrutura">Serviços e Infraestrutura</option>
            <option value="Gestão da Qualidade">Gestão da Qualidade</option>
            <option value="Gestão de Documentos">Gestão de Documentos</option>
            <option value="Pessoal e Educação">Pessoal e Educação</option>
            <option value="Geral">Geral</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Conformidade</label>
          <select 
            value={filtroConformidade} 
            onChange={e => setFiltroConformidade(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
          >
            <option value="">Todos os Status</option>
            <option value="S">Conforme (S)</option>
            <option value="N">Não Conforme (N)</option>
            <option value="NA">Não Aplicável (NA)</option>
            <option value="NaoAvaliado">Não Avaliado</option>
          </select>
        </div>
        <div className="flex items-end justify-end">
          <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold border border-blue-100 w-full text-center md:text-right md:w-auto">
            {filteredItems.length} requisitos listados
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Referência</th>
              <th className="px-6 py-4 font-semibold">Texto Integral do Requisito</th>
              <th className="px-6 py-4 font-semibold text-center">Criticidade</th>
              <th className="px-6 py-4 font-semibold text-center">Conformidade</th>
              <th className="px-6 py-4 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const aud = auditorias[item.id];
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap align-top">{item.referencia}</td>
                  <td className="px-6 py-4 align-top">
                    <p className="line-clamp-3 text-slate-700" title={item.textoIntegral}>
                      {item.textoIntegral}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span 
                      style={{ backgroundColor: getCriticidadeColor(item.criticidade) }}
                      className="px-2.5 py-1 text-xs font-bold text-white rounded-full"
                    >
                      {item.criticidade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-top font-medium">
                    {!aud?.conforme ? <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md text-xs">Não Avaliado</span> :
                     aud.conforme === 'S' ? <span className="text-green-700 bg-green-100 px-2 py-1 rounded-md text-xs">Conforme</span> :
                     aud.conforme === 'N' ? <span className="text-red-700 bg-red-100 px-2 py-1 rounded-md text-xs">Não Conforme</span> :
                     <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md text-xs">Não Aplicável</span>}
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => toggleNA(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm border ${
                          aud?.conforme === 'NA' 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={aud?.conforme === 'NA' ? "Remover N/A" : "Marcar como Não Aplicável"}
                      >
                        N/A
                      </button>
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Avaliar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Nenhum requisito encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Avaliação Premium */}
      {modalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm">{activeItem.referencia}</span>
                Auditoria de Requisito
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Box de IA */}
              <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-1">
                <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-indigo-50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900">Análise Inteligente</h4>
                      <p className="text-xs text-indigo-700/80">Entenda este requisito e saiba quais evidências anexar.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-white animate-spin"></div> Analisando...</>
                    ) : 'Gerar Análise'}
                  </button>
                </div>

                {aiResult && (
                  <div className="p-4 mt-2 bg-white rounded-lg border border-indigo-100 shadow-inner">
                    <div className="mb-3">
                      <strong className="text-xs uppercase text-indigo-800 tracking-wider font-bold">Interpretação Simplificada</strong>
                      <p className="text-sm text-slate-700 mt-1">{aiResult.traducaoSimplificada}</p>
                    </div>
                    <div className="mb-3">
                      <strong className="text-xs uppercase text-indigo-800 tracking-wider font-bold">Evidências Sugeridas</strong>
                      <ul className="list-disc list-inside text-sm text-slate-700 mt-1">
                        {aiResult.sugestoesEvidencias?.map((ev: string, idx: number) => <li key={idx}>{ev}</li>)}
                      </ul>
                    </div>
                    <div className="mb-3">
                      <strong className="text-xs uppercase text-red-800 tracking-wider font-bold">Riscos de Não Conformidade</strong>
                      <p className="text-sm text-slate-700 mt-1">{aiResult.riscosNaoConformidade}</p>
                    </div>
                    <p className="text-xs text-slate-400 italic mt-4">{aiResult.nota}</p>
                  </div>
                )}
              </div>

              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-800 leading-relaxed"><strong className="text-slate-900 font-bold block mb-1">Texto da Norma:</strong> {activeItem.textoIntegral}</p>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Situação (Conformidade)</label>
                <select 
                  value={editData.conforme} 
                  onChange={e => setEditData({...editData, conforme: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="S">Sim (Conforme)</option>
                  <option value="N">Não (Não Conforme)</option>
                  <option value="NA">Não Aplicável</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status da Ação</label>
                <select 
                  value={editData.status} 
                  onChange={e => setEditData({...editData, status: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Evidência Encontrada</label>
              <textarea 
                value={editData.evidenciaEncontrada}
                onChange={e => setEditData({...editData, evidenciaEncontrada: e.target.value})}
                rows={2}
                className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
                placeholder="Ex: POP 001 anexado, Planilha assinada..."
              />
            </div>

            {editData.conforme === 'N' && (
              <div className="mb-4 border-l-4 border-red-500 pl-4 py-1 bg-red-50/50 rounded-r-lg">
                <label className="block text-sm font-bold text-red-700 mb-1">Ação Corretiva Imediata</label>
                <textarea 
                  value={editData.acaoCorretiva}
                  onChange={e => setEditData({...editData, acaoCorretiva: e.target.value})}
                  rows={2}
                  className="w-full bg-white border border-red-300 text-slate-800 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 transition-colors mb-3"
                  placeholder="Ação para corrigir o desvio..."
                />
                
                <label className="block text-sm font-bold text-red-700 mb-1">Prazo Limite</label>
                <input 
                  type="date"
                  value={editData.prazo}
                  onChange={e => setEditData({...editData, prazo: e.target.value})}
                  className="w-full bg-white border border-red-300 text-slate-800 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 transition-colors"
                />
                <p className="text-xs text-red-600/80 mt-2 font-medium">* Para estruturar o Plano de Ação Completo (5W2H), utilize a Aba "Plano de Ação".</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Observações Gerais</label>
              <textarea 
                value={editData.observacoes}
                onChange={e => setEditData({...editData, observacoes: e.target.value})}
                rows={2}
                className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
              />
            </div>
          </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end rounded-b-2xl">
              <button 
                onClick={() => setModalOpen(false)} 
                className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                disabled={saving}
              >
                {saving && <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin"></div>}
                {saving ? 'Salvando...' : 'Salvar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
