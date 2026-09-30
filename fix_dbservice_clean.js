const fs = require('fs');
let code = fs.readFileSync('src/services/dbService.js', 'utf8');

// Eliminar cualquier cierre sobrante al final y colocar el export correcto
code = code.trim();
code = code.replace(/};\s*};\s*$/, '};\n\nexport default dbService;');
code = code.replace(/},\s*};\s*$/, '}\n};\n\nexport default dbService;');

if (!code.includes('export default dbService;')) {
  code = code.replace(/};\s*$/, '};\n\nexport default dbService;');
}

fs.writeFileSync('src/services/dbService.js', code, 'utf8');
console.log('dbService.js normalizado con exito.');
