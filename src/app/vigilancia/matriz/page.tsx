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

  // Estados para edição in-line (Modal)
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Estados para a Inteligência Artificial
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Estados para as Abas do Modal e Evidências
  const [modalTab, setModalTab] = useState<'avaliacao' | 'documentos'>('avaliacao');
  const [linkedDocuments, setLinkedDocuments] = useState<any[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [docToLink, setDocToLink] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  const handleOpenModal = async (item: any) => {
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
    setModalTab('avaliacao');
    setLinkedDocuments([]);
    
    // Fetch available docs once
    if (availableDocuments.length === 0) {
      try {
        const resDocs = await fetchAPI('/api/documentos');
        if (resDocs.ok) {
          setAvailableDocuments(await resDocs.json());
        }
      } catch(e) {}
    }

    // Fetch linked docs
    try {
      const resLinked = await fetchAPI(`/api/vigilancia/auditoria/${item.id}/documentos`);
      if (resLinked.ok) {
        setLinkedDocuments(await resLinked.json());
      }
    } catch(e) {}
  };

  const handleLinkDocument = async () => {
    if (!docToLink || !activeItem) return;
    try {
      const res = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}/documentos`, {
        method: 'POST',
        body: JSON.stringify({ documentoId: docToLink })
      });
      if (res.ok) {
        const resLinked = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}/documentos`);
        setLinkedDocuments(await resLinked.json());
        setDocToLink('');
        if (editData.conforme !== 'S') {
          setEditData((prev: any) => ({...prev, conforme: 'S'}));
          setAuditorias((prev: any) => ({...prev, [activeItem.id]: {...(prev[activeItem.id]||{}), conforme: 'S'}}));
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao vincular.');
      }
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  const handleUnlinkDocument = async (docId: string) => {
    if (!activeItem) return;
    if (!confirm('Deseja realmente desvincular este documento?')) return;
    try {
      const res = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}/documentos?documentoId=${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLinkedDocuments(linkedDocuments.filter(d => d.id !== docId));
      } else {
        alert('Erro ao desvincular.');
      }
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeItem) return;
    const file = e.target.files[0];
    
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoria', 'Evidências (Auditoria)');
      
      const uploadRes = await fetchAPI('/api/upload', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      
      if (!uploadRes.ok) {
        alert('Erro no upload do arquivo.');
        setUploadingDoc(false);
        return;
      }
      
      const uploadData = await uploadRes.json();
      
      const docRes = await fetchAPI('/api/documentos', {
        method: 'POST',
        body: JSON.stringify({
          titulo: `Evidência: ${file.name}`,
          codigo: 'EVD-' + activeItem.referencia.replace(/[^a-zA-Z0-9]/g, ''),
          categoria: 'Evidências (Auditoria)',
          arquivo: uploadData.url,
          isDraft: false
        })
      });

      if (!docRes.ok) {
        alert('Erro ao registrar documento.');
        setUploadingDoc(false);
        return;
      }

      const docData = await docRes.json();

      await fetchAPI(`/api/documentos/${docData.documento.id}/aprovar`, { method: 'POST' });

      const linkRes = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}/documentos`, {
        method: 'POST',
        body: JSON.stringify({ documentoId: docData.documento.id })
      });

      if (linkRes.ok) {
        const resLinked = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}/documentos`);
        setLinkedDocuments(await resLinked.json());
        if (editData.conforme !== 'S') {
          setEditData((prev: any) => ({...prev, conforme: 'S'}));
          setAuditorias((prev: any) => ({...prev, [activeItem.id]: {...(prev[activeItem.id]||{}), conforme: 'S'}}));
        }
        alert('Evidência enviada e vinculada com sucesso!');
      }

    } catch (error) {
      console.error(error);
      alert('Erro no envio da evidência.');
    } finally {
      setUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
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
    if (!ref) return 'Item';
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
    <div className="w-full bg-[#f8fafc] min-h-screen pb-12 font-sans animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 mb-4 bg-white px-6 py-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Matriz RDC 978 - Requisitos</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Visualize, acompanhe e gerencie todos os requisitos da RDC 978/2025</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 px-6">
        {/* Card Total */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">📋</span>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Total Geral</p>
          </div>
          <p className="text-xl font-black text-slate-800">{totalRequisitos}</p>
        </div>
        {/* Card Conformes */}
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">✅</span>
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Conformes</p>
          </div>
          <p className="text-xl font-black text-green-700">{numConformes}</p>
        </div>
        {/* Card Pendências */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">⚠️</span>
            <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-wide">Pendências</p>
          </div>
          <p className="text-xl font-black text-yellow-700">{numPendentes}</p>
        </div>
        {/* Card Não Conformes */}
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">❌</span>
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-wide">Não Conformes</p>
          </div>
          <p className="text-xl font-black text-red-700">{numNaoConformes}</p>
        </div>
      </div>
      
      {/* FILTROS SECTION */}
      <div className="bg-white border-y border-slate-200 py-5 mb-6 px-6 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Filtros de Pesquisa</h3>
          <div className="flex flex-wrap items-center gap-2">
             <button onClick={() => {setFiltroCategoria(''); setFiltroCapitulo(''); setFiltroCriticidade(''); setFiltroConformidade(''); setCurrentPage(1);}} className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center shadow-sm cursor-pointer">
               Limpar
             </button>
             <button className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center shadow-sm cursor-pointer">
               <svg className="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               Exportar
             </button>
             <button className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold flex items-center hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
               <svg className="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               Avançados
             </button>
             <button className="h-9 px-6 bg-[#2970ff] text-white rounded-3xl text-[11px] font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center cursor-pointer">
               <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               Buscar
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Categoria</label>
            <select 
              value={filtroCategoria} 
              onChange={e => {setFiltroCategoria(e.target.value); setCurrentPage(1);}}
              className="w-full h-9 px-3 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm cursor-pointer"
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
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Capítulo</label>
            <select 
              value={filtroCapitulo} 
              onChange={e => {setFiltroCapitulo(e.target.value); setCurrentPage(1);}}
              className="w-full h-9 px-3 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm cursor-pointer"
            >
              <option value="">Todos os Capítulos</option>
              <option value="Art. 1">Art. 1º ao 10º</option>
              <option value="Art. 11">Art. 11º em diante</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Criticidade</label>
            <select 
              value={filtroCriticidade} 
              onChange={e => {setFiltroCriticidade(e.target.value); setCurrentPage(1);}}
              className="w-full h-9 px-3 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm cursor-pointer"
            >
              <option value="">Todas as Criticidades</option>
              <option value="Crítica">Crítica</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
              <option value="Informativo">Informativo</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Conformidade</label>
            <select 
              value={filtroConformidade} 
              onChange={e => {setFiltroConformidade(e.target.value); setCurrentPage(1);}}
              className="w-full h-9 px-3 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="S">Conforme (S)</option>
              <option value="N">Não Conforme (N)</option>
              <option value="NA">Não Aplicável (NA)</option>
              <option value="NaoAvaliado">Não Avaliado</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mx-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-50/80 border-b border-slate-200 font-bold">
              <tr>
                <th className="px-4 py-3 w-48">Referência</th>
                <th className="px-4 py-3">Texto Integral do Requisito</th>
                <th className="px-4 py-3 w-52">Categoria</th>
                <th className="px-4 py-3 w-36 text-center">Criticidade</th>
                <th className="px-4 py-3 w-44 text-center">Conformidade</th>
                <th className="px-4 py-3 w-28 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {currentItems.map(item => {
              const aud = auditorias[item.id];
              const refType = getRefBadge(item.referencia);
              const refBadgeColor = getRefBadgeColor(refType);
              
              return (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer" onClick={() => handleOpenModal(item)}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-black text-slate-800 text-sm mb-1">{item.referencia}</p>
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${refBadgeColor}`}>
                      {refType}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-slate-700 text-xs leading-relaxed line-clamp-3 pr-4" title={item.textoIntegral}>
                      {item.textoIntegral}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-xs font-semibold truncate max-w-[150px]">{item.categoria || 'Geral'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    <span className={`text-xs font-bold ${getCriticidadeColor(item.criticidade)}`}>
                      {item.criticidade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    {!aud?.conforme ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-full border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Pendente
                      </span>
                    ) : aud.conforme === 'S' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                        <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                        Conforme
                      </span>
                    ) : aud.conforme === 'N' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 rounded-full border border-rose-200">
                        <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        Não Conforme
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-yellow-700 bg-yellow-50 rounded-full border border-yellow-200">
                        <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>
                        Não Aplicável
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                      <button className="p-2 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer" title="Visualizar">
                        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      <button className="p-2 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors cursor-pointer" title="Opções">
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
      {/* End Table Wrapper */}
      </div>
      
      {modalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-4">
              <div className="flex justify-between items-center">
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
              <div className="flex space-x-1 border-b border-slate-200">
                <button
                  onClick={() => setModalTab('avaliacao')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${modalTab === 'avaliacao' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Avaliação
                </button>
                <button
                  onClick={() => setModalTab('documentos')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${modalTab === 'documentos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Evidências e Documentos
                  {linkedDocuments.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{linkedDocuments.length}</span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {modalTab === 'avaliacao' ? (
              <div className="flex flex-col gap-6">
                
                {/* 1. SELETOR DE CONFORMIDADE (NOVO DESIGN PREMIUM) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">Situação de Conformidade</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setEditData({...editData, conforme: 'S'})}
                      className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editData.conforme === 'S' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                      <span className="font-bold text-sm">Conforme</span>
                    </button>
                    <button 
                      onClick={() => setEditData({...editData, conforme: 'N'})}
                      className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editData.conforme === 'N' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                      <span className="font-bold text-sm">Não Conforme</span>
                    </button>
                    <button 
                      onClick={() => setEditData({...editData, conforme: 'NA'})}
                      className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${editData.conforme === 'NA' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>
                      <span className="font-bold text-sm">Não Aplicável</span>
                    </button>
                  </div>
                </div>

                {/* 2. INFORMAÇÕES DA NORMA E IA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                    <strong className="text-slate-500 font-bold block mb-2 text-xs uppercase tracking-wide">Texto da Norma</strong> 
                    <div className="text-sm text-slate-700 leading-relaxed overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                      {activeItem.textoIntegral}
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col overflow-hidden max-h-[220px]">
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-indigo-50 shadow-sm shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-bold text-indigo-900">IA Analista</h4>
                      </div>
                      <button 
                        onClick={handleAiAnalysis}
                        disabled={aiLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {aiLoading ? (
                          <><div className="w-3 h-3 rounded-full border-2 border-indigo-200 border-t-white animate-spin"></div> Analisando</>
                        ) : 'Gerar Análise'}
                      </button>
                    </div>

                    <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                      {aiResult ? (
                        <div className="space-y-4">
                          <div>
                            <strong className="text-[10px] uppercase text-indigo-800 tracking-wider font-bold block mb-1">Interpretação</strong>
                            <p className="text-xs text-slate-700 leading-relaxed">{aiResult.traducaoSimplificada}</p>
                          </div>
                          <div>
                            <strong className="text-[10px] uppercase text-indigo-800 tracking-wider font-bold block mb-1">Evidências Sugeridas</strong>
                            <ul className="list-disc list-inside text-xs text-slate-700">
                              {aiResult.sugestoesEvidencias?.map((ev: string, idx: number) => <li key={idx}>{ev}</li>)}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <p className="text-xs text-indigo-400">Clique em "Gerar Análise" para a IA traduzir o requisito e sugerir evidências.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. CAMPOS ADICIONAIS E AÇÃO CORRETIVA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Status da Avaliação</label>
                    <select 
                      value={editData.status} 
                      onChange={e => setEditData({...editData, status: e.target.value})}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors shadow-sm"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Resumo da Evidência Encontrada</label>
                    <input 
                      value={editData.evidenciaEncontrada}
                      onChange={e => setEditData({...editData, evidenciaEncontrada: e.target.value})}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors shadow-sm"
                      placeholder="Ex: Anexado POP 001 e Termo Assinado..."
                    />
                  </div>
                </div>

                {editData.conforme === 'N' && (
                  <div className="border-l-4 border-red-500 bg-red-50/50 rounded-r-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-red-700 mb-1 uppercase tracking-wide">Ação Corretiva Imediata</label>
                        <input 
                          value={editData.acaoCorretiva}
                          onChange={e => setEditData({...editData, acaoCorretiva: e.target.value})}
                          className="w-full bg-white border border-red-300 text-slate-800 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 shadow-sm"
                          placeholder="Ação para corrigir o desvio..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-red-700 mb-1 uppercase tracking-wide">Prazo Limite</label>
                        <input 
                          type="date"
                          value={editData.prazo}
                          onChange={e => setEditData({...editData, prazo: e.target.value})}
                          className="w-full bg-white border border-red-300 text-slate-800 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 shadow-sm"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-red-600/80 mt-2 font-medium">* Para estruturar o Plano de Ação Completo (5W2H), utilize a Aba "Plano de Ação" (em breve).</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Observações Gerais</label>
                  <textarea 
                    value={editData.observacoes}
                    onChange={e => setEditData({...editData, observacoes: e.target.value})}
                    rows={2}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors shadow-sm"
                    placeholder="Anotações internas sobre esta avaliação..."
                  />
                </div>
              </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Lista de documentos vinculados */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                      Evidências Vinculadas
                    </h4>
                    
                    {linkedDocuments.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-sm text-slate-500">Nenhum documento ou evidência vinculada ainda.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {linkedDocuments.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{doc.titulo}</p>
                                <p className="text-xs text-slate-500">{doc.codigo} • {doc.categoria}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={doc.arquivoUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar">
                                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              </a>
                              <button onClick={() => handleUnlinkDocument(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Desvincular">
                                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações de Vínculo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Vincular Documento Existente</h4>
                      <div className="flex gap-2">
                        <select 
                          value={docToLink}
                          onChange={e => setDocToLink(e.target.value)}
                          className="flex-1 bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                        >
                          <option value="">Selecione um documento...</option>
                          {availableDocuments.filter(d => !linkedDocuments.find(ld => ld.id === d.id) && d.status !== 'Obsoleto').map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.codigo} - {doc.titulo}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleLinkDocument}
                          disabled={!docToLink}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                          Vincular
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Dica: Selecione POPs, ITAs ou Manuais criados no Controle de Documentos.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Upload de Nova Evidência</h4>
                      <label className={`flex items-center justify-center gap-2 w-full px-4 py-2 ${uploadingDoc ? 'bg-slate-200 text-slate-500' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 cursor-pointer'} text-sm font-bold rounded-lg transition-colors`}>
                        {uploadingDoc ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            Anexar Digitalização
                          </>
                        )}
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUploadEvidence} disabled={uploadingDoc} />
                      </label>
                      <p className="text-xs text-slate-500 mt-2">Use para registros preenchidos à mão, fotos, e PDFs avulsos.</p>
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
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
