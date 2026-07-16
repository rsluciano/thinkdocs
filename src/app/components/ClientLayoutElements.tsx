"use client";

import React, { useEffect, useState } from 'react';

export function CompanyLogo() {
  return <img src="/thinkdocs.png" alt="ThinkDocs Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px', objectFit: 'contain' }} />;
}

export function HeaderClient() {
  const [userName, setUserName] = useState('...');
  const [empresaName, setEmpresaName] = useState('ThinkDocs');

  const [userObj, setUserObj] = useState<any>(null);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);

  const fetchNotificacoes = async () => {
    try {
      const userStr = localStorage.getItem('thinkdocs_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const res = await fetch('/api/notificacoes', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotificacoes(data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserObj(user);
      setUserName(user.nome || user.funcao);
      if (user.empresaNome) {
        setEmpresaName(user.empresaNome);
      }
      fetchNotificacoes();
      const interval = setInterval(fetchNotificacoes, 30000); // Polling cada 30s
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
      await fetch(`/api/notificacoes/ler-todas`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userObj.token}` }
      });
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (e) { console.error(e); }
  };

  const handleSwitchEmpresa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEmpresaId = e.target.value;
    if (userObj && userObj.empresasPermitidas) {
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

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
      <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Laboratório:</span>
        {userObj?.empresasPermitidas && userObj.empresasPermitidas.length > 1 ? (
          <select 
            value={userObj.empresaId} 
            onChange={handleSwitchEmpresa}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}
          >
            {userObj.empresasPermitidas.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        ) : (
          <span>{empresaName}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* BELL ICON NOTIFICATIONS */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotificacoes(!showNotificacoes)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                backgroundColor: 'red', color: 'white', fontSize: '0.7rem',
                fontWeight: 'bold', borderRadius: '50%', padding: '0.1rem 0.35rem'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotificacoes && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
              width: '320px', backgroundColor: 'white', border: '1px solid var(--border)',
              borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 1000, maxHeight: '400px', overflowY: 'auto'
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarcarTodasLidas} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    Marcar lidas
                  </button>
                )}
              </div>
              {notificacoes.length === 0 ? (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>Nenhuma notificação.</div>
              ) : (
                notificacoes.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarcarLida(notif.id, notif.linkUrl)}
                    style={{ 
                      padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      backgroundColor: notif.lida ? 'white' : '#f0f9ff'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--foreground)' }}>{notif.titulo}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{notif.mensagem}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="user-profile">
          <span>{userName}</span>
          <div className="avatar">{userName.substring(0, 2).toUpperCase()}</div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '0.4rem 0.8rem', backgroundColor: '#fee2e2', color: '#dc2626', 
            border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) return null;

  const isLeadership = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico', 'Líder de Setor'].includes(user.funcao);

  return (
    <nav className="sidebar-nav">
      <a href="/" className="nav-item">📊 Dashboard</a>
      
      {/* Elaboração e Devolvidos visível apenas para liderança */}
      {isLeadership && (
        <a href="/elaboracao" className="nav-item">✍️ Elaboração (Rascunhos)</a>
      )}

      {['Diretor', 'Gestor da Qualidade', 'Administrador'].includes(user.funcao) && (
        <a href="/aprovacoes" className="nav-item">📥 Aprovações (Caixa de Entrada)</a>
      )}

      {isLeadership && (
        <a href="/devolvidos" className="nav-item">↩️ Devolvidos</a>
      )}

      <a href="/lista-mestra" className="nav-item">📑 Lista Mestra</a>

      <a href="/categorias" className="nav-item">📁 Categoria de Docs</a>

      <a href="/setores" className="nav-item">🏢 Setores</a>

      <a href="/arquivo-morto" className="nav-item">🗄️ Arquivo Morto (Histórico)</a>

      {isLeadership && (
        <a href="/relatorios" className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid var(--border)' }}>📈 Relatório de Leituras</a>
      )}
      
      {['Diretor', 'Gestor da Qualidade', 'Administrador'].includes(user.funcao) && (
        <a href="/vigilancia" className="nav-item">🛡️ Vigilância Sanitária</a>
      )}

      <a href="/pesquisar" className="nav-item">🔍 Pesquisar</a>

      {['Administrador', 'Diretor', 'Gestor da Qualidade'].includes(user.funcao) && (
        <>
          <a href="/usuarios" className="nav-item">👥 Gestão de Usuários</a>
          <a href="/configuracoes" className="nav-item">⚙️ Configurações</a>
          <a href="/empresas" className="nav-item">🔬 Meus Laboratórios</a>
        </>
      )}
    </nav>
  );
}
