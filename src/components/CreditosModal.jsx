import dbService from '../services/dbService';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Search, User, DollarSign, Calendar, Clock, 
  CreditCard, CheckCircle, AlertCircle, Phone, FileText, 
  ChevronRight, X, ArrowDownRight, Smartphone, Wallet, Building2, Delete
} from 'lucide-react';

export const CreditosModal = ({
  usuarioActivo,
 
  clientes = [], 
  transacciones = [], 
  abonos = [], 
  tasaCambio = 1, 
  onVolver, 
  onAbonar,
  alRegistrarAbono,
  alVolver
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [clienteAbonando, setClienteAbonando] = useState(null);
  const [clienteHistorial, setClienteHistorial] = useState(null);
  const [tabHistorial, setTabHistorial] = useState('compras'); // 'compras' o 'abonos'
  const [abonosSupabase, setAbonosSupabase] = useState([]);

  // Carga directa y reactiva desde Supabase independiente del padre
  const recargarAbonosDirectos = async () => {
    try {
      let negId = usuarioActivo?.negocio_id ||
                  (clientes && clientes.length > 0 ? (clientes[0]?.negocio_id || clientes[0]?.negocioId) : null) ||
                  localStorage.getItem('pos_negocio_id') ||
                  localStorage.getItem('pos_negocioActivo');
                  
      if (!negId) {
        try {
          const uStr = localStorage.getItem('pos_usuario') || localStorage.getItem('pos_sesion');
          if (uStr) {
            const uObj = JSON.parse(uStr);
            negId = uObj?.negocio_id || uObj?.negocioId;
          }
        } catch (_) {}
      }

      if (negId) {
        const data = await dbService.getAbonos(negId);
        if (Array.isArray(data)) {
          setAbonosSupabase(data);
        }
      }
    } catch (e) {
      console.error('Error cargando abonos directos:', e);
    }
  };

  useEffect(() => {
    recargarAbonosDirectos();
  }, []);

  // Estados de la Calculadora de Abono
  const [metodoAbono, setMetodoAbono] = useState('dolares'); // dolares, pagomovil, punto, efectivo_bs
  const [montosAbono, setMontosAbono] = useState({
    dolares: '',
    pagomovil: '',
    punto: '',
    efectivo_bs: ''
  });

  const tasa = parseFloat(tasaCambio) || 1;
  const cerrarVista = alVolver || onVolver;

  // Normalizar lista de deudas consolidada
  const clientesConsolidados = useMemo(() => {
    const mapaUnico = new Map();

    (clientes || []).forEach(c => {
      const docClean = String(c.doc || c.cedula || c.rif || '').replace(/[^0-9]/g, '');
      const key = docClean || c.id || Math.random().toString();

      if (!mapaUnico.has(key)) {
        const saldoDirecto = parseFloat(c.saldo_deudor_usd ?? c.saldoPendienteUSD ?? c.saldoDeudor ?? 0) || 0;

        // Filtrar compras fiadas correspondientes
        const comprasFiadas = (transacciones || []).filter(v => {
          const docVenta = String(v.cliente?.doc || v.cliente_doc || '').replace(/[^0-9]/g, '');
          const esFiado = Boolean(v.es_credito || v.esCredito || v.tipoVenta === 'credito');
          return esFiado && docVenta && docClean && docVenta === docClean;
        });

        // Filtrar historial de abonos correspondientes
        const listaAbonosTotal = abonosSupabase.length > 0 ? abonosSupabase : (abonos || []);
        const abonosCliente = listaAbonosTotal.filter(a => {
          const docAbono = String(a.cliente_doc || a.doc || a.cedula || a.cliente_cedula || a.doc_cliente || a.cliente?.doc || '').replace(/[^0-9]/g, '');
          return docAbono && docClean && docAbono === docClean;
        });

        // Cálculo dinámico universal: Suma de fiados menos suma de abonos
        const totalFiadoUSD = comprasFiadas.reduce((acc, v) => acc + (parseFloat(v.totalUSD ?? v.total_usd ?? 0) || 0), 0);
        const totalAbonadoUSD = abonosCliente.reduce((acc, a) => acc + (parseFloat(a.montoUSD ?? a.monto_usd ?? 0) || 0), 0);
        
        let deudaCalculada = totalFiadoUSD > 0 ? Math.max(0, parseFloat((totalFiadoUSD - totalAbonadoUSD).toFixed(2))) : Math.max(0, saldoDirecto);

        // Si saldoDirecto tiene saldo pendiente pero no hay compras fiadas en memoria, respetar saldoDirecto
        if (deudaCalculada <= 0 && saldoDirecto > 0) {
          deudaCalculada = saldoDirecto;
        }

        mapaUnico.set(key, {
          ...c,
          docClean,
          totalDeudaUSD: deudaCalculada,
          comprasFiadas,
          abonosCliente
        });
      }
    });

    return Array.from(mapaUnico.values());
  }, [clientes, transacciones, abonos]);

  // Filtrar según búsqueda
  const clientesFiltrados = useMemo(() => {
    return clientesConsolidados.filter(c => {
      const matchBusqueda = (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                            (c.doc || '').toLowerCase().includes(busqueda.toLowerCase());
      return matchBusqueda && c.totalDeudaUSD > 0.009;
    });
  }, [clientesConsolidados, busqueda]);

  const totalPorCobrarUSD = useMemo(() => {
    return clientesConsolidados.reduce((acc, c) => acc + c.totalDeudaUSD, 0);
  }, [clientesConsolidados]);

  // Teclado numérico táctil
  const handleKeypadPress = (val) => {
    setMontosAbono(prev => {
      const current = prev[metodoAbono] || '';
      if (val === '.') {
        if (current.includes('.')) return prev;
        return { ...prev, [metodoAbono]: current ? current + '.' : '0.' };
      }
      return { ...prev, [metodoAbono]: current + val };
    });
  };

  const handleKeypadDelete = () => {
    setMontosAbono(prev => {
      const current = prev[metodoAbono] || '';
      return { ...prev, [metodoAbono]: current.slice(0, -1) };
    });
  };

  const handleKeypadClear = () => {
    setMontosAbono(prev => ({ ...prev, [metodoAbono]: '' }));
  };

  const handlePagarTotal = () => {
    if (!clienteAbonando) return;
    if (metodoAbono === 'dolares') {
      setMontosAbono(prev => ({ ...prev, dolares: clienteAbonando.totalDeudaUSD.toFixed(2) }));
    } else {
      const enBs = (clienteAbonando.totalDeudaUSD * tasa).toFixed(2);
      setMontosAbono(prev => ({ ...prev, [metodoAbono]: enBs }));
    }
  };

  // Cálculos del modal de abono
  const montoUSDInput = parseFloat(montosAbono.dolares) || 0;
  const montoBSInput = (parseFloat(montosAbono.pagomovil) || 0) + 
                       (parseFloat(montosAbono.punto) || 0) + 
                       (parseFloat(montosAbono.efectivo_bs) || 0);

  const totalAbonadoUSD = parseFloat((montoUSDInput + (montoBSInput / tasa)).toFixed(2));
  const deudaActual = clienteAbonando ? clienteAbonando.totalDeudaUSD : 0;
  const nuevoRestanteUSD = Math.max(0, parseFloat((deudaActual - totalAbonadoUSD).toFixed(2)));

  const abrirModalAbono = (c) => {
    setClienteAbonando(c);
    setMontosAbono({ dolares: '', pagomovil: '', punto: '', efectivo_bs: '' });
    setMetodoAbono('dolares');
  };

  const confirmarAbono = async () => {
    if (totalAbonadoUSD <= 0) return alert('Por favor ingresa un monto válido a abonar.');

    let nombreMetodo = 'Efectivo ($)';
    if (metodoAbono === 'pagomovil') nombreMetodo = 'Pago Móvil (Bs)';
    else if (metodoAbono === 'punto') nombreMetodo = 'Punto Débito (Bs)';
    else if (metodoAbono === 'efectivo_bs') nombreMetodo = 'Efectivo Bs';

    // Respetar de forma contable exacta la moneda ingresada
    const montoBsReal = metodoAbono === 'dolares'
      ? parseFloat((totalAbonadoUSD * tasa).toFixed(2))
      : (parseFloat(montoBSInput) || 0);

    try {
      const fn = onAbonar || alRegistrarAbono;
      if (fn) {
        await fn({
          cliente: clienteAbonando,
          montoUSD: totalAbonadoUSD,
          montoBS: montoBsReal,
          metodoPago: nombreMetodo,
          tasa: tasa
        });
      }

      // Inyección reactiva inmediata en la vista local
      const nuevoAbonoInmediato = {
        id: 'abn_' + Date.now(),
        cliente_doc: clienteAbonando.doc || clienteAbonando.cedula || clienteAbonando.docClean,
        monto_usd: totalAbonadoUSD,
        monto_bs: montoBsReal,
        metodo_pago: nombreMetodo,
        tasa_bcv: tasa,
        fecha: new Date().toISOString()
      };

      setAbonosSupabase(prev => [nuevoAbonoInmediato, ...prev]);

      // Confirmar con Supabase en segundo plano
      setTimeout(() => {
        if (typeof recargarAbonosDirectos === 'function') {
          recargarAbonosDirectos();
        }
      }, 500);

    } catch (e) {
      alert("Error procesando abono: " + (e?.message || JSON.stringify(e)));
    } finally {
      setClienteAbonando(null);
      setMontosAbono({ dolares: '', pagomovil: '', punto: '', efectivo_bs: '' });
    }
  };
  // Lista reactiva de abonos en tiempo real para el cliente abierto
  const abonosClienteActivo = useMemo(() => {
    if (!clienteHistorial) return [];
    const docTarget = String(clienteHistorial.doc || clienteHistorial.cedula || clienteHistorial.docClean || '').replace(/[^0-9]/g, '');
    const fuente = abonosSupabase.length > 0 ? abonosSupabase : (abonos || []);
    return fuente.filter(a => {
      const docA = String(a.cliente_doc || a.doc || a.cedula || a.cliente_cedula || a.doc_cliente || a.cliente?.doc || '').replace(/[^0-9]/g, '');
      return docTarget && docA && docTarget === docA;
    });
  }, [clienteHistorial, abonosSupabase, abonos]);

  return (
    <div style={styles.contenedorPrincipal}>
      {/* HEADER SUPERIOR */}
      <div style={styles.header}>
        <button onClick={cerrarVista} style={styles.btnAtras}>
          <ArrowLeft size={22} color="#0f2a4a" />
        </button>
        <div>
          <h2 style={styles.tituloHeader}>Créditos y Cuentas</h2>
          <span style={styles.subtituloHeader}>Gestión de fiados y cartera de clientes</span>
        </div>
        <div style={styles.badgeTasa}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>TASA BCV</span>
          <strong style={{ fontSize: '0.9rem', color: '#0f2a4a' }}>Bs. {tasa.toFixed(2)}</strong>
        </div>
      </div>

      {/* TARJETA TOTALIZADORA */}
      <div style={styles.tarjetaResumen}>
        <div>
          <span style={styles.labelResumen}>TOTAL POR COBRAR (DIVISA)</span>
          <h1 style={styles.montoResumen}>${totalPorCobrarUSD.toFixed(2)}</h1>
          <span style={styles.montoResumenBs}>≈ Bs. {(totalPorCobrarUSD * tasa).toFixed(2)}</span>
        </div>
        <div style={styles.badgeClientes}>
          <User size={16} />
          <span>{clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} con deuda</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={styles.barraBusqueda}>
        <Search size={18} color="#94a3b8" />
        <input 
          type="text" 
          placeholder="Buscar deudor por cédula o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={styles.inputBusqueda}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={styles.btnLimpiar}>
            <X size={16} color="#64748b" />
          </button>
        )}
      </div>

      {/* LISTA DE CLIENTES CON DEUDA */}
      <div style={styles.listaClientes}>
        {clientesFiltrados.length === 0 ? (
          <div style={styles.vacio}>
            <CheckCircle size={44} color="#10b981" />
            <p style={{ marginTop: '10px', fontWeight: 'bold', color: '#334155' }}>¡Al día! No hay cuentas pendientes</p>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No se encontraron clientes con saldo pendiente</span>
          </div>
        ) : (
          clientesFiltrados.map((c) => (
            <div key={c.id || c.doc} style={styles.tarjetaCliente}>
              <div style={styles.filaClienteTop}>
                <div style={styles.avatarMini}>
                  {(c.nombre || 'C').charAt(0).toUpperCase()}
                </div>
                <div style={styles.datosCliente}>
                  <h4 style={styles.nombreCliente}>{c.nombre || 'Cliente General'}</h4>
                  <div style={styles.filaDocTel}>
                    <span style={styles.docBadge}>{c.doc || 'Sin Cédula'}</span>
                    {c.telefono && <span style={styles.telBadge}>📞 {c.telefono}</span>}
                  </div>
                </div>
                <div style={styles.montoClienteCol}>
                  <span style={styles.labelSaldo}>SALDO</span>
                  <strong style={styles.saldoDolares}>${c.totalDeudaUSD.toFixed(2)}</strong>
                  <span style={styles.saldoBs}>Bs. {(c.totalDeudaUSD * tasa).toFixed(2)}</span>
                </div>
              </div>

              <div style={styles.accionesCliente}>
                <button 
                  onClick={() => { setClienteHistorial(c); setTabHistorial('compras'); }} 
                  style={styles.btnSecundario}
                >
                  <FileText size={15} /> Ver Movimientos
                </button>
                <button 
                  onClick={() => abrirModalAbono(c)} 
                  style={styles.btnAbonar}
                >
                  <CreditCard size={15} /> Abonar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL TÁCTIL CALCULADORA DE ABONOS */}
      {clienteAbonando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalKeypadCard}>
            <div style={styles.headerModalAbono}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800' }}>ABONAR A CLIENTE</span>
                <h3 style={{ margin: 0, color: '#0f2a4a', fontSize: '1.2rem' }}>{clienteAbonando.nombre}</h3>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>C.I: {clienteAbonando.doc}</span>
              </div>
              <button onClick={() => setClienteAbonando(null)} style={styles.btnCerrarModal}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* DEUDA VS NUEVO SALDO */}
            <div style={styles.comparativaSaldos}>
              <div style={styles.colSaldo}>
                <span style={styles.subColLabel}>DEUDA ACTUAL</span>
                <strong style={{ color: '#dc2626', fontSize: '1.15rem' }}>${deudaActual.toFixed(2)}</strong>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Bs. {(deudaActual * tasa).toFixed(2)}</small>
              </div>
              <ArrowDownRight size={22} color="#94a3b8" />
              <div style={styles.colSaldo}>
                <span style={styles.subColLabel}>NUEVO RESTANTE</span>
                <strong style={{ color: nuevoRestanteUSD === 0 ? '#10b981' : '#f59e0b', fontSize: '1.15rem' }}>
                  ${nuevoRestanteUSD.toFixed(2)}
                </strong>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Bs. {(nuevoRestanteUSD * tasa).toFixed(2)}</small>
              </div>
            </div>

            {/* SELECTOR DE MÉTODO */}
            <div style={styles.gridMetodos}>
              <button 
                onClick={() => setMetodoAbono('dolares')} 
                style={{ ...styles.btnMetodo, ...(metodoAbono === 'dolares' ? styles.btnMetodoActivo : {}) }}
              >
                <DollarSign size={16} /> Efectivo $
              </button>
              <button 
                onClick={() => setMetodoAbono('pagomovil')} 
                style={{ ...styles.btnMetodo, ...(metodoAbono === 'pagomovil' ? styles.btnMetodoActivo : {}) }}
              >
                <Smartphone size={16} /> Pago Móvil
              </button>
              <button 
                onClick={() => setMetodoAbono('punto')} 
                style={{ ...styles.btnMetodo, ...(metodoAbono === 'punto' ? styles.btnMetodoActivo : {}) }}
              >
                <CreditCard size={16} /> Punto Débito
              </button>
              <button 
                onClick={() => setMetodoAbono('efectivo_bs')} 
                style={{ ...styles.btnMetodo, ...(metodoAbono === 'efectivo_bs' ? styles.btnMetodoActivo : {}) }}
              >
                <Wallet size={16} /> Efectivo Bs
              </button>
            </div>

            {/* PANTALLA INPUT ACTIVO */}
            <div style={styles.displayAbono}>
              <span style={styles.displayMoneda}>
                {metodoAbono === 'dolares' ? 'USD $' : 'BS.'}
              </span>
              <span style={styles.displayValor}>
                {montosAbono[metodoAbono] || '0.00'}
              </span>
              <button onClick={handlePagarTotal} style={styles.btnPagarTotal}>
                Pagar Total
              </button>
            </div>

            {/* KEYPAD TÁCTIL */}
            <div style={styles.keypadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(num => (
                <button key={num} onClick={() => handleKeypadPress(num)} style={styles.keypadBtn}>
                  {num}
                </button>
              ))}
              <button onClick={handleKeypadDelete} style={{ ...styles.keypadBtn, backgroundColor: '#fee2e2' }}>
                <Delete size={20} color="#dc2626" />
              </button>
            </div>

            {/* CONFIRMACIÓN */}
            <button onClick={confirmarAbono} style={styles.btnConfirmarFinal}>
              <CheckCircle size={20} /> Confirmar Abono de ${totalAbonadoUSD.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLES / HISTORIAL DE MOVIMIENTOS */}
      {clienteHistorial && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalKeypadCard}>
            <div style={styles.headerModalAbono}>
              <div>
                <h3 style={{ margin: 0, color: '#0f2a4a' }}>{clienteHistorial.nombre}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>C.I: {clienteHistorial.doc}</span>
              </div>
              <button onClick={() => setClienteHistorial(null)} style={styles.btnCerrarModal}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={styles.tabsHistorial}>
              <button 
                onClick={() => setTabHistorial('compras')}
                style={{ ...styles.tabBtn, ...(tabHistorial === 'compras' ? styles.tabBtnActivo : {}) }}
              >
                Compras Fiadas ({clienteHistorial.comprasFiadas?.length || 0})
              </button>
              <button 
                onClick={() => setTabHistorial('abonos')}
                style={{ ...styles.tabBtn, ...(tabHistorial === 'abonos' ? styles.tabBtnActivo : {}) }}
              >
                Historial Abonos ({abonosClienteActivo.length})
              </button>
            </div>

            <div style={styles.cuerpoHistorial}>
              {tabHistorial === 'compras' ? (
                clienteHistorial.comprasFiadas?.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No hay facturas a crédito registradas</p>
                ) : (
                  clienteHistorial.comprasFiadas.map(v => (
                    <div key={v.id} style={styles.itemHistorial}>
                      <div>
                        <strong>Ticket #{v.correlativo || String(v.id).slice(-6)}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(v.fecha).toLocaleDateString()} {new Date(v.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#059669', fontSize: '1rem' }}>${(v.total_usd ?? v.totalUSD ?? 0).toFixed(2)}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                          Bs. {((v.total_usd ?? v.totalUSD ?? 0) * (v.tasa_bcv || tasa)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                abonosClienteActivo.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No se han registrado abonos en esta cuenta</p>
                ) : (
                  abonosClienteActivo.map(a => (
                    <div key={a.id} style={styles.itemHistorial}>
                      <div>
                        <strong>{a.metodo_pago || 'Abono Recibido'}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(a.fecha).toLocaleDateString()} {new Date(a.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#2563eb', fontSize: '1rem' }}>+${parseFloat(a.monto_usd || 0).toFixed(2)}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                          Bs. {parseFloat(a.monto_bs || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  contenedorPrincipal: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8fafc',
    overflowY: 'auto',
    padding: '12px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px'
  },
  btnAtras: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tituloHeader: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0f2a4a'
  },
  subtituloHeader: {
    fontSize: '0.75rem',
    color: '#64748b',
    display: 'block'
  },
  badgeTasa: {
    marginLeft: 'auto',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '4px 8px',
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column'
  },
  tarjetaResumen: {
    background: 'linear-gradient(135deg, #0f2a4a 0%, #1e3a8a 100%)',
    borderRadius: '16px',
    padding: '18px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    boxShadow: '0 4px 14px rgba(15, 42, 74, 0.15)'
  },
  labelResumen: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: '0.5px'
  },
  montoResumen: {
    margin: '4px 0',
    fontSize: '2rem',
    fontWeight: '900'
  },
  montoResumenBs: {
    fontSize: '0.85rem',
    color: '#cbd5e1'
  },
  badgeClientes: {
    background: 'rgba(255, 255, 255, 0.15)',
    padding: '6px 12px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  barraBusqueda: {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '8px 14px',
    marginBottom: '14px',
    gap: '8px'
  },
  inputBusqueda: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '0.95rem',
    color: '#1e293b'
  },
  btnLimpiar: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  listaClientes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingBottom: '24px'
  },
  tarjetaCliente: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '14px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.03)'
  },
  filaClienteTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  avatarMini: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#e0e7ff',
    color: '#4338ca',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    flexShrink: 0
  },
  datosCliente: {
    flex: 1,
    minWidth: 0
  },
  nombreCliente: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '800',
    color: '#0f2a4a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  filaDocTel: {
    display: 'flex',
    gap: '8px',
    marginTop: '3px'
  },
  docBadge: {
    fontSize: '0.75rem',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  telBadge: {
    fontSize: '0.75rem',
    color: '#64748b'
  },
  montoClienteCol: {
    textAlign: 'right',
    flexShrink: 0
  },
  labelSaldo: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '0.5px',
    display: 'block'
  },
  saldoDolares: {
    fontSize: '1.2rem',
    fontWeight: '900',
    color: '#dc2626'
  },
  saldoBs: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b'
  },
  accionesCliente: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '10px'
  },
  btnSecundario: {
    flex: 1,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  btnAbonar: {
    flex: 1,
    background: '#0284c7',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '12px'
  },
  modalKeypadCard: {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '380px',
    padding: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '94vh',
    overflowY: 'auto'
  },
  headerModalAbono: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  btnCerrarModal: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  comparativaSaldos: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '8px 14px',
    marginBottom: '12px'
  },
  colSaldo: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column'
  },
  subColLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#64748b'
  },
  gridMetodos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginBottom: '12px'
  },
  btnMetodo: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  btnMetodoActivo: {
    background: '#0f2a4a',
    borderColor: '#0f2a4a',
    color: '#fff'
  },
  displayAbono: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  displayMoneda: {
    fontWeight: '900',
    color: '#64748b',
    fontSize: '0.9rem'
  },
  displayValor: {
    fontSize: '1.5rem',
    fontWeight: '900',
    color: '#0f2a4a'
  },
  btnPagarTotal: {
    background: '#e0e7ff',
    color: '#4338ca',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer'
  },
  keypadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '14px'
  },
  keypadBtn: {
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#1e293b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  },
  btnConfirmarFinal: {
    background: '#10b981',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '900',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  tabsHistorial: {
    display: 'flex',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '12px'
  },
  tabBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer'
  },
  tabBtnActivo: {
    borderBottomColor: '#0f2a4a',
    color: '#0f2a4a'
  },
  cuerpoHistorial: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '260px',
    overflowY: 'auto'
  },
  itemHistorial: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  vacio: {
    textAlign: 'center',
    padding: '40px 14px'
  }
};

export default CreditosModal;
