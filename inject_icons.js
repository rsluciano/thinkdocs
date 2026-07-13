const fs = require('fs');
let content = fs.readFileSync('src/app/setores/page.tsx', 'utf8');

const ICONES_SETORES = `
const ICONES_SETORES: Record<string, string> = {
  "Recepção e Atendimento": "🤝",
  "Coleta": "💉",
  "Triagem": "🔀",
  "Bioquímica": "🧪",
  "Hematologia": "🩸",
  "Imunologia": "🛡️",
  "Microbiologia": "🧫",
  "Urinálise": "💧",
  "Parasitologia": "🐛",
  "Qualidade": "⭐",
  "Faturamento": "💰",
  "TI e Infraestrutura": "💻",
  "Área Técnica": "⚙️",
  "Administrativo": "📁",
  "Diretoria": "👔",
  "Limpeza": "🧹",
  "Geral": "🏢"
};
`;

content = content.replace(/(const TODOS_SETORES = \[[\s\S]*?\];)/, "$1\n" + ICONES_SETORES);
content = content.replace(/<div style=\{\{ fontSize: '2\.5rem' \}\}>🏢<\/div>/g, `<div style={{ fontSize: '2.5rem' }}>{ICONES_SETORES[setor.name] || '🏢'}</div>`);
content = content.replace(/🏢 Documentos em: \{selectedFolder\}/g, `{ICONES_SETORES[selectedFolder] || '🏢'} Documentos em: {selectedFolder}`);

fs.writeFileSync('src/app/setores/page.tsx', content, 'utf8');
console.log("Applied icons!");
