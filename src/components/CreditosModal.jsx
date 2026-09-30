import React, { useState, useMemo } from 'react';
import {
  Users, Search, DollarSign, MessageCircle, Calendar,
  CheckCircle, Clock, ChevronRight, X, AlertCircle, ArrowLeft,
  CreditCard, Wallet, ShieldCheck, Phone
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

  // Unificar y deduplicar clientes por cédula
  const clientesUnicos = useMemo(() => {
    const mapa = new Map();
    (clientes || []).forEach(c => {
      const docClean = (c.doc || '').replace(/[^0-9]/g, '') || c.id;
      if (!mapa.has(docClean)) {
        mapa.set(docClean, c);
      }
    });
    return Array.from(mapa.values());
  }, [clientes]);

  // Filtrar clientes con saldo deudor o coincidentes con búsqueda
  const clientesFiltrados = clientesUnicos.filter(c => {
    const doc = (c.doc || '').toLowerCase();
    const nom = (c.nombre || '').toLowerCase();
    const q = busqueda.trim().toLowerCase();
    const coincide = doc.includes(q) || nom.includes(q);
    const saldo = parseFloat(c.saldoPendienteUSD || c.saldoDeudor || c.saldoDeudorUSD || 0);
    return q ? coincide : (saldo > 0.01);
  });

  const totalDeudaGlobalUSD = clientesFiltrados.reduce((acc, c) => {
    return acc + parseFloat(c.saldoPendienteUSD || c.saldoDeudor || c.saldoDeudorUSD || 0);
  }, 0);

  const totalDeudaGlobalBS = totalDeudaGlobalUSD * tasa;

  // Historial del cliente seleccionado
  const comprasCliente = clienteDetalle ? (transacciones || []).filter(t => {
    const tDoc = (t.cliente?.doc || t.clienteDoc || '').replace(/[^0-9]/g, '');
    const cDoc = (clienteDetalle.doc || '').replace(/[^0-9]/g, '');
    return tDoc && tDoc === cDoc;
  }) : [];

  const abonosCliente = clienteDetalle?.historialAbonos || [];

  // Cálculos de Abono
  const montoUSDNum = parseFloat(pagoUSD) || 0;
  const montoBsNum = parseFloat(pagoBsEfectivo) || 0;
  const montoPMNum = parseFloat(pagoPM) || 0;
  const montoPuntoNum = parseFloat(pagoPunto) || 0;

  const totalAbonandoUSD = montoUSDNum + ((montoBsNum + montoPMNum + montoPuntoNum) / tasa);
  const deudaActualUSD = parseFloat(clienteAbonando?.saldoPendienteUSD || clienteAbonando?.saldoDeudor || clienteAbonando?.saldoDeudorUSD || 0);
  const saldoRestanteUSD = Math.max(0, deudaActualUSD - totalAbonandoUSD);

  const procesarAbono = () => {
    if (totalAbonandoUSD <= 0) return alert('Por favor ingresa un monto válido.');
    const fnAbonar = onAbonar || alRegistrarAbono;
    if (fnAbonar) {
      fnAbonar(clienteAbonando.id || clienteAbonando.doc, totalAbonandoUSD);
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
    const texto = encodeURIComponent(`Hola ${cli.nombre}, le saludamos de MiniMarket JJJP. Le recordamos amablemente su saldo pendiente por pagar de $${saldo.toFixed(2)} (Bs. ${(saldo * tasa).toFixed(2)}). ¡Muchas gracias!`);
    window.open(`https://wa.me/${tel}?text=${texto}`, '_blank');
  };

  return (
    <div style={styles.pantallaContainer}>
      {/* Header Premium POS */}
      <header style={styles.headerPOS}>
        <div style={styles.headerLeft}>
          <button onClick={alCerrar} style={styles.btnVolverIcon} aria-label="Volver al mostrador">
            <ArrowLeft size={20} color="#0f2a4a" />
          </button>
          <div>
            <h1 style={styles.tituloModulo}>Cuentas por Cobrar</h1>
            <p style={styles.subtituloModulo}>Control de créditos y clientes deudores</p>
          </div>
        </div>

        <div style={styles.tarjetaTasaBCV}>
          <span style={styles.labelTasa}>TASA BCV</span>
          <span style={styles.valorTasa}>Bs. {tasa.toFixed(2)}</span>
        </div>
      </header>

      {/* Banner Resumen Totalizador */}
      <div style={styles.bannerResumen}>
        <div style={styles.bannerItem}>
          <div style={styles.bannerLabel}>TOTAL PENDIENTE GLOBAL</div>
          <div style={styles.bannerMontoUSD}>${totalDeudaGlobalUSD.toFixed(2)}</div>
          <div style={styles.bannerMontoBS}>Bs. {totalDeudaGlobalBS.toFixed(2)}</div>
        </div>
        <div style={styles.bannerBadgeDeudores}>
          <Users size={16} color="#0052cc" />
          <span>{clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'Deudor' : 'Deudores'}</span>
        </div>
      </div>

      {/* Barra de Búsqueda Moderna */}
      <div style={styles.seccionBuscador}>
        <div style={styles.cajaInputBusqueda}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre o número de cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputSearch}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={styles.btnBorrarSearch}>
              <X size={16} color="#94a3b8" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Deudores */}
      <div style={styles.contenedorLista}>
        {clientesFiltrados.length === 0 ? (
          <div style={styles.estadoVacio}>
            <div style={styles.iconoCirculoVerde}>
              <CheckCircle size={42} color="#00b050" />
            </div>
            <h3 style={styles.tituloVacio}>¡Cuentas al Día!</h3>
            <p style={styles.textoVacio}>No hay saldos pendientes registrados en este momento.</p>
          </div>
        ) : (
          <div style={styles.gridClientes}>
            {clientesFiltrados.map((cli) => {
              const saldo = parseFloat(cli.saldoPendienteUSD || cli.saldoDeudor || cli.saldoDeudorUSD || 0);
              const saldoBS = saldo * tasa;

              return (
                <div key={cli.id || cli.doc} style={styles.tarjetaCliente}>
                  <div
                    onClick={() => { setClienteDetalle(cli); setPestanaDetalle('compras'); }}
                    style={styles.infoClienteClickable}
                  >
                    <div style={styles.encabezadoNombre}>
                      <span style={styles.nombreTexto}>{cli.nombre}</span>
                    </div>

                    <div style={styles.detallesBadgeFila}>
                      <span style={styles.badgeCedula}>{cli.doc}</span>
                      {cli.telefono && (
                        <span style={styles.badgeTelefono}>
                          <Phone size={12} color="#64748b" /> {cli.telefono}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={styles.panelAccionesDeuda}>
                    <div style={styles.bloqueSaldo}>
                      <span style={styles.saldoEtiqueta}>DEBE</span>
                      <div style={styles.saldoValorUSD}>${saldo.toFixed(2)}</div>
                      <div style={styles.saldoValorBS}>Bs. {saldoBS.toFixed(2)}</div>
                    </div>

                    <div style={styles.botonesAccionFila}>
                      {cli.telefono && (
                        <button
                          onClick={() => enviarWhatsAppRecordatorio(cli)}
                          title="Recordatorio WhatsApp"
                          style={styles.botonWhatsApp}
                        >
                          <MessageCircle size={18} color="#fff" />
                        </button>
                      )}
                      <button
                        onClick={() => setClienteAbonando(cli)}
                        style={styles.botonAbonarPOS}
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

      {/* MODAL DETALLES DE COMPRAS / ABONOS */}
      {clienteDetalle && (
        <div style={styles.overlayModerno}>
          <div style={styles.dialogoModerno}>
            <div style={styles.dialogoHeader}>
              <div>
                <h3 style={styles.dialogoTitulo}>{clienteDetalle.nombre}</h3>
                <span style={styles.dialogoSub}>{clienteDetalle.doc}</span>
              </div>
              <button onClick={() => setClienteDetalle(null)} style={styles.btnCerrarModal}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={styles.pestanasHeader}>
              <button
                onClick={() => setPestanaDetalle('compras')}
                style={{ ...styles.pestanaBtn, ...(pestanaDetalle === 'compras' ? styles.pestanaActiva : {}) }}
              >
                Historial Compras ({comprasCliente.length})
              </button>
              <button
                onClick={() => setPestanaDetalle('abonos')}
                style={{ ...styles.pestanaBtn, ...(pestanaDetalle === 'abonos' ? styles.pestanaActiva : {}) }}
              >
                Abonos Recibidos ({abonosCliente.length})
              </button>
            </div>

            <div style={styles.cuerpoDetalles}>
              {pestanaDetalle === 'compras' ? (
                comprasCliente.length === 0 ? (
                  <div style={styles.vacioDetalle}>No hay facturas vinculadas a este cliente.</div>
                ) : (
                  comprasCliente.map((c, i) => (
                    <div key={i} style={styles.itemFactura}>
                      <div>
                        <div style={styles.ticketNumero}>Ticket #{c.numeroTicket || c.ticket || c.id}</div>
                        <div style={styles.ticketFecha}>{c.fecha || 'Sin fecha'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={styles.ticketMontoUSD}>${parseFloat(c.totalUSD || c.montoUSD || 0).toFixed(2)}</div>
                        <div style={styles.ticketMontoBS}>Bs. {parseFloat(c.totalBS || (c.totalUSD * tasa) || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                abonosCliente.length === 0 ? (
                  <div style={styles.vacioDetalle}>No se han registrado abonos anteriores.</div>
                ) : (
                  abonosCliente.map((a, i) => (
                    <div key={i} style={styles.itemAbono}>
                      <div>
                        <div style={styles.abonoTitulo}>Abono a Cuenta</div>
                        <div style={styles.abonoFecha}>{a.fecha}</div>
                      </div>
                      <div style={styles.abonoMonto}>-${parseFloat(a.montoUSD || 0).toFixed(2)}</div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO (ESTILO COBRO POS) */}
      {clienteAbonando && (
        <div style={styles.overlayModerno}>
          <div style={styles.dialogoModerno}>
            <div style={styles.dialogoHeader}>
              <div>
                <h3 style={styles.dialogoTitulo}>Abonar a Cuenta</h3>
                <span style={styles.dialogoSub}>{clienteAbonando.nombre} ({clienteAbonando.doc})</span>
              </div>
              <button onClick={() => setClienteAbonando(null)} style={styles.btnCerrarModal}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* Tarjeta Deuda Actual */}
            <div style={styles.cardDeudaAbono}>
              <span style={styles.cardDeudaLabel}>SALDO TOTAL ADEUDADO</span>
              <div style={styles.cardDeudaMontoUSD}>${deudaActualUSD.toFixed(2)}</div>
              <div style={styles.cardDeudaMontoBS}>Bs. {(deudaActualUSD * tasa).toFixed(2)}</div>
            </div>

            {/* Inputs de Métodos de Pago */}
            <div style={styles.contenedorInputsAbono}>
              <div style={styles.inputGrupoAbono}>
                <label style={styles.inputLabelMini}>Efectivo ($ Dólares)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={pagoUSD}
                  onChange={(e) => setPagoUSD(e.target.value)}
                  style={styles.inputMontoAbono}
                />
              </div>

              <div style={styles.inputGrupoAbono}>
                <label style={styles.inputLabelMini}>Pago Móvil (Bs.)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={pagoPM}
                  onChange={(e) => setPagoPM(e.target.value)}
                  style={styles.inputMontoAbono}
                />
              </div>

              <div style={styles.inputGrupoAbono}>
                <label style={styles.inputLabelMini}>Punto Débito (Bs.)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={pagoPunto}
                  onChange={(e) => setPagoPunto(e.target.value)}
                  style={styles.inputMontoAbono}
                />
              </div>

              <div style={styles.inputGrupoAbono}>
                <label style={styles.inputLabelMini}>Efectivo (Bs. Bolívares)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={pagoBsEfectivo}
                  onChange={(e) => setPagoBsEfectivo(e.target.value)}
                  style={styles.inputMontoAbono}
                />
              </div>
            </div>

            {/* Balance Restante */}
            <div style={styles.balanceRestanteBarra}>
              <span>Nuevo Saldo Restante:</span>
              <strong style={{ color: saldoRestanteUSD === 0 ? '#00b050' : '#dc2626', fontSize: '1.05rem' }}>
                ${saldoRestanteUSD.toFixed(2)}
              </strong>
            </div>

            <button onClick={procesarAbono} style={styles.btnConfirmarAbonoPOS}>
              <CheckCircle size={18} /> Confirmar Abono
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pantallaContainer: {
    position: 'fixed', inset: 0, backgroundColor: '#f1f5f9',
    zIndex: 99999, display: 'flex', flexDirection: 'column'
  },
  headerPOS: {
    backgroundColor: '#fff', padding: '12px 16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #e2e8f0'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  btnVolverIcon: {
    background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px',
    width: '40px', height: '40px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer'
  },
  tituloModulo: { margin: 0, fontSize: '1.2rem', color: '#0f2a4a', fontWeight: '800' },
  subtituloModulo: { margin: 0, fontSize: '0.78rem', color: '#64748b' },
  tarjetaTasaBCV: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '6px 12px', textAlign: 'right'
  },
  labelTasa: { display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' },
  valorTasa: { fontSize: '0.88rem', fontWeight: '800', color: '#0f2a4a' },
  bannerResumen: {
    backgroundColor: '#0f2a4a', color: '#fff', padding: '16px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 4px 12px rgba(15,42,74,0.12)'
  },
  bannerItem: { display: 'flex', flexDirection: 'column' },
  bannerLabel: { fontSize: '0.75rem', color: '#93c5fd', fontWeight: '700', letterSpacing: '0.5px' },
  bannerMontoUSD: { fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.1 },
  bannerMontoBS: { fontSize: '0.85rem', color: '#cbd5e1', marginTop: '2px' },
  bannerBadgeDeudores: {
    backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
    padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '0.88rem', fontWeight: 'bold', color: '#fff'
  },
  seccionBuscador: { padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' },
  cajaInputBusqueda: {
    display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc',
    padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0'
  },
  inputSearch: { border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', fontSize: '0.92rem', color: '#0f2a4a' },
  btnBorrarSearch: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex' },
  contenedorLista: { flex: 1, overflowY: 'auto', padding: '16px' },
  estadoVacio: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '70%', textAlign: 'center'
  },
  iconoCirculoVerde: {
    width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#dcfce7',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px'
  },
  tituloVacio: { margin: '0 0 6px', color: '#0f2a4a', fontSize: '1.2rem', fontWeight: 'bold' },
  textoVacio: { margin: 0, color: '#64748b', fontSize: '0.9rem' },
  gridClientes: { display: 'flex', flexDirection: 'column', gap: '12px' },
  tarjetaCliente: {
    backgroundColor: '#fff', borderRadius: '14px', padding: '14px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  },
  infoClienteClickable: { flex: 1, minWidth: 0, cursor: 'pointer' },
  encabezadoNombre: { display: 'flex', alignItems: 'center', gap: '8px' },
  nombreTexto: { fontSize: '1rem', fontWeight: '800', color: '#0f2a4a' },
  detallesBadgeFila: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' },
  badgeCedula: {
    backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.76rem',
    fontWeight: '700', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0'
  },
  badgeTelefono: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '0.76rem', color: '#64748b', fontWeight: '500'
  },
  panelAccionesDeuda: { display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 },
  bloqueSaldo: { textAlign: 'right' },
  saldoEtiqueta: { fontSize: '0.65rem', color: '#dc2626', fontWeight: '800', letterSpacing: '0.5px' },
  saldoValorUSD: { fontSize: '1.35rem', fontWeight: '900', color: '#dc2626', lineHeight: 1.1 },
  saldoValorBS: { fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginTop: '2px' },
  botonesAccionFila: { display: 'flex', gap: '6px' },
  botonWhatsApp: {
    backgroundColor: '#25D366', border: 'none', borderRadius: '10px',
    width: '38px', height: '38px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,211,102,0.3)'
  },
  botonAbonarPOS: {
    backgroundColor: '#0052cc', color: '#fff', border: 'none',
    padding: '0 16px', height: '38px', borderRadius: '10px',
    fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,82,204,0.25)'
  },
  overlayModerno: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(3px)', zIndex: 100000, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '16px'
  },
  dialogoModerno: {
    backgroundColor: '#fff', borderRadius: '20px', maxWidth: '400px',
    width: '100%', padding: '20px', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
  },
  dialogoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  dialogoTitulo: { margin: 0, color: '#0f2a4a', fontSize: '1.2rem', fontWeight: '800' },
  dialogoSub: { fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'block' },
  btnCerrarModal: {
    background: '#f1f5f9', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer'
  },
  pestanasHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' },
  pestanaBtn: {
    padding: '9px', borderRadius: '10px', border: '1px solid #e2e8f0',
    background: '#f8fafc', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', cursor: 'pointer'
  },
  pestanaActiva: { background: '#0f2a4a', color: '#fff', borderColor: '#0f2a4a' },
  cuerpoDetalles: { maxHeight: '270px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  vacioDetalle: { textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.88rem' },
  itemFactura: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9'
  },
  ticketNumero: { fontWeight: 'bold', fontSize: '0.88rem', color: '#0f2a4a' },
  ticketFecha: { fontSize: '0.75rem', color: '#64748b' },
  ticketMontoUSD: { fontWeight: 'bold', color: '#00b050', fontSize: '0.95rem' },
  ticketMontoBS: { fontSize: '0.75rem', color: '#64748b' },
  itemAbono: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7'
  },
  abonoTitulo: { fontWeight: 'bold', fontSize: '0.88rem', color: '#166534' },
  abonoFecha: { fontSize: '0.75rem', color: '#64748b' },
  abonoMonto: { fontWeight: '900', color: '#16a34a', fontSize: '1rem' },
  cardDeudaAbono: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
    padding: '14px', textAlign: 'center', marginBottom: '14px'
  },
  cardDeudaLabel: { fontSize: '0.72rem', color: '#991b1b', fontWeight: '800', letterSpacing: '0.5px' },
  cardDeudaMontoUSD: { fontSize: '1.8rem', fontWeight: '900', color: '#dc2626', lineHeight: 1.1, marginTop: '2px' },
  cardDeudaMontoBS: { fontSize: '0.85rem', color: '#7f1d1d', marginTop: '2px', fontWeight: '600' },
  contenedorInputsAbono: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inputGrupoAbono: { display: 'flex', flexDirection: 'column', gap: '3px' },
  inputLabelMini: { fontSize: '0.74rem', fontWeight: '700', color: '#475569' },
  inputMontoAbono: {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1',
    fontSize: '0.95rem', fontWeight: '600', color: '#0f2a4a', outline: 'none'
  },
  balanceRestanteBarra: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.9rem', margin: '14px 0', padding: '10px 14px',
    backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0'
  },
  btnConfirmarAbonoPOS: {
    backgroundColor: '#00b050', color: '#fff', border: 'none',
    padding: '13px', borderRadius: '12px', fontWeight: '800', fontSize: '0.98rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,176,80,0.25)'
  }
};
