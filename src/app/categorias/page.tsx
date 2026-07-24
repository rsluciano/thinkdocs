"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Animated SVG Icons per Category ────────────────────────
const CategoryIllustration = ({ name, active, customColor }: { name: string; active: boolean; customColor?: string }) => {
  const baseColor = customColor || '#2563EB';
  const color = active ? '#fff' : baseColor;
  const soft  = active ? 'rgba(255,255,255,0.25)' : `${baseColor}15`;

  const illustrations: Record<string, React.ReactNode> = {
    "Formulários": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes formFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}} .form-g{animation:formFloat 3s ease-in-out infinite}`}</style>
        <g className="form-g">
          <rect x="12" y="8" width="40" height="48" rx="4" fill={soft} stroke={color} strokeWidth="2"/>
          <line x1="20" y1="22" x2="44" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="20" y1="30" x2="44" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="20" y1="38" x2="36" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="20" y="44" width="8" height="5" rx="1" fill={color}/>
        </g>
      </svg>
    ),
    "Bulário": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes bubbleFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-5px) rotate(6deg)}} .bul-g{animation:bubbleFloat 3.5s ease-in-out infinite}`}</style>
        <g className="bul-g">
          <path d="M24 8h16v8L34 24v26a2 2 0 01-2 2h-4a2 2 0 01-2-2V24L20 16V8z" fill={soft} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="30" cy="38" r="5" fill={color} opacity="0.3"/>
          <circle cx="38" cy="42" r="3" fill={color} opacity="0.5"/>
          <line x1="24" y1="8" x2="40" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "FISPQs": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes hazardPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}} .haz-g{animation:hazardPulse 2s ease-in-out infinite}`}</style>
        <g className="haz-g">
          <path d="M32 8L56 50H8L32 8z" fill={soft} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
          <line x1="32" y1="24" x2="32" y2="38" stroke={color} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32" cy="44" r="2.5" fill={color}/>
        </g>
      </svg>
    ),
    "Instrução de trabalho de Serviço": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes serviceFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}} .srv-g{animation:serviceFloat 3s ease-in-out infinite}`}</style>
        <g className="srv-g">
          <rect x="10" y="16" width="44" height="34" rx="3" fill={soft} stroke={color} strokeWidth="2"/>
          <rect x="22" y="8" width="20" height="12" rx="2" fill={soft} stroke={color} strokeWidth="2"/>
          <line x1="20" y1="30" x2="44" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="38" x2="36" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="44" cy="42" r="7" fill={color} opacity="0.15"/>
          <path d="M41 42l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Instrução de trabalho de Equipamentos": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes gearSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}} @keyframes gearSpinReverse{0%{transform:rotate(0deg)}100%{transform:rotate(-360deg)}} .gear1{animation:gearSpin 5s linear infinite; transform-origin:22px 22px} .gear2{animation:gearSpinReverse 5s linear infinite; transform-origin:42px 42px}`}</style>
        <g className="gear1">
          <circle cx="22" cy="22" r="9" fill={soft} stroke={color} strokeWidth="2"/>
          <circle cx="22" cy="22" r="4" fill={color} opacity="0.4"/>
          {[0,60,120,180,240,300].map(a => {
            const r = Math.PI * a / 180;
            return <rect key={a} x={22 + 10*Math.cos(r) - 2} y={22 + 10*Math.sin(r) - 3} width="4" height="6" rx="1" fill={color} transform={`rotate(${a},${22 + 10*Math.cos(r)},${22 + 10*Math.sin(r)})`}/>;
          })}
        </g>
        <g className="gear2">
          <circle cx="42" cy="42" r="7" fill={soft} stroke={color} strokeWidth="2"/>
          <circle cx="42" cy="42" r="3" fill={color} opacity="0.4"/>
          {[0,60,120,180,240,300].map(a => {
            const r = Math.PI * a / 180;
            return <rect key={a} x={42 + 8*Math.cos(r) - 1.5} y={42 + 8*Math.sin(r) - 2.5} width="3" height="5" rx="1" fill={color} transform={`rotate(${a},${42 + 8*Math.cos(r)},${42 + 8*Math.sin(r)})`}/>;
          })}
        </g>
      </svg>
    ),
    "Instrução de trabalho de Exames": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes microscopeFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}} .mic-g{animation:microscopeFloat 3s ease-in-out infinite}`}</style>
        <g className="mic-g">
          <ellipse cx="24" cy="46" rx="14" ry="4" fill={color} opacity="0.15"/>
          <rect x="20" y="38" width="8" height="8" rx="2" fill={soft} stroke={color} strokeWidth="2"/>
          <rect x="22" y="20" width="4" height="20" rx="1" fill={soft} stroke={color} strokeWidth="2"/>
          <ellipse cx="24" cy="19" rx="8" ry="5" fill={soft} stroke={color} strokeWidth="2"/>
          <circle cx="40" cy="28" r="10" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3"/>
          <circle cx="40" cy="28" r="4" fill={color} opacity="0.3"/>
          <line x1="48" y1="36" x2="54" y2="42" stroke={color} strokeWidth="3" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "Manuais": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes bookFlip{0%,90%,100%{transform:scaleX(1)}95%{transform:scaleX(0.92)}} .book-g{animation:bookFlip 4s ease-in-out infinite}`}</style>
        <g className="book-g">
          <rect x="10" y="10" width="22" height="44" rx="2" fill={soft} stroke={color} strokeWidth="2"/>
          <rect x="32" y="10" width="22" height="44" rx="2" fill={soft} stroke={color} strokeWidth="2"/>
          <line x1="32" y1="10" x2="32" y2="54" stroke={color} strokeWidth="2"/>
          <line x1="16" y1="22" x2="28" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="28" x2="28" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="34" x2="24" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="36" y1="22" x2="48" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="36" y1="28" x2="48" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="36" y1="34" x2="44" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "Documentos Mestres": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes crownBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-5px) rotate(3deg)}} .crw-g{animation:crownBob 3s ease-in-out infinite}`}</style>
        <g className="crw-g">
          <rect x="14" y="20" width="36" height="34" rx="3" fill={soft} stroke={color} strokeWidth="2"/>
          <path d="M14 20l8-10 10 8 10-8 8 10" fill={soft} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="22" cy="10" r="3" fill={color}/>
          <circle cx="32" cy="18" r="3" fill={color}/>
          <circle cx="42" cy="10" r="3" fill={color}/>
          <line x1="22" y1="34" x2="42" y2="34" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="22" y1="42" x2="36" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    "Procedimentos da qualidade": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes shieldPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}} .shd-g{animation:shieldPulse 2.5s ease-in-out infinite}`}</style>
        <g className="shd-g">
          <path d="M32 8L10 18v14c0 13 10 22 22 26 12-4 22-13 22-26V18L32 8z" fill={soft} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
          <path d="M23 33l6 6 12-12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    "Listas": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes listSlide{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}} .lst-g{animation:listSlide 3s ease-in-out infinite}`}</style>
        <g className="lst-g">
          <rect x="12" y="10" width="40" height="44" rx="4" fill={soft} stroke={color} strokeWidth="2"/>
          {[22,32,42].map((y, i) => (
            <g key={y}>
              <circle cx="22" cy={y} r="3" fill={color} opacity={0.7 - i * 0.15}/>
              <line x1="30" y1={y} x2="44" y2={y} stroke={color} strokeWidth="2" strokeLinecap="round"/>
            </g>
          ))}
        </g>
      </svg>
    ),
    "Geral": (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`@keyframes folderOpen{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.95)}} .fld-g{animation:folderOpen 3s ease-in-out infinite}`}</style>
        <g className="fld-g">
          <path d="M8 20h48v30a4 4 0 01-4 4H12a4 4 0 01-4-4V20z" fill={soft} stroke={color} strokeWidth="2"/>
          <path d="M8 20v-4a4 4 0 014-4h14l4 8H8z" fill={soft} stroke={color} strokeWidth="2"/>
          <line x1="18" y1="32" x2="46" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="40" x2="38" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </g>
      </svg>
    ),
  };

  return (
    <div style={{ width: 56, height: 56, flexShrink: 0 }}>
      {illustrations[name] || illustrations["Geral"]}
    </div>
  );
};

