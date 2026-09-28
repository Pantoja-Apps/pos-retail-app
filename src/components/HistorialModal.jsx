import React, { useState } from 'react';
import { 
  ArrowLeft, Search, Receipt, Eye, Ban, CheckCircle2, 
  X, Calendar, DollarSign, AlertTriangle, Filter
} from 'lucide-react';

export default function HistorialModal({
  transacciones = [],
  tasaCambio = 855.66,
  usuarioActivo,
  cajaActiva,
  alVerTicket,
  alAnularVenta,
  alVolver
}) {
  const [busqueda, setBusqueda] = useState('');
  const [pestana, setPestana] = useState('activas'); // 'activas' | 'anuladas'
  const [filtroTurno, setFiltroTurno] = useState('todas'); // 'todas' | 'turno_activo'
  const [modalAnularId, setModalAnularId] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const tasa = Number(tasaCambio) || 1;

  // Filtrado de activas vs anuladas
  const ventasActivas = transacciones.filter(t => !t.anulada);
  const ventasAnuladas = transacciones.filter(t => Boolean(t.anulada));

  // Aplicar filtro de turno si se solicita
  const listaBase = pestana === 'activas' 
    ? (filtroTurno === 'turno_activo' ? ventasActivas.filter(t => !t.cerradoEnTurno) : ventasActivas)
    : ventasAnuladas;

  // Totales
  const totalUSD = listaBase.reduce((acc, t) => acc + Number(t.totalUSD || 0), 0);
  const totalBS = listaBase.reduce((acc, t) => acc + Number(t.totalBS || (Number(t.totalUSD || 0) * tasa)), 0);

  const listaFiltrada = listaBase.filter(t => {
    const q = busqueda.toLowerCase().trim();
    const matchId = (t.correlativo || t.id || '').toLowerCase().includes(q);
    const matchCliente = (t.cliente?.nombre || t.cliente_nombre || '').toLowerCase().includes(q);
    const matchDoc = (t.cliente?.doc || t.cliente_doc || '').toLowerCase().includes(q);
    const matchMetodo = (t.metodoPago || '').toLowerCase().includes(q);
    return matchId || matchCliente || matchDoc || matchMetodo;
  });

  const formatearFechaHora = (fechaRaw) => {
    if (!fechaRaw) return 'Reciente';
    try {
      const d = new Date(fechaRaw);
      if (isNaN(d.getTime())) return String(fechaRaw);
      return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(fechaRaw);
    }
  };

  const confirmarAnulacion = (e) => {
    e.preventDefault();
    if (!motivoAnulacion.trim()) return alert('Ingresa el motivo de anulación');

    if (alAnularVenta) alAnularVenta(modalAnularId, motivoAnulacion.trim());
    setModalAnularId(null);
    setMotivoAnulacion('');
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* Cabecera */}
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Historial y Registro de Ventas</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            Auditoría de facturación · Tasa BCV: <strong>Bs. {tasa.toFixed(2)}</strong>
          </small>
        </div>
        <div style={{ width: '32px' }} />
      </header>

      {/* Pestañas */}
      <div style={styles.tabsFila}>
        <button
          type="button"
          onClick={() => setPestana('activas')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'activas' ? '#0052cc' : 'transparent',
            color: pestana === 'activas' ? '#0052cc' : '#64748b'
          }}
        >
          <Receipt size={15} />
          <span>Ventas Activas ({ventasActivas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPestana('anuladas')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'anuladas' ? '#dc2626' : 'transparent',
            color: pestana === 'anuladas' ? '#dc2626' : '#64748b'
          }}
        >
          <Ban size={15} />
          <span>Facturas Anuladas ({ventasAnuladas.length})</span>
        </button>
      </div>

      <main style={styles.cuerpo}>
        {/* Tarjeta de Resumen Total */}
        <div style={styles.tarjetaTotal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.etiquetaTotal}>
              {filtroTurno === 'turno_activo' ? 'TOTAL TURNO ABIERTO' : 'TOTAL FACTURADO (GLOBAL)'}
            </span>
            <span style={styles.badgeFacturas}>{listaBase.length} Factura(s)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
            <div style={styles.cifraUSD}>${totalUSD.toFixed(2)}</div>
            <div style={styles.cifraBS}>Bs. {totalBS.toFixed(2)}</div>
          </div>
        </div>

        {/* Selector de Filtro de Turno */}
        {pestana === 'activas' && (
          <div style={styles.filaFiltroTurnos}>
            <button
              type="button"
              onClick={() => setFiltroTurno('todas')}
              style={{
                ...styles.btnFiltroTurno,
                backgroundColor: filtroTurno === 'todas' ? '#0f2a4a' : '#f1f5f9',
                color: filtroTurno === 'todas' ? '#fff' : '#64748b'
              }}
            >
              Todas las Ventas (Histórico)
            </button>
            <button
              type="button"
              onClick={() => setFiltroTurno('turno_activo')}
              style={{
                ...styles.btnFiltroTurno,
                backgroundColor: filtroTurno === 'turno_activo' ? '#00b050' : '#f1f5f9',
                color: filtroTurno === 'turno_activo' ? '#fff' : '#64748b'
              }}
            >
              Solo Turno Actual Abierto
            </button>
          </div>
        )}

        {/* Buscador */}
        <div style={styles.cajaBuscador}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por # ticket, cliente, cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBusqueda}
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} style={styles.btnLimpiarBusqueda}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Lista de Facturas */}
        {listaFiltrada.length === 0 ? (
          <div style={styles.vacioBox}>
            <Receipt size={42} color="#cbd5e1" />
            <p style={{ margin: '8px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
              No se encontraron ventas para este filtro.
            </p>
          </div>
        ) : (
          <div style={styles.listaGrid}>
            {listaFiltrada.map((v) => {
              const esAnulada = Boolean(v.anulada);
              const totalVentaUSD = Number(v.totalUSD || 0);
              const totalVentaBS = Number(v.totalBS || (totalVentaUSD * tasa));
              const correlativoMostrar = v.correlativo ? `#${v.correlativo}` : `#${String(v.id).slice(-6)}`;
              const nombreCliente = v.cliente?.nombre || v.cliente_nombre || 'Consumidor Final';
              const docCliente = v.cliente?.doc || v.cliente_doc || '';

              return (
                <div 
                  key={v.id} 
                  style={{
                    ...styles.cardFactura,
                    borderLeft: esAnulada ? '4px solid #dc2626' : (v.cerradoEnTurno ? '4px solid #64748b' : '4px solid #00b050')
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={styles.correlativoText}>Ticket {correlativoMostrar}</strong>
                        {esAnulada ? (
                          <span style={styles.badgeAnulada}>ANULADA</span>
                        ) : v.cerradoEnTurno ? (
                          <span style={styles.badgeCerrado}>Turno Cerrado</span>
                        ) : (
                          <span style={styles.badgeMetodo}>{v.metodoPago || 'Efectivo'}</span>
                        )}
                      </div>
                      <div style={styles.clienteText}>
                        Cliente: <strong>{nombreCliente}</strong> {docCliente && `(${docCliente})`}
                      </div>
                      <div style={styles.horaText}>
                        Fecha: {formatearFechaHora(v.fecha || v.fechaFormateada)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ ...styles.montoUSDCard, color: esAnulada ? '#94a3b8' : '#00b050' }}>
                        ${totalVentaUSD.toFixed(2)}
                      </div>
                      <small style={styles.montoBSCard}>
                        Bs. {totalVentaBS.toFixed(2)}
                      </small>
                    </div>
                  </div>

                  {esAnulada && v.motivoAnulacion && (
                    <div style={styles.cajaMotivoAnulada}>
                      <strong>Motivo:</strong> {v.motivoAnulacion}
                    </div>
                  )}

                  <div style={styles.accionesFila}>
                    <button type="button" onClick={() => alVerTicket(v)} style={styles.btnVerTicket}>
                      <Eye size={14} />
                      <span>Ver Comprobante</span>
                    </button>

                    {!esAnulada && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalAnularId(v.id);
                          setMotivoAnulacion('');
                        }}
                        style={styles.btnAnular}
                      >
                        <Ban size={14} />
                        <span>Anular Factura</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal para Anular */}
      {modalAnularId && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: '800', color: '#0f2a4a' }}>
                  Anulación de Factura
                </h3>
              </div>
              <button type="button" onClick={() => setModalAnularId(null)} style={styles.btnCerrarModal}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 10px 0' }}>
              Esta acción reversará la transacción y repondrá automáticamente el stock al inventario.
            </p>

            <form onSubmit={confirmarAnulacion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={styles.labelForm}>Motivo de la anulación *</label>
                <input
                  type="text"
                  placeholder="Ej: Error en cantidad / Devolución..."
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  style={styles.inputModal}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setModalAnularId(null)} style={styles.btnCancelarModal}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnConfirmarAnularModal}>
                  Confirmar Anulación
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
  tarjetaTotal: {
    backgroundColor: '#0f2a4a',
    borderRadius: '16px',
    padding: '12px 14px',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(15, 42, 74, 0.15)'
  },
  etiquetaTotal: {
    fontSize: '0.66rem',
    fontWeight: '800',
    letterSpacing: '0.8px',
    color: '#94a3b8'
  },
  badgeFacturas: {
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
  filaFiltroTurnos: {
    display: 'flex',
    gap: '6px'
  },
  btnFiltroTurno: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  cajaBuscador: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '7px 10px',
    gap: '6px',
    border: '1px solid #cbd5e1'
  },
  inputBusqueda: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '0.82rem',
    color: '#0f2a4a'
  },
  btnLimpiarBusqueda: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: 0
  },
  vacioBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#94a3b8'
  },
  listaGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  cardFactura: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  correlativoText: {
    fontSize: '0.86rem',
    color: '#0f2a4a'
  },
  badgeAnulada: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #fecaca'
  },
  badgeCerrado: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1'
  },
  badgeMetodo: {
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #bfdbfe'
  },
  clienteText: {
    fontSize: '0.74rem',
    color: '#334155',
    marginTop: '2px'
  },
  horaText: {
    fontSize: '0.68rem',
    color: '#64748b',
    marginTop: '1px'
  },
  montoUSDCard: {
    fontSize: '1.1rem',
    fontWeight: '900'
  },
  montoBSCard: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#64748b'
  },
  cajaMotivoAnulada: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    borderRadius: '8px',
    padding: '6px 8px',
    fontSize: '0.68rem',
    color: '#991b1b'
  },
  accionesFila: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
    paddingTop: '6px',
    borderTop: '1px dashed #f1f5f9'
  },
  btnVerTicket: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#f8fafc',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnAnular: {
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  overlayModal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 99999999
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    maxWidth: '340px',
    width: '100%',
    padding: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  btnCerrarModal: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  labelForm: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '3px',
    display: 'block'
  },
  inputModal: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  btnCancelarModal: {
    flex: 1,
    padding: '9px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnConfirmarAnularModal: {
    flex: 1.4,
    padding: '9px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
