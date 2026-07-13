"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RecuperarSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [simulatedLink, setSimulatedLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSimulatedLink('');

    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setSimulatedLink(data._simulatedEmailLink);
      } else {
        setError(data.error || 'Erro ao solicitar recuperação.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        
        <Image src="/thinkdocs.png" alt="ThinkDocs Logo" width={180} height={60} style={{ objectFit: 'contain' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#334155', textAlign: 'center' }}>
          Recuperação de Senha
        </h2>

        {!simulatedLink ? (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
              Digite seu e-mail cadastrado e enviaremos um link de segurança para você criar uma nova senha.
            </p>
            
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
            
            {error && <div style={{ color: 'red', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold', 
                cursor: isSubmitting ? 'not-allowed' : 'pointer' 
              }}
            >
              {isSubmitting ? 'Verificando...' : 'Enviar Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <a href="/login" style={{ fontSize: '0.9rem', color: '#64748b', textDecoration: 'underline' }}>Voltar para o Login</a>
            </div>
          </form>
        ) : (
          <div style={{ width: '100%', padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>E-mail enviado! (Simulação)</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Para continuar e redefinir sua senha, acesse o link seguro abaixo:</p>
            <a href={simulatedLink} style={{ color: '#2563eb', fontWeight: 'bold', wordBreak: 'break-all', display: 'block', marginBottom: '1rem' }}>
              {simulatedLink}
            </a>
            <button onClick={() => router.push('/login')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #166534', borderRadius: '4px', color: '#166534', fontWeight: 'bold' }}>
              Voltar ao Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
