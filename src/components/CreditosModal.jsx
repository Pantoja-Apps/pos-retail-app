import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCircle, Smartphone, DollarSign, CreditCard, Banknote, Share2, X, ShoppingBag, History, ChevronRight } from 'lucide-react';

function extraerNumerosDoc(str) {
  if (!str) return '';
  return str.toString().replace(/[^0-9]/g, '');
}

export default function CreditosModal({ clientes, tasaCambio, transacciones = [], alRegistrarAbono, alVolver }) {
  const [busqueda, setBusqueda] = useState('');
  const [clienteAbonando, setClienteAbonando] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [pestanaDetalle, setPestanaDetalle] = useState('compras');

  const [pagoUSD, setPagoUSD] = useState('');
  const [pagoBsEfectivo, setPagoBsEfectivo] = useState('');
  const [pagoPM, setPagoPM] = useState('');
  const [pagoPunto, setPagoPunto] = useState('');

  const tasa = parseFloat(tasaCambio) || 1;

  const clientesConDeuda = clientes.filter(c => (parseFloat(c.saldoPendienteUSD) || 0) > 0.009);
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
    msg += `• Total a Pagar: *$${deudaUSD}* (Bs. ${deudaBS})\n`;
    msg += `• Tasa Oficial: Bs. ${tasa.toFixed(2)}\n`;
    msg += `--------------------------------\n`;
    msg += `Agradecemos gestionar su pago a la brevedad posible.\n`;
    msg += `¡Feliz día!`;

    const b = String.fromCharCode(96, 96, 96);
    const textoWhatsApp = b + "\n" + msg + b;
    const tel = (cliente.telefono || '').replace(/[^0-9]/g, '');
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(textoWhatsApp)}` : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;
    window.open(url, '_blank');
  };

  const obtenerMovimientosCliente = (cliente) => {
    if (!cliente) return { compras: [], abonos: [] };
    
    const numCli = extraerNumerosDoc(cliente.doc);
    const nomCli = (cliente.nombre || '').toLowerCase().trim();

    const delClienteCompras = Array.isArray(cliente.historialCreditos) ? [...cliente.historialCreditos] : [];
    const deTransaccionesCompras = transacciones.filter(t => {
      if (t.tipo !== 'venta' || t.anulada) return false;
      const numTx = extraerNumerosDoc(t.cliente?.doc);
      const nomTx = (t.cliente?.nombre || '').toLowerCase().trim();
      const coincideDoc = numCli && numTx && (numCli === numTx || numCli.endsWith(numTx) || numTx.endsWith(numCli));
      const coincideNom = nomCli && nomTx && nomCli === nomTx && nomCli !== 'consumidor final';
      return (coincideDoc || coincideNom) && (t.esCredito || parseFloat(t.saldoDeudaUSD) > 0);
    });

    const mapaCompras = new Map();
    delClienteCompras.forEach(item => mapaCompras.set(item.id, item));
    deTransaccionesCompras.forEach(item => {
      if (!mapaCompras.has(item.id)) mapaCompras.set(item.id, item);
    });

    const comprasFinal = Array.from(mapaCompras.values());
    const sumaDetalles = comprasFinal.reduce((acc, it) => acc + (parseFloat(it.saldoDeudaUSD) || parseFloat(it.totalUSD) || 0), 0);
    const deudaTotal = parseFloat(cliente.saldoPendienteUSD) || 0;
    const diferencia = deudaTotal - sumaDetalles;

    if (diferencia > 0.01) {
      comprasFinal.unshift({
        id: 'PREVIO',
        fecha: 'Turnos Anteriores',
        items: [{ nombre: 'Saldo Fiado Pendiente Acumulado', cantidad: 1, precioUSD: diferencia }],
        saldoDeudaUSD: diferencia.toFixed(2),
        totalUSD: diferencia.toFixed(2)
      });
    }

    const delClienteAbonos = Array.isArray(cliente.historialAbonos) ? [...cliente.historialAbonos] : [];
    const deTransaccionesAbonos = transacciones.filter(t => {
      if (t.tipo !== 'abono') return false;
      const numTx = extraerNumerosDoc(t.doc);
      const nomTx = (t.cliente || '').toLowerCase().trim();
      const coincideDoc = numCli && numTx && (numCli === numTx || numCli.endsWith(numTx) || numTx.endsWith(numCli));
      const coincideNom = nomCli && nomTx && nomCli === nomTx;
      return coincideDoc || coincideNom;
    });

    const mapaAbonos = new Map();
    delClienteAbonos.forEach(item => mapaAbonos.set(item.id, item));
    deTransaccionesAbonos.forEach(item => {
      if (!mapaAbonos.has(item.id)) mapaAbonos.set(item.id, item);
    });

    const abonosFinal = Array.from(mapaAbonos.values());

    return { compras: comprasFinal, abonos: abonosFinal };
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

    alRegistrarAbono(clienteAbonando, totalAbonadoUSD, {
      pagoUSD: usd.toFixed(2),
      pagoBsEfectivo: bsEf.toFixed(2),
      pagoPM: pm.toFixed(2),
      pagoPunto: punto.toFixed(2)
    });

    const msg = `*COMPROBANTE DE ABONO*\n` +
      `Cliente: ${clienteAbonando.nombre} (${clienteAbonando.doc})\n` +
      `Monto Abonado: $${totalAbonadoUSD.toFixed(2)} (Bs. ${(totalAbonadoUSD * tasa).toFixed(2)})\n` +
      `Saldo Restante: $${restante.toFixed(2)} (Bs. ${(restante * tasa).toFixed(2)})\n` +
      `¡Gracias por su pago puntual!`;

    const b = String.fromCharCode(96, 96, 96);
    const textoWhatsApp = b + "\n" + msg + b;
    const tel = (clienteAbonando.telefono || '').replace(/[^0-9]/g, '');
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(textoWhatsApp)}` : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;
    
    if (confirm('Abono registrado con éxito. ¿Deseas enviar el comprobante por WhatsApp al cliente?')) {
      window.open(url, '_blank');
    }

    setClienteAbonando(null);
  };

  const movimientos = clienteDetalle ? obtenerMovimientosCliente(clienteDetalle) : { compras: [], abonos: [] };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}><ArrowLeft color="#333" size={20} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Créditos y Cuentas por Cobrar</h2>
            <small style={{ color: '#666', fontSize: '0.72rem' }}>Total Pendiente: ${totalPorCobrarUSD.toFixed(2)}</small>
          </div>
        </div>
      </header>

      <div style={styles.seccionBusqueda}>
        <div style={styles.inputWrapper}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Buscar deudor por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBuscador}
          />
        </div>
      </div>

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
              <div 
                key={c.id || c.doc} 
                onClick={() => setClienteDetalle(c)}
                style={styles.cardItem}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{c.nombre}</strong>
                    <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                      C.I: {c.doc} {c.telefono ? `· Tlf: ${c.telefono}` : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ea580c' }}>${deudaUSD.toFixed(2)}</div>
                    <small style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>Bs. {deudaBS.toFixed(2)}</small>
                  </div>
                </div>

                <div style={styles.filaAccionesCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#0052cc', fontSize: '0.74rem', fontWeight: '600' }}>
                    <span>Ver Compras y Abonos</span>
                    <ChevronRight size={14} />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button" 
                      onClick={(e) => enviarRecordatorioWhatsApp(c, e)} 
                      style={styles.btnNotificarWA}
                      title="Cobrar por WhatsApp"
                    >
                      <Share2 size={13} /> Cobrar
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => abrirModalAbono(c, e)} 
                      style={styles.btnAbonar}
                    >
                      Abonar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ESTADO DE CUENTA DETALLADO */}
      {clienteDetalle && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Estado de Cuenta</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{clienteDetalle.nombre} · {clienteDetalle.doc}</div>
              </div>
              <button type="button" onClick={() => setClienteDetalle(null)} style={styles.btnCerrarModal}><X size={18} /></button>
            </div>

            <div style={styles.formScroll}>
              <div style={styles.cardBalanceCliente}>
                <span style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 'bold', textTransform: 'uppercase' }}>Deuda Total Acumulada</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ea580c', margin: '2px 0' }}>
                  ${(parseFloat(clienteDetalle.saldoPendienteUSD) || 0).toFixed(2)}
                </div>
                <small style={{ fontSize: '0.76rem', color: '#0052cc', fontWeight: 'bold' }}>
                  Equivalente: Bs. {((parseFloat(clienteDetalle.saldoPendienteUSD) || 0) * tasa).toFixed(2)}
                </small>
              </div>

              {/* SELECTOR DE PESTAÑAS */}
              <div style={styles.tabsDetalle}>
                <button
                  type="button"
                  onClick={() => setPestanaDetalle('compras')}
                  style={{
                    ...styles.tabDetalleBtn,
                    backgroundColor: pestanaDetalle === 'compras' ? '#fff' : 'transparent',
                    color: pestanaDetalle === 'compras' ? '#0052cc' : '#64748b',
                    boxShadow: pestanaDetalle === 'compras' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <ShoppingBag size={14} /> Compras ({movimientos.compras.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPestanaDetalle('abonos')}
                  style={{
                    ...styles.tabDetalleBtn,
                    backgroundColor: pestanaDetalle === 'abonos' ? '#fff' : 'transparent',
                    color: pestanaDetalle === 'abonos' ? '#16a34a' : '#64748b',
                    boxShadow: pestanaDetalle === 'abonos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <History size={14} /> Abonos ({movimientos.abonos.length})
                </button>
              </div>

              {/* PESTAÑA COMPRAS */}
              {pestanaDetalle === 'compras' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {movimientos.compras.length === 0 ? (
                    <div style={styles.vacioMini}>No hay compras fiadas registradas.</div>
                  ) : (
                    movimientos.compras.map((v, i) => (
                      <div key={v.id || i} style={styles.itemCompraCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#0f172a' }}>
                            {v.id === 'PREVIO' ? 'Saldo Previo' : `Ticket #${v.id}`}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{v.fecha}</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {(v.items || []).map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: '#334155' }}>
                              <span>• {it.cantidad}x {it.nombre}</span>
                              <strong>${(it.precioUSD * it.cantidad).toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0', fontSize: '0.75rem' }}>
                          <span style={{ color: '#64748b' }}>Quedó debiendo:</span>
                          <strong style={{ color: '#ea580c' }}>
                            ${parseFloat(v.saldoDeudaUSD || v.totalUSD).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PESTAÑA ABONOS */}
              {pestanaDetalle === 'abonos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {movimientos.abonos.length === 0 ? (
                    <div style={styles.vacioMini}>El cliente aún no ha registrado abonos.</div>
                  ) : (
                    movimientos.abonos.map((a, i) => (
                      <div key={a.id || i} style={styles.itemAbonoCard}>
                        <div>
                          <strong style={{ fontSize: '0.84rem', color: '#16a34a' }}>+${parseFloat(a.totalAbonoUSD).toFixed(2)}</strong>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{a.fecha}</div>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', textAlign: 'right' }}>
                          {parseFloat(a.pagoUSD) > 0 && <div>Divisas: ${a.pagoUSD}</div>}
                          {parseFloat(a.pagoBsEfectivo) > 0 && <div>Efec Bs: {a.pagoBsEfectivo}</div>}
                          {parseFloat(a.pagoPM) > 0 && <div>P. Móvil: {a.pagoPM}</div>}
                          {parseFloat(a.pagoPunto) > 0 && <div>Punto: {a.pagoPunto}</div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div style={{ marginTop: '16px', paddingBottom: '30px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    const cli = clienteDetalle;
                    setClienteDetalle(null);
                    abrirModalAbono(cli, e);
                  }}
                  style={styles.btnAbonarDesdeDetalle}
                >
                  Registrar Abono a la Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO */}
      {clienteAbonando && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 'bold' }}>Registrar Abono</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{clienteAbonando.nombre} ({clienteAbonando.doc})</div>
              </div>
              <button type="button" onClick={() => setClienteAbonando(null)} style={styles.btnCerrarModal}><X size={18} /></button>
            </div>

            <form onSubmit={procesarAbono} style={styles.formScroll}>
              <div style={styles.bannerDeuda}>
                <span style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 'bold', textTransform: 'uppercase' }}>Deuda Total Pendiente:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#c2410c', margin: '2px 0' }}>
                  ${saldoActual.toFixed(2)}
                </div>
                <small style={{ fontSize: '0.74rem', color: '#0052cc', fontWeight: 'bold' }}>
                  Bs. {(saldoActual * tasa).toFixed(2)}
                </small>
              </div>

              <div style={styles.seccionCamposAbono}>
                <div style={styles.cardMetodoAbono}>
                  <div style={styles.metaRowAbono}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <DollarSign size={16} color="#16a34a" />
                      <span style={styles.nombreMetodo}>Divisas ($):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPagoUSD(saldoActual.toFixed(2))}
                      style={styles.btnTotalAbono}
                    >
                      Pagar Todo
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={pagoUSD}
                    onChange={(e) => setPagoUSD(e.target.value)}
                    style={styles.inputMontoAbono}
                  />
                </div>

                <div style={styles.cardMetodoAbono}>
                  <div style={styles.metaRowAbono}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Banknote size={16} color="#059669" />
                      <span style={styles.nombreMetodo}>Efectivo (Bs):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPagoBsEfectivo((saldoActual * tasa).toFixed(2))}
                      style={styles.btnTotalAbono}
                    >
                      Pagar Todo
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={pagoBsEfectivo}
                    onChange={(e) => setPagoBsEfectivo(e.target.value)}
                    style={styles.inputMontoAbono}
                  />
                </div>

                <div style={styles.cardMetodoAbono}>
                  <div style={styles.metaRowAbono}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Smartphone size={16} color="#0284c7" />
                      <span style={styles.nombreMetodo}>Pago Móvil (Bs):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPagoPM((saldoActual * tasa).toFixed(2))}
                      style={styles.btnTotalAbono}
                    >
                      Pagar Todo
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={pagoPM}
                    onChange={(e) => setPagoPM(e.target.value)}
                    style={styles.inputMontoAbono}
                  />
                </div>

                <div style={styles.cardMetodoAbono}>
                  <div style={styles.metaRowAbono}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CreditCard size={16} color="#9333ea" />
                      <span style={styles.nombreMetodo}>Punto Débito (Bs):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPagoPunto((saldoActual * tasa).toFixed(2))}
                      style={styles.btnTotalAbono}
                    >
                      Pagar Todo
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={pagoPunto}
                    onChange={(e) => setPagoPunto(e.target.value)}
                    style={styles.inputMontoAbono}
                  />
                </div>
              </div>

              <div style={styles.bannerResumenAbono}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: '#166534' }}>Total que está abonando:</span>
                  <strong style={{ fontSize: '1rem', color: '#16a34a' }}>+${totalAbonadoUSD.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Saldo restante que quedará:</span>
                  <strong style={{ fontSize: '0.92rem', color: '#ea580c' }}>${restante.toFixed(2)}</strong>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingBottom: '30px' }}>
                <button type="submit" style={styles.btnConfirmarAbono}>
                  Procesar Abono y Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '12px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  seccionBusqueda: { padding: '8px 14px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  inputWrapper: { position: 'relative' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 8px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  lista: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  vacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%' },
  cardItem: { backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer' },
  filaAccionesCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' },
  btnNotificarWA: { backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 11px', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  btnAbonar: { backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '12px' },
  modalBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '375px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' },
  btnCerrarModal: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  formScroll: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  cardBalanceCliente: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '12px', borderRadius: '10px', textAlign: 'center', marginBottom: '12px' },
  tabsDetalle: { display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px', marginBottom: '10px' },
  tabDetalleBtn: { flex: 1, border: 'none', padding: '7px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  vacioMini: { fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', padding: '10px 0', textAlign: 'center' },
  itemCompraCard: { backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  itemAbonoCard: { backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnAbonarDesdeDetalle: { width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' },
  bannerDeuda: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '10px', borderRadius: '10px', marginBottom: '12px', textAlign: 'center' },
  seccionCamposAbono: { display: 'flex', flexDirection: 'column', gap: '10px' },
  cardMetodoAbono: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px' },
  metaRowAbono: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  nombreMetodo: { fontSize: '0.74rem', fontWeight: 'bold', color: '#334155' },
  btnTotalAbono: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 'bold', color: '#0052cc', cursor: 'pointer' },
  inputMontoAbono: { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 'bold', outline: 'none' },
  bannerResumenAbono: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '10px', marginTop: '12px' },
  btnConfirmarAbono: { width: '100%', padding: '13px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.92rem', fontWeight: 'bold', cursor: 'pointer' }
};
