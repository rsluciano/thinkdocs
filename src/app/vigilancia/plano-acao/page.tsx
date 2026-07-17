'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function PlanoAcaoPage() {
  const [naoConformidades, setNaoConformidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeNC, setActiveNC] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Buscar auditorias
      const resAud = await fetchAPI('/api/vigilancia/auditoria');
      if (!resAud.ok) throw new Error();
      const auds = await resAud.json();

      // 2. Buscar RDC items
      const resItems = await fetchAPI('/api/vigilancia/rdc-items');
      const itemsData = await resItems.json();
      const itemsMap = new Map(itemsData.map((i:any) => [i.id, i]));

      // 3. Filtrar apenas NC
      const ncs = auds.filter((a:any) => a.conforme === 'N').map((a:any) => ({
        ...a,
        rdcItem: itemsMap.get(a.rdcItemId)
      }));

      setNaoConformidades(ncs);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (nc: any) => {
    setActiveNC(nc);
    const plano = nc.planosAcao && nc.planosAcao.length > 0 ? nc.planosAcao[0] : {};
    
    setEditData({
      id: plano.id || null,
      what: plano.what || nc.acaoCorretiva || '',
      why: plano.why || '',
      where: plano.where || '',
      when: plano.when ? plano.when.substring(0, 10) : (nc.prazo ? nc.prazo.substring(0, 10) : ''),
      who: plano.who || nc.responsavelId || '',
      how: plano.how || '',
      howMuch: plano.howMuch || '',
      status: plano.status || 'Pendente'
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!activeNC) return;
    setSaving(true);
    try {
      const isUpdate = !!editData.id;
      const url = isUpdate ? `/api/vigilancia/plano-acao/${editData.id}` : '/api/vigilancia/plano-acao';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        auditoriaRdcId: activeNC.id,
        ...editData
      };

      const res = await fetchAPI(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Plano salvo com sucesso!');
        setModalOpen(false);
        carregarDados();
      } else {
        alert('Erro ao salvar plano.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Carregando Planos de Ação...</p>;

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}>Plano de Ação (5W2H)</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Gerencie as tratativas para todas as Não Conformidades (NC) registradas na matriz.
      </p>

      {naoConformidades.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <h3 style={{ color: '#22c55e', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Excelente!</h3>
          <p style={{ color: 'var(--muted)' }}>Nenhuma Não Conformidade registrada no momento.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Referência NC</th>
                <th style={{ padding: '0.75rem' }}>O Que (What)</th>
                <th style={{ padding: '0.75rem' }}>Quem (Who)</th>
                <th style={{ padding: '0.75rem' }}>Quando (When)</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {naoConformidades.map(nc => {
                const plano = nc.planosAcao && nc.planosAcao.length > 0 ? nc.planosAcao[0] : null;
                const statusColor = plano?.status === 'Concluído' ? '#22c55e' : plano?.status === 'Em Andamento' ? '#3b82f6' : '#f59e0b';
                
                return (
                  <tr key={nc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{nc.rdcItem?.referencia || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', maxWidth: '300px' }}>{plano?.what || <span style={{ color: '#ef4444' }}>Ação não definida</span>}</td>
                    <td style={{ padding: '0.75rem' }}>{plano?.who || nc.responsavelId || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{plano?.when ? new Date(plano.when).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ backgroundColor: statusColor, color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        {plano?.status || 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => handleOpenModal(nc)}
                        style={{ padding: '0.3rem 0.8rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {plano ? 'Editar 5W2H' : 'Criar 5W2H'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 5W2H */}
      {modalOpen && activeNC && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card animate-fade-in" style={{ width: '800px', backgroundColor: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>
              Plano de Ação (5W2H) - {activeNC.rdcItem?.referencia}
            </h3>
            
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
              <p style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem' }}><strong>Requisito Desviado:</strong> {activeNC.rdcItem?.requisitoObjetivo}</p>
              <p style={{ fontSize: '0.85rem', color: '#991b1b' }}><strong>Evidência Encontrada:</strong> {activeNC.evidenciaEncontrada}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>O que será feito? (What)</label>
                <textarea rows={2} value={editData.what} onChange={e => setEditData({...editData, what: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Por que será feito? (Why)</label>
                <textarea rows={2} value={editData.why} onChange={e => setEditData({...editData, why: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Onde será feito? (Where)</label>
                <input type="text" value={editData.where} onChange={e => setEditData({...editData, where: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Quando será feito? (When)</label>
                <input type="date" value={editData.when} onChange={e => setEditData({...editData, when: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Quem fará? (Who)</label>
                <input type="text" value={editData.who} onChange={e => setEditData({...editData, who: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Quanto custará? (How Much)</label>
                <input type="text" value={editData.howMuch} onChange={e => setEditData({...editData, howMuch: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} placeholder="R$ 0,00" />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Como será feito? (How)</label>
              <textarea rows={3} value={editData.how} onChange={e => setEditData({...editData, how: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ marginBottom: '1.5rem', width: '50%' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Status do Plano</label>
              <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }} disabled={saving}>Cancelar</button>
              <button onClick={handleSave} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Plano 5W2H'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
