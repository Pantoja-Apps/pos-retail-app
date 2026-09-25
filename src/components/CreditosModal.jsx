import React, { useState } from 'react';
import { ArrowLeft, Search, PlusCircle, CheckCircle2, X, Banknote, Smartphone, CreditCard, Share2 } from 'lucide-react';

function normalizarDoc(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function CreditosModal({ clientes, tasaCambio, alRegistrarAbono, alVolver }) {
  const [busqueda, setBusqueda] = useState('');
  const [clienteAbono, setClienteAbono] = useState(null);
  const [abonoUSD, setAbonoUSD] = useState('');
  const [abonoPM, setAbonoPM] = useState('');
  const [abonoPunto, setAbonoPunto] = useState('');
  const tasa = parseFloat(tasaCambio) || 1;

  // DEDUPLICACIÓN ESTRICTA: Agrupar por documento normalizado
  const clientesUnicosMap = new Map();
  clientes.forEach(c => {
    const docNorm = normalizarDoc(c.doc);
    if (!docNorm || docNorm === 'V00000000') return;

    if (clientesUnicosMap.has(docNorm)) {
      const existente = clientesUnicosMap.get(docNorm);
      existente.saldoPendienteUSD = Math.max(existente.saldoPendienteUSD || 0, c.saldoPendienteUSD || 0);
      if (!existente.telefono && c.telefono) existente.telefono = c.telefono;
    } else {
      clientesUnicosMap.set(docNorm, { ...c });
    }
  });

  const listaFiltrada = Array.from(clientesUnicosMap.values()).filter(c => {
    const coincideTexto = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.doc.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTexto && (parseFloat(c.saldoPendienteUSD) || 0) > 0.01;
  });

  const nUSD = parseFloat(abonoUSD) || 0;
  const nPM = parseFloat(abonoPM) || 0;
  const nPunto = parseFloat(abonoPunto) || 0;
  const totalAbonadoUSD = nUSD + (nPM / tasa) + (nPunto / tasa);

  const saldoActual = clienteAbono ? (parseFloat(clienteAbono.saldoPendienteUSD) || 0) : 0;
  const restanteUSD = Math.max(0, saldoActual - totalAbonadoUSD);

  const guardarAbono = () => {
    if (totalAbonadoUSD <= 0) return alert('Ingresa un monto válido para el abono.');
    
    alRegistrarAbono(clienteAbono, totalAbonadoUSD, {
      pagoUSD: nUSD.toFixed(2),
      pagoPM: nPM.toFixed(2),
      pagoPunto: nPunto.toFixed(2)
    });

    setClienteAbono(null);
    setAbonoUSD('');
    setAbonoPM('');
    setAbonoPunto('');
  };

  const compartirEstadoCuentaWhatsApp = (c) => {
    const sUSD = parseFloat(c.saldoPendienteUSD) || 0;
    const sBS = sUSD * tasa;
    let t = "*ESTADO DE CUENTA - COMERCIALIZADORA POS*\n";
    t += "--------------------------------\n";
    t += "Cliente: " + c.nombre + "\n";
    t += "Cédula:  " + c.doc + "\n";
    t += "Fecha:   " + new Date().toLocaleDateString('es-VE') + "\n";
    t += "--------------------------------\n";
    t += "*SALDO PENDIENTE ACTUAL:*\n";
    t += "• Divisas:   $" + sUSD.toFixed(2) + "\n";
    t += "• Bolívares: Bs. " + sBS.toFixed(2) + " (Tasa: " + tasa.toFixed(2) + ")\n";
    t += "--------------------------------\n";
    t += "Por favor realice su pago a la brevedad. Gracias por su preferencia.";

    const b = String.fromCharCode(96, 96, 96);
    const msg = b + "\n" + t + b;
    const tel = (c.telefono || '').replace(/[^0-9]/g, '');
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}><ArrowLeft color="#333" size={20} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Cuentas por Cobrar (Créditos)</h2>
            <small style={{ color: '#666', fontSize: '0.75rem' }}>{listaFiltrada.length} clientes con deuda activa</small>
          </div>
        </div>
      </header>

      <div style={styles.seccionBusqueda}>
        <div style={styles.inputWrapper}>
          <Search size={16} color="#666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Buscar por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBuscador}
          />
        </div>
      </div>

      <div style={styles.lista}>
        {listaFiltrada.length === 0 ? (
          <div style={styles.vacio}>
            <CheckCircle2 color="#28a745" size={44} />
            <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#555' }}>No hay deudas pendientes registradas.</p>
          </div>
        ) : (
          listaFiltrada.map(c => {
            const deudaUSD = parseFloat(c.saldoPendienteUSD) || 0;
            const deudaBS = deudaUSD * tasa;
            return (
              <div key={normalizarDoc(c.doc)} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#111' }}>{c.nombre}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>C.I: {c.doc} {c.telefono ? `· Telf: ${c.telefono}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#d32f2f' }}>${deudaUSD.toFixed(2)}</div>
                    <small style={{ fontSize: '0.72rem', color: '#666' }}>Bs. {deudaBS.toFixed(2)}</small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setClienteAbono(c); setAbonoUSD(''); setAbonoPM(''); setAbonoPunto(''); }}
                    style={{ ...styles.btnAccion, backgroundColor: '#0052cc', color: '#fff' }}
                  >
                    <PlusCircle size={15} /> Abonar
                  </button>
                  <button
                    type="button"
                    onClick={() => compartirEstadoCuentaWhatsApp(c)}
                    style={{ ...styles.btnAccion, backgroundColor: '#25d366', color: '#fff' }}
                  >
                    <Share2 size={15} /> WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {clienteAbono && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#111' }}>Registrar Abono</h3>
                <small style={{ color: '#666' }}>{clienteAbono.nombre} ({clienteAbono.doc})</small>
              </div>
              <button type="button" onClick={() => setClienteAbono(null)} style={styles.btnBack}><X size={18} /></button>
            </div>

            <div style={styles.panelSaldo}>
              <div><span style={{ fontSize: '0.75rem', color: '#555' }}>Deuda Total:</span><div style={{ fontWeight: 'bold', color: '#d32f2f' }}>${saldoActual.toFixed(2)}</div></div>
              <div style={{ textAlign: 'right' }}><span style={{ fontSize: '0.75rem', color: '#555' }}>Quedará:</span><div style={{ fontWeight: 'bold', color: restanteUSD === 0 ? '#28a745' : '#e65100' }}>${restanteUSD.toFixed(2)}</div></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
              <div>
                <label style={styles.label}><Banknote size={15} color="#28a745" /> Efectivo Divisas ($):</label>
                <input type="number" step="any" placeholder="0.00" value={abonoUSD} onChange={(e) => setAbonoUSD(e.target.value)} style={styles.inputModal} />
              </div>
              <div>
                <label style={styles.label}><Smartphone size={15} color="#0052cc" /> Pago Móvil (Bs):</label>
                <input type="number" step="any" placeholder="0.00" value={abonoPM} onChange={(e) => setAbonoPM(e.target.value)} style={styles.inputModal} />
              </div>
              <div>
                <label style={styles.label}><CreditCard size={15} color="#6f42c1" /> Punto de Venta (Bs):</label>
                <input type="number" step="any" placeholder="0.00" value={abonoPunto} onChange={(e) => setAbonoPunto(e.target.value)} style={styles.inputModal} />
              </div>
            </div>

            <button type="button" onClick={guardarAbono} style={styles.btnConfirmarAbono}>
              Confirmar Abono de ${totalAbonadoUSD.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e4e8' },
  btnBack: { background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  seccionBusqueda: { padding: '10px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e1e4e8' },
  inputWrapper: { position: 'relative' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.85rem', outline: 'none' },
  lista: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  card: { backgroundColor: '#fff', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  vacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%' },
  btnAccion: { flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' },
  modal: { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '340px', padding: '16px' },
  panelSaldo: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', marginTop: '6px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#444', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' },
  inputModal: { width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', outline: 'none' },
  btnConfirmarAbono: { width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer', marginTop: '4px' }
};
