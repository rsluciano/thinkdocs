"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { CompanyLogo, HeaderClient, SidebarNav } from "./ClientLayoutElements";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/cadastro' || pathname === '/recuperar-senha';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <CompanyLogo />
        </div>
        <SidebarNav />
      </aside>
      <main className="main-content">
        <header className="topbar">
          <HeaderClient />
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
