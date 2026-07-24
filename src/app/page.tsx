"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaInfo, setEmpresaInfo] = useState({ nome: '', logo: '' });
  
  // Estado dos Filtros Cruzados
  const [filtros, setFiltros] = useState({
    status: null as string | null,
    categoria: null as string | null,
    setor: null as string | null
  });

  const handleToggleFilter = (tipo: 'status' | 'categoria' | 'setor', valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: prev[tipo] === valor ? null : valor
    }));
  };

  const clearFilters = () => {
    setFiltros({ status: null, categoria: null, setor: null });
  };

  // Auth Check Simples
  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const user = JSON.parse(userStr);
      let finalLogo = user.empresaLogo || '';
      if (user.empresaNome && user.empresaNome.toLowerCase().includes('souza')) {
        finalLogo = '/logo-souza-areas.png';
      }
      setEmpresaInfo({ nome: user.empresaNome || '', logo: finalLogo });
      fetchAPI(`/api/documentos?empresaId=${user.empresaId}&userFuncao=${encodeURIComponent(user.funcao)}&userSetor=${encodeURIComponent(user.setor)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDocumentos(data);
          else setDocumentos([]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [router]);

  // Função auxiliar para mapear status interno para chave do filtro
  const getFiltroStatus = (statusOriginal: string) => {
    if (statusOriginal === 'Vigente') return 'Vigentes';
    if (statusOriginal === 'Aguardando Aprovação') return 'Aguardando';
    if (statusOriginal === 'Reprovado') return 'Devolvidos';
    if (statusOriginal === 'Rascunho' || statusOriginal === 'Elaboração') return 'Elaboracao';
    return 'Outros';
  };

  // Listas Semi-Filtradas (Cross-Filtering)
  const docsForStatus = documentos.filter(d => 
    (!filtros.categoria || d.categoria === filtros.categoria) &&
    (!filtros.setor || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes('Geral') || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes(filtros.setor))
  );

  const docsForCategoria = documentos.filter(d => 
    (!filtros.status || getFiltroStatus(d.status) === filtros.status) &&
    (!filtros.setor || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes('Geral') || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes(filtros.setor))
  );

  const docsForSetor = documentos.filter(d => 
    (!filtros.status || getFiltroStatus(d.status) === filtros.status) &&
    (!filtros.categoria || d.categoria === filtros.categoria)
  );

  const fullyFilteredDocs = documentos.filter(d => 
    (!filtros.status || getFiltroStatus(d.status) === filtros.status) &&
    (!filtros.categoria || d.categoria === filtros.categoria) &&
    (!filtros.setor || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes('Geral') || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes(filtros.setor))
  );

  // Totais dos Cards
  const totalDocs = docsForStatus.length;
  const countVigentes = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Vigentes').length;
  const countAguardando = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Aguardando').length;
  const countDevolvidos = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Devolvidos').length;
  const countElaboracao = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Elaboracao').length;

  // Lógica de Categorias
  const categoriasCount = docsForCategoria.reduce((acc, doc) => {
    const cat = doc.categoria || 'Sem Categoria';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalParaCat = docsForCategoria.length;
  const categoriasChart = Object.keys(categoriasCount).map(cat => ({
    categoria: cat,
    count: categoriasCount[cat],
    percent: totalParaCat > 0 ? ((categoriasCount[cat] / totalParaCat) * 100).toFixed(1) : '0.0'
  })).sort((a, b) => b.count - a.count);

  // Lógica de Setores
  const setoresPermitidos = {
    'Geral': 0, 'Limpeza': 0, 'Área Técnica': 0, 'Coleta': 0, 'Administração': 0, 
    'Triagem': 0, 'Diretoria': 0, 'Qualidade': 0, 'TI e infraestrutura': 0, 'Recepção': 0
  };

  const setoresCount = docsForSetor.reduce((acc, doc) => {
    const docSetores = Array.isArray(doc.setor) ? doc.setor : [doc.setor || 'Geral'];
    if (docSetores.includes('Geral')) {
      Object.keys(setoresPermitidos).forEach(s => {
        if (acc[s] !== undefined) acc[s] += 1;
      });
    } else {
      docSetores.forEach((s: string) => {
        if (acc[s] !== undefined) acc[s] += 1;
      });
    }
    return acc;
  }, { ...setoresPermitidos } as Record<string, number>);

  const totalParaSetor = docsForSetor.length;

  const setoresChart = Object.keys(setoresCount).map(setor => ({
    setor: setor,
    count: setoresCount[setor],
    percent: totalParaSetor > 0 ? ((setoresCount[setor] / totalParaSetor) * 100).toFixed(1) : '0.0'
  })).sort((a: any, b: any) => b.count - a.count);


  // Lógica de Vencimentos
  const docsVigentesFiltrados = fullyFilteredDocs.filter(d => getFiltroStatus(d.status) === 'Vigentes');
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  const docsComDias = docsVigentesFiltrados.map(doc => {
    let diasParaVencer = 999;
    if (doc.dataVencimento) {
      let venc: Date;
      if (doc.dataVencimento.includes('T')) {
        venc = new Date(doc.dataVencimento);
      } else {
        venc = new Date(doc.dataVencimento.split('/').reverse().join('-'));
      }
      venc.setHours(0,0,0,0);
      const diffTime = venc.getTime() - hoje.getTime();
      diasParaVencer = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    let cor = '#10B981'; // Emerald Green
    let bg = 'rgba(16, 185, 129, 0.1)';
    let corNome = 'green';
    let statusTexto = 'No Prazo';

    if (diasParaVencer <= 0) {
      cor = '#EF4444'; // Crimson
      bg = 'rgba(239, 68, 68, 0.1)';
      corNome = 'red';
      statusTexto = diasParaVencer < 0 ? 'Vencido' : 'Vence Hoje';
    }
    else if (diasParaVencer <= 7) {
      cor = '#F97316'; // Orange
      bg = 'rgba(249, 115, 22, 0.1)';
      corNome = 'orange';
      statusTexto = 'Crítico';
    }
    else if (diasParaVencer <= 15) {
      cor = '#F59E0B'; // Amber
      bg = 'rgba(245, 158, 11, 0.1)';
      corNome = 'yellow';
      statusTexto = 'Alerta';
    }
    else if (diasParaVencer <= 30) {
      cor = '#3B82F6'; // Blue
      bg = 'rgba(59, 130, 246, 0.1)';
      corNome = 'blue';
      statusTexto = 'Atenção';
    }
    
    return { ...doc, diasParaVencer, cor, bg, corNome, statusTexto };
  });

  const countVerde = docsComDias.filter(d => d.corNome === 'green').length;
  const countAzul = docsComDias.filter(d => d.corNome === 'blue').length;
  const countAmarelo = docsComDias.filter(d => d.corNome === 'yellow').length;
  const countLaranja = docsComDias.filter(d => d.corNome === 'orange').length;
  const countVermelho = docsComDias.filter(d => d.corNome === 'red').length;

  const docsCriticos = docsComDias
    .filter(d => d.corNome !== 'green')
    .sort((a, b) => a.diasParaVencer - b.diasParaVencer);

  const hasFilters = filtros.status || filtros.categoria || filtros.setor;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748B' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '2rem' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .saas-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
        }
        .saas-kpi-card {
          cursor: pointer;
        }
        .saas-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.05);
          border-color: #CBD5E1;
        }
        .saas-kpi-card.active {
          border-color: #0F172A;
          box-shadow: 0 0 0 1px #0F172A;
        }
        .saas-table th {
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #E2E8F0;
          position: sticky;
          top: 0;
          background-color: #F8FAFC;
        }
        .saas-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #F1F5F9;
          font-size: 0.875rem;
          color: #334155;
        }
        .saas-table tr:hover td {
          background-color: #F8FAFC;
        }
        .saas-table tr:last-child td {
          border-bottom: none;
        }
        .chart-row:hover {
          background-color: #F8FAFC;
        }
      `}} />

      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {empresaInfo.logo && (
            <img src={empresaInfo.logo} alt="Logo" style={{ maxHeight: '48px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
            {empresaInfo.nome && <span style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>{empresaInfo.nome}</span>}
          </div>
        </div>
        
        {hasFilters && (
          <button 
            onClick={clearFilters}
            style={{ 
              padding: '0.5rem 1rem', backgroundColor: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', 
              borderRadius: '8px', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div 
          className="saas-card" 
          style={{ padding: '1.5rem', opacity: hasFilters && !filtros.status ? 0.6 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Documents</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>{totalDocs}</div>
        </div>

        <div 
          className={`saas-card saas-kpi-card ${filtros.status === 'Vigentes' ? 'active' : ''}`}
          onClick={() => handleToggleFilter('status', 'Vigentes')}
          style={{ padding: '1.5rem', opacity: filtros.status && filtros.status !== 'Vigentes' ? 0.5 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>{countVigentes}</div>
        </div>

        <div 
          className={`saas-card saas-kpi-card ${filtros.status === 'Aguardando' ? 'active' : ''}`}
          onClick={() => handleToggleFilter('status', 'Aguardando')}
          style={{ padding: '1.5rem', opacity: filtros.status && filtros.status !== 'Aguardando' ? 0.5 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>{countAguardando}</div>
        </div>

        <div 
          className={`saas-card saas-kpi-card ${filtros.status === 'Devolvidos' ? 'active' : ''}`}
          onClick={() => handleToggleFilter('status', 'Devolvidos')}
          style={{ padding: '1.5rem', opacity: filtros.status && filtros.status !== 'Devolvidos' ? 0.5 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Returned</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>{countDevolvidos}</div>
        </div>

        <div 
          className={`saas-card saas-kpi-card ${filtros.status === 'Elaboracao' ? 'active' : ''}`}
          onClick={() => handleToggleFilter('status', 'Elaboracao')}
          style={{ padding: '1.5rem', opacity: filtros.status && filtros.status !== 'Elaboracao' ? 0.5 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Drafts</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>{countElaboracao}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Gráfico de Categorias */}
        <div className="saas-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Distribution by Category
          </h2>
          {categoriasChart.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No data matches the current filters.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categoriasChart.map((cat, idx) => (
                <div 
                  key={idx} 
                  className="chart-row"
                  onClick={() => handleToggleFilter('categoria', cat.categoria)} 
                  style={{ 
                    cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', 
                    opacity: filtros.categoria && filtros.categoria !== cat.categoria ? 0.4 : 1, 
                    transition: 'all 0.2s', backgroundColor: filtros.categoria === cat.categoria ? '#F1F5F9' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {cat.categoria} {filtros.categoria === cat.categoria && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0F172A' }}></div>}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{cat.count}</span>
                      <span style={{ backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{cat.percent}%</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: `${cat.percent}%`, backgroundColor: '#2563EB', 
                      borderRadius: '999px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico de Setores */}
        <div className="saas-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Distribution by Sector
          </h2>
          {setoresChart.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No data matches the current filters.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {setoresChart.map((setor, idx) => (
                <div 
                  key={idx} 
                  className="chart-row"
                  onClick={() => handleToggleFilter('setor', setor.setor)} 
                  style={{ 
                    cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', 
                    opacity: filtros.setor && filtros.setor !== setor.setor ? 0.4 : 1, 
                    transition: 'all 0.2s', backgroundColor: filtros.setor === setor.setor ? '#F1F5F9' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {setor.setor} {filtros.setor === setor.setor && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0F172A' }}></div>}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{setor.count}</span>
                      <span style={{ backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{setor.percent}%</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: `${setor.percent}%`, backgroundColor: '#10B981', 
                      borderRadius: '999px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Expiration Control
      </h2>

      {docsCriticos.length > 0 && (
        <div style={{ 
          marginBottom: '2rem', padding: '1rem 1.5rem', borderRadius: '8px', 
          backgroundColor: countVermelho > 0 ? '#FEF2F2' : (countLaranja > 0 ? '#FFF7ED' : '#FEFCE8'),
          border: `1px solid ${countVermelho > 0 ? '#FECACA' : (countLaranja > 0 ? '#FFEDD5' : '#FEF08A')}`,
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ color: countVermelho > 0 ? '#EF4444' : (countLaranja > 0 ? '#F97316' : '#F59E0B') }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Attention Required</h3>
            <p style={{ fontSize: '0.875rem', color: '#334155', margin: '0.2rem 0 0 0' }}>
              There are <strong>{docsCriticos.length} documents</strong> approaching expiration. {countVermelho > 0 && <span style={{ color: '#EF4444', fontWeight: 600 }}>{countVermelho} documents have already expired.</span>}
            </p>
          </div>
        </div>
      )}

      {/* Structured Metric Containers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        
        <div className="saas-card" style={{ padding: '1.25rem', borderTop: '3px solid #10B981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>On Track</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>{countVerde}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>&gt; 30 days</div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem', borderTop: '3px solid #3B82F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attention</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>{countAzul}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>16-30 days</div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem', borderTop: '3px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alert</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>{countAmarelo}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>8-15 days</div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem', borderTop: '3px solid #F97316' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F97316' }}></div>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>{countLaranja}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>1-7 days</div>
        </div>

        <div className="saas-card" style={{ padding: '1.25rem', borderTop: '3px solid #EF4444', backgroundColor: countVermelho > 0 ? '#FEF2F2' : '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expired</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: countVermelho > 0 ? '#991B1B' : '#0F172A' }}>{countVermelho}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>&le; 0 days</div>
        </div>

      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Critical Expirations List
      </h2>
      <div className="saas-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
          <table className="saas-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Title</th>
                <th>Sector</th>
                <th>Time Remaining</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {docsCriticos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>No Critical Expirations</h4>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>All filtered documents are currently in a safe state.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : docsCriticos.map(doc => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{doc.codigo}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.titulo}</td>
                  <td>
                    <span style={{ backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, color: '#475569' }}>
                      {Array.isArray(doc.setor) ? doc.setor.join(', ') : doc.setor}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: doc.cor }}></div>
                      <span style={{ fontWeight: 600, color: doc.corNome === 'red' ? '#EF4444' : '#334155', fontSize: '0.85rem' }}>
                        {doc.diasParaVencer < 0 ? `Expired ${Math.abs(doc.diasParaVencer)} days ago` : `${doc.diasParaVencer} days`}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => router.push(`/elaboracao?revisao=${doc.id}`)}
                      style={{ 
                        padding: '0.4rem 0.8rem', backgroundColor: '#FFFFFF', color: '#0F172A', 
                        border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', 
                        fontWeight: 500, fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
