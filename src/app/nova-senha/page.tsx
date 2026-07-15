"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function NovaSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token inválido ou ausente. Por favor, solicite a recuperação de senha novamente.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (senha !== confirmarSenha) {
      setError('As senhas digitadas não coincidem.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetchAPI('/api/auth/nova-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha: senha })
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Senha redefinida com sucesso! Redirecionando para o login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Erro ao redefinir a senha.');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        
        <Image src="/thinkdocs.png" alt="ThinkDocs Logo" width={180} height={60} style={{ objectFit: 'contain' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#334155', textAlign: 'center' }}>
          Criar Nova Senha
        </h2>

        {success ? (
          <div style={{ width: '100%', padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
            ✅ {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showSenha ? "text" : "password"} 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a nova senha" 
                required 
                disabled={!token}
                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: 'var(--muted)'
                }}
                title={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showSenha ? "text" : "password"} 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha" 
                required 
                disabled={!token}
                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            
            {error && <div style={{ color: 'red', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}

            <button 
              type="submit" 
              disabled={isSubmitting || !token}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold', 
                cursor: (isSubmitting || !token) ? 'not-allowed' : 'pointer' 
              }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function NovaSenha() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NovaSenhaContent />
    </Suspense>
  );
}
