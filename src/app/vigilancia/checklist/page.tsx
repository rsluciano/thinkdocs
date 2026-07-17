'use client';
import React from 'react';

export default function ChecklistPage() {
  return (
    <div className="card animate-fade-in">
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}>Checklist para Auditoria</h2>
      <p style={{ color: 'var(--muted)' }}>
        A versão simplificada para uso em campo (tablets/celulares) estará disponível aqui na próxima etapa.
      </p>
    </div>
  );
}
