import React, { useState } from 'react';
import { 
  Users, Search, DollarSign, ArrowUpRight, MessageCircle, 
  Calendar, CheckCircle, Clock, ChevronRight, X, AlertCircle
} from 'lucide-react';

export default function CreditosModal({ 
  clientes = [], 
  tasaCambio = 1, 
  transacciones = [], 
  onAbonar, 
  alCerrar 
}) {
  const [busqueda, setBusqueda] = useState('');
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [pestanaDetalle, setPestanaDetalle] = useState('compras');
  const [clienteAbonando, setClienteAbonando] = useState(null);

  const [pagoUSD, setPagoUSD] = useState('');
  const [pagoBsEfectivo, setPagoBsEfectivo] = useState('');
  const [pagoPM, setPagoPM] = useState('');
  const [pagoPunto, setPagoPunto] = useState('');

  const tasa = parseFloat(tasaCambio) || 1;

  // Reconstrucción infalible de clientes con deuda desde transacciones / ventas
  const mapaDeudas = new Map();
  const mapaNombres = new Map();
  const mapaTelefonos = new Map();

  const ventasArr = Array.isArray(transacciones) ? transacciones : [];
  ventasArr.forEach(v => {
    const esVtaCredito = Boolean(
      v.esCredito || 
      v.es_credito || 
      String(v.metodoPago || '').toLowerCase().includes('crédito') || 
      String(v.metodoPago || '').toLowerCase().includes('fiar')
    );
    if (esVtaCredito && v.cliente?.doc) {
      const doc = String(v.cliente.doc).trim();
      const monto = parseFloat(v.totalUSD ?? v.total_usd ?? 0) || 0;
      mapaDeudas.set(doc, (mapaDeudas.get(doc) || 0) + monto);
      if (v.cliente.nombre) mapaNombres.set(doc, v.cliente.nombre);
      if (v.cliente.telefono) mapaTelefonos.set(doc, v.cliente.telefono);
    }
  });

  const listaBase = (Array.isArray(clientes) ? clientes : []).map(c => {
    const doc = String(c.doc || '').trim();
    const deudaVentas = mapaDeudas.get(doc) || 0;
    const deudaDirecta = parseFloat(c.saldoPendienteUSD ?? c.saldoDeudor ?? c.saldo_deudor_usd ?? 0) || 0;
    const deudaFinal = Math.max(deudaVentas, deudaDirecta);
    mapaDeudas.delete(doc);
    return {
      ...c,
      saldoPendienteUSD: deudaFinal,
      saldoDeudor: deudaFinal
    };
  });

  mapaDeudas.forEach((monto, doc) => {
    if (monto > 0.009) {
      listaBase.push({
        id: 'cli_' + doc,
        doc: doc,
        nombre: mapaNombres.get(doc) || 'Cliente',
        telefono: mapaTelefonos.get(doc) || '',
        saldoPendienteUSD: monto,
        saldoDeudor: monto
      });
    }
  });

  const clientesConDeuda = listaBase.filter(c => (parseFloat(c.saldoPendienteUSD) || 0) > 0.009);
  const listaFiltrada = clientesConDeuda.filter(c =>
    (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.doc || '').includes(busqueda)
  );

  const totalPorCobrarUSD = clientesConDeuda.reduce((acc, c) => acc + (parseFloat(c.saldoPendienteUSD) || 0), 0);

  const abrirModalAbono = (cliente, e) => {
    if (e) e.stopPropagation();
    setClienteAbonando(cliente);
    setPagoUSD('');
    setPagoBsEfectivo('');
    setPagoPM('');
    setPagoPunto('');
  };

  const enviarRecordatorioWhatsApp = (cliente, e) => {
    if (e) e.stopPropagation();
    const deudaUSD = (parseFloat(cliente.saldoPendienteUSD) || 0).toFixed(2);
    const deudaBS = ((parseFloat(cliente.saldoPendienteUSD) || 0) * tasa).toFixed(2);

    let msg = `*RECORDATORIO DE PAGO PENDIENTE*\n`;
    msg += `Estimado(a) *${cliente.nombre}*,\n`;
    msg += `Le recordamos amablemente que mantiene un saldo pendiente en cuenta:\n`;
    msg += `--------------------------------\n`;
    msg += `Total a cancelar: *$${deudaUSD}* (Bs. ${deudaBS})\n`;
    msg += `Tasa del día: Bs. ${tasa.toFixed(2)}\n`;
    msg += `--------------------------------\n`;
    msg += `Agradecemos gestionar su abono o pago a la brevedad. ¡Gracias por su preferencia!`;

    const tel = (cliente.telefono || '').replace(/[^0-9]/g, '');
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const usd = parseFloat(pagoUSD) || 0;
  const bsEf = parseFloat(pagoBsEfectivo) || 0;
  const pm = parseFloat(pagoPM) || 0;
  const punto = parseFloat(pagoPunto) || 0;
  const totalAbonadoUSD = usd + ((bsEf + pm + punto) / tasa);

  const saldoActual = clienteAbonando ? (parseFloat(clienteAbonando.saldoPendienteUSD) || 0) : 0;
  const restante = Math.max(0, saldoActual - totalAbonadoUSD);

  const procesarAbono = (e) => {
    e.preventDefault();
    if (totalAbonadoUSD <= 0) return alert('Ingresa un monto válido para abonar.');
    if (onAbonar) {
      onAbonar(clienteAbonando, totalAbonadoUSD, {
        usd, bsEf, pm, punto, tasa
      });
    }
    setClienteAbonando(null);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#0052cc" />
            <div>
              <h2 style={styles.titulo}>Créditos y Cuentas por Cobrar</h2>
              <p style={styles.subtitulo}>Total Pendiente: ${totalPorCobrarUSD.toFixed(2)} (Bs. {(totalPorCobrarUSD * tasa).toFixed(2)})</p>
            </div>
          </div>
          <button onClick={alCerrar} style={styles.btnCerrar}>
            <X size={20} />
          </button>
        </div>

        {/* Buscador */}
        <div style={styles.searchBox}>
          <Search size={16} color="#64748b" style={{ marginLeft: '10px' }} />
          <input
            type="text"
            placeholder="Buscar deudor por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Lista */}
        <div style={styles.lista}>
          {listaFiltrada.length === 0 ? (
            <div style={styles.vacio}>
              <CheckCircle color="#22c55e" size={48} />
              <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#64748b' }}>No hay cuentas pendientes por cobrar.</p>
            </div>
          ) : (
            listaFiltrada.map(c => {
              const deudaUSD = parseFloat(c.saldoPendienteUSD) || 0;
              const deudaBS = deudaUSD * tasa;
              return (
                <div key={c.id || c.doc} onClick={() => setClienteDetalle(c)} style={styles.cardCliente}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{c.nombre}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>C.I: {c.doc} {c.telefono ? `· Tel: ${c.telefono}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: '10px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.98rem', color: '#dc2626' }}>${deudaUSD.toFixed(2)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#0052cc', fontWeight: 'bold' }}>Bs. {deudaBS.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={(e) => enviarRecordatorioWhatsApp(c, e)} 
                      title="Enviar recordatorio por WhatsApp"
                      style={styles.btnIconWa}
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button 
                      onClick={(e) => abrirModalAbono(c, e)} 
                      style={styles.btnAbonarMini}
                    >
                      Abonar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal de Abono */}
        {clienteAbonando && (
          <div style={styles.subOverlay}>
            <div style={styles.subModal}>
              <div style={styles.headerSub}>
                <h3 style={{ margin: 0, fontSize: '0.96rem' }}>Registrar Abono: {clienteAbonando.nombre}</h3>
                <button onClick={() => setClienteAbonando(null)} style={styles.btnCerrar}><X size={16} /></button>
              </div>
              <div style={{ padding: '14px' }}>
                <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#991b1b' }}>Deuda Actual:</div>
                  <strong style={{ fontSize: '1.2rem', color: '#dc2626' }}>${saldoActual.toFixed(2)}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '6px' }}>(Bs. {(saldoActual * tasa).toFixed(2)})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={styles.inputLabel}>Dólares en Efectivo ($):</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={pagoUSD} 
                      onChange={e => setPagoUSD(e.target.value)} 
                      style={styles.inputModal} 
                    />
                  </div>
                  <div>
                    <label style={styles.inputLabel}>Bolívares Efectivo (Bs):</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={pagoBsEfectivo} 
                      onChange={e => setPagoBsEfectivo(e.target.value)} 
                      style={styles.inputModal} 
                    />
                  </div>
                  <div>
                    <label style={styles.inputLabel}>Pago Móvil (Bs):</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={pagoPM} 
                      onChange={e => setPagoPM(e.target.value)} 
                      style={styles.inputModal} 
                    />
                  </div>
                  <div>
                    <label style={styles.inputLabel}>Punto de Venta (Bs):</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={pagoPunto} 
                      onChange={e => setPagoPunto(e.target.value)} 
                      style={styles.inputModal} 
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span>Total Abonado:</span>
                    <strong style={{ color: '#16a34a' }}>${totalAbonadoUSD.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                    <span>Resta por Cobrar:</span>
                    <strong style={{ color: '#dc2626' }}>${restante.toFixed(2)}</strong>
                  </div>
                </div>

                <button 
                  onClick={procesarAbono} 
                  disabled={totalAbonadoUSD <= 0}
                  style={{ ...styles.btnConfirmarAbono, opacity: totalAbonadoUSD > 0 ? 1 : 0.5 }}
                >
                  Confirmar y Guardar Abono
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '12px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #f1f5f9'
  },
  titulo: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitulo: {
    margin: '2px 0 0 0',
    fontSize: '0.74rem',
    color: '#64748b'
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    margin: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    padding: '9px 10px',
    fontSize: '0.82rem',
    outline: 'none'
  },
  lista: {
    padding: '0 16px 16px 16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  vacio: {
    textAlign: 'center',
    padding: '40px 10px'
  },
  cardCliente: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  btnIconWa: {
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    padding: '7px 8px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  btnAbonarMini: {
    backgroundColor: '#0052cc',
    color: '#fff',
    border: 'none',
    padding: '7px 12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  subOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '14px'
  },
  subModal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '380px',
    width: '100%',
    overflow: 'hidden'
  },
  headerSub: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    fontWeight: 'bold'
  },
  inputLabel: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: '#475569',
    display: 'block',
    marginBottom: '2px'
  },
  inputModal: {
    width: '100%',
    padding: '7px 9px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.84rem',
    boxSizing: 'border-box'
  },
  btnConfirmarAbono: {
    width: '100%',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 'bold',
    marginTop: '12px',
    cursor: 'pointer'
  }
};
