"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let finalLogoUrl = '';

      if (empresaLogo) {
        const formData = new FormData();
        formData.append('file', empresaLogo);
        formData.append('empresa', empresaNome);
        formData.append('categoria', 'Logos');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          finalLogoUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, empresaNome, empresaLogo: finalLogoUrl })
      });

      const data = await res.json();

      if (res.ok) {
        // Loga o usuário automaticamente
        localStorage.setItem('thinkdocs_user', JSON.stringify(data.usuario));
        localStorage.setItem('thinkdocs_token', data.token);
        window.location.href = '/'; // Força o reload para montar a Sidebar no Layout
      } else {
        setError(data.error || 'Falha ao realizar cadastro');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
        <h1 className="text-2xl font-bold text-center" style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
          Crie sua Conta Administrador
        </h1>
        
        <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--foreground)' }}>
          Como primeiro acesso, você será configurado como Administrador Mestre do ThinkDocs.
        </p>

        <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nome do Laboratório / Empresa</label>
            <input 
              type="text" 
              value={empresaNome}
              onChange={(e) => setEmpresaNome(e.target.value)}
              placeholder="Ex: LabMed, ThinkPlus..." 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Logo da Empresa (Opcional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setEmpresaLogo(e.target.files ? e.target.files[0] : null)}
              style={{ width: '100%', padding: '0.5rem', border: '1px dashed var(--primary)', borderRadius: '4px' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Anexe a imagem para personalizar seu sistema.</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nome do Gestor Responsável</label>
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Luciano..." 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>E-mail corporativo</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="luciano@thinkplus.com.br" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Senha de Acesso</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showSenha ? "text" : "password"} 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie uma senha forte" 
                required 
                minLength={6}
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
          </div>

          {error && <div style={{ color: 'red', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              padding: '0.75rem', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius)', 
              fontWeight: 'bold', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '1rem'
            }}
          >
            {isLoading ? 'Criando Conta...' : 'Cadastrar e Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Já possui uma conta? Faça Login.
          </Link>
        </div>
      </div>
    </div>
  );
}
