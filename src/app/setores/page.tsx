"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const TODOS_SETORES = [
  "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica",
  "Hematologia", "Imunologia", "Microbiologia",
  "Urinálise", "Parasitologia",
  "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica",
  "Administrativo", "Diretoria", "Limpeza"
];

// ─── Animated SVG Icons per Setor ────────────────────────────
const SetorIllustration = ({ name, active, customColor }: { name: string; active: boolean; customColor?: string }) => {
  const baseColor = customColor || '#2563EB';
  const color = active ? '#fff' : baseColor;
  const soft  = active ? 'rgba(255,255,255,0.25)' : `${baseColor}15`;
  const stroke = active ? 'white' : baseColor;

  const illustrations: Record<string, React.ReactNode> = {
    "Recepção e Atendimento": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes handshake{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}} .hnd{animation:handshake 2s ease-in-out infinite}`}</style>
        <g className="hnd">
          <circle cx="22" cy="18" r="8" fill={soft} stroke={stroke} strokeWidth="2"/>
          <path d="M14 36c0-4.4 3.6-8 8-8h16c4.4 0 8 3.6 8 8v14H14V36z" fill={soft} stroke={stroke} strokeWidth="2"/>
          <path d="M38 28l6 6-6 6" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Coleta": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes syringeFloat{0%,100%{transform:translateY(0) rotate(-15deg)}50%{transform:translateY(-5px) rotate(-15deg)}} .syr{animation:syringeFloat 3s ease-in-out infinite}`}</style>
        <g className="syr" style={{ transformOrigin: '32px 32px' }}>
          <rect x="24" y="16" width="16" height="32" rx="3" fill={soft} stroke={stroke} strokeWidth="2"/>
          <rect x="28" y="22" width="8" height="18" rx="1" fill={stroke} opacity="0.15"/>
          <line x1="32" y1="8" x2="32" y2="16" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
          <line x1="32" y1="48" x2="32" y2="56" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="28" y1="52" x2="36" y2="52" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
          <line x1="28" y1="30" x2="36" y2="30" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="28" y1="36" x2="36" y2="36" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "Triagem": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes routeAnim{0%,100%{stroke-dashoffset:0}50%{stroke-dashoffset:-20}} .rt{animation:routeAnim 2s linear infinite; stroke-dasharray:6 4}`}</style>
        <circle cx="32" cy="28" r="8" fill={soft} stroke={stroke} strokeWidth="2"/>
        <circle cx="16" cy="48" r="6" fill={soft} stroke={stroke} strokeWidth="2"/>
        <circle cx="48" cy="48" r="6" fill={soft} stroke={stroke} strokeWidth="2"/>
        <path d="M28 34 L18 42" stroke={stroke} strokeWidth="2" strokeLinecap="round" className="rt"/>
        <path d="M36 34 L46 42" stroke={stroke} strokeWidth="2" strokeLinecap="round" className="rt"/>
        <circle cx="32" cy="28" r="3.5" fill={stroke} opacity="0.5"/>
      </svg>
    ),
    "Bioquímica": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes testTube{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}} .tt{animation:testTube 3s ease-in-out infinite; transform-origin:32px 32px}`}</style>
        <g className="tt">
          <path d="M24 10h16v28l-8 14-8-14V10z" fill={soft} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
          <rect x="24" y="10" width="16" height="6" rx="1" fill={stroke} opacity="0.2"/>
          <circle cx="30" cy="40" r="3" fill={stroke} opacity="0.4"/>
          <circle cx="36" cy="44" r="2" fill={stroke} opacity="0.3"/>
          <line x1="24" y1="18" x2="40" y2="18" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="24" y1="24" x2="40" y2="24" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "Hematologia": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes dropFall{0%{transform:translateY(-3px)}50%{transform:translateY(3px)}100%{transform:translateY(-3px)}} .drp{animation:dropFall 2.5s ease-in-out infinite}`}</style>
        <g className="drp">
          <path d="M32 10 C32 10 14 30 14 40 a18 18 0 0 0 36 0 C50 30 32 10 32 10z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
          <path d="M32 16 C32 16 20 32 20 40 a12 12 0 0 0 12 12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        </g>
      </svg>
    ),
    "Imunologia": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes shieldPulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}} .shd2{animation:shieldPulse2 2.5s ease-in-out infinite}`}</style>
        <g className="shd2">
          <path d="M32 8L10 18v14c0 13 10 22 22 26 12-4 22-13 22-26V18L32 8z" fill={soft} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
          <path d="M23 33l6 6 12-12" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Microbiologia": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes bacteriaPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}} .bac{animation:bacteriaPulse 2s ease-in-out infinite}`}</style>
        <g className="bac">
          <ellipse cx="32" cy="32" rx="14" ry="10" fill={soft} stroke={stroke} strokeWidth="2"/>
          {[-50,-20,10,40,70,100,130,160].map((a,i) => {
            const rad = Math.PI * a / 180;
            const rx = 14, ry = 10;
            const bx = 32 + rx * Math.cos(rad), by = 32 + ry * Math.sin(rad);
            const ex = 32 + (rx+7) * Math.cos(rad), ey = 32 + (ry+7) * Math.sin(rad);
            return <line key={i} x1={bx} y1={by} x2={ex} y2={ey} stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>;
          })}
          <ellipse cx="32" cy="32" rx="6" ry="4" fill={stroke} opacity="0.3"/>
        </g>
      </svg>
    ),
    "Urinálise": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes dropletBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} .dlt{animation:dropletBounce 2s ease-in-out infinite}`}</style>
        <g className="dlt">
          <path d="M32 12C32 12 18 28 18 38a14 14 0 0028 0C46 28 32 12 32 12z" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2"/>
          <path d="M26 40a8 8 0 008 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        </g>
      </svg>
    ),
    "Parasitologia": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes bugWiggle{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}} .bug{animation:bugWiggle 1.5s ease-in-out infinite; transform-origin:32px 32px}`}</style>
        <g className="bug">
          <ellipse cx="32" cy="32" rx="10" ry="14" fill={soft} stroke={stroke} strokeWidth="2"/>
          <circle cx="32" cy="18" r="5" fill={soft} stroke={stroke} strokeWidth="2"/>
          {[[-10,-8],[-14,0],[-10,8],[10,-8],[14,0],[10,8]].map(([dx,dy],i) => (
            <line key={i} x1={32} y1={32} x2={32+dx} y2={32+dy} stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
          ))}
        </g>
      </svg>
    ),
    "Qualidade": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes starSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}} .str{animation:starSpin 6s linear infinite; transform-origin:32px 32px}`}</style>
        <g className="str">
          <path d="M32 8l4.9 14.9H52l-12.5 9.1 4.8 14.9L32 38l-12.3 8.9 4.8-14.9L12 22.9h15.1L32 8z" fill={soft} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Faturamento": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes coinFloat{0%,100%{transform:translateY(0) rotateY(0)}50%{transform:translateY(-4px) rotateY(180deg)}} .coi{animation:coinFloat 3s ease-in-out infinite}`}</style>
        <g className="coi">
          <circle cx="32" cy="32" r="20" fill={soft} stroke={stroke} strokeWidth="2"/>
          <text x="32" y="38" textAnchor="middle" fontSize="20" fontWeight="bold" fill={stroke}>$</text>
        </g>
      </svg>
    ),
    "TI e Infraestrutura": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes screenBlink{0%,90%,100%{opacity:1}95%{opacity:0.5}} .scr{animation:screenBlink 3s ease-in-out infinite}`}</style>
        <g className="scr">
          <rect x="8" y="12" width="48" height="32" rx="3" fill={soft} stroke={stroke} strokeWidth="2"/>
          <rect x="14" y="18" width="36" height="20" rx="1" fill={stroke} opacity="0.1"/>
          <line x1="24" y1="44" x2="40" y2="44" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
          <rect x="20" y="44" width="24" height="6" rx="1" fill={soft} stroke={stroke} strokeWidth="1.5"/>
          <path d="M20 30l5-4 4 6 5-8 4 5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Área Técnica": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes wrenchTurn{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}} .wrc{animation:wrenchTurn 2s ease-in-out infinite; transform-origin:32px 32px}`}</style>
        <g className="wrc">
          <path d="M20 44l-8 8 4 4 8-8a12 12 0 1012-20 12 12 0 00-16 16z" fill={soft} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="40" cy="24" r="8" fill="none" stroke={stroke} strokeWidth="2"/>
        </g>
      </svg>
    ),
    "Administrativo": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes folderBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}} .fld2{animation:folderBounce 3s ease-in-out infinite}`}</style>
        <g className="fld2">
          <path d="M8 20h48v28a4 4 0 01-4 4H12a4 4 0 01-4-4V20z" fill={soft} stroke={stroke} strokeWidth="2"/>
          <path d="M8 20v-4a4 4 0 014-4h14l4 8H8z" fill={soft} stroke={stroke} strokeWidth="2"/>
          <line x1="18" y1="32" x2="46" y2="32" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="40" x2="36" y2="40" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "Diretoria": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes tieSwing{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}} .tie{animation:tieSwing 3s ease-in-out infinite; transform-origin:32px 30px}`}</style>
        <g className="tie">
          <circle cx="32" cy="18" r="9" fill={soft} stroke={stroke} strokeWidth="2"/>
          <path d="M26 28 h12 l-3 20 h-6 l-3-20z" fill={soft} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
          <path d="M28 30l4 4 4-4" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Limpeza": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes broomSwipe{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(-5deg)}} .brm{animation:broomSwipe 2s ease-in-out infinite; transform-origin:20px 20px}`}</style>
        <g className="brm">
          <line x1="20" y1="14" x2="46" y2="46" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
          <path d="M14 46 C18 38 24 36 30 38 L46 46 C40 52 28 56 14 46z" fill={soft} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Geral": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes buildingGlow{0%,100%{opacity:1}50%{opacity:0.7}} .bld{animation:buildingGlow 2s ease-in-out infinite}`}</style>
        <g className="bld">
          <rect x="12" y="20" width="40" height="36" rx="2" fill={soft} stroke={stroke} strokeWidth="2"/>
          <rect x="22" y="10" width="20" height="14" rx="2" fill={soft} stroke={stroke} strokeWidth="2"/>
          <rect x="20" y="30" width="8" height="8" rx="1" fill={stroke} opacity="0.3"/>
          <rect x="36" y="30" width="8" height="8" rx="1" fill={stroke} opacity="0.3"/>
          <rect x="26" y="42" width="12" height="14" rx="1" fill={stroke} opacity="0.2"/>
        </g>
      </svg>
    ),
  };

  return (
    <div style={{ width: 52, height: 52, flexShrink: 0 }}>
      {illustrations[name] || illustrations["Geral"]}
    </div>
  );
};

