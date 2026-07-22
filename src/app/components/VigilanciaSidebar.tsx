"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Image from 'next/image';

export function ThinkPlusLogo() {
  return (
    <div className="flex flex-col items-center mb-6 px-4 pt-6">
      <div className="relative w-40 h-20">
        <Image 
          src="/think_vs_logo.jpg" 
          alt="Think V.S. Logo" 
          fill 
          style={{ objectFit: 'contain' }}
          className="rounded-xl"
        />
      </div>
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-2">Acreditação & Qualidade</span>
    </div>
  );
}

export function VigilanciaSidebarNav() {
  const pathname = usePathname() || '';
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) return null;

  const navItemClass = (path: string) => 
    `px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
      pathname === path 
        ? 'bg-[#2970ff] text-white shadow-md' 
        : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
    }`;

  const IconWrapper = ({ children, isActive }: { children: React.ReactNode, isActive: boolean }) => (
    <div className={`flex items-center justify-center w-5 h-5 ${isActive ? 'text-white' : 'text-[#94a3b8]'}`}>
      {children}
    </div>
  );

  return (
    <nav className="flex flex-col h-full pb-4 px-3 overflow-y-auto custom-scrollbar">
      {/* MENU PRINCIPAL */}
      <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3 mt-4 px-2">Menu Principal</div>
      
      <a href="/vigilancia/dashboard" className={navItemClass('/vigilancia/dashboard')}>
        <IconWrapper isActive={pathname === '/vigilancia/dashboard'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.92 8.921a.75.75 0 11-1.06 1.06l-1.39-1.39V21a.75.75 0 01-.75.75H13.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-8.56l-1.39 1.39a.75.75 0 01-1.06-1.06l8.92-8.92z" /></svg>
        </IconWrapper>
        Dashboard
      </a>
      
      <a href="/vigilancia/matriz" className={navItemClass('/vigilancia/matriz')}>
        <IconWrapper isActive={pathname === '/vigilancia/matriz'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
        </IconWrapper>
        Matriz RDC 978
      </a>

      <a href="/vigilancia/plano-acao" className={navItemClass('/vigilancia/plano-acao')}>
        <IconWrapper isActive={pathname === '/vigilancia/plano-acao'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
        </IconWrapper>
        Plano de Ação (5W2H)
      </a>

      <a href="/vigilancia/controle-documentos" className={navItemClass('/vigilancia/controle-documentos')}>
        <IconWrapper isActive={pathname === '/vigilancia/controle-documentos'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        </IconWrapper>
        Documentos
      </a>

      <a href="/vigilancia/checklist" className={navItemClass('/vigilancia/checklist')}>
        <IconWrapper isActive={pathname === '/vigilancia/checklist'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
        </IconWrapper>
        Checklist Auditoria
      </a>

      <a href="/vigilancia/painel-executivo" className={navItemClass('/vigilancia/painel-executivo')}>
        <IconWrapper isActive={pathname === '/vigilancia/painel-executivo'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        </IconWrapper>
        Painel Executivo
      </a>

      {/* GERENCIAMENTO */}
      <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3 mt-6 px-2 border-t border-white/5 pt-6">Gerenciamento</div>
      
      <a href="#" className="px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 text-[#94a3b8] hover:text-white hover:bg-white/5">
        <IconWrapper isActive={false}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
        </IconWrapper>
        Categorias
      </a>

      <a href="#" className="px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 text-[#94a3b8] hover:text-white hover:bg-white/5">
        <IconWrapper isActive={false}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </IconWrapper>
        Tipos de Serviço
      </a>

      <a href="#" className="px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 text-[#94a3b8] hover:text-white hover:bg-white/5">
        <IconWrapper isActive={false}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
        </IconWrapper>
        Usuários
      </a>

      <a href="#" className="px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 text-[#94a3b8] hover:text-white hover:bg-white/5">
        <IconWrapper isActive={false}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </IconWrapper>
        Configurações
      </a>

      {/* SUPORTE */}
      <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3 mt-6 px-2 border-t border-white/5 pt-6">Suporte</div>

      <a href="/vigilancia/suporte" className={navItemClass('/vigilancia/suporte')}>
        <IconWrapper isActive={pathname === '/vigilancia/suporte'}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
        </IconWrapper>
        Ajuda
      </a>

      <a href="#" className="px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 text-[#94a3b8] hover:text-white hover:bg-white/5">
        <IconWrapper isActive={false}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </IconWrapper>
        Tutorial
      </a>

      <a href="/vigilancia/suporte" className="px-4 py-3 mb-1 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 text-[#94a3b8] hover:text-white hover:bg-white/5">
        <IconWrapper isActive={false}>
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
        </IconWrapper>
        Suporte Técnico
      </a>

      <div className="mt-8 mb-4 px-2">
        <div className="bg-[#1e293b]/50 border border-white/10 p-4 rounded-xl">
          <h4 className="text-white font-bold text-sm mb-1">Plano Corporativo</h4>
          <p className="text-[#64748b] text-xs mb-3">Vencimento: 30/12/2025</p>
          <a href="#" className="text-[#3b82f6] text-xs font-semibold hover:text-[#60a5fa] transition-colors">Gerenciar Assinatura</a>
        </div>
      </div>

      <div className="mt-auto px-2 mb-4 pt-4 border-t border-white/5">
        <a 
          href="/" 
          className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-white/5 text-[#94a3b8] hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 transition-all"
        >
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Voltar ao ThinkDocs
        </a>
      </div>
    </nav>
  );
}
