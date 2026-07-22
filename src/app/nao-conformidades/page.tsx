"use client";

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function NaoConformidadesPage() {
  const [rncs, setRncs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRnc, setSelectedRnc] = useState<any>(null);
  
  // Form para nova RNC
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('Auditoria Interna');

  // Form para atualização (Análise e Ação)
  const [statusUpdate, setStatusUpdate] = useState('');
  const [analiseCausa, setAnaliseCausa] = useState('');
  const [acaoCorretiva, setAcaoCorretiva] = useState('');
  const [responsavelAcao, setResponsavelAcao] = useState('');
  const [prazoAcao, setPrazoAcao] = useState('');
  const [observacoesFinais, setObservacoesFinais] = useState('');

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
        body: JSON.stringify({ titulo, descricao, origem })
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

  const openDetails = (rnc: any) => {
    setSelectedRnc(rnc);
    setStatusUpdate(rnc.status);
    setAnaliseCausa(rnc.analiseCausa || '');
    setAcaoCorretiva(rnc.acaoCorretiva || '');
    setResponsavelAcao(rnc.responsavelAcao || '');
    setPrazoAcao(rnc.prazoAcao ? new Date(rnc.prazoAcao).toISOString().split('T')[0] : '');
    setObservacoesFinais(rnc.observacoesFinais || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI(`/api/nao-conformidades/${selectedRnc.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: statusUpdate,
          analiseCausa,
          acaoCorretiva,
          responsavelAcao,
          prazoAcao,
          observacoesFinais
        })
      });
      if (res.ok) {
        setSelectedRnc(null);
        carregarRncs();
      }
    } catch (e) {
      alert('Erro ao atualizar.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registrada': return 'border-red-500 bg-red-50 text-red-700';
      case 'Em Análise': return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'Ação Pendente': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'Concluída': return 'border-green-500 bg-green-50 text-green-700';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  const colunas = ['Registrada', 'Em Análise', 'Ação Pendente', 'Concluída'];

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header Visual Moderno */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Decorator elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
              <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Gestão de RNC
            </h1>
          </div>
          <p className="text-indigo-100 text-base md:text-lg font-light leading-relaxed mb-6">
            Identifique desvios, analise causas raízes (Ishikawa/5 Porquês), estabeleça ações corretivas eficazes e promova a melhoria contínua do Sistema de Gestão da Qualidade.
          </p>
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-white text-indigo-900 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            Registrar Nova Não Conformidade
          </button>
        </div>
        
        {/* Imagem/Ilustração ao lado */}
        <div className="hidden md:flex relative z-10">
          <div className="grid grid-cols-2 gap-4 opacity-80">
            <div className="bg-indigo-800/50 p-6 rounded-2xl border border-indigo-700 backdrop-blur-sm flex flex-col items-center justify-center transform translate-y-4">
              <span className="text-3xl mb-2">🔍</span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Investigar</span>
            </div>
            <div className="bg-indigo-800/50 p-6 rounded-2xl border border-indigo-700 backdrop-blur-sm flex flex-col items-center justify-center transform -translate-y-4">
              <span className="text-3xl mb-2">🎯</span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Corrigir</span>
            </div>
            <div className="bg-indigo-800/50 p-6 rounded-2xl border border-indigo-700 backdrop-blur-sm flex flex-col items-center justify-center transform translate-y-4">
              <span className="text-3xl mb-2">📈</span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Melhorar</span>
            </div>
            <div className="bg-indigo-800/50 p-6 rounded-2xl border border-indigo-700 backdrop-blur-sm flex flex-col items-center justify-center transform -translate-y-4">
              <span className="text-3xl mb-2">🛡️</span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Prevenir</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-6 pb-8 hide-scrollbar">
          {colunas.map(coluna => {
            const itens = rncs.filter(r => r.status === coluna);
            return (
              <div key={coluna} className="flex-1 min-w-[300px] max-w-[400px] bg-slate-100/50 rounded-2xl p-4 flex flex-col h-[700px]">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-extrabold text-slate-700 uppercase tracking-widest text-sm">{coluna}</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{itens.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {itens.map(rnc => (
                    <div 
                      key={rnc.id}
                      onClick={() => openDetails(rnc)}
                      className={`bg-white p-5 rounded-xl shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all ${getStatusColor(rnc.status).split(' ')[0]}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-400">#{rnc.id.substring(rnc.id.length - 6).toUpperCase()}</span>
                        <span className="text-[10px] uppercase font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{rnc.origem}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2 line-clamp-2">{rnc.titulo}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{rnc.descricao}</p>
                      
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          {rnc.criadoPor.split(' ')[0]}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {new Date(rnc.dataRegistro).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {itens.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                      <span className="text-slate-400 text-sm font-medium">Nenhum registro</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova RNC */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Registrar Não Conformidade
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Origem / Fonte</label>
                  <select 
                    value={origem} 
                    onChange={e => setOrigem(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Auditoria Interna">Auditoria Interna</option>
                    <option value="Auditoria Externa">Auditoria Externa</option>
                    <option value="Reclamação de Cliente">Reclamação de Cliente</option>
                    <option value="Desvio de Processo">Desvio de Processo</option>
                    <option value="Oportunidade de Melhoria">Oportunidade de Melhoria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título Breve</label>
                  <input 
                    required 
                    type="text" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    placeholder="Ex: Falha na calibração do equipamento X"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Detalhada do Desvio</label>
                  <textarea 
                    required 
                    rows={4} 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    placeholder="Descreva a evidência encontrada e a constatação..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes RNC */}
      {selectedRnc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-fade-in">
            <div className={`px-6 py-4 flex justify-between items-center ${getStatusColor(selectedRnc.status)}`}>
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  Tratamento de RNC #{selectedRnc.id.substring(selectedRnc.id.length - 6).toUpperCase()}
                </h2>
                <span className="text-xs font-medium opacity-80">{selectedRnc.titulo}</span>
              </div>
              <button onClick={() => setSelectedRnc(null)} className="opacity-70 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <form id="updateForm" onSubmit={handleUpdate} className="space-y-8">
                
                {/* Seção 1: O Desvio */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b pb-2">
                    <span className="text-red-500">1.</span> Descrição do Desvio
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRnc.descricao}</p>
                  </div>
                  <div className="mt-4 flex gap-6 text-sm">
                    <div><span className="text-slate-500 font-medium">Origem:</span> <span className="font-bold text-slate-700">{selectedRnc.origem}</span></div>
                    <div><span className="text-slate-500 font-medium">Registrado por:</span> <span className="font-bold text-slate-700">{selectedRnc.criadoPor}</span></div>
                  </div>
                </div>

                {/* Seção 2: Investigação */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b pb-2">
                    <span className="text-orange-500">2.</span> Investigação e Análise de Causa (5 Porquês / Ishikawa)
                  </h3>
                  <textarea 
                    rows={4} 
                    value={analiseCausa} 
                    onChange={e => setAnaliseCausa(e.target.value)} 
                    placeholder="Descreva a investigação e a causa raiz identificada..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Seção 3: Plano de Ação */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b pb-2">
                    <span className="text-blue-500">3.</span> Ação Corretiva / Melhoria
                  </h3>
                  <textarea 
                    rows={3} 
                    value={acaoCorretiva} 
                    onChange={e => setAcaoCorretiva(e.target.value)} 
                    placeholder="O que será feito para corrigir a causa raiz e evitar reincidência?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-4"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Responsável pela Ação</label>
                      <input 
                        type="text" 
                        value={responsavelAcao} 
                        onChange={e => setResponsavelAcao(e.target.value)} 
                        placeholder="Nome do responsável"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Prazo de Conclusão</label>
                      <input 
                        type="date" 
                        value={prazoAcao} 
                        onChange={e => setPrazoAcao(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 4: Monitoramento */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b pb-2">
                    <span className="text-green-500">4.</span> Monitoramento e Encerramento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Status Atual</label>
                      <select 
                        value={statusUpdate} 
                        onChange={e => setStatusUpdate(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      >
                        <option value="Registrada">Registrada</option>
                        <option value="Em Análise">Em Análise</option>
                        <option value="Ação Pendente">Ação Pendente</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    </div>
                  </div>
                  <textarea 
                    rows={2} 
                    value={observacoesFinais} 
                    onChange={e => setObservacoesFinais(e.target.value)} 
                    placeholder="Verificação de eficácia e observações finais (preenchido no encerramento)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
              </form>
            </div>
            
            <div className="bg-white px-6 py-4 border-t flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">As alterações são registradas e auditáveis.</span>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedRnc(null)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Fechar</button>
                <button type="submit" form="updateForm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
