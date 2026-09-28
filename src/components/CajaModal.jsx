import React, { useState } from 'react';
import { 
  ArrowLeft, Receipt, DollarSign, Smartphone, CreditCard, Banknote, 
  MinusCircle, PlusCircle, CheckCircle2, AlertCircle, Printer, X
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
  const [pestana, setPestana] = useState('arqueo'); // 'arqueo' | 'gastos'
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [descripcionGasto, setDescripcionGasto] = useState('');
  const [montoGastoUSD, setMontoGastoUSD] = useState('');
  const [monedaGasto, setMonedaGasto] = useState('USD');

  const tasa = Number(tasaCambio) || 1;

  // Filtrar ventas del turno actual (por usuario activo o todas las de la sesión)
  const ventasTurno = transacciones.filter(t => {
    if (!usuarioActivo) return true;
    return !t.cajero || t.cajero === usuarioActivo.nombre || usuarioActivo.rol === 'dueno';
  });

  // Cálculos de Totales por Método de Pago
  let totalVentasUSD = 0;
  let totalVentasBS = 0;
  let efectivoUSD = 0;
  let efectivoBS = 0;
  let pagoMovilBS = 0;
  let puntoVentaBS = 0;

  ventasTurno.forEach(v => {
    const usd = Number(v.totalUSD || 0);
    const bs = Number(v.totalBS || (usd * tasa));
    totalVentasUSD += usd;
    totalVentasBS += bs;

    const met = (v.metodoPago || '').toLowerCase();
    if (met.includes('usd') || met === 'efectivo_usd') {
      efectivoUSD += usd;
    } else if (met.includes('efectivo_bs') || met === 'efectivo_bs') {
      efectivoBS += bs;
    } else if (met.includes('movil') || met === 'pago_movil') {
      pagoMovilBS += bs;
    } else if (met.includes('punto') || met === 'tarjeta' || met === 'punto_venta') {
      puntoVentaBS += bs;
    } else {
      // Si tiene desglose de pagos múltiples
      if (Array.isArray(v.pagos)) {
        v.pagos.forEach(p => {
          const pMet = (p.metodo || '').toLowerCase();
          if (pMet.includes('usd')) efectivoUSD += Number(p.montoUSD || 0);
          else if (pMet.includes('movil')) pagoMovilBS += Number(p.montoBS || 0);
          else if (pMet.includes('punto')) puntoVentaBS += Number(p.montoBS || 0);
          else efectivoBS += Number(p.montoBS || 0);
        });
      } else {
        efectivoUSD += usd;
      }
    }
  });

  // Gastos
  const totalGastosUSD = gastos.reduce((acc, g) => acc + Number(g.montoUSD || 0), 0);
  const totalGastosBS = gastos.reduce((acc, g) => acc + Number(g.montoBS || 0), 0);

  const efectivoFisicoNetoUSD = Math.max(0, efectivoUSD - totalGastosUSD);
  const efectivoFisicoNetoBS = Math.max(0, efectivoBS - totalGastosBS);

  const guardarGasto = (e) => {
    e.preventDefault();
    const val = parseFloat(montoGastoUSD) || 0;
    if (val <= 0 || !descripcionGasto.trim()) return alert('Ingresa descripción y monto válidos');

    const nuevoGasto = {
      id: 'gst_' + Date.now(),
      descripcion: descripcionGasto.trim(),
      montoUSD: monedaGasto === 'USD' ? val : (val / tasa),
      montoBS: monedaGasto === 'BS' ? val : (val * tasa),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      usuario: usuarioActivo?.nombre || 'Usuario'
    };

    if (alRegistrarGasto) alRegistrarGasto(nuevoGasto);
    setDescripcionGasto('');
    setMontoGastoUSD('');
    setModalGastoAbierto(false);
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Caja y Cuadre de Turno (Z)</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            Responsable: <strong>{usuarioActivo?.nombre || 'Admin'}</strong> · {cajaActiva?.nombre || 'Caja 01'}
          </small>
        </div>
        <button type="button" onClick={() => setModalGastoAbierto(true)} style={styles.btnGastoTop}>
          <MinusCircle size={14} />
          <span>Registrar Gasto</span>
        </button>
      </header>

      {/* Pestañas Arqueo / Gastos */}
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
          <Receipt size={16} />
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
          <MinusCircle size={16} />
          <span>Salidas y Gastos ({gastos.length})</span>
        </button>
      </div>

      <main style={styles.cuerpo}>
        {pestana === 'arqueo' && (
          <div style={styles.seccionArqueo}>
            {/* Tarjeta Resumen Total Ventas */}
            <div style={styles.cardTotalVentas}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#0f2a4a' }}>VENTAS DE TU TURNO</span>
                <span style={styles.badgeVentasCount}>{ventasTurno.length} ventas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <div>
                  <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Divisa ($)</small>
                  <div style={styles.montoPrincipalUSD}>${totalVentasUSD.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Total en Bolívares</small>
                  <div style={styles.montoPrincipalBS}>Bs. {totalVentasBS.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Efectivo Físico en Gaveta */}
            <div style={styles.bloqueMetodos}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Efectivo Físico en Gaveta</strong>
                <span style={{ fontSize: '0.7rem', color: '#00b050', fontWeight: 'bold' }}>Billetes Físicos</span>
              </div>

              <div style={styles.gridGaveta}>
                <div style={styles.itemGavetaCard}>
                  <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Dólares en Efectivo ($)</small>
                  <strong style={{ fontSize: '1.25rem', color: '#00b050', display: 'block', margin: '3px 0' }}>
                    ${efectivoFisicoNetoUSD.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                    Cobrado: ${efectivoUSD.toFixed(2)} | Gastos: -${totalGastosUSD.toFixed(2)}
                  </div>
                </div>

                <div style={styles.itemGavetaCard}>
                  <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Bolívares en Efectivo (Bs)</small>
                  <strong style={{ fontSize: '1.25rem', color: '#0052cc', display: 'block', margin: '3px 0' }}>
                    Bs. {efectivoFisicoNetoBS.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                    Cobrado: Bs. {efectivoBS.toFixed(2)} | Gastos: -Bs. {totalGastosBS.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recaudo Digital / Bancario */}
            <div style={styles.bloqueMetodos}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Recaudo Bancario (Digital)</strong>
                <span style={{ fontSize: '0.7rem', color: '#0052cc', fontWeight: 'bold' }}>
                  Saldo Neto: Bs. {(pagoMovilBS + puntoVentaBS).toFixed(2)}
                </span>
              </div>

              <div style={styles.filaBancaria}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={17} color="#0052cc" />
                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '600' }}>Pago Móvil Recibido:</span>
                </div>
                <strong style={{ fontSize: '0.86rem', color: '#0f2a4a' }}>Bs. {pagoMovilBS.toFixed(2)}</strong>
              </div>

              <div style={{ ...styles.filaBancaria, marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={17} color="#d97706" />
                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '600' }}>Punto de Venta (Tarjetas):</span>
                </div>
                <strong style={{ fontSize: '0.86rem', color: '#0f2a4a' }}>Bs. {puntoVentaBS.toFixed(2)}</strong>
              </div>
            </div>

            {/* Botón de Cierre de Turno */}
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Cerrar turno e imprimir reporte de Cierre Z?')) {
                  if (alCerrarTurno) alCerrarTurno();
                }
              }}
              style={styles.btnCerrarTurno}
            >
              <CheckCircle2 size={18} />
              <span>Cerrar Turno e Imprimir Reporte Z</span>
            </button>
          </div>
        )}

        {pestana === 'gastos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gastos.length === 0 ? (
              <div style={styles.vacioGastos}>
                <MinusCircle size={36} color="#cbd5e1" />
                <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>No hay salidas de dinero registradas en este turno.</p>
              </div>
            ) : (
              gastos.map((g) => (
                <div key={g.id} style={styles.cardGastoItem}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>{g.descripcion}</strong>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {g.hora} · Por {g.usuario}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#dc2626' }}>
                      -${Number(g.montoUSD).toFixed(2)}
                    </div>
                    <small style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Bs. {Number(g.montoBS).toFixed(2)}
                    </small>
                  </div>
                  <button type="button" onClick={() => alEliminarGasto(g.id)} style={styles.btnBorrarGasto}>
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal Registrar Gasto */}
      {modalGastoAbierto && (
        <div style={styles.overlayModal}>
          <div style={styles.modalGastoBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '0.92rem', color: '#0f2a4a' }}>Registrar Salida / Gasto</strong>
              <button type="button" onClick={() => setModalGastoAbierto(false)} style={styles.btnCerrarModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={guardarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={styles.labelForm}>Concepto del Gasto</label>
                <input
                  type="text"
                  placeholder="Ej. Almuerzo, Bolsas, Pago de hielo"
                  value={descripcionGasto}
                  onChange={(e) => setDescripcionGasto(e.target.value)}
                  style={styles.inputGasto}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={styles.labelForm}>Moneda</label>
                  <select
                    value={monedaGasto}
                    onChange={(e) => setMonedaGasto(e.target.value)}
                    style={{ ...styles.inputGasto, backgroundColor: '#fff' }}
                  >
                    <option value="USD">Dólares ($)</option>
                    <option value="BS">Bolívares (Bs)</option>
                  </select>
                </div>
                <div>
                  <label style={styles.labelForm}>Monto</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={montoGastoUSD}
                    onChange={(e) => setMontoGastoUSD(e.target.value)}
                    style={styles.inputGasto}
                    required
                  />
                </div>
              </div>

              <button type="submit" style={styles.btnGuardarGastoConfirm}>
                Confirmar Salida de Caja
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  btnAtras: { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155' },
  tituloHeader: { margin: 0, fontSize: '0.96rem', fontWeight: '800', color: '#0f2a4a' },
  btnGastoTop: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 10px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' },
  tabsFila: { display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnTab: { flex: 1, padding: '11px', background: 'none', border: 'none', borderBottom: '3px solid transparent', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' },
  cuerpo: { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  seccionArqueo: { display: 'flex', flexDirection: 'column', gap: '12px' },
  cardTotalVentas: { backgroundColor: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe', padding: '12px 14px' },
  badgeVentasCount: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold' },
  montoPrincipalUSD: { fontSize: '1.4rem', fontWeight: '900', color: '#0f2a4a' },
  montoPrincipalBS: { fontSize: '1.1rem', fontWeight: '800', color: '#0052cc' },
  bloqueMetodos: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px' },
  gridGaveta: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  itemGavetaCard: { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '10px', border: '1px solid #e2e8f0' },
  filaBancaria: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' },
  btnCerrarTurno: { width: '100%', padding: '13px', backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)' },
  vacioGastos: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' },
  cardGastoItem: { backgroundColor: '#fff', borderRadius: '12px', padding: '10px 12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' },
  btnBorrarGasto: { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 },
  overlayModal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999999 },
  modalGastoBox: { backgroundColor: '#fff', borderRadius: '20px', maxWidth: '320px', width: '100%', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  btnCerrarModal: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  labelForm: { fontSize: '0.7rem', fontWeight: 'bold', color: '#475569', marginBottom: '2px', display: 'block' },
  inputGasto: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none' },
  btnGuardarGastoConfirm: { width: '100%', padding: '10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }
};
