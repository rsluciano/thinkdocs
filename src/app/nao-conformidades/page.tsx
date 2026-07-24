"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────
type RNC = {
  id: string;
  titulo: string;
  descricao: string;
  origem: string;
  tipo?: string;
  setor?: string;
  criticidade?: string;
  status: string;
  dataRegistro: string;
  prazoAcao?: string;
  criadoPor?: string;
  responsavelAcao?: string;
  analiseCausa?: string;
};

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string; color: string }> = {
  'Registrada':    { label: 'Registrada',    cls: 'badge-gray',   color: '#94A3B8' },
  'Em Análise':    { label: 'Em Análise',    cls: 'badge-purple', color: '#7C3AED' },
  'Ação Pendente': { label: 'Plano de Ação', cls: 'badge-orange', color: '#C2410C' },
  'Em Ação':       { label: 'Em Ação',       cls: 'badge-blue',   color: '#1D4ED8' },
  'Concluída':     { label: 'Concluída',     cls: 'badge-green',  color: '#166534' },
  'Atrasada':      { label: 'Atrasada',      cls: 'badge-red',    color: '#B91C1C' },
};

const CRIT_CONFIG: Record<string, { cls: string; dot: string }> = {
  'Alta':       { cls: 'badge-red',    dot: '#EF4444' },
  'Média':      { cls: 'badge-orange', dot: '#F59E0B' },
  'Baixa':      { cls: 'badge-green',  dot: '#22C55E' },
  'Observação': { cls: 'badge-gray',   dot: '#94A3B8' },
};

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }).format(new Date(d));
};

const fmtRelative = (d: string) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  return `há ${diff} dias`;
};

// ─── Mini Chart (Sparkline) ───────────────────────────────────
const MiniChart = ({ data, color }: { data: number[]; color: string }) => (
  <ResponsiveContainer width="100%" height={32}>
    <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
        fill={`url(#sg-${color.replace('#','')})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── KPI Card ─────────────────────────────────────────────────
const KpiCard = ({ value, label, icon, color, bg, change, sparkData }: {
  value: number; label: string; icon: React.ReactNode; color: string; bg: string;
  change?: { val: string; up: boolean }; sparkData?: number[];
}) => (
  <div className="kpi-card card-hover animate-slide-up">
    <div className="kpi-header">
      <div className="kpi-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      {sparkData && <div style={{ width: 80, height: 32 }}><MiniChart data={sparkData} color={color} /></div>}
    </div>
    <div className="kpi-body">
      <div className="kpi-value" style={{ color: value > 0 && ['#EF4444', '#F59E0B'].includes(color) ? color : 'var(--color-text-primary)' }}>
        {value.toLocaleString('pt-BR')}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
    {change && (
      <div className={`kpi-change ${change.up ? 'up' : 'down'}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d={change.up ? 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18' : 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3'} />
        </svg>
        {change.val} vs mês anterior
      </div>
    )}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Registrada'];
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

// ─── Criticidade Badge ────────────────────────────────────────
const CritBadge = ({ criticidade }: { criticidade?: string }) => {
  if (!criticidade) return null;
  const cfg = CRIT_CONFIG[criticidade] || CRIT_CONFIG['Observação'];
  return <span className={`badge ${cfg.cls}`}>{criticidade}</span>;
};

// ─── Icon Components ──────────────────────────────────────────
const Icon = {
  Alert: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Export: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  ),
  Dots: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  ),
};

// ─── Skeleton Loader ──────────────────────────────────────────
const TableSkeleton = () => (
  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 80, height: 16 }} />
        <div className="skeleton" style={{ flex: 2, height: 16 }} />
        <div className="skeleton" style={{ flex: 1, height: 16 }} />
        <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 90, height: 16 }} />
      </div>
    ))}
  </div>
);