// ─── Color accent per setor ───────────────────────────────────
const SETOR_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  "Recepção e Atendimento": { from: '#F0FDF4', to: '#DCFCE7', accent: '#22C55E' },
  "Coleta":                 { from: '#FEF2F2', to: '#FECACA', accent: '#EF4444' },
  "Triagem":                { from: '#F5F3FF', to: '#DDD6FE', accent: '#7C3AED' },
  "Bioquímica":             { from: '#FFFBEB', to: '#FEF08A', accent: '#F59E0B' },
  "Hematologia":            { from: '#FEF2F2', to: '#FECACA', accent: '#DC2626' },
  "Imunologia":             { from: '#EFF6FF', to: '#BFDBFE', accent: '#2563EB' },
  "Microbiologia":          { from: '#F0FDF4', to: '#BBF7D0', accent: '#16A34A' },
  "Urinálise":              { from: '#FEFCE8', to: '#FEF08A', accent: '#CA8A04' },
  "Parasitologia":          { from: '#F7FEE7', to: '#D9F99D', accent: '#65A30D' },
  "Qualidade":              { from: '#FFFBEB', to: '#FDE68A', accent: '#D97706' },
  "Faturamento":            { from: '#F0FDF4', to: '#DCFCE7', accent: '#15803D' },
  "TI e Infraestrutura":    { from: '#F0F9FF', to: '#BAE6FD', accent: '#0284C7' },
  "Área Técnica":           { from: '#F8FAFC', to: '#E2E8F0', accent: '#475569' },
  "Administrativo":         { from: '#EFF6FF', to: '#DBEAFE', accent: '#1D4ED8' },
  "Diretoria":              { from: '#F5F3FF', to: '#DDD6FE', accent: '#6D28D9' },
  "Limpeza":                { from: '#F0FDF4', to: '#DCFCE7', accent: '#059669' },
  "Geral":                  { from: '#F8FAFC', to: '#E2E8F0', accent: '#64748B' },
};

