import React, { useState, useMemo } from 'react';
import {
  Users, Search, DollarSign, MessageCircle, Calendar,
  CheckCircle, Clock, ChevronRight, X, AlertCircle, ArrowLeft,
  CreditCard, Wallet, Smartphone, Banknote, ShieldAlert,
  Phone, UserCheck, ArrowDownRight, RefreshCw, Delete
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

  // Método de pago activo en el modal de abono (INTACTO)
  const [metodoAbono, setMetodoAbono] = useState('usd');
  const [montosAbono, setMontosAbono] = useState({ usd: '', pm: '', punto: '', bs: '' });

  const tasa = parseFloat(tasaCambio) || 1;

  // Deduplicación estricta de clientes
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

  // Filtro
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

  // Historial cliente
  const comprasCliente = clienteDetalle ? (transacciones || []).filter(t => {
    const tDoc = (t.cliente?.doc || t.clienteDoc || '').replace(/[^0-9]/g, '');
    const cDoc = (clienteDetalle.doc || '').replace(/[^0-9]/g, '');
    return tDoc && tDoc === cDoc;
  }) : [];

  const abonosCliente = clienteDetalle?.historialAbonos || [];

  // Cálculos de Abono (INTACTO)
  const deudaClienteAbonando = parseFloat(clienteAbonando?.saldoPendienteUSD || clienteAbonando?.saldoDeudor || clienteAbonando?.saldoDeudorUSD || 0);

  const totalAbonadoUSD = (parseFloat(montosAbono.usd) || 0) +
    (((parseFloat(montosAbono.pm) || 0) + (parseFloat(montosAbono.punto) || 0) + (parseFloat(montosAbono.bs) || 0)) / tasa);

  const saldoRestanteUSD = Math.max(0, deudaClienteAbonando - totalAbonadoUSD);

  const presionarTecla = (num) => {
    setMontosAbono(prev => {
      const actual = prev[metodoAbono] || '';
      if (num === '.' && actual.includes('.')) return prev;
      return { ...prev, [metodoAbono]: actual + num };
    });
  };

  const borrarTecla = () => {
    setMontosAbono(prev => {
      const actual = prev[metodoAbono] || '';
      return { ...prev, [metodoAbono]: actual.slice(0, -1) };
    });
  };

  const saldarTodo = () => {
    if (metodoAbono === 'usd') {
      setMontosAbono(prev => ({ ...prev, usd: deudaClienteAbonando.toFixed(2) }));
    } else {
      const enBS = (deudaClienteAbonando * tasa).toFixed(2);
      setMontosAbono(prev => ({ ...prev, [metodoAbono]: enBS }));
    }
  };

  const confirmarAbono = () => {
    if (totalAbonadoUSD <= 0) return alert('Por favor ingresa un monto a abonar.');
    const fn = onAbonar || alRegistrarAbono;
    if (fn) {
      fn(clienteAbonando.id || clienteAbonando.doc, totalAbonadoUSD);
    }
    setClienteAbonando(null);
    setMontosAbono({ usd: '', pm: '', punto: '', bs: '' });
  };

  const enviarWhatsApp = (cli) => {
    const saldo = parseFloat(cli.saldoPendienteUSD || cli.saldoDeudor || cli.saldoDeudorUSD || 0);
    const tel = (cli.telefono || '').replace(/[^0-9]/g, '');
    if (!tel) return alert('El cliente no tiene teléfono registrado.');
    const msg = encodeURIComponent(`Hola ${cli.nombre}, un cordial saludo de MiniMarket JJJP. Le recordamos amablemente su saldo pendiente de $${saldo.toFixed(2)} (Bs. ${(saldo * tasa).toFixed(2)}). ¡Agradecemos su pago!`);
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  };

  return (
    <div style={styles.pantallaContainer}>
      {/* Header Superior idéntico a Historial POS */}
      <header style={styles.headerPOS}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button onClick={alCerrar} style={styles.btnVolver} aria-label="Volver">
            <ArrowLeft size={18} color="#0f2a4a" />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 style={styles.tituloHeader}>Créditos y Cuentas</h1>
            <p style={styles.subtituloHeader}>Cartera de clientes con saldo pendiente</p>
          </div>
        </div>

        <div style={styles.badgeTasaBCV}>
          <span style={styles.badgeTasaLabel}>TASA BCV</span>
          <span style={styles.badgeTasaValor}>Bs. {tasa.toFixed(2)}</span>
        </div>
      </header>

      {/* Banner Financiero con micro-sombra */}
      <div style={styles.bannerCartera}>
        <div>
          <div style={styles.carteraEtiqueta}>TOTAL POR COBRAR</div>
          <div style={styles.carteraMontoUSD}>${totalDeudaGlobalUSD.toFixed(2)}</div>
          <div style={styles.carteraMontoBS}>Bs. {totalDeudaGlobalBS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div style={styles.deudoresPill}>
          <Users size={15} color="#60a5fa" />
          <span>{clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'Cliente' : 'Clientes'}</span>
        </div>
      </div>

      {/* Buscador */}
      <div style={styles.areaBuscador}>
        <div style={styles.cajaSearch}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputSearch}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={styles.btnLimpiar}>
              <X size={16} color="#94a3b8" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Tarjetas Estilo POS */}
      <div style={styles.cuerpoScroll}>
        {clientesFiltrados.length === 0 ? (
          <div style={styles.vacioBox}>
            <div style={styles.circuloCheck}>
              <CheckCircle size={38} color="#10b981" />
            </div>
            <h3 style={styles.vacioTitulo}>¡Sin deudas pendientes!</h3>
            <p style={styles.vacioSub}>Todos los clientes se encuentran al día con sus pagos.</p>
          </div>
        ) : (
          <div style={styles.tarjetasGrid}>
            {clientesFiltrados.map((cli) => {
              const saldo = parseFloat(cli.saldoPendienteUSD || cli.saldoDeudor || cli.saldoDeudorUSD || 0);
              const saldoBS = saldo * tasa;
              const iniciales = (cli.nombre || 'C').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

              return (
                <div key={cli.id || cli.doc} style={styles.tarjetaTicketPOS}>
                  {/* Línea verde decorativa izquierda como en las facturas */}
                  <div style={styles.bordeVerdeLateral} />

                  <div style={{ flex: 1, padding: '14px 14px 12px' }}>
                    {/* Fila 1: Avatar, Nombre Completo y Cédula */}
                    <div
                      onClick={() => { setClienteDetalle(cli); setPestanaDetalle('compras'); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={styles.avatarIniciales}>{iniciales}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.nombreCliente}>{cli.nombre}</div>
                            <div style={styles.cedulaTexto}>C.I: {cli.doc}</div>
                          </div>
                        </div>

                        {/* Montos destacados a la derecha */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={styles.montoPrincipalDolar}>${saldo.toFixed(2)}</div>
                          <div style={styles.montoBolivaresText}>Bs. {saldoBS.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Teléfono si existe */}
                      {cli.telefono && (
                        <div style={styles.filaTelefonoBadge}>
                          <Phone size={12} color="#64748b" />
                          <span>{cli.telefono}</span>
                        </div>
                      )}
                    </div>

                    {/* Fila 2: Separador suave */}
                    <div style={styles.divisorTicket} />

                    {/* Fila 3: Botones de Acción Amplios y Ergonómicos */}
                    <div style={styles.filaBotonesAccion}>
                      {cli.telefono && (
                        <button
                          onClick={() => enviarWhatsApp(cli)}
                          style={styles.btnWhatsAppElegante}
                        >
                          <MessageCircle size={16} color="#16a34a" />
                          <span>Cobrar por WhatsApp</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setClienteAbonando(cli);
                          setMontosAbono({ usd: '', pm: '', punto: '', bs: '' });
                          setMetodoAbono('usd');
                        }}
                        style={styles.btnAbonarPrincipal}
                      >
                        <CreditCard size={15} />
                        <span>Abonar</span>
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
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitulo}>{clienteDetalle.nombre}</h3>
                <span style={styles.modalSub}>{clienteDetalle.doc}</span>
              </div>
              <button onClick={() => setClienteDetalle(null)} style={styles.btnCerrar}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={styles.tabsFila}>
              <button
                onClick={() => setPestanaDetalle('compras')}
                style={{ ...styles.tabBtn, ...(pestanaDetalle === 'compras' ? styles.tabActivo : {}) }}
              >
                Compras Fiadas ({comprasCliente.length})
              </button>
              <button
                onClick={() => setPestanaDetalle('abonos')}
                style={{ ...styles.tabBtn, ...(pestanaDetalle === 'abonos' ? styles.tabActivo : {}) }}
              >
                Historial Abonos ({abonosCliente.length})
              </button>
            </div>

            <div style={styles.modalScrollBody}>
              {pestanaDetalle === 'compras' ? (
                comprasCliente.length === 0 ? (
                  <div style={styles.sinRegistros}>No hay facturas pendientes registradas.</div>
                ) : (
                  comprasCliente.map((c, i) => (
                    <div key={i} style={styles.itemFilaHistorial}>
                      <div>
                        <div style={styles.itemRef}>
  Ticket #{
    c.numeroTicket 
      ? String(c.numeroTicket).replace('#', '') 
      : c.ticket 
        ? String(c.ticket).replace('#', '') 
        : c.correlativo 
          ? String(c.correlativo).padStart(6, '0') 
          : String(c.id || '').replace(/^vta_/, '').slice(-6)
  }
</div>
                        <div style={styles.itemFecha}>{c.fecha || 'Sin fecha'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={styles.montoPositivo}>${parseFloat(c.totalUSD || c.montoUSD || 0).toFixed(2)}</div>
                        <div style={styles.itemBs}>Bs. {parseFloat(c.totalBS || (c.totalUSD * tasa) || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                abonosCliente.length === 0 ? (
                  <div style={styles.sinRegistros}>No se han registrado abonos en esta cuenta.</div>
                ) : (
                  abonosCliente.map((a, i) => (
                    <div key={i} style={styles.itemFilaAbono}>
                      <div>
                        <div style={styles.abonoLabel}>Abono a Cuenta</div>
                        <div style={styles.itemFecha}>{a.fecha}</div>
                      </div>
                      <div style={styles.montoAbonoBadge}>-${parseFloat(a.montoUSD || 0).toFixed(2)}</div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÁCTIL DE REGISTRO DE ABONO (TOTALMENTE INTACTO COMO TE GUSTÓ) */}
      {clienteAbonando && (
        <div style={styles.overlay}>
          <div style={styles.modalCobroBox}>
            <div style={styles.modalHeaderCobro}>
              <div>
                <span style={styles.cobroPequeno}>ABONAR A CLIENTE</span>
                <h3 style={styles.cobroNombre}>{clienteAbonando.nombre}</h3>
              </div>
              <button onClick={() => setClienteAbonando(null)} style={styles.btnCerrar}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={styles.boxResumenDeuda}>
              <div style={styles.colSaldo}>
                <span style={styles.subtextDeuda}>DEUDA ACTUAL</span>
                <span style={styles.montoPrincipalDeuda}>${deudaClienteAbonando.toFixed(2)}</span>
                <span style={styles.montoBsPequeno}>Bs. {(deudaClienteAbonando * tasa).toFixed(2)}</span>
              </div>
              <div style={styles.separadorVertical} />
              <div style={styles.colSaldo}>
                <span style={styles.subtextDeuda}>NUEVO RESTANTE</span>
                <span style={{ ...styles.montoPrincipalDeuda, color: saldoRestanteUSD === 0 ? '#10b981' : '#f59e0b' }}>
                  ${saldoRestanteUSD.toFixed(2)}
                </span>
                <span style={styles.montoBsPequeno}>Bs. {(saldoRestanteUSD * tasa).toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.metodosGrid}>
              {[
                { id: 'usd', label: 'Efectivo $', icon: Banknote },
                { id: 'pm', label: 'Pago Móvil', icon: Smartphone },
                { id: 'punto', label: 'Punto Débito', icon: CreditCard },
                { id: 'bs', label: 'Efectivo Bs', icon: Wallet }
              ].map(m => {
                const Icon = m.icon;
                const activo = metodoAbono === m.id;
                const valorActual = montosAbono[m.id];
                return (
                  <button
                    key={m.id}
                    onClick={() => setMetodoAbono(m.id)}
                    style={{ ...styles.btnMetodo, ...(activo ? styles.btnMetodoActivo : {}) }}
                  >
                    <Icon size={16} color={activo ? '#fff' : '#0f2a4a'} />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>{m.label}</span>
                    {valorActual ? (
                      <span style={{ fontSize: '0.72rem', color: activo ? '#bbf7d0' : '#0052cc', fontWeight: '800' }}>
                        {m.id === 'usd' ? `$${valorActual}` : `Bs.${valorActual}`}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div style={styles.displayMontoAbono}>
              <span style={styles.monedaLabel}>
                {metodoAbono === 'usd' ? 'USD $' : 'BS.'}
              </span>
              <span style={styles.valorDisplay}>
                {montosAbono[metodoAbono] || '0.00'}
              </span>
              <button onClick={saldarTodo} style={styles.btnSaldarTotal}>
                Pagar Total
              </button>
            </div>

            <div style={styles.tecladoNumerico}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(val => (
                <button key={val} onClick={() => presionarTecla(val)} style={styles.tecla}>
                  {val}
                </button>
              ))}
              <button onClick={borrarTecla} style={styles.teclaBorrar}>
                <Delete size={20} color="#dc2626" />
              </button>
            </div>

            <button onClick={confirmarAbono} style={styles.btnConfirmarFinal}>
              <CheckCircle size={18} /> Confirmar Abono de ${totalAbonadoUSD.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pantallaContainer: {
    position: 'fixed', inset: 0, backgroundColor: '#f8fafc',
    zIndex: 99999, display: 'flex', flexDirection: 'column'
  },
  headerPOS: {
    backgroundColor: '#ffffff', padding: '12px 16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #e2e8f0'
  },
  btnVolver: {
    background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px',
    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0
  },
  tituloHeader: { margin: 0, fontSize: '1.1rem', color: '#0f2a4a', fontWeight: '800' },
  subtituloHeader: { margin: 0, fontSize: '0.72rem', color: '#64748b' },
  badgeTasaBCV: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '4px 10px', textAlign: 'right', flexShrink: 0
  },
  badgeTasaLabel: { display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: '800' },
  badgeTasaValor: { fontSize: '0.84rem', fontWeight: '800', color: '#0f2a4a' },
  bannerCartera: {
    backgroundColor: '#0f2a4a', color: '#ffffff', padding: '14px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 4px 12px rgba(15,42,74,0.1)'
  },
  carteraEtiqueta: { fontSize: '0.68rem', color: '#93c5fd', fontWeight: '800', letterSpacing: '0.5px' },
  carteraMontoUSD: { fontSize: '1.75rem', fontWeight: '900', lineHeight: 1.1, marginTop: '2px' },
  carteraMontoBS: { fontSize: '0.78rem', color: '#cbd5e1', marginTop: '3px' },
  deudoresPill: {
    backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
    padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '0.8rem', fontWeight: '700', color: '#fff'
  },
  areaBuscador: { padding: '10px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' },
  cajaSearch: {
    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9',
    padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0'
  },
  inputSearch: { border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', fontSize: '0.88rem', color: '#0f2a4a' },
  btnLimpiar: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex' },
  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  vacioBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '65%', textAlign: 'center'
  },
  circuloCheck: {
    width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ecfdf5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
  },
  vacioTitulo: { margin: '0 0 4px', color: '#0f2a4a', fontSize: '1.1rem', fontWeight: '800' },
  vacioSub: { margin: 0, color: '#64748b', fontSize: '0.84rem' },
  tarjetasGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },

  // Tarjeta Ticket POS
  tarjetaTicketPOS: {
    backgroundColor: '#ffffff', borderRadius: '14px',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    display: 'flex', overflow: 'hidden'
  },
  bordeVerdeLateral: {
    width: '5px', backgroundColor: '#dc2626', flexShrink: 0
  },
  avatarIniciales: {
    width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fee2e2',
    color: '#b91c1c', fontWeight: '900', fontSize: '0.9rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  nombreCliente: { fontSize: '0.95rem', fontWeight: '800', color: '#0f2a4a', lineHeight: 1.2 },
  cedulaTexto: { fontSize: '0.76rem', color: '#64748b', marginTop: '2px', fontWeight: '600' },
  montoPrincipalDolar: { fontSize: '1.35rem', fontWeight: '900', color: '#dc2626', lineHeight: 1.1 },
  montoBolivaresText: { fontSize: '0.74rem', fontWeight: '700', color: '#64748b', marginTop: '2px' },
  filaTelefonoBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    marginTop: '6px', fontSize: '0.74rem', color: '#64748b',
    backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0'
  },
  divisorTicket: { height: '1px', backgroundColor: '#f1f5f9', margin: '10px 0 8px' },
  filaBotonesAccion: { display: 'flex', gap: '8px' },
  btnWhatsAppElegante: {
    flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
    color: '#15803d', borderRadius: '10px', height: '36px',
    fontSize: '0.78rem', fontWeight: '700', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
  },
  btnAbonarPrincipal: {
    flex: 1, backgroundColor: '#0052cc', color: '#ffffff', border: 'none',
    borderRadius: '10px', height: '36px', fontSize: '0.82rem', fontWeight: '800',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,82,204,0.2)'
  },

  // Modales
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(3px)', zIndex: 100000, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '16px'
  },
  modalCard: {
    backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '400px',
    width: '100%', padding: '18px', display: 'flex', flexDirection: 'column'
  },
  modalCobroBox: {
    backgroundColor: '#ffffff', borderRadius: '22px', maxWidth: '380px',
    width: '100%', padding: '18px', display: 'flex', flexDirection: 'column'
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  modalHeaderCobro: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  modalTitulo: { margin: 0, color: '#0f2a4a', fontSize: '1.15rem', fontWeight: '800' },
  modalSub: { fontSize: '0.8rem', color: '#64748b' },
  cobroPequeno: { fontSize: '0.68rem', fontWeight: '800', color: '#0052cc', letterSpacing: '0.5px' },
  cobroNombre: { margin: '2px 0 0', color: '#0f2a4a', fontSize: '1.15rem', fontWeight: '900' },
  btnCerrar: {
    background: '#f1f5f9', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer'
  },
  tabsFila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' },
  tabBtn: {
    padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0',
    background: '#f8fafc', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', cursor: 'pointer'
  },
  tabActivo: { background: '#0f2a4a', color: '#ffffff', borderColor: '#0f2a4a' },
  modalScrollBody: { maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  sinRegistros: { textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.84rem' },
  itemFilaHistorial: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9'
  },
  itemRef: { fontWeight: '800', fontSize: '0.86rem', color: '#0f2a4a' },
  itemFecha: { fontSize: '0.72rem', color: '#64748b' },
  montoPositivo: { fontWeight: '900', color: '#00b050', fontSize: '0.94rem' },
  itemBs: { fontSize: '0.72rem', color: '#64748b' },
  itemFilaAbono: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7'
  },
  abonoLabel: { fontWeight: '800', fontSize: '0.86rem', color: '#166534' },
  montoAbonoBadge: { fontWeight: '900', color: '#16a34a', fontSize: '0.95rem' },
  boxResumenDeuda: {
    backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0',
    padding: '12px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px'
  },
  colSaldo: { flex: 1, textAlign: 'center' },
  separadorVertical: { width: '1px', backgroundColor: '#e2e8f0', margin: '0 8px' },
  subtextDeuda: { display: 'block', fontSize: '0.64rem', fontWeight: '800', color: '#64748b' },
  montoPrincipalDeuda: { display: 'block', fontSize: '1.25rem', fontWeight: '900', color: '#dc2626', marginTop: '2px' },
  montoBsPequeno: { display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b' },
  metodosGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' },
  btnMetodo: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
    padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '3px', cursor: 'pointer', transition: 'all 0.2s'
  },
  btnMetodoActivo: {
    backgroundColor: '#0f2a4a', borderColor: '#0f2a4a', color: '#ffffff'
  },
  displayMontoAbono: {
    backgroundColor: '#ffffff', border: '2px solid #0052cc', borderRadius: '12px',
    padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '10px'
  },
  monedaLabel: { fontSize: '0.82rem', fontWeight: '900', color: '#0052cc' },
  valorDisplay: { fontSize: '1.35rem', fontWeight: '900', color: '#0f2a4a' },
  btnSaldarTotal: {
    backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
    padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer'
  },
  tecladoNumerico: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' },
  tecla: {
    height: '42px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '10px', fontSize: '1.15rem', fontWeight: '800', color: '#0f2a4a',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  },
  teclaBorrar: {
    height: '42px', backgroundColor: '#fee2e2', border: '1px solid #fecaca',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  },
  btnConfirmarFinal: {
    backgroundColor: '#00b050', color: '#ffffff', border: 'none',
    padding: '12px', borderRadius: '12px', fontWeight: '900', fontSize: '0.94rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,176,80,0.25)'
  }
};