// ─── Gradient palettes per category ──────────────────────────
const CAT_GRADIENTS: Record<string, { from: string; to: string; accent: string }> = {
  "Formulários":                             { from: '#EFF6FF', to: '#DBEAFE', accent: '#2563EB' }, // Blue
  "Bulário":                                 { from: '#F0FDF4', to: '#DCFCE7', accent: '#16A34A' }, // Green
  "FISPQs":                                  { from: '#FFF7ED', to: '#FED7AA', accent: '#EA580C' }, // Orange
  "Instrução de trabalho de Serviço":        { from: '#F5F3FF', to: '#DDD6FE', accent: '#7C3AED' }, // Purple
  "Instrução de trabalho de Equipamentos":   { from: '#FFFBEB', to: '#FEF08A', accent: '#EAB308' }, // Yellow
  "Instrução de trabalho de Exames":         { from: '#F0F9FF', to: '#BAE6FD', accent: '#0284C7' }, // Sky
  "Manuais":                                 { from: '#FFF1F2', to: '#FECDD3', accent: '#E11D48' }, // Rose
  "Documentos Mestres":                      { from: '#FEFCE8', to: '#FEF08A', accent: '#CA8A04' }, // Gold
  "Procedimentos da qualidade":              { from: '#F0FDF4', to: '#BBF7D0', accent: '#059669' }, // Emerald
  "Listas":                                  { from: '#EFF6FF', to: '#BFDBFE', accent: '#3B82F6' }, // Blue
  "Geral":                                   { from: '#F8FAFC', to: '#E2E8F0', accent: '#475569' }, // Slate
};

