const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Barra de cliente con predicción y alerta de deuda en el mostrador
const searchBarra = `<div style={styles.barraClienteMostrador}>`;
const newBarra = `<div style={{ ...styles.barraClienteMostrador, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, position: 'relative' }}>
          <User size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Cédula cliente..."
            value={clienteActual?.doc === 'V-00000000' ? '' : (clienteActual?.doc || '')}
            onChange={(e) => {
              const val = e.target.value;
              const clEncontrado = clientes.find(c => c.doc && c.doc.toLowerCase() === val.toLowerCase().trim());
              if (clEncontrado) {
                setClienteActual(clEncontrado);
              } else {
                setClienteActual(prev => ({ ...(prev || {}), doc: val, nombre: prev?.doc === val ? prev.nombre : 'Consumidor Final' }));
              }
            }}
            style={styles.inputDocMostrador}
          />
          {(() => {
            const deudor = clientes.find(c => c.doc && clienteActual?.doc && c.doc.toLowerCase() === clienteActual.doc.toLowerCase());
            const deuda = parseFloat(deudor?.saldoPendienteUSD || deudor?.saldoDeudor || 0);
            if (deuda > 0.01) {
              return (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                  <span>'⚠️ Debe: $' + deuda.toFixed(2)</span>
                </div>
              );
            }
            return null;
          })()}
        </div>
        <span style={{ ...styles.nombreClienteTag, color: clienteActual?.doc !== 'V-00000000' && clienteActual?.nombre !== 'Consumidor Final' ? '#0052cc' : '#64748b', fontWeight: 'bold' }}>
          {clienteActual?.nombre || 'Consumidor Final'}
        </span>
      </div>`;

if (code.includes(searchBarra)) {
  code = code.replace(searchBarra, newBarra);
  console.log('Barra de cliente en mostrador reemplazada con éxito.');
} else {
  console.log('No se encontró el texto exacto de styles.barraClienteMostrador.');
}

fs.writeFileSync('src/App.jsx', code, 'utf8');
