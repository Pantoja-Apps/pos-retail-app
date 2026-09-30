import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, CheckCircle, CreditCard, 
  DollarSign, Phone, MessageCircle, X, AlertCircle 
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
  const [clienteAbonando, setClienteAbonando] = useState(null);
  const [montosAbono, setMontosAbono] = useState({ usd: '', pm: '', punto: '', bs: '' });
  const [procesando, setProcesando] = useState(false);

  // Unificar clientes por número de documento limpio
  const clientesConsolidados = useMemo(() => {
    const mapa = new Map();

    (clientes || []).forEach(c => {
      const docClean = String(c.doc || c.cedula || c.id || '').replace(/[^0-9]/g, '');
      if (!docClean) return;

      if (!mapa.has(docClean)) {
        mapa.set(docClean, {
          ...c,
          docClean,
          totalDeudaUSD: 0
        });
      }
    });

    // Calcular deuda activa real desde las ventas fiadas en Supabase (es_credito = true y no anuladas/cerradas)
    (transacciones || []).forEach(t => {
      const esFiado = t.es_credito === true || t.esCredito === true || t.tipoPago === 'credito';
      const noPagada = t.estado === 'activa' || t.estado === 'pendiente' || !t.estado;
      if (esFiado && noPagada && !t.anulada) {
        const tDoc = String(t.cliente?.doc || t.clienteDoc || '').replace(/[^0-9]/g, '');
        if (mapa.has(tDoc)) {
          const cli = mapa.get(tDoc);
          cli.totalDeudaUSD += parseFloat(t.total_usd ?? t.totalUSD ?? 0);
        }
      }
    });

    return Array.from(mapa.values());
  }, [clientes, transacciones]);

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return clientesConsolidados.filter(c => {
      const doc = String(c.doc || '').toLowerCase();
      const nom = String(c.nombre || '').toLowerCase();
      const coincide = !q || doc.includes(q) || nom.includes(q);
      return coincide;
    });
  }, [clientesConsolidados, busqueda]);

  const totalDeudaGlobalUSD = useMemo(() => {
    return clientesConsolidados.reduce((sum, c) => sum + c.totalDeudaUSD, 0);
  }, [clientesConsolidados]);

  const totalDeudaGlobalBS = totalDeudaGlobalUSD * tasa;

  // Manejo de abonos
  const totalAbonadoUSD = (parseFloat(montosAbono.usd) || 0) + 
    (((parseFloat(montosAbono.pm) || 0) + (parseFloat(montosAbono.punto) || 0) + (parseFloat(montosAbono.bs) || 0)) / tasa);

  const restanteUSD = Math.max(0, (clienteAbonando?.totalDeudaUSD || 0) - totalAbonadoUSD);

  const confirmarAbono = async () => {
    if (totalAbonadoUSD <= 0 || !clienteAbonando) return;
    setProcesando(true);
    try {
      if (onAbonar) {
        await onAbonar(clienteAbonando.doc || clienteAbonando.id, totalAbonadoUSD);
      }
      setClienteAbonando(null);
      setMontosAbono({ usd: '', pm: '', punto: '', bs: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContenedor}>
        
        {/* CABECERA ORIGINAL */}
        <div style={styles.header}>
          <div style={styles.headerIzq}>
            <button onClick={alVolver} style={styles.btnVolver}>
              <ArrowLeft size={18} color="#0f172a" />
            </button>
            <div>
              <h2 style={styles.headerTitulo}>Créditos y Clientes</h2>
              <span style={styles.headerSub}>Cartera de clientes con saldo pendiente</span>
            </div>
          </div>
          <div style={styles.bcvBadge}>
            <span style={styles.bcvLabel}>TASA BCV</span>
            <span style={styles.bcvValor}>Bs. {tasa.toFixed(2)}</span>
          </div>
        </div>

        {/* RESUMEN GLOBAL ORIGINAL */}
        <div style={styles.resumenCard}>
          <div>
            <span style={styles.resumenLabel}>TOTAL POR COBRAR</span>
            <div style={styles.resumenMontoUSD}>
              ${totalDeudaGlobalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={styles.resumenMontoBS}>
              Bs. {totalDeudaGlobalBS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={styles.resumenContador}>
            <span>{clientesConsolidados.filter(c => c.totalDeudaUSD > 0.01).length} Clientes</span>
          </div>
        </div>

        {/* BUSCADOR */}
        <div style={styles.buscadorBox}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por cédula o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.buscadorInput}
          />
        </div>

        {/* LISTA DE CLIENTES */}
        <div style={styles.tarjetasGrid}>
          {clientesFiltrados.length === 0 ? (
            <div style={styles.vacioBox}>
              <CheckCircle size={38} color="#10b981" />
              <h3 style={styles.vacioTitulo}>Sin clientes encontrados</h3>
            </div>
          ) : (
            clientesFiltrados.map((cli) => {
              const tieneDeuda = cli.totalDeudaUSD > 0.01;
              return (
                <div key={cli.docClean} style={styles.tarjetaCliente}>
                  <div style={styles.tarjetaFilaSup}>
                    <div style={styles.tarjetaAvatar}>
                      {(cli.nombre || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.tarjetaNombre}>{cli.nombre}</div>
                      <div style={styles.tarjetaDoc}>{cli.doc}</div>
                      {cli.telefono && (
                        <div style={styles.tarjetaTel}>
                          <Phone size={11} color="#64748b" />
                          <span>{cli.telefono}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: tieneDeuda ? '#ef4444' : '#10b981' }}>
                        ${cli.totalDeudaUSD.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Bs. {(cli.totalDeudaUSD * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div style={styles.tarjetaAcciones}>
                    {cli.telefono && (
                      <a
                        href={`https://wa.me/${cli.telefono.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.btnWhatsapp}
                      >
                        <MessageCircle size={14} color="#16a34a" /> Cobrar por WhatsApp
                      </a>
                    )}
                    {tieneDeuda && (
                      <button
                        onClick={() => {
                          setClienteAbonando(cli);
                          setMontosAbono({ usd: cli.totalDeudaUSD.toString(), pm: '', punto: '', bs: '' });
                        }}
                        style={styles.btnAbonarPrincipal}
                      >
                        <CreditCard size={14} /> Abonar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL DE ABONO ORIGINAL */}
        {clienteAbonando && (
          <div style={styles.abonoOverlay}>
            <div style={styles.abonoCard}>
              <div style={styles.abonoHeader}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Registrar Abono</h3>
                <button onClick={() => setClienteAbonando(null)} style={styles.btnCerrar}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{clienteAbonando.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Cédula: {clienteAbonando.doc}</div>
                  <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>
                    Deuda Actual: ${clienteAbonando.totalDeudaUSD.toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Monto en Dólares (USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={montosAbono.usd}
                    onChange={(e) => setMontosAbono({ ...montosAbono, usd: e.target.value })}
                    style={styles.inputAbono}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                    <span>Total a Abonar: <b>${totalAbonadoUSD.toFixed(2)}</b></span>
                    <span>Resta: <b style={{ color: restanteUSD > 0 ? '#ef4444' : '#10b981' }}>${restanteUSD.toFixed(2)}</b></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={() => setClienteAbonando(null)} style={styles.btnCancelarAbono}>
                    Cancelar
                  </button>
                  <button 
                    disabled={procesando || totalAbonadoUSD <= 0} 
                    onClick={confirmarAbono} 
                    style={styles.btnConfirmarAbono}
                  >
                    {procesando ? 'Guardando...' : 'Confirmar Abono'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  modalOverlay: { position: 'fixed', inset: 0, background: '#f8fafc', zIndex: 1000, overflowY: 'auto' },
  modalContenedor: { maxWidth: '650px', margin: '0 auto', padding: '16px', minHeight: '100vh', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  headerIzq: { display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', cursor: 'pointer' },
  headerTitulo: { margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: '11px', color: '#64748b' },
  bcvBadge: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 8px', textAlign: 'right' },
  bcvLabel: { display: 'block', fontSize: '9px', color: '#64748b', fontWeight: '700' },
  bcvValor: { fontSize: '12px', fontWeight: '800', color: '#0f172a' },
  resumenCard: { background: '#0f172a', borderRadius: '14px', padding: '16px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  resumenLabel: { fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' },
  resumenMontoUSD: { fontSize: '26px', fontWeight: '800', margin: '2px 0' },
  resumenMontoBS: { fontSize: '12px', color: '#38bdf8' },
  resumenContador: { background: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' },
  buscadorBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0 12px', marginBottom: '14px' },
  buscadorInput: { width: '100%', padding: '10px 0', border: 'none', outline: 'none', fontSize: '13px' },
  tarjetasGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tarjetaCliente: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' },
  tarjetaFilaSup: { display: 'flex', alignItems: 'center', gap: '10px' },
  tarjetaAvatar: { width: '38px', height: '38px', borderRadius: '19px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' },
  tarjetaNombre: { fontSize: '14px', fontWeight: '800', color: '#0f172a' },
  tarjetaDoc: { fontSize: '12px', color: '#64748b' },
  tarjetaTel: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginTop: '2px' },
  tarjetaAcciones: { display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' },
  btnWhatsapp: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#16a34a', fontSize: '12px', fontWeight: '600', textDecoration: 'none' },
  btnAbonarPrincipal: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  vacioBox: { textAlign: 'center', padding: '40px 16px' },
  vacioTitulo: { margin: '8px 0 0 0', fontSize: '15px', color: '#0f172a' },
  abonoOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' },
  abonoCard: { background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '380px', overflow: 'hidden' },
  abonoHeader: { padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrar: { background: 'transparent', border: 'none', cursor: 'pointer' },
  inputAbono: { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  btnCancelarAbono: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontWeight: '700', cursor: 'pointer' },
  btnConfirmarAbono: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#10b981', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }
};