export default function SetoresPage() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) { router.push('/login'); return; }
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    carregarDocumentos(parsedUser);
  }, [router]);

  const carregarDocumentos = async (userData: any) => {
    try {
      const res = await fetchAPI(`/api/documentos?status=Vigente&empresaId=${userData.empresaId}&userFuncao=${encodeURIComponent(userData.funcao)}&userSetor=${encodeURIComponent(userData.setor)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setDocumentos(data);
      else setDocumentos([]);
    } catch { console.error('Erro ao buscar documentos'); }
    finally { setLoading(false); }
  };

  const setores = useMemo(() => {
    const counts: Record<string, number> = {};
    const isFullAccess = user && ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico'].includes(user.funcao);
    const userSetoresList = user ? (user.setor || '').split(',').map((s: string) => s.trim()) : [];
    const hasGeralAccess = userSetoresList.includes('Geral');
    const allowedSectors = (isFullAccess || hasGeralAccess) ? TODOS_SETORES : userSetoresList;

    documentos.forEach(doc => {
      const s = doc.setor;
      let setoresList = Array.isArray(s) ? s : (s ? [s] : ['Geral']);
      if (!setoresList.includes('Qualidade')) setoresList = [...setoresList, 'Qualidade'];
      if (setoresList.includes('Geral')) {
        allowedSectors.forEach((setorNome: string) => {
          if (setorNome === 'Geral') return;
          counts[setorNome] = (counts[setorNome] || 0) + 1;
        });
      } else {
        setoresList.forEach(setorNome => {
          if (allowedSectors.includes(setorNome)) counts[setorNome] = (counts[setorNome] || 0) + 1;
        });
      }
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [documentos, user]);

  const filteredDocs = useMemo(() => {
    if (!selectedFolder) return [];
    let docs = documentos.filter(doc => {
      const s = doc.setor;
      let setoresList = Array.isArray(s) ? s : (s ? [s] : ['Geral']);
      if (!setoresList.includes('Qualidade')) setoresList = [...setoresList, 'Qualidade'];
      if (setoresList.includes('Geral')) return true;
      return setoresList.includes(selectedFolder);
    });
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      docs = docs.filter(doc =>
        (doc.codigo?.toLowerCase().includes(q)) ||
        (doc.titulo?.toLowerCase().includes(q)) ||
        (doc.categoria?.toLowerCase().includes(q))
      );
    }
    return docs.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));
  }, [documentos, selectedFolder, searchTerm]);

  const maxCount = Math.max(...setores.map(s => s.count), 1);

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button onClick={() => router.push('/')} style={{
        marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'none', border: 'none', color: 'var(--color-primary)',
        fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.875rem'
      }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
        Voltar ao Dashboard
      </button>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg,#EFF6FF,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>Setores</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Navegue pelos documentos separados por área e setor de aplicação do laboratório.</p>
        </div>
        <div style={{ marginLeft: 'auto', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{setores.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>setores ativos</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Setor cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {setores.map((setor, idx) => {
              const isActive = selectedFolder === setor.name;
              const isHovered = hoveredCard === setor.name;
              const pal = SETOR_COLORS[setor.name] || SETOR_COLORS['Geral'];
              const pct = Math.round((setor.count / maxCount) * 100);

              return (
                <div
                  key={setor.name}
                  onClick={() => setSelectedFolder(isActive ? null : setor.name)}
                  onMouseEnter={() => setHoveredCard(setor.name)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${pal.accent}, ${pal.accent}CC)`
                      : isHovered
                        ? `linear-gradient(135deg, ${pal.from}, ${pal.to})`
                        : 'white',
                    border: `1.5px solid ${isActive ? pal.accent : isHovered ? pal.accent + '60' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.125rem 1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: isActive
                      ? `0 12px 30px ${pal.accent}50`
                      : isHovered
                        ? 'var(--shadow-md)'
                        : 'var(--shadow-xs)',
                    transform: isHovered && !isActive ? 'translateY(-3px)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    animation: `fadeIn 0.35s ease ${idx * 0.035}s both`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Background progress fill */}
                  {!isActive && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0,
                      width: `${pct}%`, height: 3,
                      background: pal.accent, borderRadius: '0 2px 2px 0',
                      opacity: 0.5, transition: 'width 0.8s ease'
                    }} />
                  )}

                  <SetorIllustration name={setor.name} active={isActive} customColor={pal.accent} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontWeight: 700, fontSize: '0.875rem',
                      color: isActive ? 'white' : 'var(--color-text-primary)',
                      marginBottom: '0.25rem', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{setor.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        background: isActive ? 'rgba(255,255,255,0.3)' : `${pal.accent}20`,
                        borderRadius: 'var(--radius-full)',
                        padding: '1px 8px', display: 'inline-flex'
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isActive ? 'white' : pal.accent }}>
                          {setor.count} doc{setor.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={isActive ? 'white' : 'var(--color-text-muted)'} strokeWidth={2.5}
                    style={{ flexShrink: 0, transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.25s ease', opacity: isHovered || isActive ? 1 : 0.4 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              );
            })}

            {setores.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏢</div>
                <div style={{ fontWeight: 600 }}>Nenhum setor com documentos vigentes no momento.</div>
              </div>
            )}
          </div>

          {/* Document table */}
          {selectedFolder && (
            <div className="card animate-slide-up" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{
                padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                background: 'var(--color-surface-2)', flexWrap: 'wrap'
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <SetorIllustration name={selectedFolder} active={false} customColor={SETOR_COLORS[selectedFolder]?.accent || '#475569'} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Setor: {selectedFolder}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{filteredDocs.length} documento(s)</p>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', width: 280 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por código, título..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>

                <button onClick={() => setSelectedFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Categoria</th>
                      <th style={{ textAlign: 'center' }}>Revisão</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                        {searchTerm ? 'Nenhum resultado para a busca.' : 'Nenhum documento neste setor.'}
                      </td></tr>
                    ) : filteredDocs.map(doc => (
                      <tr key={doc.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{doc.codigo}</span></td>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{doc.titulo}</td>
                        <td>
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{doc.categoria || 'Geral'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}><span className="badge badge-gray">v{doc.revisao}</span></td>
                        <td style={{ textAlign: 'center' }}><span className="badge badge-green">Vigente</span></td>
                        <td>
                          <a href={`/documentos/ler/${doc.id}`} className="btn btn-primary btn-sm">
                            Ler Documento
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
