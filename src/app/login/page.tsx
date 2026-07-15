"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetchAPI('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('thinkdocs_user', JSON.stringify(data.usuario));
        localStorage.setItem('thinkdocs_token', data.token);
        window.location.href = '/'; 
      } else {
        setError(data.error || 'Falha ao realizar login');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111315', // Fundo chumbo muito escuro igual ao da logo
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Efeitos visuais de luz no fundo - sutis e puxados pro dourado escuro */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(213,140,33,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(226,226,226,0.03) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Pássaro GIGANTE de fundo (usando a logo cortada visualmente pelo tamanho e opacidade) */}
      <img 
        src="/thinkdocs.png" 
        alt="" 
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-25%',
          width: '120vw',
          opacity: 0.03, // Muito sutil para parecer uma marca d'água no fundo chumbo
          transform: 'rotate(-10deg)',
          pointerEvents: 'none',
          objectFit: 'contain'
        }} 
      />

      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '3rem 2.5rem',
        background: 'rgba(25, 27, 30, 0.7)', // Fundo do card um pouco mais claro que o fundo
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        zIndex: 1,
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', width: '100%' }}>
          <img src="/thinkdocs.png" alt="ThinkDocs Logo" style={{ width: '100%', maxWidth: '280px', height: 'auto', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
        </div>
        
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#cbd5e1', fontSize: '0.9rem' }}>
              E-mail corporativo
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@thinkplus.com.br" 
              required 
              style={{ 
                width: '100%', 
                padding: '0.85rem 1rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                background: 'rgba(15, 23, 42, 0.6)',
                color: 'white',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontSize: '1rem'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '600', color: '#cbd5e1', fontSize: '0.9rem' }}>Senha</label>
              <a href="/recuperar-senha" style={{ fontSize: '0.85rem', color: '#d4af37', textDecoration: 'none', fontWeight: '500' }}>Esqueci a senha</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type={showSenha ? "text" : "password"} 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••" 
                required 
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1rem', 
                  paddingRight: '3rem', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#D58C21'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#64748b',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#D58C21'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                title={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%',
              padding: '0.85rem', 
              background: 'linear-gradient(to right, #C57A1E, #E8A941)', 
              color: '#111315', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              transition: 'transform 0.1s, box-shadow 0.2s',
              boxShadow: '0 4px 14px 0 rgba(213, 140, 33, 0.3)',
            }}
            onMouseOver={(e) => {
              if(!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(213, 140, 33, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if(!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(213, 140, 33, 0.3)';
              }
            }}
          >
            {isLoading ? 'Autenticando...' : 'Acessar o Sistema'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', width: '100%' }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#A8A8A8' }}>Ainda não tem uma conta? </span>
            <Link href="/cadastro" style={{ color: '#D58C21', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', transition: 'color 0.2s' }}>
              Cadastre sua Clínica
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
