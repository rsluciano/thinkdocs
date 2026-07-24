"use client";

import React, { useEffect, useState } from 'react';

export function CompanyLogo() {
  return <img src="/thinkdocs.png" alt="ThinkDocs Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px', objectFit: 'contain' }} />;
}

// ──────────────────────────────────────────────
// Premium Header v2
// ──────────────────────────────────────────────
export function HeaderClient() {
  const [userName, setUserName] = useState('...');
  const [userRole, setUserRole] = useState('Usuário');
  const [empresaName, setEmpresaName] = useState('ThinkDocs');
  const [userObj, setUserObj] = useState<any>(null);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  const fetchNotificacoes = async () => {
    try {
      const userStr = localStorage.getItem('thinkdocs_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const res = await fetch('/api/notificacoes', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) setNotificacoes(await res.json());
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserObj(user);
      setUserName(user.nome || user.funcao || 'Usuário');
      setUserRole(user.funcao || 'Colaborador');
      if (user.empresaNome) setEmpresaName(user.empresaNome);
      fetchNotificacoes();
      const interval = setInterval(fetchNotificacoes, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleMarcarLida = async (id: string, linkUrl?: string) => {
    if (!userObj) return;
    try {
      await fetch(`/api/notificacoes/${id}/ler`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userObj.token}` }
      });
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      if (linkUrl) window.location.href = linkUrl;
    } catch (e) { console.error(e); }
  };

  const handleMarcarTodasLidas = async () => {
    if (!userObj) return;
    try {
      await fetch('/api/notificacoes/ler-todas', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userObj.token}` }
      });
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (e) { console.error(e); }
  };

  const handleSwitchEmpresa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEmpresaId = e.target.value;
    if (userObj?.empresasPermitidas) {
      const novaEmpresa = userObj.empresasPermitidas.find((emp: any) => emp.id === newEmpresaId);
      if (novaEmpresa) {
        userObj.empresaId = novaEmpresa.id;
        userObj.empresaNome = novaEmpresa.nome;
        userObj.empresaLogo = novaEmpresa.logoUrl || '';
        localStorage.setItem('thinkdocs_user', JSON.stringify(userObj));
        window.location.reload();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('thinkdocs_user');
    window.location.href = '/login';
  };

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  // Build breadcrumb from path
  const buildBreadcrumb = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const labels: Record<string, string> = {
      'nao-conformidades': 'Não Conformidades',
      'vigilancia': 'Vigilância Sanitária',
      'dashboard': 'Dashboard',
      'matriz': 'Matriz RDC',
      'lista-mestra': 'Lista Mestra',
      'elaboracao': 'Elaboração',
      'aprovacoes': 'Aprovações',
      'relatorios': 'Relatórios',
      'usuarios': 'Usuários',
      'setores': 'Setores',
      'empresas': 'Laboratórios',
      'arquivo-morto': 'Arquivo Morto',
      'categorias': 'Categorias',
      'plano-acao': 'Plano de Ação',
    };
    return parts.map(p => labels[p] || p);
  };

  const breadcrumbs = buildBreadcrumb();
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
      
      {/* Breadcrumb */}
      <div className="topbar-breadcrumb">
        <a href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Início</a>
        {breadcrumbs.map((bc, i) => (
          <React.Fragment key={i}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-border)', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span style={i === breadcrumbs.length - 1 ? { color: 'var(--color-text-primary)', fontWeight: 600 } : { color: 'var(--color-text-muted)' }}>
              {bc}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Global Search */}
      <div className="topbar-search">
        <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input placeholder="Pesquisar..." type="text" />
      </div>

      <div className="topbar-actions">
        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotificacoes(!showNotificacoes)}
            data-tooltip="Notificações"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && <span className="notif-badge" />}
          </button>

          {showNotificacoes && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000, maxHeight: 420, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              animation: 'slideUp 0.2s ease'
            }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notificações</div>
                  {unreadCount > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{unreadCount} não lidas</div>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarcarTodasLidas} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    Marcar todas lidas
                  </button>
                )}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notificacoes.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Nenhuma notificação
                  </div>
                ) : notificacoes.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarcarLida(notif.id, notif.linkUrl)}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: notif.lida ? 'white' : '#EFF6FF',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{notif.titulo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{notif.mensagem}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empresa selector / User info */}
        {userObj?.empresasPermitidas && userObj.empresasPermitidas.length > 1 ? (
          <select
            value={userObj.empresaId}
            onChange={handleSwitchEmpresa}
            style={{
              padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)', fontSize: '0.8rem',
              fontWeight: 600, color: 'var(--color-primary)', background: 'white',
              outline: 'none', cursor: 'pointer'
            }}
          >
            {userObj.empresasPermitidas.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            🔬 {empresaName}
          </div>
        )}

        {/* User Avatar */}
        <div className="topbar-user" onClick={handleLogout} title="Clique para sair">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Sidebar v2 — Premium Dark Navigation
