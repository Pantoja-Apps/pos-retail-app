const fs = require('fs');

const files = [
  'src/services/dbService.js',
  'src/components/CreditosModal.jsx',
  'src/App.jsx'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openParens = (content.match(/\(/g) \vert{}\vert{} []).length;     const closeParens = (content.match(/\)/g) || []).length;
    
    console.log(`\nVerificando ${file}:`);
    console.log(`Llaves: { = ${openBraces}, } = ${closeBraces} -> ${openBraces === closeBraces ? 'OK' : 'ERROR'}`);
    console.log(`Paréntesis: ( = ${openParens}, ) = ${closeParens} -> ${openParens === closeParens ? 'OK' : 'ERROR'}`);
  } catch (err) {
    console.error(`Error al leer ${file}:`, err.message);
  }
});
