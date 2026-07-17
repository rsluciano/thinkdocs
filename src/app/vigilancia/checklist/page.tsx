'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function ChecklistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  
  // Estado para o painel inferior mobile (Bottom Sheet simplificado)
  const [activeItem, setActiveItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

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
      alert('Erro ao carregar checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async (item: any, status: string) => {
    setSaving(true);
    try {
      const currentAud = auditorias[item.id] || {};
      const payload = { ...currentAud, conforme: status };
      
      const res = await fetchAPI(`/api/vigilancia/auditoria/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const audSalva = await res.json();
        setAuditorias(prev => ({ ...prev, [item.id]: audSalva }));
      }
    } catch (e) {
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filtroCategoria && item.categoria !== filtroCategoria) return false;
    return true;
  });

  if (loading) return <p style={{ padding: '1rem' }}>Carregando Checklist Mobile...</p>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Checklist de Campo</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Avaliação rápida para uso em tablets e celulares durante a auditoria física.</p>
      </div>

      <select 
        value={filtroCategoria} 
        onChange={e => setFiltroCategoria(e.target.value)}
        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.5rem', fontSize: '1rem' }}
      >
        <option value="">Todas as Categorias</option>
        <option value="Estrutura Física">Estrutura Física</option>
        <option value="Equipamentos">Equipamentos</option>
        <option value="Biossegurança">Biossegurança</option>
      </select>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredItems.map(item => {
          const aud = auditorias[item.id];
          const isConforme = aud?.conforme === 'S';
          const isNaoConforme = aud?.conforme === 'N';
          
          return (
            <div key={item.id} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${isConforme ? '#22c55e' : isNaoConforme ? '#dc2626' : '#cbd5e1'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--muted)', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{item.referencia}</span>
                {item.criticidade === 'Crítico' && <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 'bold' }}>CRÍTICO</span>}
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>{item.requisitoObjetivo || item.textoIntegral}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleSaveStatus(item, 'S')}
                  disabled={saving}
                  style={{ padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s',
                    backgroundColor: isConforme ? '#22c55e' : '#f1f5f9',
                    color: isConforme ? 'white' : '#475569'
                  }}
                >
                  {isConforme ? '✅ CONFORME' : 'Conforme'}
                </button>
                <button 
                  onClick={() => handleSaveStatus(item, 'N')}
                  disabled={saving}
                  style={{ padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s',
                    backgroundColor: isNaoConforme ? '#dc2626' : '#fef2f2',
                    color: isNaoConforme ? 'white' : '#991b1b'
                  }}
                >
                  {isNaoConforme ? '❌ NÃO CONFORME' : 'Não Conforme'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
