"use client";

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

type RNC = any; // Will use proper type in a real app

export default function CausaRaizTab({ rnc }: { rnc: RNC }) {
  const [analises, setAnalises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'HOME' | 'ISHIKAWA' | '5WHYS' | 'FMEA' | 'BRAINSTORM'>('HOME');
  
  // AI State
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState<any>(null); // For filling forms

  useEffect(() => {
    carregarAnalises();
    solicitarSugestaoIA();
  }, [rnc.id]);

  const carregarAnalises = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI(`/api/nao-conformidades/${rnc.id}/analises`);
      if (res.ok) setAnalises(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const solicitarSugestaoIA = async () => {
    setAiLoading(true);
    try {
      const res = await fetchAPI('/api/ai/analyze-nc', {
        method: 'POST',
        body: JSON.stringify({ action: 'SUGGEST_METHODOLOGY', ncData: rnc })
      });
      if (res.ok) {
        setAiSuggestion(await res.json());
      } else {
        const err = await res.json();
        if (err.needsApiKey) {
           setAiSuggestion({
             reasoning: "⚠️ Atenção: A chave de API do DeepSeek não foi encontrada ou é inválida no arquivo .env. Configure DEEPSEEK_API_KEY para a inteligência artificial funcionar.",
             confidence: 0,
             suggestion: "Configurar API Key"
           });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const solicitarPreenchimentoIA = async (action: string) => {
    setAiLoading(true);
    try {
      const res = await fetchAPI('/api/ai/analyze-nc', {
        method: 'POST',
        body: JSON.stringify({ action, ncData: rnc })
      });
      if (res.ok) {
        setAiContext(await res.json());
      } else {
        const err = await res.json();
        if (err.needsApiKey) {
          alert("Configure a chave DEEPSEEK_API_KEY no arquivo .env para usar esta funcionalidade.");
          setView('HOME');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (metodologia: string, dadosJson: any, rpnCalculado?: number) => {
    try {
      const res = await fetchAPI(`/api/nao-conformidades/${rnc.id}/analises`, {
        method: 'POST',
        body: JSON.stringify({ metodologia, dadosJson, rpnCalculado })
      });
      if (res.ok) {
        setView('HOME');
        carregarAnalises();
      } else {
        alert('Erro ao salvar análise');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação');
    }
  };

  if (loading) return <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      
      {view === 'HOME' && (
        <>
          {/* PAINEL DA IA */}
          <div style={{
            background: 'linear-gradient(135deg, #1E1B4B, #312E81)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem', color: 'white',
            boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: 8 }}>
                ✨
              </div>
              <div>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Think Quality AI</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Copiloto de Investigação</p>
              </div>
            </div>

            {aiLoading && !aiSuggestion ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Analisando ocorrência...
              </div>
            ) : aiSuggestion ? (
              <div className="animate-slide-up">
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem', opacity: 0.9 }}>
                  {aiSuggestion.reasoning}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      Confiança: {aiSuggestion.confidence}%
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ background: 'white', color: '#1E1B4B', border: 'none' }}>
                    Utilizar {aiSuggestion.suggestion}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* CARDS DE METODOLOGIAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            
            <div className="card card-hover" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderLeft: '4px solid #7C3AED' }} onClick={() => { setView('ISHIKAWA'); solicitarPreenchimentoIA('FILL_ISHIKAWA'); }}>
              <div style={{ fontSize: '2rem' }}>⚗️</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: 'var(--color-text-primary)' }}>Diagrama de Ishikawa</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mapeamento de causa e efeito (6M).</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Tempo: ~15m</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Complexidade: Média</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>

            <div className="card card-hover" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderLeft: '4px solid #22C55E' }} onClick={() => { setView('5WHYS'); solicitarPreenchimentoIA('FILL_5_WHYS'); }}>
              <div style={{ fontSize: '2rem' }}>❓</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: 'var(--color-text-primary)' }}>5 Porquês</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Investigação sequencial linear da causa.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Tempo: ~5m</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Complexidade: Baixa</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>

            <div className="card card-hover" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderLeft: '4px solid #2563EB' }} onClick={() => { setView('FMEA'); solicitarPreenchimentoIA('FILL_FMEA'); }}>
              <div style={{ fontSize: '2rem' }}>🔬</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: 'var(--color-text-primary)' }}>FMEA</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Análise de Modos de Falha e Efeitos (Cálculo RPN).</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Tempo: ~25m</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Complexidade: Alta</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>

            <div className="card card-hover" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderLeft: '4px solid #F59E0B' }} onClick={() => { setView('BRAINSTORM'); solicitarPreenchimentoIA('FILL_BRAINSTORMING'); }}>
              <div style={{ fontSize: '2rem' }}>💡</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: 'var(--color-text-primary)' }}>Brainstorming</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Geração colaborativa de ideias.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Tempo: ~10m</span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Complexidade: Baixa</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>

          </div>
          
          {/* HISTÓRICO DE ANÁLISES */}
          {analises.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Histórico de Análises</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analises.map(a => (
                  <div key={a.id} className="card" style={{ padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{a.metodologia}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        Feito por {a.criadoPor} em {new Date(a.dataCriacao).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Concluído</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view === '5WHYS' && (
        <div className="animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('HOME')}>← Voltar</button>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>5 Porquês</h3>
          </div>
          
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>ThinkAI gerando encadeamento...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', marginBottom: '0.25rem' }}>SUGESTÃO DA IA</div>
                <div style={{ fontSize: '0.875rem', color: '#1E3A8A' }}>O encadeamento abaixo foi sugerido com base no contexto da NC. Revise e edite conforme necessário.</div>
              </div>

              {(aiContext || []).map((item: any, i: number) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 4 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 2 }}>{item.pergunta}</div>
                    <textarea 
                      className="input-field" 
                      defaultValue={item.resposta}
                      rows={2}
                      style={{ fontSize: '0.875rem', resize: 'vertical' }}
                    />
                  </div>
                </div>
              ))}
              
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => handleSave('5 Porquês', aiContext)}
              >
                Salvar Análise
              </button>
            </div>
          )}
        </div>
      )}

      {/* ISHIKAWA MOCK VIEW */}
      {view === 'ISHIKAWA' && (
        <div className="animate-slide-up">
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('HOME')}>← Voltar</button>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>Diagrama de Ishikawa (6M)</h3>
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>ThinkAI estruturando as causas...</div>
            </div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', marginBottom: '0.25rem' }}>SUGESTÃO DA IA</div>
                  <div style={{ fontSize: '0.875rem', color: '#1E3A8A' }}>Abaixo estão as possíveis causas mapeadas por categoria. Pode adicionar, editar ou remover.</div>
                </div>
                
                {['maoDeObra', 'maquina', 'metodo', 'material', 'medicao', 'meioAmbiente'].map((key) => (
                  <div key={key}>
                    <label className="input-label" style={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <textarea 
                      className="input-field" 
                      defaultValue={(aiContext?.[key] || []).join('\n')}
                      rows={3}
                      style={{ fontSize: '0.875rem', resize: 'vertical' }}
                    />
                  </div>
                ))}
                
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem' }}
                  onClick={() => handleSave('Ishikawa', aiContext)}
                >
                  Salvar Análise
                </button>
             </div>
          )}
        </div>
      )}

      {/* OTHER VIEWS CAN BE ADDED SIMILARLY */}
      {(view === 'FMEA' || view === 'BRAINSTORM') && (
        <div className="animate-slide-up">
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('HOME')}>← Voltar</button>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>{view}</h3>
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>ThinkAI gerando...</div>
            </div>
          ) : (
            <div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', marginBottom: '0.25rem' }}>SUGESTÃO DA IA</div>
                <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: '#1E3A8A', margin: 0 }}>
                  {JSON.stringify(aiContext, null, 2)}
                </pre>
              </div>
              <button className="btn btn-primary" onClick={() => handleSave(view, aiContext)}>Salvar Análise</button>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}