// ─── Drawer (Detail Panel) ────────────────────────────────────
const DetailDrawer = ({ rnc, onClose, idx }: { rnc: RNC; onClose: () => void; idx: number }) => {
  const [activeTab, setActiveTab] = useState<'info'|'causa'|'plano'|'evidencias'|'timeline'>('info');

  const timelineSteps = [
    { label: 'Registrada',      done: true },
    { label: 'Investigação',    done: rnc.status !== 'Registrada' },
    { label: 'Análise da Causa',done: ['Em Ação','Ação Pendente','Concluída'].includes(rnc.status) },
    { label: 'Plano de Ação',   done: ['Em Ação','Concluída'].includes(rnc.status) },
    { label: 'Implementação',   done: rnc.status === 'Concluída' },
    { label: 'Verificação',     done: rnc.status === 'Concluída' },
    { label: 'Encerrada',       done: rnc.status === 'Concluída' },
  ];

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'info',       label: 'Detalhes' },
    { key: 'causa',      label: 'Causa Raiz' },
    { key: 'plano',      label: '5W2H' },
    { key: 'evidencias', label: 'Evidências' },
    { key: 'timeline',   label: 'Timeline' },
  ];

  const ncId = `NC-2026-${String(idx + 1).padStart(4, '0')}`;

  return (
    <div className="drawer animate-slide-up" style={{ width: 420, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      {/* Drawer Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4, color: 'var(--color-text-muted)', fontWeight: 600, border: '1px solid var(--color-border)' }}>
              {ncId}
            </span>
            <StatusBadge status={rnc.status} />
            {rnc.criticidade && <CritBadge criticidade={rnc.criticidade} />}
          </div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rnc.titulo}
          </h3>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
          <Icon.Close />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 1rem', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '0.625rem 0.75rem',
            fontSize: '0.8rem', fontWeight: 600,
            color: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: `2px solid ${activeTab === t.key ? 'var(--color-primary)' : 'transparent'}`,
            background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer', white_space: 'nowrap', transition: 'all 0.15s',
            whiteSpace: 'nowrap'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }} className="custom-scrollbar">

        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {rnc.descricao}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {[
                { label: 'Tipo',            value: rnc.tipo || 'Não Conformidade' },
                { label: 'Setor',           value: rnc.setor || '—' },
                { label: 'Origem',          value: rnc.origem },
                { label: 'Responsável',     value: rnc.responsavelAcao || '—' },
                { label: 'Identificado em', value: fmtDate(rnc.dataRegistro) },
                { label: 'Por',             value: rnc.criadoPor || '—' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{f.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'causa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Selecione a metodologia de análise de causa raiz:</p>
            {[
              { name: 'Diagrama de Ishikawa', desc: 'Causa e Efeito — 6M', color: '#7C3AED', emoji: '⚗️' },
              { name: '5 Porquês', desc: 'Análise sequencial de causas', color: '#C2410C', emoji: '❓' },
              { name: 'FMEA', desc: 'Análise de Risco e Modos de Falha', color: '#1D4ED8', emoji: '🔬' },
              { name: 'Brainstorming', desc: 'Sessão colaborativa de causas', color: '#166534', emoji: '💡' },
            ].map(m => (
              <button key={m.name} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'white', cursor: 'pointer',
                textAlign: 'left', width: '100%', transition: 'all 0.15s'
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = m.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}><Icon.ChevronRight /></span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'plano' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Plano de ação estruturado no método 5W2H:</p>
            {[
              { key: 'What',  label: 'O Quê?',   placeholder: 'O que será feito?' },
              { key: 'Why',   label: 'Por Quê?', placeholder: 'Qual o motivo?' },
              { key: 'Where', label: 'Onde?',    placeholder: 'Onde será realizado?' },
              { key: 'Who',   label: 'Quem?',    placeholder: 'Quem é responsável?' },
              { key: 'When',  label: 'Quando?',  placeholder: 'Qual o prazo?' },
              { key: 'How',   label: 'Como?',    placeholder: 'Como será executado?' },
              { key: 'HowMuch', label: 'Quanto?',placeholder: 'Qual o custo estimado?' },
            ].map(f => (
              <div key={f.key}>
                <label className="input-label" style={{ fontSize: '0.7rem' }}>{f.label}</label>
                <input className="input-field" placeholder={f.placeholder} style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }} />
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Salvar Plano de Ação</button>
          </div>
        )}

        {activeTab === 'evidencias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
              padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
              background: 'var(--color-surface-2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📎</div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Arraste ou clique para anexar</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>PDF, imagens, documentos (max 20MB)</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Nenhuma evidência anexada ainda.</div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timelineSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.875rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: step.done ? 'var(--color-primary)' : 'var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {step.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                    )}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: step.done ? 'var(--color-primary)' : 'var(--color-border)', margin: '2px 0', minHeight: 24 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < timelineSteps.length - 1 ? '1rem' : 0, paddingTop: '2px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: step.done ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    {step.label}
                  </div>
                  {step.done && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                      {fmtDate(rnc.dataRegistro)} · {rnc.criadoPor || 'Sistema'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.625rem' }}>
        <button className="btn btn-primary" style={{ flex: 1 }}>Editar</button>
        <button className="btn btn-secondary">Histórico</button>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function NaoConformidadesPage() {
  const [rncs, setRncs] = useState<RNC[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRnc, setSelectedRnc] = useState<RNC | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [view, setView] = useState<'table'|'kanban'|'analytics'>('table');
  const [busca, setBusca] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCrit, setFilterCrit] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [sortCol, setSortCol] = useState<'dataRegistro'|'titulo'|'criticidade'>('dataRegistro');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('Auditoria Interna');
  const [tipo, setTipo] = useState('Não Conformidade');
  const [setor, setSetor] = useState('');
  const [criticidade, setCriticidade] = useState('Alta');

  useEffect(() => { carregarRncs(); }, []);

  const carregarRncs = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/api/nao-conformidades');
      if (res.ok) setRncs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI('/api/nao-conformidades', {
        method: 'POST',
        body: JSON.stringify({ titulo, descricao, origem, tipo, setor, criticidade })
      });
      if (res.ok) {
        setModalOpen(false); setTitulo(''); setDescricao(''); setSetor('');
        carregarRncs();
      }
    } catch { alert('Erro ao registrar.'); }
  };

  // Computed stats
  const stats = useMemo(() => ({
    total:     rncs.length,
    abertas:   rncs.filter(r => ['Registrada','Aberta'].includes(r.status)).length,
    emAnalise: rncs.filter(r => r.status === 'Em Análise').length,
    emAcao:    rncs.filter(r => ['Ação Pendente','Em Ação'].includes(r.status)).length,
    concluidas:rncs.filter(r => r.status === 'Concluída').length,
    criticas:  rncs.filter(r => r.criticidade === 'Alta').length,
  }), [rncs]);

  // Filtered & sorted data
  const filteredRncs = useMemo(() => {
    let data = [...rncs];
    if (busca) {
      const q = busca.toLowerCase();
      data = data.filter(r => r.titulo.toLowerCase().includes(q) || r.descricao?.toLowerCase().includes(q));
    }
    if (filterStatus) data = data.filter(r => r.status === filterStatus);
    if (filterCrit)   data = data.filter(r => r.criticidade === filterCrit);
    if (filterSetor)  data = data.filter(r => r.setor?.toLowerCase().includes(filterSetor.toLowerCase()));
    data.sort((a, b) => {
      let va = (a as any)[sortCol] ?? '';
      let vb = (b as any)[sortCol] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [rncs, busca, filterStatus, filterCrit, filterSetor, sortCol, sortDir]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
      style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.3 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={sortDir === 'asc' && sortCol === col ? 'M4.5 10.5L12 3l7.5 7.5' : 'M19.5 13.5L12 21l-7.5-7.5'} />
    </svg>
  );

  // Sparkline mock data
  const sparkData = [4, 6, 3, 8, 5, 9, 7, 11, 8, 12, 10, 14];

  // Chart data for analytics
  const monthlyData = [
    { mes: 'Jan', abertas: 4, fechadas: 2 }, { mes: 'Fev', abertas: 6, fechadas: 4 },
    { mes: 'Mar', abertas: 3, fechadas: 5 }, { mes: 'Abr', abertas: 8, fechadas: 3 },
    { mes: 'Mai', abertas: 5, fechadas: 7 }, { mes: 'Jun', abertas: 9, fechadas: 6 },
    { mes: 'Jul', abertas: stats.abertas, fechadas: stats.concluidas },
  ];

  const porCriticidade = [
    { name: 'Alta',       value: stats.criticas,                       fill: '#EF4444' },
    { name: 'Média',      value: rncs.filter(r=>r.criticidade==='Média').length, fill: '#F59E0B' },
    { name: 'Baixa',      value: rncs.filter(r=>r.criticidade==='Baixa').length, fill: '#22C55E' },
    { name: 'Observação', value: rncs.filter(r=>!r.criticidade || r.criticidade==='Observação').length, fill: '#94A3B8' },
  ].filter(d => d.value > 0);

  const porSetor = useMemo(() => {
    const counts: Record<string, number> = {};
    rncs.forEach(r => { const s = r.setor || 'Geral'; counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [rncs]);

  const hasFilters = busca || filterStatus || filterCrit || filterSetor;

  // Kanban columns
  const kanbanColumns = [
    { key: 'Registrada',    label: 'Registradas',    color: '#94A3B8' },
    { key: 'Em Análise',    label: 'Em Análise',     color: '#7C3AED' },
    { key: 'Ação Pendente', label: 'Plano de Ação',  color: '#C2410C' },
    { key: 'Concluída',     label: 'Concluídas',     color: '#166534' },
  ];

  const CHART_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>

      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #EF444420, #EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.025em', marginBottom: '0.125rem' }}>
              Não Conformidades
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: 480 }}>
              Gerencie, acompanhe e monitore todas as não conformidades identificadas no laboratório.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" style={{ gap: '0.375rem' }}>
            <Icon.Dashboard />
            Dashboard
          </button>
          <button className="btn btn-secondary btn-sm" style={{ gap: '0.375rem' }}>
            <Icon.Export />
            Exportar
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setModalOpen(true)}
            style={{ gap: '0.5rem' }}
          >
            <Icon.Plus />
            Nova Não Conformidade
          </button>
        </div>
      </div>

      {/* ─── KPI CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <KpiCard value={stats.total}      label="Total de Não Conformidades" color="#2563EB" bg="#EFF6FF"   change={{ val: '+7', up: false }} sparkData={sparkData}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        />
        <KpiCard value={stats.abertas}    label="Abertas" color="#F59E0B" bg="#FFFBEB" change={{ val: '+3', up: false }} sparkData={[2,4,3,5,4,6,5]}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard value={stats.emAnalise}  label="Em Análise" color="#7C3AED" bg="#F5F3FF" sparkData={[1,3,2,4,3,2,4]}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
        />
        <KpiCard value={stats.emAcao}     label="Em Ação" color="#0EA5E9" bg="#F0F9FF" sparkData={[3,2,4,3,5,4,6]}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>}
        />
        <KpiCard value={stats.concluidas} label="Concluídas" color="#22C55E" bg="#F0FDF4" change={{ val: '+12%', up: true }} sparkData={[2,3,5,4,7,6,8]}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard value={stats.criticas}   label="NC Críticas" color="#EF4444" bg="#FEF2F2" sparkData={[3,4,2,5,4,3,5]}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* ─── FILTER BAR ─── */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
              <Icon.Search />
            </span>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Buscar por título, descrição..."
            />
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 160 }}>
            <option value="">Todas as Situações</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          {/* Criticidade filter */}
          <select value={filterCrit} onChange={e => setFilterCrit(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 140 }}>
            <option value="">Todas as Criticidades</option>
            {['Alta', 'Média', 'Baixa', 'Observação'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Setor filter */}
          <input value={filterSetor} onChange={e => setFilterSetor(e.target.value)} className="input-field" placeholder="Filtrar por setor..." style={{ width: 160 }} />

          {/* View switcher */}
          <div style={{ display: 'flex', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
            {([['table','Tabela'],['kanban','Kanban'],['analytics','Análises']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 600,
                background: view === v ? 'var(--color-primary)' : 'white',
                color: view === v ? 'white' : 'var(--color-text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s'
              }}>{label}</button>
            ))}
          </div>

          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setBusca(''); setFilterStatus(''); setFilterCrit(''); setFilterSetor(''); }} style={{ color: 'var(--color-danger)', whiteSpace: 'nowrap' }}>
              Limpar filtros
            </button>
          )}
        </div>

        {hasFilters && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{filteredRncs.length} resultado(s):</span>
            {busca       && <span className="chip active" style={{ fontSize: '0.75rem' }}>"{busca}" <button onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2, color: 'inherit' }}>×</button></span>}
            {filterStatus && <span className="chip active" style={{ fontSize: '0.75rem' }}>{filterStatus} <button onClick={() => setFilterStatus('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2, color: 'inherit' }}>×</button></span>}
            {filterCrit   && <span className="chip active" style={{ fontSize: '0.75rem' }}>{filterCrit} <button onClick={() => setFilterCrit('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2, color: 'inherit' }}>×</button></span>}
          </div>
        )}
      </div>

      {/* ─── TABLE VIEW ─── */}
      {view === 'table' && (
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', minHeight: 0 }}>
          {/* Table Card */}
          <div className="card" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>ID</th>
                    <th onClick={() => toggleSort('titulo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      TÍTULO <SortIcon col="titulo" />
                    </th>
                    <th>TIPO</th>
                    <th>SETOR</th>
                    <th style={{ textAlign: 'center' }}>SITUAÇÃO</th>
                    <th onClick={() => toggleSort('criticidade')} style={{ cursor: 'pointer', textAlign: 'center', userSelect: 'none' }}>
                      CRITICIDADE <SortIcon col="criticidade" />
                    </th>
                    <th onClick={() => toggleSort('dataRegistro')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      DATA <SortIcon col="dataRegistro" />
                    </th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8}><TableSkeleton /></td></tr>
                  ) : filteredRncs.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                          <div style={{ fontWeight: 600 }}>Nenhuma não conformidade encontrada</div>
                          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Tente ajustar os filtros ou registre uma nova NC.</div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRncs.map((rnc, i) => (
                    <tr
                      key={rnc.id}
                      onClick={() => { setSelectedRnc(rnc); setSelectedIdx(i); }}
                      className={selectedRnc?.id === rnc.id ? 'selected' : ''}
                    >
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4, color: 'var(--color-text-muted)', fontWeight: 600, border: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                          NC-{String(filteredRncs.length - i).padStart(4, '0')}
                        </span>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rnc.titulo}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{rnc.descricao}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>{rnc.tipo || 'NC'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{rnc.setor || 'Geral'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}><StatusBadge status={rnc.status} /></td>
                      <td style={{ textAlign: 'center' }}><CritBadge criticidade={rnc.criticidade} /></td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{fmtDate(rnc.dataRegistro)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{fmtRelative(rnc.dataRegistro)}</div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }}>
                          <Icon.Dots />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Exibindo <strong>{filteredRncs.length}</strong> de <strong>{rncs.length}</strong> registros
              </span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {[1].map(p => (
                  <button key={p} style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)', color: 'white',
                    border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                  }}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer */}
          {selectedRnc && (
            <DetailDrawer rnc={selectedRnc} onClose={() => setSelectedRnc(null)} idx={selectedIdx} />
          )}
        </div>
      )}

      {/* ─── KANBAN VIEW ─── */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kanbanColumns.length}, 1fr)`, gap: '1rem' }}>
          {kanbanColumns.map(col => {
            const colRncs = rncs.filter(r => r.status === col.key || (col.key === 'Ação Pendente' && r.status === 'Em Ação'));
            return (
              <div key={col.key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--color-text-primary)' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.7rem', padding: '1px 6px', borderRadius: 20 }}>{colRncs.length}</span>
                </div>
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', minHeight: 200 }}>
                  {colRncs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Nenhuma NC</div>
                  ) : colRncs.map(r => (
                    <div key={r.id} className="card-hover" style={{
                      background: 'white', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', padding: '0.875rem',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }} onClick={() => { setSelectedRnc(r); setView('table'); }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem', lineHeight: 1.35 }}>{r.titulo}</div>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <CritBadge criticidade={r.criticidade} />
                        {r.setor && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{r.setor}</span>}
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{fmtDate(r.dataRegistro)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ANALYTICS VIEW ─── */}
      {view === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Row 1: Area + Donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>Evolução Mensal</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>NC abertas vs fechadas nos últimos 7 meses</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="abertas" name="Abertas" stroke="#EF4444" strokeWidth={2} fill="url(#ga)" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="fechadas" name="Fechadas" stroke="#22C55E" strokeWidth={2} fill="url(#gf)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>Por Criticidade</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Distribuição das NCs registradas</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={porCriticidade.length > 0 ? porCriticidade : [{ name:'Nenhum', value:1, fill:'#E2E8F0' }]}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {(porCriticidade.length > 0 ? porCriticidade : [{ fill: '#E2E8F0' }]).map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {porCriticidade.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.fill, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Bar por setor + Causa */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>NC por Setor</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Top 6 setores com mais ocorrências</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porSetor.length > 0 ? porSetor : [{ name: 'Geral', value: 0 }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Bar dataKey="value" name="NCs" fill="#2563EB" radius={[0, 4, 4, 0]}>
                    {porSetor.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>Metodologias de Causa</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Ferramentas de análise utilizadas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { name: 'Diagrama Ishikawa', pct: 48, count: 12, color: '#7C3AED', emoji: '⚗️' },
                  { name: '5 Porquês',         pct: 32, count: 8,  color: '#C2410C', emoji: '❓' },
                  { name: 'FMEA',              pct: 12, count: 3,  color: '#1D4ED8', emoji: '🔬' },
                  { name: 'Outros',            pct: 8,  count: 2,  color: '#166534', emoji: '💡' },
                ].map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{m.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.color }}>{m.count} ({m.pct}%)</span>
                      </div>
                      <div style={{ background: 'var(--color-surface-2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box animate-slide-up">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="modal-title">Registrar Não Conformidade</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}><Icon.Close /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div>
                  <label className="input-label">Título <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input required value={titulo} onChange={e => setTitulo(e.target.value)} className="input-field" placeholder="Descreva brevemente o problema..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className="input-label">Tipo</label>
                    <select value={tipo} onChange={e => setTipo(e.target.value)} className="input-field">
                      <option value="Não Conformidade">Não Conformidade</option>
                      <option value="Desvio">Desvio</option>
                      <option value="Observação">Observação</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Criticidade</label>
                    <select value={criticidade} onChange={e => setCriticidade(e.target.value)} className="input-field">
                      <option value="Alta">🔴 Alta</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Observação">⚪ Observação</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className="input-label">Setor <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input required value={setor} onChange={e => setSetor(e.target.value)} className="input-field" placeholder="Ex: Hematologia" />
                  </div>
                  <div>
                    <label className="input-label">Origem</label>
                    <select value={origem} onChange={e => setOrigem(e.target.value)} className="input-field">
                      <option value="Auditoria Interna">Auditoria Interna</option>
                      <option value="Auditoria Externa">Auditoria Externa</option>
                      <option value="Reclamação de Cliente">Reclamação de Cliente</option>
                      <option value="Controle de Qualidade">Controle de Qualidade</option>
                      <option value="Monitoramento">Monitoramento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Descrição Completa <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <textarea
                    required value={descricao} onChange={e => setDescricao(e.target.value)}
                    className="input-field" rows={4}
                    placeholder="Descreva detalhadamente o problema, quando ocorreu, o que foi observado..."
                    style={{ resize: 'vertical', minHeight: 100 }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar NC</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