export default function CategoriasPage() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
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

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    documentos.forEach(doc => {
      const cat = doc.categoria || 'Geral';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [documentos]);

  const filteredDocs = useMemo(() => {
    if (!selectedFolder) return [];
    return documentos.filter(doc => (doc.categoria || 'Geral') === selectedFolder);
  }, [documentos, selectedFolder]);

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>Categorias de Documentos</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Navegue pelos documentos do sistema organizados por categoria.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Gráfico Analítico de Categorias */}
          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Distribuição de Documentos</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Percentual e quantidade por tipo de documento no sistema.</p>
            </div>
            
            <div style={{ flex: 2, height: 200, minWidth: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.length > 0 ? categories : [{ name: 'Nenhum', count: 1 }]}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {(categories.length > 0 ? categories : [{ name: 'Nenhum' }]).map((cat: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CAT_GRADIENTS[cat.name]?.accent || CAT_GRADIENTS['Geral'].accent} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} docs`, 'Quantidade']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {categories.map((cat, idx) => {
              const isActive = selectedFolder === cat.name;
              const isHovered = hoveredCard === cat.name;
              const grad = CAT_GRADIENTS[cat.name] || CAT_GRADIENTS['Geral'];

              return (
                <div
                  key={cat.name}
                  onClick={() => setSelectedFolder(isActive ? null : cat.name)}
                  onMouseEnter={() => setHoveredCard(cat.name)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${grad.accent}, ${grad.accent}DD)`
                      : isHovered
                        ? `linear-gradient(135deg, ${grad.from}, ${grad.to})`
                        : 'white',
                    border: `1.5px solid ${isActive ? grad.accent : isHovered ? grad.accent + '40' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.125rem',
                    boxShadow: isActive
                      ? '0 12px 30px rgba(37,99,235,0.35)'
                      : isHovered
                        ? 'var(--shadow-md)'
                        : 'var(--shadow-xs)',
                    transform: isHovered && !isActive ? 'translateY(-3px)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    animation: `fadeIn 0.4s ease ${idx * 0.04}s both`,
                  }}
                >
                  <CategoryIllustration name={cat.name} active={isActive} customColor={grad.accent} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: isActive ? 'white' : 'var(--color-text-primary)', marginBottom: '0.25rem', lineHeight: 1.3 }}>{cat.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ height: 4, flex: 1, background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, cat.count * 10)}%`, background: isActive ? 'white' : 'var(--color-primary)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {cat.count} doc{cat.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={isActive ? 'white' : 'var(--color-text-muted)'} strokeWidth={2}
                    style={{ flexShrink: 0, transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.25s ease' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📂</div>
                <div style={{ fontWeight: 600 }}>Nenhuma categoria com documentos vigentes no momento.</div>
              </div>
            )}
          </div>

          {/* Document table */}
          {selectedFolder && (
            <div className="card animate-slide-up" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-surface-2)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIllustration name={selectedFolder} active={false} customColor={CAT_GRADIENTS[selectedFolder]?.accent || '#475569'} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Documentos: {selectedFolder}</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{filteredDocs.length} documento(s) encontrado(s)</p>
                </div>
                <button onClick={() => setSelectedFolder(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Setor</th>
                      <th style={{ textAlign: 'center' }}>Revisão</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Nenhum documento nesta pasta.</td></tr>
                    ) : filteredDocs.map(doc => (
                      <tr key={doc.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{doc.codigo}</span></td>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{doc.titulo}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{Array.isArray(doc.setor) ? doc.setor.join(', ') : doc.setor}</td>
                        <td style={{ textAlign: 'center' }}><span className="badge badge-blue">v{doc.revisao}</span></td>
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
