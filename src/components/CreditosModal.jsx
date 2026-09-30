import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, UserCheck, CreditCard, 
  AlertCircle, Phone, X 
} from 'lucide-react';

export default function CreditosModal({
  clientes = [],
  transacciones = [],
  tasaCambio = 1,
  onAbonar,
  alVolver
}) {
  const tasa = parseFloat(tasaCambio) || 1;
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'deudores' | 'aldia'
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false);

  const [montoUSD, setMontoUSD] = useState('');
  const [montoBS, setMontoBS] = useState('');
  const [procesandoAbono, setProcesandoAbono] = useState(false);

  // Unificar y deduplicar clientes
  const listaClientes = useMemo(() => {
    const mapa = new Map();
    (clientes || []).forEach(c => {
      const docClean = String(c.doc || c.cedula || c.id || '').replace(/[^0-9]/g, '');
      if (docClean && !mapa.has(docClean)) {
        const saldo = parseFloat(c.saldoPendienteUSD ?? c.saldoDeudor ?? c.saldo_deudor_usd ?? 0) || 0;
        mapa.set(docClean, {
          ...c,
          saldoActualUSD: Math.max(0, saldo)
        });
      }
    });
    return Array.from(mapa.values());
  }, [clientes]);

  // Filtro
  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return listaClientes.filter(c => {
      const doc = String(c.doc || '').toLowerCase();
      const nom = String(c.nombre || '').toLowerCase();
      const coincide = doc.includes(q) || nom.includes(q);

      if (!coincide) return false;
      if (filtroTipo === 'deudores') return c.saldoActualUSD > 0.01;
      if (filtroTipo === 'aldia') return c.saldoActualUSD <= 0.01;
      return true;
    });
  }, [listaClientes, busqueda, filtroTipo]);

  const deudaTotalUSD = useMemo(() => {
    return listaClientes.reduce((acc, c) => acc + c.saldoActualUSD, 0);
  }, [listaClientes]);

  const comprasCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    const docCli = String(clienteSeleccionado.doc || '').replace(/[^0-9]/g, '');
    return (transacciones || []).filter(t => {
      const tDoc = String(t.cliente?.doc || t.clienteDoc || '').replace(/[^0-9]/g, '');
      return tDoc && tDoc === docCli;
    });
  }, [clienteSeleccionado, transacciones]);

  const abrirAbono = (cliente) => {
    setClienteSeleccionado(cliente);
    setMontoUSD('');
    setMontoBS('');
    setMostrarModalAbono(true);
  };

  const ejecutarAbono = async () => {
    const abonoFinal = parseFloat(montoUSD) || 0;
    if (abonoFinal <= 0 || !clienteSeleccionado) return;

    setProcesandoAbono(true);
    try {
      if (onAbonar) {
        await onAbonar(clienteSeleccionado.doc || clienteSeleccionado.id, abonoFinal);
      }
      setMostrarModalAbono(false);
      setClienteSeleccionado(null);
      setMontoUSD('');
      setMontoBS('');
    } catch (err) {
      console.error('Error al aplicar abono:', err);
    } finally {
      setProcesandoAbono(false);
    }
  };

  return (
    <div style={estilos.contenedorPrincipal}>
      {/* HEADER */}
      <div style={estilos.header}>
        <button onClick={alVolver} style={estilos.btnVolver}>
          <ArrowLeft size={20} color="#0f172a" />
        </button>
        <div>
          <h2 style={estilos.titulo}>Créditos y Cuentas</h2>
          <p style={estilos.subtitulo}>Gestión de cartera de clientes</p>
        </div>
        <div style={estilos.badgeTasa}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>BCV</span>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Bs. {tasa.toFixed(2)}</span>
        </div>
      </div>

      {/* TARJETA TOTALIZADORA */}
      <div style={estilos.cardResumen}>
        <div>
          <span style={estilos.lblResumen}>TOTAL PENDIENTE POR COBRAR</span>
          <h1 style={estilos.montoGrandeUSD}>${deudaTotalUSD.toFixed(2)}</h1>
          <span style={estilos.montoGrandeBS}>Bs. {(deudaTotalUSD * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={estilos.contadorClientes}>
          <UserCheck size={20} color="#0284c7" />
          <span style={{ fontWeight: 'bold', color: '#0369a1' }}>{listaClientes.length} Clientes</span>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div style={estilos.grupoPestanas}>
        <button 
          style={filtroTipo === 'todos' ? estilos.pestanaActiva : estilos.pestanaInactiva}
          onClick={() => setFiltroTipo('todos')}
        >
          Todos ({listaClientes.length})
        </button>
        <button 
          style={filtroTipo === 'deudores' ? estilos.pestanaActiva : estilos.pestanaInactiva}
          onClick={() => setFiltroTipo('deudores')}
        >
          Con Deuda ({listaClientes.filter(c => c.saldoActualUSD > 0.01).length})
        </button>
        <button 
          style={filtroTipo === 'aldia' ? estilos.pestanaActiva : estilos.pestanaInactiva}
          onClick={() => setFiltroTipo('aldia')}
        >
          Al Día ({listaClientes.filter(c => c.saldoActualUSD <= 0.01).length})
        </button>
      </div>

      {/* BUSCADOR */}
      <div style={estilos.buscadorWrapper}>
        <Search size={18} color="#94a3b8" />
        <input 
          type="text"
          placeholder="Buscar por cédula o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={estilos.inputBuscador}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={estilos.btnLimpiarBusqueda}>
            <X size={16} color="#94a3b8" />
          </button>
        )}
      </div>

      {/* LISTA */}
      <div style={estilos.listaContainer}>
        {clientesFiltrados.length === 0 ? (
          <div style={estilos.vacioContainer}>
            <AlertCircle size={40} color="#cbd5e1" />
            <p style={{ color: '#64748b', marginTop: '8px' }}>No se encontraron clientes</p>
          </div>
        ) : (
          clientesFiltrados.map((cli) => {
            const tieneDeuda = cli.saldoActualUSD > 0.01;
            return (
              <div key={cli.id || cli.doc} style={estilos.cardCliente}>
                <div style={estilos.infoFila}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={estilos.nombreCliente}>{cli.nombre || 'Cliente'}</span>
                      {tieneDeuda ? (
                        <span style={estilos.badgeDeudor}>Debe</span>
                      ) : (
                        <span style={estilos.badgeSolvente}>Al Día</span>
                      )}
                    </div>
                    <span style={estilos.docCliente}>{cli.doc}</span>
                    {cli.telefono && (
                      <div style={estilos.telCliente}>
                        <Phone size={12} color="#64748b" />
                        <span>{cli.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: tieneDeuda ? '#dc2626' : '#16a34a' }}>
                      ${cli.saldoActualUSD.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Bs. {(cli.saldoActualUSD * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div style={estilos.accionesFila}>
                  <button 
                    onClick={() => setClienteSeleccionado(cli)}
                    style={estilos.btnDetalle}
                  >
                    Movimientos
                  </button>
                  {tieneDeuda && (
                    <button 
                      onClick={() => abrirAbono(cli)}
                      style={estilos.btnAbonar}
                    >
                      <CreditCard size={15} /> Abonar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE ABONO */}
      {mostrarModalAbono && clienteSeleccionado && (
        <div style={estilos.overlayModal}>
          <div style={estilos.modalCaja}>
            <div style={estilos.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Registrar Abono</h3>
              <button onClick={() => setMostrarModalAbono(false)} style={estilos.btnCerrarX}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={estilos.boxClienteAbonando}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{clienteSeleccionado.nombre}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{clienteSeleccionado.doc}</span>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Deuda Total:</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc2626' }}>${clienteSeleccionado.saldoActualUSD.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={estilos.labelInput}>Monto a Abonar (USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={montoUSD}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMontoUSD(val);
                    setMontoBS(val ? (parseFloat(val) * tasa).toFixed(2) : '');
                  }}
                  style={estilos.inputMonto}
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={estilos.labelInput}>Equivalente en Bolívares</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={montoBS}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMontoBS(val);
                    setMontoUSD(val ? (parseFloat(val) / tasa).toFixed(2) : '');
                  }}
                  style={estilos.inputMonto}
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setMontoUSD(clienteSeleccionado.saldoActualUSD.toString());
                    setMontoBS((clienteSeleccionado.saldoActualUSD * tasa).toFixed(2));
                  }}
                  style={estilos.btnPagarTodo}
                >
                  Pagar Deuda Total
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button onClick={() => setMostrarModalAbono(false)} style={estilos.btnCancelar}>
                  Cancelar
                </button>
                <button 
                  disabled={procesandoAbono || !parseFloat(montoUSD)} 
                  onClick={ejecutarAbono} 
                  style={estilos.btnConfirmarAbono}
                >
                  {procesandoAbono ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {clienteSeleccionado && !mostrarModalAbono && (
        <div style={estilos.overlayModal}>
          <div style={estilos.modalCajaGrande}>
            <div style={estilos.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{clienteSeleccionado.nombre}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{clienteSeleccionado.doc}</span>
              </div>
              <button onClick={() => setClienteSeleccionado(null)} style={estilos.btnCerrarX}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>SALDO ACTUAL</span>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: clienteSeleccionado.saldoActualUSD > 0 ? '#dc2626' : '#16a34a' }}>
                    ${clienteSeleccionado.saldoActualUSD.toFixed(2)}
                  </div>
                </div>
                {clienteSeleccionado.saldoActualUSD > 0 && (
                  <button onClick={() => abrirAbono(clienteSeleccionado)} style={estilos.btnAbonarModal}>
                    Abonar
                  </button>
                )}
              </div>

              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>Transacciones Registradas</h4>
              {comprasCliente.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                  No hay transacciones registradas.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {comprasCliente.map((trx, idx) => (
                    <div key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Venta #{trx.correlativo || trx.id?.slice(0, 6)}</span>
                        <span>${Number(trx.totalUSD || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '4px' }}>
                        <span>{new Date(trx.fecha || Date.now()).toLocaleDateString()}</span>
                        <span style={{ textTransform: 'capitalize' }}>{trx.tipoPago || (trx.esCredito ? 'Crédito' : 'Contado')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const estilos = {
  contenedorPrincipal: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  btnVolver: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer'
  },
  titulo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: 0
  },
  subtitulo: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0
  },
  badgeTasa: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '4px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  cardResumen: {
    background: '#0f172a',
    borderRadius: '14px',
    padding: '18px',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  lblResumen: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  montoGrandeUSD: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '4px 0 0 0',
    color: '#ffffff'
  },
  montoGrandeBS: {
    fontSize: '13px',
    color: '#38bdf8'
  },
  contadorClientes: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  grupoPestanas: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px'
  },
  pestanaActiva: {
    flex: 1,
    padding: '8px',
    background: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  pestanaInactiva: {
    flex: 1,
    padding: '8px',
    background: '#ffffff',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  buscadorWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0 12px',
    marginBottom: '14px'
  },
  inputBuscador: {
    width: '100%',
    padding: '10px 8px',
    border: 'none',
    outline: 'none',
    fontSize: '14px'
  },
  btnLimpiarBusqueda: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  listaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  vacioContainer: {
    textAlign: 'center',
    padding: '40px 0'
  },
  cardCliente: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  infoFila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  nombreCliente: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#0f172a'
  },
  badgeDeudor: {
    background: '#fee2e2',
    color: '#b91c1c',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  badgeSolvente: {
    background: '#dcfce7',
    color: '#15803d',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  docCliente: {
    fontSize: '12px',
    color: '#64748b'
  },
  telCliente: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px'
  },
  accionesFila: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '10px'
  },
  btnDetalle: {
    flex: 1,
    padding: '7px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#475569',
    cursor: 'pointer',
    fontWeight: '500'
  },
  btnAbonar: {
    flex: 1,
    padding: '7px',
    background: '#0284c7',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  overlayModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '16px'
  },
  modalCaja: {
    background: '#ffffff',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '380px',
    overflow: 'hidden'
  },
  modalCajaGrande: {
    background: '#ffffff',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  btnCerrarX: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b'
  },
  boxClienteAbonando: {
    background: '#f8fafc',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  labelInput: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '4px'
  },
  inputMonto: {
    width: '100%',
    padding: '9px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  btnPagarTodo: {
    background: '#f1f5f9',
    border: '1px dashed #94a3b8',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#475569',
    cursor: 'pointer'
  },
  btnCancelar: {
    flex: 1,
    padding: '9px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    color: '#64748b',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnConfirmarAbono: {
    flex: 1,
    padding: '9px',
    background: '#16a34a',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnAbonarModal: {
    background: '#0284c7',
    border: 'none',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
