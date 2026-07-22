'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VigilanciaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  if (!user) return <p style={{ padding: '2rem' }}>Carregando...</p>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="animate-fade-in w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
