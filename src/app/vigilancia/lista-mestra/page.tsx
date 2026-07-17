'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function ListaMestraRdcPage() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const itensComEvidencia = items.filter(item => {
    const aud = auditorias[item.id];
    return aud?.evidenciaEncontrada && aud.evidenciaEncontrada.trim().length > 0;
  });

  if (loading) return <p>Carregando Lista Mestra...</p>;

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Relação de Evidências (Lista Mestra - RDC 978)</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Listagem de todos os documentos (POPs, Manuais, Registros) informados como evidência objetiva.
      </p>

      {itensComEvidencia.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          Nenhuma evidência documental registrada ainda.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Ref. Norma</th>
              <th style={{ padding: '0.75rem' }}>Evidência Exigida</th>
              <th style={{ padding: '0.75rem' }}>Documento(s) Apontado(s)</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {itensComEvidencia.map(item => {
              const aud = auditorias[item.id];
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item.referencia}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--muted)' }}>{item.evidenciaObjetiva || '-'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{aud.evidenciaEncontrada}</td>
                  <td style={{ padding: '0.75rem' }}>
                     {aud.conforme === 'S' ? <span style={{ color: '#22c55e' }}>Válido</span> : <span style={{ color: '#dc2626' }}>Inválido</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
