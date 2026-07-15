"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CompanyLogo, HeaderClient, SidebarNav } from "./ClientLayoutElements";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      let url = '';
      if (typeof input === 'string') url = input;
      else if (input instanceof URL) url = input.toString();
      else if (input instanceof Request) url = input.url;

      if (url.includes('/api/') && !url.includes('/api/auth/')) {
        const token = localStorage.getItem('thinkdocs_token');
        if (token) {
          init = init || {};
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      }
      
      const response = await originalFetch(input, init);
      
      if (response.status === 401 && url.includes('/api/') && !url.includes('/api/auth/')) {
        localStorage.removeItem('thinkdocs_token');
        localStorage.removeItem('thinkdocs_user');
        window.location.href = '/login';
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

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
