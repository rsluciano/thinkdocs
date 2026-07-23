"use client";

import React, { useState, useEffect } from 'react';

// MOCK DATA PARA APRESENTAÇÃO
const mockDocumentos = [
  { id: 1, tipoImg: 'PDF', tipoBadge: 'POP', titulo: 'POP Coleta de Sangue', subtitulo: 'POP-COL-001.pdf', req: 'Art. 154 - Inciso I', reqDesc: 'Fase Pré-analítica', cap: 'IV - Fase Pré-analítica', data: '20/05/2025 14:32', autor: 'Ana Carolina', validade: '20/05/2026', dias: '365 dias', status: 'Válido' },
  { id: 2, tipoImg: 'W', tipoBadge: 'Manual', titulo: 'Manual da Qualidade', subtitulo: 'MQ-001.docx', req: 'Art. 84 - Caput', reqDesc: 'Gestão da Qualidade', cap: 'II - Gestão', data: '18/05/2025 09:15', autor: 'Luciano Simões', validade: '18/05/2026', dias: '363 dias', status: 'Válido' },
  { id: 3, tipoImg: 'X', tipoBadge: 'Registro', titulo: 'Planilha Controle de Temperatura', subtitulo: 'TEMP-LAB-2025.xlsx', req: 'Art. 95 - Inciso II', reqDesc: 'Equipamentos', cap: 'V - Infraestrutura', data: '15/05/2025 16:45', autor: 'Juliana Costa', validade: '15/05/2026', dias: '360 dias', status: 'Válido' },
  { id: 4, tipoImg: 'PDF', tipoBadge: 'Certificado', titulo: 'Certificado Calibração Centrífuga', subtitulo: 'CAL-CTR-123.pdf', req: 'Art. 95 - Inciso III', reqDesc: 'Equipamentos', cap: 'V - Infraestrutura', data: '10/05/2025 11:20', autor: 'Carlos Alberto', validade: '10/05/2026', dias: '355 dias', status: 'Válido' },
  { id: 5, tipoImg: 'IMG', tipoBadge: 'Imagem', titulo: 'Foto Sala de Coleta', subtitulo: 'SALA-COLETA-01.png', req: 'Art. 73 - Inciso I', reqDesc: 'Licenciamento', cap: 'I - Disposições Gerais', data: '08/05/2025 13:10', autor: 'Ana Carolina', validade: '-', dias: 'Não aplicável', status: 'Ativo' },
  { id: 6, tipoImg: 'PDF', tipoBadge: 'Licença', titulo: 'Alvará Sanitário 2025', subtitulo: 'ALVARA-2025.pdf', req: 'Art. 73 - Caput', reqDesc: 'Licenciamento', cap: 'I - Disposições Gerais', data: '05/05/2025 10:05', autor: 'Luciano Simões', validade: '30/04/2026', dias: '345 dias', status: 'Vence em breve' },
  { id: 7, tipoImg: 'W', tipoBadge: 'Treinamento', titulo: 'Treinamento Equipe Coleta', subtitulo: 'TREIN-COLETA.docx', req: 'Art. 88 - Inciso I', reqDesc: 'Recursos Humanos', cap: 'III - Recursos Humanos', data: '02/05/2025 15:30', autor: 'Juliana Costa', validade: '02/05/2026', dias: '347 dias', status: 'Válido' },
];

