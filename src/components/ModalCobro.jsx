import React, { useState, useEffect } from 'react';
import { X, Banknote, Smartphone, CreditCard, CheckCircle2, User } from 'lucide-react';

function normalizarDoc(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function ModalCobro({
  abierto, alCerrar, totalUSD, totalBS, tasaCambio, clienteActual, setClienteActual, clientes, guardarClienteEnDB, alFinalizarVenta
}) {
  const [valUSD, setValUSD] = useState('');
  const [valPM, setValPM] = useState('');
  const [valPunto, setValPunto] = useState('');
  const [esCredito, setEsCredito] = useState(false);

  useEffect(() => {
    if (abierto) {
      setValUSD('');
      setValPM('');
      setValPunto('');
      setEsCredito(false);
    }
  }, [abierto]);

  if (!abierto) return null;

  const tBS = parseFloat(totalBS) || 0;
  const tUSD = parseFloat(totalUSD) || 0;
  const tasa = parseFloat(tasaCambio) || 1;

  const nUSD = parseFloat(valUSD) || 0;
  const nPM = parseFloat(valPM) || 0;
  const nPunto = parseFloat(valPunto) || 0;

  const totalAbonadoBS = (nUSD * tasa) + nPM + nPunto;
  const balance = totalAbonadoBS - tBS;

  const faltaBS = balance < -0.01 ? Math.abs(balance) : 0;
  const faltaUSD = faltaBS > 0 ? (faltaBS / tasa) : 0;
  const vueltoBS = balance > 0.01 ? balance : 0;
  const vueltoUSD = vueltoBS > 0 ? (vueltoBS / tasa) : 0;

  const pagadoCompleto = totalAbonadoBS >= (tBS - 0.05);
  const puedeProcesar = esCredito ? (clienteActual.nombre && clienteActual.doc !== 'V-00000000') : pagadoCompleto;

  const clienteEnBase = clientes.find(c => {
    const cDoc = normalizarDoc(c.doc);
    const inDoc = normalizarDoc(clienteActual.doc);
    return cDoc === inDoc || (inDoc.length >= 6 && (cDoc.endsWith(inDoc) || inDoc.endsWith(cDoc)));
  });
  const saldoPrevio = clienteEnBase ? (clienteEnBase.saldoPendienteUSD || 0) : (clienteActual.saldoPendienteUSD || 0);

  const manejarCambioDoc = (docIngresado) => {
    const inLimpio = normalizarDoc(docIngresado);
    const encontrado = clientes.find(c => {
      const cLimpio = normalizarDoc(c.doc);
      return cLimpio === inLimpio || (inLimpio.length >= 6 && (cLimpio.endsWith(inLimpio) || inLimpio.endsWith(cLimpio)));
    });

    if (encontrado) {
      setClienteActual({ ...encontrado });
    } else {
      setClienteActual(prev => ({ ...prev, doc: docIngresado, saldoPendienteUSD: 0 }));
    }
  };

  const procesar = () => {
    if (!puedeProcesar) {
      if (esCredito && (!clienteActual.nombre || clienteActual.doc === 'V-00000000')) {
        alert('Para vender a crédito debes asignar una Cédula y Nombre al cliente.');
      }
      return;
    }
    if (clienteActual.doc && clienteActual.nombre && clienteActual.doc !== 'V-00000000') {
      guardarClienteEnDB(clienteActual);
    }
    alFinalizarVenta({
      totalUSD: tUSD.toFixed(2),
      totalBS: tBS.toFixed(2),
      tasa: tasa.toFixed(4),
      pagoUSD: nUSD.toFixed(2),
      pagoPM: nPM.toFixed(2),
      pagoPunto: nPunto.toFixed(2),
      vueltoBS: vueltoBS.toFixed(2),
      vueltoUSD: vueltoUSD.toFixed(2),
      esCredito: esCredito,
      saldoDeudaUSD: esCredito ? faltaUSD.toFixed(2) : '0.00',
      saldoDeudaBS: esCredito ? faltaBS.toFixed(2) : '0.00',
      cliente: clienteActual,
      fecha: new Date().toLocaleString('es-VE')
    });
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Procesar Venta</h2>
            <small style={{ color: '#666' }}>Tasa BCV: Bs. {tasa.toFixed(2)}</small>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}><X size={18} /></button>
        </div>

        <div style={styles.switchTabs}>
          <button type="button" onClick={() => setEsCredito(false)} style={{ ...styles.btnTab, backgroundColor: !esCredito ? '#0052cc' : '#f1f3f5', color: !esCredito ? '#fff' : '#444' }}>Contado</button>
          <button type="button" onClick={() => setEsCredito(true)} style={{ ...styles.btnTab, backgroundColor: esCredito ? '#e65100' : '#f1f3f5', color: esCredito ? '#fff' : '#444' }}>Crédito / Fiado</button>
        </div>

        <div style={styles.seccionCliente}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input type="text" placeholder="C.I. (ej: 24808845)" value={clienteActual.doc} onChange={(e) => manejarCambioDoc(e.target.value)} style={{ ...styles.inputCliente, width: '130px', fontWeight: 'bold' }} />
            <input type="text" placeholder="Nombre completo" value={clienteActual.nombre} onChange={(e) => setClienteActual(prev => ({ ...prev, nombre: e.target.value }))} style={{ ...styles.inputCliente, flex: 1 }} />
          </div>
          <input type="text" placeholder="Teléfono WhatsApp" value={clienteActual.telefono || ''} onChange={(e) => setClienteActual(prev => ({ ...prev, telefono: e.target.value }))} style={styles.inputCliente} />
          {saldoPrevio > 0 && (
            <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#c62828', fontWeight: 'bold' }}>⚠️ Deuda previa: ${saldoPrevio.toFixed(2)}</div>
          )}
        </div>

        <div style={styles.resumenTotal}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#555' }}>Total orden:</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0052cc' }}>Bs. {tBS.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#555' }}>En Divisa:</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>${tUSD.toFixed(2)}</div>
          </div>
        </div>

        <div style={styles.cuerpoPagos}>
          <div style={styles.grupoInput}>
            <label style={styles.label}><Banknote size={15} color="#28a745" /> Efectivo Divisa ($):</label>
            <input type="number" step="any" placeholder="0.00" value={valUSD} onChange={(e) => setValUSD(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.grupoInput}>
            <label style={styles.label}><Smartphone size={15} color="#0052cc" /> Pago Móvil (Bs):</label>
            <input type="number" step="any" placeholder="0.00" value={valPM} onChange={(e) => setValPM(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.grupoInput}>
            <label style={styles.label}><CreditCard size={15} color="#6f42c1" /> Punto (Bs):</label>
            <input type="number" step="any" placeholder="0.00" value={valPunto} onChange={(e) => setValPunto(e.target.value)} style={styles.input} />
          </div>
        </div>

        {esCredito ? (
          <div style={{ ...styles.panelEstado, backgroundColor: '#fff3e0', borderColor: '#ffe0b2' }}>
            <span style={{ fontSize: '0.78rem', color: '#e65100', fontWeight: 'bold' }}>QUEDARÁ DEBIENDO:</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#bf360c' }}>${faltaUSD.toFixed(2)} (Bs. {faltaBS.toFixed(2)})</div>
          </div>
        ) : (
          <div style={{ ...styles.panelEstado, backgroundColor: pagadoCompleto ? '#e8f5e9' : '#ffebee', borderColor: pagadoCompleto ? '#a5d6a7' : '#ffcdd2' }}>
            {pagadoCompleto ? (
              <div style={{ color: '#1b5e20', fontWeight: 'bold', fontSize: '0.85rem' }}>{vueltoBS > 0 ? `VUELTO: Bs. ${vueltoBS.toFixed(2)} ($${vueltoUSD.toFixed(2)})` : "PAGO EXACTO"}</div>
            ) : (
              <div style={{ color: '#b71c1c', fontWeight: 'bold', fontSize: '0.85rem' }}>FALTA: Bs. {faltaBS.toFixed(2)}</div>
            )}
          </div>
        )}

        <button type="button" onClick={procesar} disabled={!puedeProcesar} style={{ ...styles.btnFinalizar, backgroundColor: puedeProcesar ? (esCredito ? '#e65100' : '#28a745') : '#ccc', cursor: puedeProcesar ? 'pointer' : 'not-allowed' }}>
          <CheckCircle2 size={18} /> {esCredito ? 'Registrar Crédito' : 'Emitir Factura'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9998, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', maxHeight: '95vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  switchTabs: { display: 'flex', gap: '6px', marginBottom: '10px', background: '#f1f3f5', padding: '4px', borderRadius: '8px' },
  btnTab: { flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCerrar: { background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  seccionCliente: { backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #e2e8f0' },
  inputCliente: { width: '100%', boxSizing: 'border-box', padding: '7px 9px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.82rem', outline: 'none' },
  resumenTotal: { display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e9ecef' },
  cuerpoPagos: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' },
  grupoInput: { display: 'flex', flexDirection: 'column', gap: '2px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#444', display: 'flex', alignItems: 'center', gap: '4px' },
  input: { padding: '8px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', outline: 'none' },
  panelEstado: { padding: '8px', borderRadius: '8px', border: '1px solid', textAlign: 'center', marginBottom: '10px' },
  btnFinalizar: { width: '100%', padding: '10px', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
};
