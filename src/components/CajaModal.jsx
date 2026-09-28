import React, { useState } from 'react';
import { 
  ArrowLeft, Receipt, DollarSign, Smartphone, CreditCard, Banknote, 
  MinusCircle, CheckCircle2, X, Printer, Share2, ShieldCheck, MapPin, Phone
} from 'lucide-react';

export default function CajaModal({
  transacciones = [],
  gastos = [],
  tasaCambio = 855.66,
  configEmpresa,
  usuarioActivo,
  cajaActiva,
  alRegistrarGasto,
  alEliminarGasto,
  alCerrarTurno,
  alVolver
}) {
  const [pestana, setPestana] = useState('arqueo');
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [reporteZGenerado, setReporteZGenerado] = useState(null);

  const [descripcionGasto, setDescripcionGasto] = useState('');
  const [origenGasto, setOrigenGasto] = useState('efectivo_bs');
  const [montoGasto, setMontoGasto] = useState('');

  const tasa = Number(tasaCambio) || 1;

  // Filtrar ventas del turno actual (no cerradas ni anuladas)
  const ventasTurno = transacciones.filter(t => !t.anulada && !t.cerradoEnTurno);

  // Totales del Turno
  let totalVentasUSD = 0;
  let totalVentasBS = 0;
  let ventasEfectivoUSD = 0;
  let ventasEfectivoBS = 0;
  let ventasPagoMovilBS = 0;
  let ventasPuntoBS = 0;

  ventasTurno.forEach(v => {
    const usd = Number(v.totalUSD || 0);
    const bs = Number(v.totalBS || (usd * tasa));
    totalVentasUSD += usd;
    totalVentasBS += bs;

    if (Array.isArray(v.pagos) && v.pagos.length > 0) {
      v.pagos.forEach(p => {
        const met = (p.metodo || '').toLowerCase();
        if (met.includes('usd') || met.includes('$')) {
          ventasEfectivoUSD += Number(p.montoUSD || p.monto || 0);
        } else if (met.includes('móvil') || met.includes('movil')) {
          ventasPagoMovilBS += Number(p.montoBS || p.monto || 0);
        } else if (met.includes('punto') || met.includes('tarjeta')) {
          ventasPuntoBS += Number(p.montoBS || p.monto || 0);
        } else {
          ventasEfectivoBS += Number(p.montoBS || p.monto || 0);
        }
      });
    } else {
      const met = (v.metodoPago || '').toLowerCase();
      if (met.includes('usd') || met === 'efectivo_usd') ventasEfectivoUSD += usd;
      else if (met.includes('movil') || met === 'pago_movil') ventasPagoMovilBS += bs;
      else if (met.includes('punto') || met === 'punto_venta') ventasPuntoBS += bs;
      else ventasEfectivoBS += bs;
    }
  });

  // Gastos discriminados por origen real
  let gastosEfectivoUSD = 0;
  let gastosEfectivoBS = 0;
  let gastosPagoMovilBS = 0;

  gastos.forEach(g => {
    const origen = g.origen || (g.moneda === 'USD' ? 'efectivo_usd' : 'efectivo_bs');
    const m = Number(g.monto || g.montoBS || g.montoUSD || 0);

    if (origen === 'efectivo_usd') {
      gastosEfectivoUSD += Number(g.montoUSD || m);
    } else if (origen === 'pago_movil') {
      gastosPagoMovilBS += Number(g.montoBS || m);
    } else {
      gastosEfectivoBS += Number(g.montoBS || m);
    }
  });

  // Saldos Netos
  const efectivoNetoUSD = Math.max(0, ventasEfectivoUSD - gastosEfectivoUSD);
  const efectivoNetoBS = Math.max(0, ventasEfectivoBS - gastosEfectivoBS);
  const pagoMovilNetoBS = Math.max(0, ventasPagoMovilBS - gastosPagoMovilBS);
  const saldoDigitalNetoBS = pagoMovilNetoBS + ventasPuntoBS;

  const registrarNuevoGasto = (e) => {
    e.preventDefault();
    const val = parseFloat(montoGasto) || 0;
    if (val <= 0 || !descripcionGasto.trim()) {
      return alert('Ingresa concepto y monto válido mayor a 0');
    }

    const nuevoGasto = {
      id: 'gst_' + Date.now(),
      descripcion: descripcionGasto.trim(),
      origen: origenGasto,
      monto: val,
      montoUSD: origenGasto === 'efectivo_usd' ? val : (val / tasa),
      montoBS: origenGasto === 'efectivo_usd' ? (val * tasa) : val,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      usuario: usuarioActivo?.nombre || 'Angel Pantoja'
    };

    if (alRegistrarGasto) alRegistrarGasto(nuevoGasto);
    setDescripcionGasto('');
    setMontoGasto('');
    setModalGastoAbierto(false);
  };

  const ejecutarCierreTurno = () => {
    const datosReporte = {
      fechaHora: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      cajero: usuarioActivo?.nombre || 'Angel Pantoja',
      caja: cajaActiva?.nombre || 'Caja 01',
      totalVentasUSD,
      totalVentasBS,
      ventasEfectivoUSD,
      ventasEfectivoBS,
      ventasPagoMovilBS,
      ventasPuntoBS,
      gastosEfectivoUSD,
      gastosEfectivoBS,
      gastosPagoMovilBS,
      efectivoNetoUSD,
      efectivoNetoBS,
      pagoMovilNetoBS,
      ventasCount: ventasTurno.length,
      gastosCount: gastos.length,
      gastosDetalle: [...gastos],
      tasa
    };

    setReporteZGenerado(datosReporte);
  };

  const compartirReporteWhatsApp = () => {
    if (!reporteZGenerado) return;
    const r = reporteZGenerado;

    let t = `*📊 REPORTE DE CIERRE DE CAJA (CORTE Z)*\n`;
    t += `*${(configEmpresa?.nombre || 'FACILITO POS').toUpperCase()}*\n`;
    if (configEmpresa?.rif) t += `RIF: ${configEmpresa.rif}\n`;
    if (configEmpresa?.direccion) t += `DIR: ${configEmpresa.direccion}\n`;
    if (configEmpresa?.telefono) t += `TEL: ${configEmpresa.telefono}\n`;
    t += `================================\n`;
    t += `FECHA: ${r.fechaHora}\n`;
    t += `RESPONSABLE: ${r.cajero} · ${r.caja}\n`;
    t += `TOTAL VENTAS: ${r.ventasCount} ticket(s)\n`;
    t += `================================\n`;
    t += `*1. VENTAS TOTALES FACTURADAS:*\n`;
    t += `  • Total en Dólares ($): $${r.totalVentasUSD.toFixed(2)}\n`;
    t += `  • Total en Bolívares (Bs): Bs. ${r.totalVentasBS.toFixed(2)}\n`;
    t += `--------------------------------\n`;
    t += `*2. EFECTIVO EN GAVETA (NETO):*\n`;
    t += `  • Dólares en Efectivo ($): $${r.efectivoNetoUSD.toFixed(2)}\n`;
    t += `  • Bolívares en Efectivo (Bs): Bs. ${r.efectivoNetoBS.toFixed(2)}\n`;
    t += `--------------------------------\n`;
    t += `*3. RECAUDO BANCARIO (DIGITAL):*\n`;
    t += `  • Pago Móvil:    Bs. ${r.pagoMovilNetoBS.toFixed(2)}\n`;
    t += `  • Punto Débito:  Bs. ${r.ventasPuntoBS.toFixed(2)}\n`;

    if (r.gastosDetalle && r.gastosDetalle.length > 0) {
      t += `--------------------------------\n`;
      t += `*4. SALIDAS Y GASTOS (${r.gastosDetalle.length}):*\n`;
      r.gastosDetalle.forEach(g => {
        const m = g.origen === 'efectivo_usd' ? `$${Number(g.monto).toFixed(2)}` : `Bs. ${Number(g.monto).toFixed(2)}`;
        t += `  • ${g.descripcion}: -${m}\n`;
      });
    }

    t += `================================\n`;
    t += `Tasa Oficial BCV: Bs. ${r.tasa.toFixed(2)} / USD\n`;
    t += `Auditoría contable completada exitosamente.\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(t)}`;
    window.open(url, '_blank');
  };

  const finalizarCierreDefinitivo = () => {
    if (alCerrarTurno) alCerrarTurno();
    setReporteZGenerado(null);
    alVolver();
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* Cabecera */}
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Caja y Cuadre de Turno (Z)</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            Responsable: <strong>{usuarioActivo?.nombre || 'Angel Pantoja'}</strong> · {cajaActiva?.nombre || 'Caja 01'}
          </small>
        </div>
        <button type="button" onClick={() => setModalGastoAbierto(true)} style={styles.btnRegistrarGastoTop}>
          <MinusCircle size={14} />
          <span>Registrar Gasto</span>
        </button>
      </header>

      {/* Tabs */}
      <div style={styles.tabsFila}>
        <button
          type="button"
          onClick={() => setPestana('arqueo')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'arqueo' ? '#0052cc' : 'transparent',
            color: pestana === 'arqueo' ? '#0052cc' : '#64748b'
          }}
        >
          <Receipt size={15} />
          <span>Arqueo de Caja (Z)</span>
        </button>
        <button
          type="button"
          onClick={() => setPestana('gastos')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'gastos' ? '#0052cc' : 'transparent',
            color: pestana === 'gastos' ? '#0052cc' : '#64748b'
          }}
        >
          <MinusCircle size={15} />
          <span>Salidas y Gastos ({gastos.length})</span>
        </button>
      </div>

      <main style={styles.cuerpo}>
        {pestana === 'arqueo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Tarjeta Ventas del Turno */}
            <div style={styles.tarjetaVentasTurno}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.etiquetaTotalVentas}>VENTAS DE TU TURNO</span>
                <span style={styles.badgeVentasCount}>{ventasTurno.length} ventas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                <div>
                  <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Divisa ($)</small>
                  <div style={styles.cifraUSD}>${totalVentasUSD.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total en Bolívares</small>
                  <div style={styles.cifraBS}>Bs. {totalVentasBS.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Efectivo Físico en Gaveta */}
            <div style={styles.bloqueSeccion}>
              <div style={styles.encabezadoBloque}>
                <strong style={{ fontSize: '0.82rem', color: '#0f2a4a' }}>Efectivo Físico en Gaveta</strong>
                <span style={{ fontSize: '0.68rem', color: '#00b050', fontWeight: 'bold' }}>Billetes Físicos</span>
              </div>

              <div style={styles.gridGaveta}>
                <div style={styles.tarjetaGaveta}>
                  <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Dólares en Efectivo ($)</small>
                  <strong style={{ fontSize: '1.25rem', color: '#00b050', display: 'block', margin: '2px 0' }}>
                    ${efectivoNetoUSD.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                    Cobrado: ${ventasEfectivoUSD.toFixed(2)} | Gastos: -${gastosEfectivoUSD.toFixed(2)}
                  </div>
                </div>

                <div style={styles.tarjetaGaveta}>
                  <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Bolívares en Efectivo (Bs)</small>
                  <strong style={{ fontSize: '1.25rem', color: '#0052cc', display: 'block', margin: '2px 0' }}>
                    Bs. {efectivoNetoBS.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                    Cobrado: Bs. {ventasEfectivoBS.toFixed(2)} | Gastos: -Bs. {gastosEfectivoBS.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recaudo Bancario Digital */}
            <div style={styles.bloqueSeccion}>
              <div style={styles.encabezadoBloque}>
                <strong style={{ fontSize: '0.82rem', color: '#0f2a4a' }}>Recaudo Bancario (Digital)</strong>
                <span style={{ fontSize: '0.68rem', color: '#0052cc', fontWeight: 'bold' }}>
                  Saldo Neto: Bs. {saldoDigitalNetoBS.toFixed(2)}
                </span>
              </div>

              <div style={styles.filaBancaria}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={16} color="#0052cc" />
                  <span style={{ fontSize: '0.76rem', color: '#334155', fontWeight: '600' }}>Pago Móvil Recibido:</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Bs. {pagoMovilNetoBS.toFixed(2)}</strong>
                  {gastosPagoMovilBS > 0 && (
                    <small style={{ display: 'block', fontSize: '0.6rem', color: '#dc2626' }}>
                      (Gastos: -Bs. {gastosPagoMovilBS.toFixed(2)})
                    </small>
                  )}
                </div>
              </div>

              <div style={{ ...styles.filaBancaria, marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16} color="#7c3aed" />
                  <span style={{ fontSize: '0.76rem', color: '#334155', fontWeight: '600' }}>Punto de Venta (Tarjetas):</span>
                </div>
                <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Bs. {ventasPuntoBS.toFixed(2)}</strong>
              </div>
            </div>

            {/* Botón Cerrar Turno */}
            <button type="button" onClick={ejecutarCierreTurno} style={styles.btnCerrarTurno}>
              <CheckCircle2 size={18} />
              <span>Cerrar Turno e Imprimir Reporte Z</span>
            </button>
          </div>
        )}

        {/* Pestaña Gastos */}
        {pestana === 'gastos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gastos.length === 0 ? (
              <div style={styles.vacioBox}>
                <MinusCircle size={38} color="#cbd5e1" />
                <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  No hay salidas ni gastos registrados en este turno.
                </p>
              </div>
            ) : (
              gastos.map((g) => {
                const origenTexto = g.origen === 'efectivo_usd' ? 'Efectivo ($)' : 
                                    g.origen === 'pago_movil' ? 'Pago Móvil (Bs)' : 'Efectivo (Bs)';
                const montoMostrar = g.origen === 'efectivo_usd'
                  ? `-$${Number(g.monto || g.montoUSD).toFixed(2)}`
                  : `-Bs. ${Number(g.monto || g.montoBS).toFixed(2)}`;

                return (
                  <div key={g.id} style={styles.cardGastoItem}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.82rem', color: '#0f2a4a' }}>{g.descripcion}</strong>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {g.hora} · Origen: <strong>{origenTexto}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#dc2626' }}>
                        {montoMostrar}
                      </div>
                      <small style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                        Equiv: ${Number(g.montoUSD || 0).toFixed(2)}
                      </small>
                    </div>
                    <button type="button" onClick={() => alEliminarGasto(g.id)} style={styles.btnBorrarGasto}>
                      <X size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* MODAL REGISTRAR GASTO */}
      {modalGastoAbierto && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBoxGasto}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MinusCircle size={18} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#0f2a4a' }}>
                  Registrar Salida de Dinero
                </h3>
              </div>
              <button type="button" onClick={() => setModalGastoAbierto(false)} style={styles.btnCerrarX}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={registrarNuevoGasto} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={styles.labelCampo}>Concepto / Motivo del Gasto *</label>
                <input
                  type="text"
                  placeholder="Ej: Compra de bolsas, almuerzo, hielo..."
                  value={descripcionGasto}
                  onChange={(e) => setDescripcionGasto(e.target.value)}
                  style={styles.inputModal}
                  required
                />
              </div>

              <div>
                <label style={styles.labelCampo}>¿De dónde se retira el dinero? *</label>
                <select
                  value={origenGasto}
                  onChange={(e) => setOrigenGasto(e.target.value)}
                  style={{ ...styles.inputModal, backgroundColor: '#fff' }}
                >
                  <option value="efectivo_bs">💵 Efectivo Físico en Bolívares (Bs)</option>
                  <option value="efectivo_usd">💵 Efectivo Físico en Dólares ($)</option>
                  <option value="pago_movil">📱 Transferencia / Pago Móvil (Bs)</option>
                </select>
              </div>

              <div>
                <label style={styles.labelCampo}>
                  Monto a Retirar ({origenGasto === 'efectivo_usd' ? 'USD $' : 'Bolívares Bs'}) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(e.target.value)}
                  style={styles.inputModal}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalGastoAbierto(false)} style={styles.btnCancelarGasto}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnConfirmarGasto}>
                  Confirmar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPORTE DE CIERRE Z CON ENCABEZADO COMPLETO Y MÁRGENES FLUIDOS */}
      {reporteZGenerado && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBoxReporteZ}>
            <div style={styles.barraControlZ}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={17} color="#00b050" />
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#0f2a4a' }}>
                  Cierre de Turno Z
                </h3>
              </div>
              <button type="button" onClick={() => setReporteZGenerado(null)} style={styles.btnCerrarX}>
                <X size={16} />
              </button>
            </div>

            {/* Recibo Térmico del Cierre Z */}
            <div id="area-ticket-cierre-z" style={styles.papelReporteZ}>
              <div style={{ textAlign: 'center', lineHeight: 1.35 }}>
                {configEmpresa?.logo && (
                  <img src={configEmpresa.logo} alt="Logo" style={styles.logoTicketZ} />
                )}
                <h3 style={{ margin: '0 0 2px 0', fontSize: '0.94rem', fontWeight: '900', color: '#0f2a4a' }}>
                  {(configEmpresa?.nombre || 'FACILITO POS').toUpperCase()}
                </h3>
                {configEmpresa?.rif && <div style={{ fontSize: '0.66rem', color: '#475569' }}>RIF: {configEmpresa.rif}</div>}
                {configEmpresa?.direccion && <div style={{ fontSize: '0.64rem', color: '#64748b' }}>{configEmpresa.direccion}</div>}
                {configEmpresa?.telefono && <div style={{ fontSize: '0.64rem', color: '#64748b' }}>TEL: {configEmpresa.telefono}</div>}
                
                <div style={styles.badgeCorteZTag}>
                  REPORTE FISCAL Y CONTABLE DE CIERRE (CORTE Z)
                </div>
              </div>

              <div style={styles.lineaDobleCorte} />

              <div style={styles.infoReporteZ}>
                <div style={styles.filaZMeta}>
                  <span>FECHA / HORA:</span>
                  <strong>{reporteZGenerado.fechaHora}</strong>
                </div>
                <div style={styles.filaZMeta}>
                  <span>RESPONSABLE:</span>
                  <strong>{reporteZGenerado.cajero}</strong>
                </div>
                <div style={styles.filaZMeta}>
                  <span>CAJA / TERMINAL:</span>
                  <strong>{reporteZGenerado.caja}</strong>
                </div>
                <div style={styles.filaZMeta}>
                  <span>VENTAS REALIZADAS:</span>
                  <strong>{reporteZGenerado.ventasCount} ticket(s)</strong>
                </div>
                <div style={styles.filaZMeta}>
                  <span>TASA BCV DE CIERRE:</span>
                  <strong>Bs. {reporteZGenerado.tasa.toFixed(2)}</strong>
                </div>
              </div>

              <div style={styles.lineaDobleCorte} />

              {/* Bloque 1: Ventas Totales */}
              <div style={styles.seccionDesgloseZ}>
                <strong style={{ fontSize: '0.72rem', color: '#0f2a4a', display: 'block', marginBottom: '3px' }}>
                  1. VENTAS TOTALES FACTURADAS
                </strong>
                <div style={styles.filaZ}>
                  <span>Total en Divisas ($):</span>
                  <strong style={{ color: '#00b050' }}>${reporteZGenerado.totalVentasUSD.toFixed(2)}</strong>
                </div>
                <div style={styles.filaZ}>
                  <span>Total en Bolívares (Bs):</span>
                  <strong style={{ color: '#0052cc' }}>Bs. {reporteZGenerado.totalVentasBS.toFixed(2)}</strong>
                </div>

                <div style={styles.lineaFinaZ} />

                {/* Bloque 2: Efectivo en Gaveta */}
                <strong style={{ fontSize: '0.72rem', color: '#0f2a4a', display: 'block', margin: '4px 0 2px 0' }}>
                  2. EFECTIVO FÍSICO EN GAVETA (NETO)
                </strong>
                <div style={styles.filaZ}>
                  <span>Dólares en Efectivo ($):</span>
                  <strong style={{ color: '#00b050' }}>${reporteZGenerado.efectivoNetoUSD.toFixed(2)}</strong>
                </div>
                <div style={styles.filaZ}>
                  <span>Bolívares en Efectivo (Bs):</span>
                  <strong style={{ color: '#0052cc' }}>Bs. {reporteZGenerado.efectivoNetoBS.toFixed(2)}</strong>
                </div>

                <div style={styles.lineaFinaZ} />

                {/* Bloque 3: Bancos */}
                <strong style={{ fontSize: '0.72rem', color: '#0f2a4a', display: 'block', margin: '4px 0 2px 0' }}>
                  3. RECAUDO BANCARIO (DIGITAL)
                </strong>
                <div style={styles.filaZ}>
                  <span>Pago Móvil Recibido:</span>
                  <strong>Bs. {reporteZGenerado.pagoMovilNetoBS.toFixed(2)}</strong>
                </div>
                <div style={styles.filaZ}>
                  <span>Punto Débito (Tarjetas):</span>
                  <strong>Bs. {reporteZGenerado.ventasPuntoBS.toFixed(2)}</strong>
                </div>

                {/* Bloque 4: Gastos Detallados */}
                {reporteZGenerado.gastosDetalle && reporteZGenerado.gastosDetalle.length > 0 && (
                  <>
                    <div style={styles.lineaFinaZ} />
                    <strong style={{ fontSize: '0.72rem', color: '#dc2626', display: 'block', margin: '4px 0 2px 0' }}>
                      4. SALIDAS Y GASTOS DEL TURNO ({reporteZGenerado.gastosDetalle.length})
                    </strong>
                    {reporteZGenerado.gastosDetalle.map((g, idx) => {
                      const montoTxt = g.origen === 'efectivo_usd' ? `$${Number(g.monto).toFixed(2)}` : `Bs. ${Number(g.monto).toFixed(2)}`;
                      return (
                        <div key={idx} style={styles.filaZ}>
                          <span style={{ fontSize: '0.66rem', color: '#475569' }}>• {g.descripcion}:</span>
                          <strong style={{ fontSize: '0.68rem', color: '#dc2626' }}>-{montoTxt}</strong>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div style={styles.lineaDobleCorte} />

              <div style={{ textAlign: 'center', fontSize: '0.64rem', color: '#64748b' }}>
                <ShieldCheck size={13} color="#00b050" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                <span>Auditoría de Turno Completada y Verificada</span>
              </div>
            </div>

            {/* Acciones */}
            <div style={styles.accionesReporteZFila}>
              <button type="button" onClick={() => window.print()} style={styles.btnImprimirZ}>
                <Printer size={15} />
                <span>Imprimir</span>
              </button>
              <button type="button" onClick={compartirReporteWhatsApp} style={styles.btnWhatsAppZ}>
                <Share2 size={15} />
                <span>WhatsApp</span>
              </button>
              <button type="button" onClick={finalizarCierreDefinitivo} style={styles.btnFinalizarCierre}>
                <span>Finalizar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    padding: '10px 14px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  btnAtras: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#334155'
  },
  tituloHeader: {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#0f2a4a'
  },
  btnRegistrarGastoTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  tabsFila: {
    display: 'flex',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0
  },
  btnTab: {
    flex: 1,
    padding: '10px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  cuerpo: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tarjetaVentasTurno: {
    backgroundColor: '#0f2a4a',
    borderRadius: '16px',
    padding: '12px 14px',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(15, 42, 74, 0.15)'
  },
  etiquetaTotalVentas: {
    fontSize: '0.66rem',
    fontWeight: '800',
    letterSpacing: '0.8px',
    color: '#94a3b8'
  },
  badgeVentasCount: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.66rem',
    fontWeight: 'bold'
  },
  cifraUSD: {
    fontSize: '1.65rem',
    fontWeight: '900',
    color: '#00b050',
    lineHeight: 1.1
  },
  cifraBS: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#bfdbfe'
  },
  bloqueSeccion: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '12px'
  },
  encabezadoBloque: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  gridGaveta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  tarjetaGaveta: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '10px',
    border: '1px solid #e2e8f0'
  },
  filaBancaria: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9'
  },
  btnCerrarTurno: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)',
    marginTop: '2px'
  },
  vacioBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  },
  cardGastoItem: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  btnBorrarGasto: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    padding: 0
  },
  overlayModal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    boxSizing: 'border-box',
    zIndex: 99999999
  },
  modalBoxGasto: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    maxWidth: '340px',
    width: '100%',
    padding: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalBoxReporteZ: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '360px',
    width: '100%',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
    overflow: 'hidden'
  },
  barraControlZ: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
    flexShrink: 0
  },
  btnCerrarX: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  labelCampo: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '2px',
    display: 'block'
  },
  inputModal: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.82rem',
    outline: 'none'
  },
  btnCancelarGasto: {
    flex: 1,
    padding: '9px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnConfirmarGasto: {
    flex: 1.4,
    padding: '9px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  papelReporteZ: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    padding: '14px 14px 20px 14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '0.72rem',
    color: '#0f172a'
  },
  logoTicketZ: {
    maxHeight: '48px',
    maxWidth: '120px',
    objectFit: 'contain',
    marginBottom: '6px'
  },
  badgeCorteZTag: {
    display: 'inline-block',
    fontSize: '0.62rem',
    color: '#0052cc',
    fontWeight: 'bold',
    marginTop: '4px',
    backgroundColor: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '6px'
  },
  lineaDobleCorte: {
    borderTop: '2px dashed #94a3b8',
    margin: '8px 0'
  },
  lineaFinaZ: {
    borderTop: '1px solid #e2e8f0',
    margin: '6px 0'
  },
  infoReporteZ: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '0.68rem',
    color: '#1e293b'
  },
  filaZMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  seccionDesgloseZ: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  filaZ: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem'
  },
  accionesReporteZFila: {
    padding: '10px 14px 14px 14px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    gap: '6px',
    flexShrink: 0
  },
  btnImprimirZ: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnWhatsAppZ: {
    flex: 1.2,
    padding: '10px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnFinalizarCierre: {
    padding: '10px 14px',
    backgroundColor: '#f1f5f9',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
