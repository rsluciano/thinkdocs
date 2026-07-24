"use client";

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

type RNC = any;

export default function PlanoAcaoTab({ rnc }: { rnc: RNC }) {
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'HOME' | 'GERANDO' | 'EDITANDO'>('HOME');
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [acoesSugeridas, setAcoesSugeridas] = useState<any[]>([]);

  useEffect(() => {
    carregarPlanos();
  }, [rnc.id]);

  const carregarPlanos = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI(`/api/nao-conformidades/${rnc.id}/planos-acao`);
      if (res.ok) setPlanos(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const gerarPlanoComIA = async () => {
    setView('GERANDO');
    setAiLoading(true);
    try {
      const res = await fetchAPI('/api/ai/analyze-nc', {
        method: 'POST',
        body: JSON.stringify({ action: 'GENERATE_CAPA', ncData: rnc })
      });
      if (res.ok) {
        const data = await res.json();
        setAcoesSugeridas(data.acoes || []);
        setView('EDITANDO');
      } else {
        const err = await res.json();
        if (err.needsApiKey) {
          alert("Configure a chave DEEPSEEK_API_KEY no arquivo .env para usar esta funcionalidade.");
          setView('HOME');
        } else {
          alert('Erro ao gerar plano de ação com a IA.');
          setView('HOME');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação.');
      setView('HOME');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSalvar = async () => {
    try {
      const res = await fetchAPI(`/api/nao-conformidades/${rnc.id}/planos-acao`, {
        method: 'POST',
        body: JSON.stringify({ acoes: acoesSugeridas })
      });
      if (res.ok) {
        setView('HOME');
        carregarPlanos();
      } else {
        alert('Erro ao salvar plano de ação');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação');
    }
  };

  const handleEditAcao = (index: number, field: string, value: string) => {
    const novasAcoes = [...acoesSugeridas];
    novasAcoes[index] = { ...novasAcoes[index], [field]: value };
    setAcoesSugeridas(novasAcoes);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      'Pendente': 'badge-gray',
      'Em Andamento': 'badge-blue',
      'Concluído': 'badge-green',
      'Atrasado': 'badge-red'
    };
    return <span className={`badge ${colors[status] || 'badge-gray'}`}>{status}</span>;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 0' }}>
      
      {view === 'HOME' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Plano de Ação (CAPA)</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Gerencie as ações preventivas e corretivas no formato 5W2H.</p>
            </div>
            <button onClick={gerarPlanoComIA} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Gerar CAPA com Think AI
            </button>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>What (O que)</th>
                      <th>Who (Quem)</th>
                      <th>When (Quando)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planos.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                          Nenhum plano de ação gerado para esta NC. Clique em "Gerar CAPA com Think AI" para iniciar.
                        </td>
                      </tr>
                    ) : (
                      planos.map((plano) => (
                        <tr key={plano.id}>
                          <td style={{ fontWeight: 600 }}>{plano.what}</td>
                          <td>{plano.who}</td>
                          <td>{plano.when ? new Date(plano.when).toLocaleDateString() : '-'}</td>
                          <td><StatusBadge status={plano.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'GERANDO' && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: 40, height: 40, border: '3px solid var(--color-surface-2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Think Quality AI Analisando...</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Gerando um Plano de Ação 5W2H focado na Causa Raiz desta NC.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {view === 'EDITANDO' && (
        <div className="animate-slide-up">
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#059669', fontWeight: 700 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sugestão Gerada pela IA
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Revise e edite as ações sugeridas abaixo. Você é o responsável técnico, sinta-se livre para modificar prazos e responsáveis.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {acoesSugeridas.map((acao, index) => (
              <div key={index} className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>Ação #{index + 1}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">O que (What)</label>
                    <input className="input-field" value={acao.what || ''} onChange={(e) => handleEditAcao(index, 'what', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Por que (Why)</label>
                    <input className="input-field" value={acao.why || ''} onChange={(e) => handleEditAcao(index, 'why', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Onde (Where)</label>
                    <input className="input-field" value={acao.where || ''} onChange={(e) => handleEditAcao(index, 'where', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Quem (Who)</label>
                    <input className="input-field" value={acao.who || ''} onChange={(e) => handleEditAcao(index, 'who', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Quando (When)</label>
                    <input type="date" className="input-field" value={acao.when || ''} onChange={(e) => handleEditAcao(index, 'when', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Como (How)</label>
                    <input className="input-field" value={acao.how || ''} onChange={(e) => handleEditAcao(index, 'how', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Quanto (How Much)</label>
                    <input className="input-field" value={acao.howMuch || ''} onChange={(e) => handleEditAcao(index, 'howMuch', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => setView('HOME')} className="btn" style={{ background: 'var(--color-surface-2)' }}>Cancelar</button>
            <button onClick={handleSalvar} className="btn btn-primary">Salvar Plano de Ação</button>
          </div>
        </div>
      )}

    </div>
  );
}
