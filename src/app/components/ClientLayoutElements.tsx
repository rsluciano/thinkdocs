"use client";

import React, { useEffect, useState } from 'react';

export function CompanyLogo() {
  const [logoUrl, setLogoUrl] = useState('/thinkdocs.png');
  
  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.empresaLogo && user.empresaLogo.trim() !== '') {
        setLogoUrl(user.empresaLogo);
      }
    }
  }, []);

  return <img src={logoUrl} alt="Company Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px', objectFit: 'contain' }} />;
}

export function HeaderClient() {
  const [userName, setUserName] = useState('...');
  const [empresaName, setEmpresaName] = useState('ThinkDocs');

  const [userObj, setUserObj] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserObj(user);
      setUserName(user.nome || user.funcao);
      if (user.empresaNome) {
        setEmpresaName(user.empresaNome);
      }
    }
  }, []);

  const handleSwitchEmpresa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEmpresaId = e.target.value;
    if (userObj && userObj.empresasPermitidas) {
      const novaEmpresa = userObj.empresasPermitidas.find((emp: any) => emp.id === newEmpresaId);
      if (novaEmpresa) {
        // Atualiza a sessão
        userObj.empresaId = novaEmpresa.id;
        userObj.empresaNome = novaEmpresa.nome;
        // Pega a logo da empresa se existir na api, ou mantém a anterior por enquanto
        // Idealmente a API que busca a lista deveria trazer a logo também, mas para o protótipo:
        userObj.empresaLogo = novaEmpresa.logoUrl || '/thinkdocs.png';
        localStorage.setItem('thinkdocs_user', JSON.stringify(userObj));
        window.location.reload(); // Recarrega para aplicar a todos os componentes
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('thinkdocs_user');
    window.location.href = '/login';
  };

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
        <div className="user-profile">
          <span>{userName}</span>
          <div className="avatar">{userName.substring(0, 2).toUpperCase()}</div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '0.4rem 0.8rem', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            fontSize: '0.85rem'
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
