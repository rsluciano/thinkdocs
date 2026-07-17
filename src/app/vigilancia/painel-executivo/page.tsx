'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function PainelExecutivoPage() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resItems, resAud] = await Promise.all([
          fetchAPI('/api/vigilancia/rdc-items'),
          fetchAPI('/api/vigilancia/auditoria')
        ]);
        
        if (resItems.ok && resAud.ok) {
          setItems(await resItems.json());
          setAuditorias(await resAud.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <p>Carregando Painel Executivo...</p>;

  const audMap = new Map(auditorias.map(a => [a.rdcItemId, a]));
  let conformes = 0; let naoConformes = 0; let naoAplicaveis = 0;

  items.forEach(item => {
    const status = audMap.get(item.id)?.conforme;
    if (status === 'S') conformes++;
    else if (status === 'N') naoConformes++;
    else if (status === 'NA') naoAplicaveis++;
  });

  const total = conformes + naoConformes + naoAplicaveis;
  const perc = total > 0 ? ((conformes / (total - naoAplicaveis)) * 100).toFixed(1) : '0.0';

  const criticosPendentes = items.filter(i => i.criticidade?.toLowerCase() === 'crítico' && audMap.get(i.id)?.conforme !== 'S');

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      {/* Header do Relatório */}
      <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Relatório Executivo de Auditoria</h1>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--muted)', margin: 0 }}>Referência: RDC 978/2025</h2>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Resumo Global */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)' }}>1. Índice de Conformidade Global</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: perc >= '80' ? '#22c55e' : perc >= '50' ? '#eab308' : '#dc2626' }}>
            {perc}%
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1.1rem' }}>
            <div><span style={{ color: '#22c55e', fontWeight: 'bold' }}>■</span> {conformes} Requisitos Atendidos</div>
            <div><span style={{ color: '#dc2626', fontWeight: 'bold' }}>■</span> {naoConformes} Não Conformidades</div>
            <div><span style={{ color: '#eab308', fontWeight: 'bold' }}>■</span> {naoAplicaveis} Não Aplicáveis</div>
          </div>
        </div>
      </div>

      {/* Pontos de Atenção Crítica */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)' }}>2. Pontos de Atenção Crítica</h3>
        {criticosPendentes.length === 0 ? (
          <p style={{ color: '#22c55e', fontWeight: 'bold' }}>Não há requisitos CRÍTICOS pendentes ou não conformes.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {criticosPendentes.map(item => {
              const aud = audMap.get(item.id);
              return (
                <li key={item.id} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '0.25rem' }}>{item.referencia}</div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{item.requisitoObjetivo}</div>
                  <div style={{ fontSize: '0.85rem', color: '#dc2626' }}><strong>Status Atual:</strong> {aud?.conforme === 'N' ? 'Não Conforme' : 'Pendente de Avaliação'}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Botão Imprimir */}
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button 
          onClick={() => window.print()}
          style={{ padding: '0.75rem 2rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🖨️ Imprimir Relatório
        </button>
      </div>
    </div>
  );
}
