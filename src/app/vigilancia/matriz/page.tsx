'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function MatrizRDC() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroConformidade, setFiltroConformidade] = useState('');

  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtroCapitulo, setFiltroCapitulo] = useState('');
  const [filtroCriticidade, setFiltroCriticidade] = useState('');

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
    let passCap = true;
    let passCrit = true;
    let passConf = true;

    if (filtroCategoria && item.categoria !== filtroCategoria) passCat = false;
    // Capítulo logic can be added later if data supports it. Using generic filter.
    if (filtroCapitulo && !item.referencia?.includes(filtroCapitulo)) passCap = false; 
    
    if (filtroCriticidade && item.criticidade?.toLowerCase() !== filtroCriticidade.toLowerCase()) passCrit = false;

    if (filtroConformidade) {
      const isConf = aud?.conforme;
      if (filtroConformidade === 'NaoAvaliado' && isConf) passConf = false;
      if (filtroConformidade !== 'NaoAvaliado' && isConf !== filtroConformidade) passConf = false;
    }

    return passCat && passCap && passCrit && passConf;
  });

  // Cálculos de KPIs
  const totalRequisitos = filteredItems.length;
  const numConformes = filteredItems.filter(item => auditorias[item.id]?.conforme === 'S').length;
  const numNaoConformes = filteredItems.filter(item => auditorias[item.id]?.conforme === 'N').length;
  const numPendentes = filteredItems.filter(item => !auditorias[item.id]?.conforme).length;

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const getCriticidadeColor = (crit: string) => {
    switch(crit?.toLowerCase()) {
      case 'crítico': 
      case 'crítica': return 'text-red-600'; 
      case 'alto':
      case 'alta': return 'text-orange-600'; 
      case 'médio': 
      case 'média': return 'text-yellow-600'; 
      case 'baixo': 
      case 'baixa': return 'text-green-600'; 
      default: return 'text-slate-500';
    }
  };
  
  const getRefBadge = (ref: string) => {
    if (ref.toLowerCase().includes('art.')) return 'Artigo';
    if (ref.toLowerCase().includes('parágrafo')) return 'Parágrafo';
    if (ref.toLowerCase().includes('inciso') || ref.includes(' - ')) return 'Inciso';
    return 'Item';
  };

  const getRefBadgeColor = (type: string) => {
    if (type === 'Artigo') return 'bg-blue-100 text-blue-700';
    if (type === 'Parágrafo') return 'bg-purple-100 text-purple-700';
    return 'bg-indigo-100 text-indigo-700';
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Matriz RDC 978 - Requisitos</h2>
            <p className="text-sm text-slate-500 mt-1">Visualize, acompanhe e gerencie todos os requisitos da RDC 978/2025</p>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Card Total */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 flex-1 min-w-[140px] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{totalRequisitos}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Total de Requisitos</p>
            </div>
          </div>
          {/* Card Conformes */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 flex-1 min-w-[140px] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{numConformes}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Conformes</p>
            </div>
          </div>
          {/* Card Pendências */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 flex-1 min-w-[140px] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{numPendentes}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Pendências</p>
            </div>
          </div>
          {/* Card Não Conformes */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 flex-1 min-w-[140px] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-xl">❌</span>
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{numNaoConformes}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Não Conformes</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FILTROS SECTION */}
      <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
          <select 
            value={filtroCategoria} 
            onChange={e => {setFiltroCategoria(e.target.value); setCurrentPage(1);}}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-colors font-semibold shadow-sm"
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

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Capítulo</label>
          <select 
            value={filtroCapitulo} 
            onChange={e => {setFiltroCapitulo(e.target.value); setCurrentPage(1);}}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-colors font-semibold shadow-sm"
          >
            <option value="">Todos os Capítulos</option>
            <option value="Art. 1">Art. 1º ao 10º</option>
            <option value="Art. 11">Art. 11º em diante</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Criticidade</label>
          <select 
            value={filtroCriticidade} 
            onChange={e => {setFiltroCriticidade(e.target.value); setCurrentPage(1);}}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-colors font-semibold shadow-sm"
          >
            <option value="">Todas</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
            <option value="Informativo">Informativo</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conformidade</label>
          <select 
            value={filtroConformidade} 
            onChange={e => {setFiltroConformidade(e.target.value); setCurrentPage(1);}}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-colors font-semibold shadow-sm"
          >
            <option value="">Todos os Status</option>
            <option value="S">Conforme (S)</option>
            <option value="N">Não Conforme (N)</option>
            <option value="NA">Não Aplicável (NA)</option>
            <option value="NaoAvaliado">Não Avaliado</option>
          </select>
        </div>

        <div className="flex items-end gap-2 mt-5">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
            Filtros Avançados
          </button>
          <button 
            onClick={() => {setFiltroCategoria(''); setFiltroCapitulo(''); setFiltroCriticidade(''); setFiltroConformidade(''); setCurrentPage(1);}}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            Limpar Filtros
          </button>
          <button className="px-4 py-2 bg-blue-600 border border-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Exportar
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left text-slate-600 border-collapse">
          <thead className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200 font-bold">
            <tr>
              <th className="px-6 py-4 w-40">Referência</th>
              <th className="px-6 py-4">Texto Integral do Requisito</th>
              <th className="px-6 py-4 w-48">Categoria</th>
              <th className="px-6 py-4 w-32 text-center">Criticidade</th>
              <th className="px-6 py-4 w-40 text-center">Conformidade</th>
              <th className="px-6 py-4 w-24 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.map(item => {
              const aud = auditorias[item.id];
              const refType = getRefBadge(item.referencia);
              const refBadgeColor = getRefBadgeColor(refType);
              
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenModal(item)}>
                  <td className="px-6 py-5 align-top">
                    <p className="font-black text-slate-800 text-[13px]">{item.referencia}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${refBadgeColor}`}>
                      {refType}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-2 pr-4" title={item.textoIntegral}>
                      {item.textoIntegral}
                    </p>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-[13px] font-medium truncate max-w-[150px]">{item.categoria || 'Geral'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-center">
                    <span className={`text-[13px] font-bold ${getCriticidadeColor(item.criticidade)}`}>
                      {item.criticidade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-center">
                    {!aud?.conforme ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-full border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Pendente
                      </span>
                    ) : aud.conforme === 'S' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                        <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                        Conforme
                      </span>
                    ) : aud.conforme === 'N' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 rounded-full border border-rose-200">
                        <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        Não Conforme
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-yellow-700 bg-yellow-50 rounded-full border border-yellow-200">
                        <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>
                        Não Aplicável
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                      <button className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors" title="Visualizar">
                        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors" title="Opções">
                        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum requisito encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER / PAGINATION */}
      <div className="p-4 border-t border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <span>Mostrando {filteredItems.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredItems.length)} de {filteredItems.length} requisitos</span>
          <select 
            value={itemsPerPage} 
            onChange={e => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            «
          </button>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          
          {/* Exibir até 3 páginas no meio */}
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            // Logica simplificada para centralizar páginas
            let pageNum = currentPage;
            if (currentPage === 1) pageNum = i + 1;
            else if (currentPage === totalPages && totalPages > 2) pageNum = totalPages - 2 + i;
            else pageNum = currentPage - 1 + i;

            if (pageNum > totalPages) return null;

            return (
              <button 
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  currentPage === pageNum 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'border border-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            )
          })}

          {totalPages > 3 && currentPage < totalPages - 1 && (
            <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
          )}

          {totalPages > 3 && currentPage < totalPages - 1 && (
            <button 
              onClick={() => setCurrentPage(totalPages)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold border border-transparent text-slate-600 hover:bg-slate-100"
            >
              {totalPages}
            </button>
          )}

          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ›
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(totalPages)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      </div>
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
