const fs = require('fs');
const files = [
  'src/app/arquivo-morto/page.tsx',
  'src/app/setores/page.tsx',
  'src/app/categorias/page.tsx',
  'src/app/devolvidos/page.tsx',
  'src/app/lista-mestra/page.tsx',
  'src/app/aprovacoes/page.tsx',
  'src/app/elaboracao/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const button = `    <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>← Voltar ao Dashboard</button>\n`;
  content = content.replace(/(<div className="animate-fade-in">)/, "$1\n" + button);
  fs.writeFileSync(f, content, 'utf8');
});
console.log("Done");
