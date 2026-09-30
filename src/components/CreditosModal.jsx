import React, { useState } from 'react';
import {
  Users, Search, DollarSign, MessageCircle, Calendar,
  CheckCircle, Clock, ChevronRight, X, AlertCircle, ArrowLeft
} from 'lucide-react';

export default function CreditosModal({
  clientes = [],
  tasaCambio = 1,
  transacciones = [],
  onAbonar,
  alRegistrarAbono,
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

  // Filtrar clientes con deuda o que coincidan con la búsqueda
  const clientesFiltrados = (clientes || []).filter(c => {
    const doc = (c.doc || '').toLowerCase();
    const nom = (c.nombre || '').toLowerCase();
    const q = busqueda.trim().toLowerCase();
    const coincide = doc.includes(q) || nom.includes(q);
    const saldo = parseFloat(c.saldoPendienteUSD || c.saldoDeudor || c.saldoDeudorUSD || 0);
    return q ? coincide : (saldo > 0.01);
  });

  const totalDeudaGlobalUSD = (clientes || []).reduce((acc, c) => {
    return acc + parseFloat(c.saldoPendienteUSD || c.saldoDeudor || c.saldoDeudorUSD || 0);
  }, 0);

  const totalDeudaGlobalBS = totalDeudaGlobalUSD * tasa;

  // Compras y Abonos del cliente seleccionado para detalle
  const comprasCliente = clienteDetalle ? (transacciones || []).filter(t => {
    const tDoc = (t.cliente?.doc || t.clienteDoc || '').replace(/[^0-9]/g, '');
    const cDoc = (clienteDetalle.doc || '').replace(/[^0-9]/g, '');
    return tDoc && tDoc === cDoc;
  }) : [];

  const abonosCliente = clienteDetalle?.historialAbonos || [];

  // Cálculos del modal de abono
  const montoUSDNum = parseFloat(pagoUSD) || 0;
  const montoBsNum = parseFloat(pagoBsEfectivo) || 0;
  const montoPMNum = parseFloat(pagoPM) || 0;
  const montoPuntoNum = parseFloat(pagoPunto) || 0;

  const totalAbonandoUSD = montoUSDNum + ((montoBsNum + montoPMNum + montoPuntoNum) / tasa);
  const deudaActualUSD = parseFloat(clienteAbonando?.saldoPendienteUSD || clienteAbonando?.saldoDeudor || clienteAbonando?.saldoDeudorUSD || 0);
  const saldoRestanteUSD = Math.max(0, deudaActualUSD - totalAbonandoUSD);

  const procesarAbono = () => {
    if (totalAbonandoUSD <= 0) return alert('Ingresa un monto válido para abonar.');
    if (onAbonar) {
      onAbonar(clienteAbonando.id || clienteAbonando.doc, totalAbonandoUSD);
    }
    setClienteAbonando(null);
    setPagoUSD('');
    setPagoBsEfectivo('');
    setPagoPM('');
    setPagoPunto('');
  };

  const enviarWhatsAppRecordatorio = (cli) => {
    const saldo = parseFloat(cli.saldoPendienteUSD || cli.saldoDeudor || cli.saldoDeudorUSD || 0);
    const tel = (cli.telefono || '').replace(/[^0-9]/g, '');
    if (!tel) return alert('El cliente no tiene un teléfono registrado.');
    const texto = encodeURIComponent(`Hola ${cli.nombre}, le escribimos de MiniMarket JJJP para recordarle amablemente que mantiene un saldo pendiente de $${saldo.toFixed(2)} (Bs. ${(saldo * tasa).toFixed(2)}). ¡Agradecemos su pago!`);
    window.open(`https://wa.me/${tel}?text=${texto}`, '_blank');
  };

  return (
    <div style={styles.pantallaCompleta}>
      {/* Encabezado Principal */}
      <header style={styles.header}>
        <button onClick={alCerrar} style={styles.btnVolver}>
          <ArrowLeft size={20} color="#0f2a4a" />
        </button>
        <div>
          <h2 style={styles.tituloHeader}>Créditos y Cuentas por Cobrar</h2>
          <div style={styles.subtituloHeader}>
            Total por cobrar: <strong style={{ color: '#dc2626' }}>${totalDeudaGlobalUSD.toFixed(2)}</strong> (Bs. {totalDeudaGlobalBS.toFixed(2)})
          </div>
        </div>
      </header>

      {/* Buscador */}
      <div style={styles.contenedorBuscador}>
        <div style={styles.barraBusqueda}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar deudor por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBusqueda}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={styles.btnLimpiarBusqueda}>
              <X size={16} color="#64748b" />
            </button>
          )}
        </div>
      </div>

      {/* Listado de Clientes con Deuda */}
      <div style={styles.cuerpoScroll}>
        {clientesFiltrados.length === 0 ? (
          <div style={styles.vacioContainer}>
            <CheckCircle size={48} color="#00b050" />
            <h3 style={{ margin: '12px 0 4px', color: '#0f2a4a' }}>¡Todo al día!</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>No hay cuentas pendientes por cobrar.</p>
          </div>
        ) : (
          <div style={styles.listaCards}>
            {clientesFiltrados.map((cli) => {
              const saldo = parseFloat(cli.saldoPendienteUSD || cli.saldoDeudor || cli.saldoDeudorUSD || 0);
              const saldoBS = saldo * tasa;

              return (
                <div key={cli.id || cli.doc} style={styles.cardCliente}>
                  <div
                    onClick={() => { setClienteDetalle(cli); setPestanaDetalle('compras'); }}
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <div style={styles.nombreCard}>{cli.nombre}</div>
                    <div style={styles.docCard}>C.I: {cli.doc}</div>
                    {cli.telefono && <div style={styles.telCard}>{cli.telefono}</div>}
                  </div>

                  <div style={styles.zonaMontoAcciones}>
                    <div style={styles.bloqueMontos}>
                      <div style={styles.montoUSD}>${saldo.toFixed(2)}</div>
                      <div style={styles.montoBS}>Bs. {saldoBS.toFixed(2)}</div>
                    </div>

                    <div style={styles.filaBotones}>
                      {cli.telefono && (
                        <button
                          onClick={() => enviarWhatsAppRecordatorio(cli)}
                          title="Cobrar por WhatsApp"
                          style={styles.btnWhatsApp}
                        >
                          <MessageCircle size={18} color="#fff" />
                        </button>
                      )}
                      <button
                        onClick={() => { setClienteAbonando(cli); }}
                        style={styles.btnAbonar}
                      >
                        Abonar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALLES DEL CLIENTE */}
      {clienteDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#0f2a4a', fontSize: '1.1rem' }}>{clienteDetalle.nombre}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>C.I: {clienteDetalle.doc}</div>
              </div>
              <button onClick={() => setClienteDetalle(null)} style={styles.btnCerrarModal}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.tabsDetalle}>
              <button
                onClick={() => setPestanaDetalle('compras')}
                style={{ ...styles.tabBtn, ...(pestanaDetalle === 'compras' ? styles.tabBtnActivo : {}) }}
              >
                Historial Compras ({comprasCliente.length})
              </button>
              <button
                onClick={() => setPestanaDetalle('abonos')}
                style={{ ...styles.tabBtn, ...(pestanaDetalle === 'abonos' ? styles.tabBtnActivo : {}) }}
              >
                Historial Abonos ({abonosCliente.length})
              </button>
            </div>

            <div style={styles.listaScrollModal}>
              {pestanaDetalle === 'compras' ? (
                comprasCliente.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.85rem' }}>
                    No hay compras registradas para este cliente.
                  </div>
                ) : (
                  comprasCliente.map((c, i) => (
                    <div key={i} style={styles.itemDetalle}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#0f2a4a' }}>
                          Ticket #{c.numeroTicket || c.ticket || c.id}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.fecha || 'Sin fecha'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#00b050', fontSize: '0.9rem' }}>
                          ${parseFloat(c.totalUSD || c.montoUSD || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Bs. {parseFloat(c.totalBS || (c.totalUSD * tasa) || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                abonosCliente.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.85rem' }}>
                    No hay abonos registrados para este cliente.
                  </div>
                ) : (
                  abonosCliente.map((a, i) => (
                    <div key={i} style={styles.itemDetalle}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#0052cc' }}>Abono Registrado</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.fecha}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#0052cc', fontSize: '0.9rem' }}>
                        -${parseFloat(a.montoUSD || 0).toFixed(2)}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ABONAR */}
      {clienteAbonando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#0f2a4a', fontSize: '1.1rem' }}>Registrar Abono</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{clienteAbonando.nombre}</div>
              </div>
              <button onClick={() => setClienteAbonando(null)} style={styles.btnCerrarModal}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.resumenDeudaBox}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>DEUDA ACTUAL</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#dc2626' }}>
                ${deudaActualUSD.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Bs. {(deudaActualUSD * tasa).toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
              <input
                type="number"
                placeholder="Efectivo en Dólares ($)"
                value={pagoUSD}
                onChange={(e) => setPagoUSD(e.target.value)}
                style={styles.inputAbono}
              />
              <input
                type="number"
                placeholder="Pago Móvil (Bs)"
                value={pagoPM}
                onChange={(e) => setPagoPM(e.target.value)}
                style={styles.inputAbono}
              />
              <input
                type="number"
                placeholder="Punto Débito (Bs)"
                value={pagoPunto}
                onChange={(e) => setPagoPunto(e.target.value)}
                style={styles.inputAbono}
              />
              <input
                type="number"
                placeholder="Efectivo en Bolívares (Bs)"
                value={pagoBsEfectivo}
                onChange={(e) => setPagoBsEfectivo(e.target.value)}
                style={styles.inputAbono}
              />
            </div>

            <div style={styles.saldoFinalAbono}>
              <span>Quedará debiendo:</span>
              <strong style={{ color: saldoRestanteUSD === 0 ? '#00b050' : '#dc2626' }}>
                ${saldoRestanteUSD.toFixed(2)}
              </strong>
            </div>

            <button onClick={procesarAbono} style={styles.btnConfirmarAbono}>
              <CheckCircle size={18} /> Confirmar Abono
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pantallaCompleta: {
    position: 'fixed', inset: 0, backgroundColor: '#f8fafc',
    zIndex: 99999, display: 'flex', flexDirection: 'column'
  },
  header: {
    backgroundColor: '#fff', padding: '14px 16px', display: 'flex',
    alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0'
  },
  btnVolver: {
    background: '#f1f5f9', border: 'none', borderRadius: '50%',
    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer'
  },
  tituloHeader: { margin: 0, fontSize: '1.15rem', color: '#0f2a4a', fontWeight: 'bold' },
  subtituloHeader: { fontSize: '0.8rem', color: '#64748b', marginTop: '2px' },
  contenedorBuscador: { padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' },
  barraBusqueda: {
    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9',
    padding: '8px 12px', borderRadius: '10px'
  },
  inputBusqueda: { border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem' },
  btnLimpiarBusqueda: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex' },
  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '16px' },
  vacioContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '60%'
  },
  listaCards: { display: 'flex', flexDirection: 'column', gap: '10px' },
  cardCliente: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '14px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
  },
  nombreCard: { fontSize: '0.95rem', fontWeight: 'bold', color: '#0f2a4a' },
  docCard: { fontSize: '0.8rem', color: '#64748b', marginTop: '2px' },
  telCard: { fontSize: '0.75rem', color: '#94a3b8' },
  zonaMontoAcciones: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
  bloqueMontos: { textAlign: 'right' },
  montoUSD: { fontSize: '1.25rem', fontWeight: '900', color: '#dc2626' },
  montoBS: { fontSize: '0.78rem', fontWeight: '600', color: '#64748b' },
  filaBotones: { display: 'flex', gap: '6px' },
  btnWhatsApp: {
    backgroundColor: '#25D366', border: 'none', borderRadius: '8px',
    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer'
  },
  btnAbonar: {
    backgroundColor: '#0052cc', color: '#fff', border: 'none',
    padding: '0 14px', height: '36px', borderRadius: '8px',
    fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
    zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px'
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: '16px', maxWidth: '380px',
    width: '100%', padding: '16px', display: 'flex', flexDirection: 'column'
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  btnCerrarModal: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  tabsDetalle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' },
  tabBtn: { padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.78rem', fontWeight: 'bold', color: '#64748b', cursor: 'pointer' },
  tabBtnActivo: { background: '#0f2a4a', color: '#fff', borderColor: '#0f2a4a' },
  listaScrollModal: { maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  itemDetalle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' },
  resumenDeudaBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', textAlign: 'center' },
  inputAbono: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' },
  saldoFinalAbono: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '8px 0 14px' },
  btnConfirmarAbono: { backgroundColor: '#00b050', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }
};