export default function ControleDocumentosPage() {
  const [mounted, setMounted] = useState(false);
  const [modalNovoDocOpen, setModalNovoDocOpen] = useState(false);

  // Estados dos filtros
  const [busca, setBusca] = useState('');
  const [requisito, setRequisito] = useState('');
  const [capitulo, setCapitulo] = useState('');
  const [tipo, setTipo] = useState('');
  const [situacao, setSituacao] = useState('');
  const [statusRevisao, setStatusRevisao] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filtragem
  const filtered = mockDocumentos.filter(doc => {
    if (busca && !doc.titulo.toLowerCase().includes(busca.toLowerCase()) && !doc.req.toLowerCase().includes(busca.toLowerCase())) return false;
    if (capitulo && !doc.cap.includes(capitulo)) return false;
    if (tipo && doc.tipoBadge !== tipo) return false;
    if (situacao && doc.status !== situacao) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'POP': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Manual': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Registro': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Certificado': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Imagem': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Licença': return 'text-cyan-600 bg-cyan-50 border-cyan-100';
      case 'Treinamento': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusPill = (st: string) => {
    if (st === 'Válido' || st === 'Ativo') {
      return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">Válido</span>;
    }
    if (st === 'Vence em breve') {
      return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">Vence em breve</span>;
    }
    return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200">{st}</span>;
  };

  const getIconFile = (t: string) => {
    if (t === 'PDF') {
      return (
        <div className="w-8 h-8 rounded text-xs font-bold text-red-600 border border-red-200 bg-red-50 flex items-center justify-center">PDF</div>
      );
    }
    if (t === 'W') {
      return (
        <div className="w-8 h-8 rounded text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 flex items-center justify-center">W</div>
      );
    }
    if (t === 'X') {
      return (
        <div className="w-8 h-8 rounded text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 flex items-center justify-center">XC</div>
      );
    }
    return (
      <div className="w-8 h-8 rounded text-[10px] font-bold text-purple-600 border border-purple-200 bg-purple-50 flex items-center justify-center">IMG</div>
    );
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen pb-12 font-sans animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-4 bg-white px-6 py-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Documentos e Evidências</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Gerencie e organize todas as evidências dos requisitos da RDC 978/2025</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 px-6">
        
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">📋</span>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Total de Documentos</p>
          </div>
          <p className="text-xl font-black text-slate-800">1.248</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">✅</span>
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide">Evidências Vinculadas</p>
          </div>
          <p className="text-xl font-black text-green-700">986</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">⏳</span>
            <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-wide">Pendentes Revisão</p>
          </div>
          <p className="text-xl font-black text-yellow-700">72</p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">❌</span>
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-wide">Documentos Vencidos</p>
          </div>
          <p className="text-xl font-black text-red-700">15</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">📑</span>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">Tipos Cadastrados</p>
          </div>
          <p className="text-xl font-black text-blue-700">23</p>
        </div>

      </div>

      {/* FILTROS DE PESQUISA */}
      <div className="bg-white border-y border-slate-200 py-5 mb-6 px-6 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Filtros de Pesquisa</h3>
          <div className="flex flex-wrap items-center gap-2">
             <button onClick={() => { setBusca(''); setCapitulo(''); setTipo(''); setSituacao(''); }} className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center shadow-sm cursor-pointer">
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Buscar</label>
            <div className="relative">
              <input type="text" placeholder="Digite o nome do documento, requisito ou palavra-chave..." 
                className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                value={busca} onChange={e => setBusca(e.target.value)} />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Requisito (Artigo / Inciso)</label>
            <input type="text" placeholder="Ex.: Art. 73, Inciso I..." 
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                value={requisito} onChange={e => setRequisito(e.target.value)} />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Capítulo</label>
            <select className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
              value={capitulo} onChange={e => setCapitulo(e.target.value)}>
              <option value="">Todos os Capítulos</option>
              <option value="I">I - Disposições Gerais</option>
              <option value="II">II - Gestão</option>
              <option value="III">III - Recursos Humanos</option>
              <option value="IV">IV - Fase Pré-analítica</option>
              <option value="V">V - Infraestrutura</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tipo de Documento</label>
            <select className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
              value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos os Tipos</option>
              <option value="POP">POP</option>
              <option value="Manual">Manual</option>
              <option value="Registro">Registro</option>
              <option value="Certificado">Certificado</option>
              <option value="Licença">Licença</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Situação</label>
            <select className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
              value={situacao} onChange={e => setSituacao(e.target.value)}>
              <option value="">Todos</option>
              <option value="Válido">Válido</option>
              <option value="Ativo">Ativo</option>
              <option value="Vence em breve">Vence em breve</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Status da Revisão</label>
            <select className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-blue-500 outline-none shadow-sm cursor-pointer"
              value={statusRevisao} onChange={e => setStatusRevisao(e.target.value)}>
              <option value="">Todos</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Data Inicial</label>
            <input type="date" className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-500 outline-none shadow-sm cursor-pointer" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Data Final</label>
            <input type="date" className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-500 outline-none shadow-sm cursor-pointer" />
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setModalNovoDocOpen(true)} className="h-10 px-5 bg-[#2970ff] text-white rounded-3xl text-[11px] font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center cursor-pointer">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Documento
          </button>
          <button className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center shadow-sm cursor-pointer">
             <svg className="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
             Upload em Lote
          </button>
          <button className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center shadow-sm cursor-pointer">
             <svg className="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
             Pastas
          </button>
          <button className="h-9 px-4 bg-white border border-slate-300 text-slate-700 rounded-3xl text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center shadow-sm cursor-pointer">
             <svg className="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             Relatório
          </button>
        </div>
      </div>

      {/* TABELA DE DOCUMENTOS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mx-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" /></th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Documento</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Requisito Vinculado</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Capítulo</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Documento</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Data Upload</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Validade</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3 align-top"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 w-3.5 h-3.5 cursor-pointer" /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-4">
                      {getIconFile(doc.tipoImg)}
                      <div>
                        <p className="text-sm font-black text-slate-800 mb-0.5">{doc.titulo}</p>
                        <p className="text-sm text-slate-500 font-medium">{doc.subtitulo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-700 mb-0.5">{doc.req}</p>
                    <p className="text-xs text-slate-500">{doc.reqDesc}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-600">{doc.cap}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getBadgeColor(doc.tipoBadge)}`}>
                      {doc.tipoBadge}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-700 mb-0.5">{doc.data}</p>
                    <p className="text-[10px] text-slate-500">Por: {doc.autor}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-xs font-bold mb-0.5 ${doc.status === 'Vence em breve' ? 'text-orange-600' : 'text-slate-700'}`}>{doc.validade}</p>
                    <p className={`text-[10px] ${doc.status === 'Vence em breve' ? 'text-orange-500 font-semibold' : 'text-slate-500'}`}>{doc.dias}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusPill(doc.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Visualizar">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Download">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Opções">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER / PAGINAÇÃO */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filtered.length)} de {filtered.length} documentos</span>
            <div className="flex items-center gap-2">
              <select 
                className="h-8 pl-2 pr-6 border border-slate-300 rounded text-slate-600 font-semibold focus:outline-none focus:border-blue-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              className={`w-8 h-8 flex items-center justify-center rounded border ${currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === currentPage;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-semibold text-sm transition-colors ${
                      isActive 
                        ? 'bg-[#2970ff] text-white shadow-sm' 
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === 2 && currentPage > 3) return <span key={pageNum} className="px-1 text-slate-400">...</span>;
              if (pageNum === totalPages - 1 && currentPage < totalPages - 2) return <span key={pageNum} className="px-1 text-slate-400">...</span>;
              return null;
            })}
            <button 
              className={`w-8 h-8 flex items-center justify-center rounded border ${currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>

      </div>

      {/* MODAL DE NOVO DOCUMENTO (COM SUPORTE A MÚLTIPLOS) */}
      {modalNovoDocOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Vincular Documento(s) ao Requisito
              </h3>
              <button onClick={() => setModalNovoDocOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Requisito da RDC 978</label>
                <select className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none text-slate-700">
                  <option value="">Selecione o Artigo / Inciso correspondente...</option>
                  <option value="1">Art. 154 - Inciso I (Fase Pré-analítica)</option>
                  <option value="2">Art. 84 - Caput (Gestão da Qualidade)</option>
                  <option value="3">Art. 95 - Inciso II (Equipamentos)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Dica: Você pode anexar vários documentos para comprovar um mesmo requisito.</p>
              </div>

              <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-8 flex flex-col items-center justify-center mb-6">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                 </div>
                 <p className="text-sm font-bold text-slate-700 mb-1">Arraste os arquivos aqui</p>
                 <p className="text-xs text-slate-500 mb-4 text-center max-w-sm">Suporta PDFs, Word, Excel, Imagens. Selecione múltiplos arquivos para enviar de uma vez.</p>
                 <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                   Procurar Arquivos
                 </button>
              </div>

              {/* Lista de Arquivos (Exemplo visual simulando que anexaram vários) */}
              <div className="space-y-3">
                 <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Documentos Anexados (2)</h4>
                 
                 <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-[10px] font-bold">PDF</div>
                     <div>
                       <p className="text-sm font-semibold text-slate-700">POP_Coleta_Sangue_v2.pdf</p>
                       <p className="text-xs text-slate-500">2.4 MB</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <select className="h-8 px-2 text-xs border border-slate-300 rounded text-slate-600">
                       <option>POP</option>
                       <option>Registro</option>
                       <option>Manual</option>
                     </select>
                     <button className="text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                 </div>

                 <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-[10px] font-bold">IMG</div>
                     <div>
                       <p className="text-sm font-semibold text-slate-700">Evidencia_Foto_Local.jpg</p>
                       <p className="text-xs text-slate-500">1.1 MB</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <select className="h-8 px-2 text-xs border border-slate-300 rounded text-slate-600">
                       <option selected>Imagem</option>
                       <option>Registro</option>
                       <option>Certificado</option>
                     </select>
                     <button className="text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                 </div>
              </div>

            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setModalNovoDocOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                className="px-5 py-2.5 bg-[#2970ff] text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                onClick={() => setModalNovoDocOpen(false)}
              >
                Salvar 2 Documentos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

