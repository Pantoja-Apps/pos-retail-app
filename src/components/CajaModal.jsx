import React, { useState } from 'react';
import { ArrowLeft, Wallet, TrendingDown, DollarSign, Plus, Trash2, Printer, CheckCircle2 } from 'lucide-react';

export default function CajaModal({
  transacciones = [],
  gastos = [],
  tasaCambio = 1,
  configEmpresa = {},
  usuarioActivo = {},
  alRegistrarGasto = () => {},
  alEliminarGasto = () => {},
  alCerrarTurno = () => {},
  alVolver = () => {}
}) {
  const [tab, setTab] = useState('arqueo');
  const [modalGasto, setModalGasto] = useState(false);
  const [motivoGasto, setMotivoGasto] = useState('');
  const [montoGasto, setMontoGasto] = useState('');
  const [monedaGasto, setMonedaGasto] = useState('USD');

  const esDueno = usuarioActivo?.rol === 'dueno';

  // REGLA DE ARQUEO ESTRICTO:
  // Si es cajero, solo se calculan las ventas cobradas por él mismo.
  const ventasTurno = transacciones.filter(t => {
    if (t.anulada || t.tipo !== 'venta') return false;
    if (esDueno) return true;
    if (!usuarioActivo?.nombre) return false;
    const cobrador = (t.cajeroCobrador || '').toLowerCase();
    return cobrador.includes(usuarioActivo.nombre.toLowerCase().trim());
  });

  const tasaNum = parseFloat(tasaCambio) || 1;

  // Totales de ventas del turno
  const totalVentasUSD = ventasTurno.reduce((acc, t) => acc + (parseFloat(t.totalUSD) || 0), 0);
  const totalVentasBS = ventasTurno.reduce((acc, t) => acc + (parseFloat(t.totalBS) || (parseFloat(t.totalUSD) * tasaNum)), 0);

  // Desglose de pagos cobrados
  let efectivoUSD = 0;
  let efectivoBS = 0;
  let pagoMovilBS = 0;
  let puntoBS = 0;

  ventasTurno.forEach(v => {
    const pagos = v.pagos || {};
    efectivoUSD += parseFloat(pagos.dolaresEfectivo || 0);
    efectivoBS += parseFloat(pagos.bolivaresEfectivo || 0);
    pagoMovilBS += parseFloat(pagos.pagoMovil || 0);
    puntoBS += parseFloat(pagos.puntoVenta || 0);
  });

  // Gastos
  const gastosUSD = gastos.filter(g => g.moneda === 'USD').reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);
  const gastosBS = gastos.filter(g => g.moneda === 'BS').reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);

  const efectivoUSDNeto = Math.max(0, efectivoUSD - gastosUSD);
  const efectivoBSNeto = Math.max(0, efectivoBS - gastosBS);
  const totalDigitalBS = pagoMovilBS + puntoBS;

  const agregarGasto = (e) => {
    e.preventDefault();
    if (!motivoGasto.trim() || !montoGasto) return alert('Completa el motivo y monto del gasto');

    alRegistrarGasto({
      id: Date.now(),
      motivo: motivoGasto.trim(),
      monto: parseFloat(montoGasto),
      moneda: monedaGasto,
      cajero: usuarioActivo?.nombre || 'Cajero',
      fecha: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    });

    setMotivoGasto('');
    setMontoGasto('');
    setModalGasto(false);
  };

  const ejecutarCierreTurno = () => {
    if (confirm(`¿Confirmas cerrar el turno de ${usuarioActivo?.nombre}? El registro de ventas de este turno se reiniciará.`)) {
      alCerrarTurno();
      alert('¡Turno cerrado y arqueo registrado con éxito!');
      alVolver();
    }
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack} title="Volver al POS">
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>Caja y Cuadre de Turno (Z)</h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
              Responsable: <strong>{usuarioActivo?.nombre || 'Cajero'}</strong>
            </small>
          </div>
        </div>

        <button type="button" onClick={() => setModalGasto(true)} style={styles.btnGastoMini}>
          <TrendingDown size={14} color="#dc2626" />
          <span>Registrar Gasto</span>
        </button>
      </header>

      {/* TABS */}
      <div style={styles.navTabs}>
        <button
          type="button"
          onClick={() => setTab('arqueo')}
          style={{
            ...styles.btnTab,
            borderBottom: tab === 'arqueo' ? '2.5px solid #0052cc' : 'none',
            color: tab === 'arqueo' ? '#0052cc' : '#64748b'
          }}
        >
          <Wallet size={15} /> Arqueo de Caja (Z)
        </button>
        <button
          type="button"
          onClick={() => setTab('gastos')}
          style={{
            ...styles.btnTab,
            borderBottom: tab === 'gastos' ? '2.5px solid #dc2626' : 'none',
            color: tab === 'gastos' ? '#dc2626' : '#64748b'
          }}
        >
          <TrendingDown size={15} /> Salidas y Gastos ({gastos.length})
        </button>
      </div>

      <div style={styles.cuerpoScroll}>
        {tab === 'arqueo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* TOTALES DE VENTAS DEL TURNO */}
            <div style={styles.cardResumenTotal}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase' }}>
                  Ventas de tu Turno
                </span>
                <span style={styles.badgeVentasCount}>{ventasTurno.length} ventas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px' }}>
                <div>
                  <small style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Divisa ($)</small>
                  <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>${totalVentasUSD.toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total en Bolívares</small>
                  <strong style={{ fontSize: '1.15rem', color: '#0052cc' }}>Bs. {totalVentasBS.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* EFECTIVO EN GAVETA */}
            <div style={styles.boxSeccion}>
              <div style={styles.tituloSeccion}>
                <span>Efectivo Físico en Gaveta</span>
                <small style={{ color: '#16a34a', fontWeight: 'bold' }}>Billetes Físicos</small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div style={styles.tarjetaMoneda}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Dólares en Efectivo ($)</span>
                  <strong style={{ fontSize: '1.2rem', color: '#16a34a', marginTop: '2px', display: 'block' }}>
                    ${efectivoUSDNeto.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px' }}>
                    Cobrado: ${efectivoUSD.toFixed(2)}<br />
                    Gastos: -${gastosUSD.toFixed(2)}
                  </div>
                </div>

                <div style={styles.tarjetaMoneda}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Bolívares en Efectivo (Bs)</span>
                  <strong style={{ fontSize: '1.1rem', color: '#0052cc', marginTop: '2px', display: 'block' }}>
                    Bs. {efectivoBSNeto.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px' }}>
                    Cobrado: Bs. {efectivoBS.toFixed(2)}<br />
                    Gastos: -Bs. {gastosBS.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* RECAUDO BANCARIO DIGITAL */}
            <div style={styles.boxSeccion}>
              <div style={styles.tituloSeccion}>
                <span>Recaudo Bancario (Digital)</span>
                <span style={{ color: '#0052cc', fontWeight: 'bold' }}>Saldo Neto: Bs. {totalDigitalBS.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                <div style={styles.filaDigital}>
                  <span style={{ fontSize: '0.74rem', color: '#475569' }}>📱 Pago Móvil Recibido:</span>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Bs. {pagoMovilBS.toFixed(2)}</strong>
                </div>

                <div style={styles.filaDigital}>
                  <span style={{ fontSize: '0.74rem', color: '#475569' }}>💳 Punto de Venta (Tarjetas):</span>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Bs. {puntoBS.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* BOTÓN CIERRE DE TURNO */}
            <button type="button" onClick={ejecutarCierreTurno} style={styles.btnCerrarTurno}>
              <CheckCircle2 size={16} /> Cerrar Turno e Imprimir Reporte Z
            </button>

          </div>
        )}

        {tab === 'gastos' && (
          <div>
            {gastos.length === 0 ? (
              <div style={styles.vacio}>
                <TrendingDown size={40} color="#cbd5e1" />
                <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>No se han registrado salidas de dinero ni gastos.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gastos.map(g => (
                  <div key={g.id} style={styles.cardGasto}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{g.motivo}</strong>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        Hora: {g.fecha} • Por: {g.cajero}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.96rem', color: '#dc2626' }}>
                        -{g.moneda === 'USD' ? `$${g.monto.toFixed(2)}` : `Bs. ${g.monto.toFixed(2)}`}
                      </strong>
                      <button type="button" onClick={() => alEliminarGasto(g.id)} style={styles.btnEliminarGasto} title="Eliminar gasto">
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modalGasto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>Registrar Gasto de Caja</h3>
            <form onSubmit={agregarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={styles.lbl}>Motivo de la Salida de Dinero *</label>
                <input
                  type="text"
                  placeholder="Ej: Pago de hielo, almuerzo, bolsas..."
                  value={motivoGasto}
                  onChange={(e) => setMotivoGasto(e.target.value)}
                  style={styles.inputModal}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={styles.lbl}>Moneda *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setMonedaGasto('USD')}
                    style={{
                      ...styles.btnMoneda,
                      backgroundColor: monedaGasto === 'USD' ? '#0052cc' : '#f1f5f9',
                      color: monedaGasto === 'USD' ? '#fff' : '#475569'
                    }}
                  >
                    Dólares ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonedaGasto('BS')}
                    style={{
                      ...styles.btnMoneda,
                      backgroundColor: monedaGasto === 'BS' ? '#0052cc' : '#f1f5f9',
                      color: monedaGasto === 'BS' ? '#fff' : '#475569'
                    }}
                  >
                    Bolívares (Bs)
                  </button>
                </div>
              </div>

              <div>
                <label style={styles.lbl}>Monto *</label>
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

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setModalGasto(false)} style={styles.btnCancelarGasto}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnGuardarGasto}>
                  Registrar Salida
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
  header: { padding: '10px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnGastoMini: { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 8px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  
  navTabs: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnTab: { padding: '10px 0', background: 'none', border: 'none', fontSize: '0.76rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },

  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  cardResumenTotal: { backgroundColor: '#eff6ff', borderRadius: '14px', border: '1px solid #bfdbfe', padding: '12px 14px' },
  badgeVentasCount: { backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.66rem', fontWeight: 'bold', padding: '2px 7px', borderRadius: '12px' },

  boxSeccion: { backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '12px 14px', marginTop: '10px' },
  tituloSeccion: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#0f172a', fontWeight: 'bold' },
  tarjetaMoneda: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' },
  filaDigital: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' },

  btnCerrarTurno: { marginTop: '14px', width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.86rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' },

  vacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: '#94a3b8' },
  cardGasto: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnEliminarGasto: { background: '#fee2e2', border: 'none', borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBox: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '340px', padding: '16px' },
  lbl: { fontSize: '0.72rem', fontWeight: 'bold', color: '#475569' },
  inputModal: { width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', marginTop: '3px' },
  btnMoneda: { padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCancelarGasto: { flex: 1, padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', cursor: 'pointer' },
  btnGuardarGasto: { flex: 1, padding: '10px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }
};
