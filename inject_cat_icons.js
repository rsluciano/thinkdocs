const fs = require('fs');
let content = fs.readFileSync('src/app/categorias/page.tsx', 'utf8');

const ICONES_CATEGORIAS = `
const ICONES_CATEGORIAS: Record<string, string> = {
  "Formulários": "📝",
  "Bulário": "💊",
  "FISPQs": "☣️",
  "Instruções de Trabalho de serviço": "📋",
  "Instruções de Trabalho de equipamento": "⚙️",
  "Instruções de Trabalho de exames": "🔬",
  "Manuais": "📖",
  "Documentos Mestres": "👑",
  "Procedimentos da Qualidade": "🛡️",
  "Listas": "🧾",
  "Geral": "📁"
};
`;

content = content.replace(/(export default function CategoriasPage\(\) \{)/, ICONES_CATEGORIAS + "\n$1");
content = content.replace(/<div style=\{\{ fontSize: '2\.5rem' \}\}>📁<\/div>/g, `<div style={{ fontSize: '2.5rem' }}>{ICONES_CATEGORIAS[cat.name] || '📁'}</div>`);
content = content.replace(/📂 Documentos em: \{selectedFolder\}/g, `{ICONES_CATEGORIAS[selectedFolder] || '📂'} Documentos em: {selectedFolder}`);

fs.writeFileSync('src/app/categorias/page.tsx', content, 'utf8');
console.log("Applied category icons!");