// ──────────────────────────────────────────────
export function SidebarNav() {
  const [user, setUser] = useState<any>(null);
  const [pathname, setPathname] = useState('');
  const [vigilanciaOpen, setVigilanciaOpen] = useState(false);

  useEffect(() => {
    const p = window.location.pathname;
    setPathname(p);
    setVigilanciaOpen(p.startsWith('/vigilancia'));
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  if (!user) return null;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const isLeadership = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico', 'Líder de Setor'].includes(user.funcao);
  const isAdmin = ['Diretor', 'Gestor da Qualidade', 'Administrador'].includes(user.funcao);

  const NavItem = ({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: number }) => (
    <a
      href={href}
      className={`nav-item${isActive(href) ? ' active' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="nav-badge">{badge > 9 ? '9+' : badge}</span>
      )}
    </a>
  );

  const ChevronDown = ({ open }: { open: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', color: 'var(--sidebar-fg)', flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <nav className="sidebar-nav">

      {/* — Dashboard — */}
      <div className="sidebar-category">Principal</div>
      <NavItem href="/" label="Dashboard" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      } />

      {/* — Gestão da Qualidade — */}
      <div className="sidebar-category" style={{ marginTop: '0.5rem' }}>Gestão da Qualidade</div>

      {isAdmin && (
        <NavItem href="/nao-conformidades" label="Não Conformidades" badge={3} icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        } />
      )}

      {isAdmin && (
        <NavItem href="/vigilancia/dashboard" label="Vigilância Sanitária" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        } />
      )}

      {isLeadership && (
        <NavItem href="/relatorios" label="Relatórios" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        } />
      )}

      {/* — Documentação — */}
      <div className="sidebar-divider" />
      <div className="sidebar-category">Documentação</div>

      <NavItem href="/lista-mestra" label="Lista Mestra" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      } />

      {isLeadership && (
        <NavItem href="/elaboracao" label="Elaboração" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        } />
      )}

      {isAdmin && (
        <NavItem href="/aprovacoes" label="Aprovações" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
      )}

      {isLeadership && (
        <NavItem href="/devolvidos" label="Devolvidos" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        } />
      )}

      <NavItem href="/categorias" label="Categorias" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      } />

      <NavItem href="/arquivo-morto" label="Arquivo Morto" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      } />

      {/* — Configurações — */}
      {isAdmin && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-category">Configurações</div>
          <NavItem href="/usuarios" label="Usuários" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          } />
          <NavItem href="/setores" label="Setores" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          } />
          <NavItem href="/empresas" label="Meus Laboratórios" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.359 2.798H4.157c-1.388 0-2.358-1.798-1.359-2.798L4.2 15.3" />
            </svg>
          } />
        </>
      )}

      {/* Footer branding */}
      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 500 }}>Sistema ativo</span>
          <span style={{ fontSize: '0.65rem', color: '#334155', marginLeft: 'auto' }}>v2.0</span>
        </div>
      </div>
    </nav>
  );
}
