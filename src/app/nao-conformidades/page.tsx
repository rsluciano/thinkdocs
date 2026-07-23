"use client";

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function NaoConformidadesPage() {
  const [rncs, setRncs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRnc, setSelectedRnc] = useState<any>(null);
  
  // Filtros
  const [busca, setBusca] = useState('');
  
  // Form para nova RNC
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('Auditoria Interna');
  const [tipo, setTipo] = useState('Não Conformidade');
  const [setor, setSetor] = useState('Laboratório / Hematologia');
  const [criticidade, setCriticidade] = useState('Alta');

  useEffect(() => {
    carregarRncs();
  }, []);

  const carregarRncs = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/api/nao-conformidades');
      if (res.ok) {
        setRncs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI('/api/nao-conformidades', {
        method: 'POST',
        body: JSON.stringify({ titulo, descricao, origem, tipo, setor, criticidade })
      });
      if (res.ok) {
        setModalOpen(false);
        setTitulo('');
        setDescricao('');
        carregarRncs();
      }
    } catch (e) {
      alert('Erro ao registrar.');
    }
  };

  // Helper colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Registrada': return 'text-slate-700 bg-slate-100';
      case 'Abertas': return 'text-orange-700 bg-orange-50'; // Mockup shows "Aberta" as Orange
      case 'Em Análise': return 'text-purple-700 bg-purple-50'; // Mockup shows "Em Análise" as Purple
      case 'Ação Pendente':
      case 'Em Ação': return 'text-blue-700 bg-blue-50'; // Mockup shows "Em Ação" as Blue
      case 'Concluída': return 'text-emerald-700 bg-emerald-50';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  const getCriticidadeStyle = (crit: string) => {
    switch (crit) {
      case 'Alta': return 'text-red-700 bg-white';
      case 'Média': return 'text-orange-600 bg-white';
      case 'Baixa': return 'text-emerald-600 bg-white';
      default: return 'text-slate-600 bg-white';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
  };

  const stats = {
    total: rncs.length,
    abertas: rncs.filter(r => r.status === 'Registrada' || r.status === 'Aberta').length,
    emAnalise: rncs.filter(r => r.status === 'Em Análise').length,
    emAcao: rncs.filter(r => r.status === 'Ação Pendente' || r.status === 'Em Ação').length,
    concluidas: rncs.filter(r => r.status === 'Concluída').length,
  };

  // Calculate percentages safely
  const getPct = (val: number) => stats.total === 0 ? '0%' : ((val / stats.total) * 100).toFixed(1) + '%';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 w-full">
      <div className="p-8 w-full">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-800">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Não Conformidades</h1>
            <p className="text-sm text-slate-500">Registre, analise e acompanhe todas as não conformidades identificadas no laboratório.</p>
          </div>
        </div>

        {/* CARDS DE ESTATÍSTICA */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Card Total */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1">Total de Não Conformidades</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
                <span className="text-xs font-semibold text-blue-600 mb-1">+7 este mês</span>
              </div>
            </div>
          </div>
          
          {/* Card Abertas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1">Abertas</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.abertas}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{getPct(stats.abertas)} do total</p>
            </div>
          </div>

          {/* Card Em Análise */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1">Em Análise</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.emAnalise}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{getPct(stats.emAnalise)} do total</p>
            </div>
          </div>

          {/* Card Em Ação */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1">Em Ação</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.emAcao}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{getPct(stats.emAcao)} do total</p>
            </div>
          </div>

          {/* Card Concluídas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1">Concluídas</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats.concluidas}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{getPct(stats.concluidas)} do total</p>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </div>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors" placeholder="Digite o título, descrição ou nº da NC..." />
            </div>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Período de Identificação</label>
            <div className="flex items-center gap-2">
              <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 outline-none w-full" />
              <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 outline-none w-full" />
            </div>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none">
              <option>Todos os Tipos</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Situação</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none">
              <option>Todas as Situações</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Setor</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none">
              <option>Todos os Setores</option>
            </select>
          </div>

          <button className="h-[38px] px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
            Filtros Avançados
          </button>

          <button 
            onClick={() => { setSelectedRnc(null); setModalOpen(true); }}
            className="h-[38px] px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nova Não Conformidade
          </button>
        </div>

        {/* MAIN LAYOUT (Tabela e Drawer Lateral) */}
        <div className="flex gap-6 items-start">
          
          {/* TABELA */}
          <div className={`transition-all duration-300 ease-in-out ${selectedRnc ? 'w-2/3' : 'w-full'} bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">TÍTULO</th>
                    <th className="px-6 py-4">TIPO</th>
                    <th className="px-6 py-4">SETOR</th>
                    <th className="px-6 py-4 text-center">SITUAÇÃO</th>
                    <th className="px-6 py-4 text-center">CRITICIDADE</th>
                    <th className="px-6 py-4">IDENTIFICAÇÃO</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                        Carregando...
                      </td>
                    </tr>
                  ) : rncs.map((rnc, i) => (
                    <tr 
                      key={rnc.id} 
                      onClick={() => setSelectedRnc(rnc)}
                      className={`cursor-pointer transition-colors ${selectedRnc?.id === rnc.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">NC-2026-{(rncs.length - i).toString().padStart(4, '0')}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{rnc.titulo}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{rnc.descricao}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-blue-600">{rnc.tipo || 'Não Conformidade'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.999 2.999 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
                          <span className="text-xs text-slate-600">{rnc.setor || 'Geral'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-current ${getStatusStyle(rnc.status)}`}>
                          {rnc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold text-xs ${getCriticidadeStyle(rnc.criticidade)}`}>
                          {rnc.criticidade || 'Média'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700">{formatDate(rnc.dataRegistro)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Por: {rnc.criadoPor}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-sm text-slate-500">
                <span>Mostrando 1 a {rncs.length} de {rncs.length} não conformidades</span>
                <div className="flex gap-1">
                  {/* Paginador simplificado */}
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50">&lt;</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white font-bold">1</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-transparent text-slate-600 hover:bg-slate-50">2</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-transparent text-slate-600 hover:bg-slate-50">3</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50">&gt;</button>
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL LATERAL DE DETALHES */}
          {selectedRnc && (
            <div className="w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in flex flex-col relative sticky top-6">
              
              <button 
                onClick={() => setSelectedRnc(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    Detalhes da Não Conformidade
                  </h2>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-lg font-bold text-slate-900">NC-2026-00{(rncs.length - rncs.indexOf(selectedRnc)).toString().padStart(2, '0')}</span>
                    <button className="hover:text-blue-600" title="Copiar ID"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg></button>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-current ${getStatusStyle(selectedRnc.status)}`}>
                  {selectedRnc.status}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900 mb-2">{selectedRnc.titulo}</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{selectedRnc.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6">
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Tipo</span>
                  <span className="text-slate-800 font-medium">{selectedRnc.tipo || 'Não Conformidade'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Setor</span>
                  <span className="text-slate-800 font-medium">{selectedRnc.setor || 'Laboratório'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Identificação</span>
                  <span className="text-slate-800 font-medium block">{formatDate(selectedRnc.dataRegistro)} às 08:30</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Identificado por</span>
                  <span className="text-slate-800 font-medium">{selectedRnc.criadoPor}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Criticidade</span>
                  <span className={`font-bold text-xs ${getCriticidadeStyle(selectedRnc.criticidade)}`}>⚠️ {selectedRnc.criticidade || 'Média'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Situação Atual</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold">{selectedRnc.status}</span>
                </div>
              </div>

              <div className="space-y-2 mb-8 flex-1">
                <button className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Descrição Completa</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-purple-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">Análise de Causa</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Ishikawa</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4.25L4.75 6l1.25 1.75M9 5h10M6 14.25L4.75 16l1.25 1.75M9 15h10" /></svg>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">Plano de Ação (5W2H)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">2 ações</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-orange-600"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-orange-700">Evidências</span>
                  </div>
                  <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded">0 arquivos</span>
                </button>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Editar Não Conformidade
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Análise de Causa Rápida</h3>
            <p className="text-sm text-slate-500 mb-6">Resumo das metodologias de análise de causa utilizadas</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold text-xl shadow-sm">
                  ⚗️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Ishikawa</h4>
                  <p className="text-2xl font-bold text-slate-900 leading-none mt-1">12 <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wide">Utilizações</span></p>
                </div>
              </div>

              <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-bold text-xl shadow-sm">
                  ❓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">5 Porquês</h4>
                  <p className="text-2xl font-bold text-slate-900 leading-none mt-1">8 <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wide">Utilizações</span></p>
                </div>
              </div>

              <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Outras Metodologias</h4>
                  <p className="text-2xl font-bold text-slate-900 leading-none mt-1">3 <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wide">Utilizações</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-6">Não Conformidades por Criticidade</h3>
            <div className="flex items-center justify-center flex-1 gap-6">
              {/* Fake Donut Chart via CSS borders */}
              <div className="relative w-32 h-32 rounded-full border-[12px] border-slate-100 flex items-center justify-center" style={{
                borderTopColor: '#ef4444',
                borderRightColor: '#f97316',
                borderBottomColor: '#10b981',
                borderLeftColor: '#ef4444'
              }}>
                <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{stats.total}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Alta
                  </div>
                  <span className="font-bold">19 <span className="text-xs font-normal text-slate-400">(39,6%)</span></span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Média
                  </div>
                  <span className="font-bold">15 <span className="text-xs font-normal text-slate-400">(31,3%)</span></span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Baixa
                  </div>
                  <span className="font-bold">8 <span className="text-xs font-normal text-slate-400">(16,7%)</span></span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Obs.
                  </div>
                  <span className="font-bold">6 <span className="text-xs font-normal text-slate-400">(12,5%)</span></span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal Nova Não Conformidade */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Nova Não Conformidade</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título Resumido</label>
                <input 
                  required 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full border border-slate-300 bg-slate-50 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none transition-colors" 
                  placeholder="Ex: Controle de temperatura fora da faixa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                  <select 
                    value={tipo} 
                    onChange={e => setTipo(e.target.value)}
                    className="w-full border border-slate-300 bg-slate-50 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none"
                  >
                    <option value="Não Conformidade">Não Conformidade</option>
                    <option value="Desvio">Desvio</option>
                    <option value="Observação">Observação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Criticidade</label>
                  <select 
                    value={criticidade} 
                    onChange={e => setCriticidade(e.target.value)}
                    className="w-full border border-slate-300 bg-slate-50 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Setor</label>
                  <input 
                    required 
                    value={setor} 
                    onChange={e => setSetor(e.target.value)}
                    className="w-full border border-slate-300 bg-slate-50 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none" 
                    placeholder="Ex: Laboratório / Hematologia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Origem da Identificação</label>
                  <select 
                    value={origem} 
                    onChange={e => setOrigem(e.target.value)}
                    className="w-full border border-slate-300 bg-slate-50 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none"
                  >
                    <option value="Auditoria Interna">Auditoria Interna</option>
                    <option value="Auditoria Externa">Auditoria Externa</option>
                    <option value="Reclamação de Cliente">Reclamação de Cliente</option>
                    <option value="Controle de Qualidade">Controle de Qualidade</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Completa</label>
                <textarea 
                  required 
                  value={descricao} 
                  onChange={e => setDescricao(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 bg-slate-50 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none transition-colors" 
                  placeholder="Descreva detalhadamente o que ocorreu..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
