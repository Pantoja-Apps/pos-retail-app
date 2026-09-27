import React, { useState } from 'react';
import { ArrowLeft, Search, Receipt, Eye, Ban, Calendar, User, Monitor } from 'lucide-react';

export default function HistorialModal({ 
  transacciones = [], 
  tasaCambio = 1, 
  usuarioActivo = {}, 
  cajaActiva = {},
  alVerTicket = () => {}, 
  alAnularVenta = () => {}, 
  alVolver = () => {} 
}) {
  const [busqueda, setBusqueda] = useState('');
  const esDueno = usuarioActivo?.rol === 'dueno';

  // REGLA ESTRICTA DE PRIVACIDAD:
  // - Si es Dueño: Ve todas las ventas del negocio.
  // - Si es Cajero: SOLO ve las ventas cobradas bajo su propio usuario / nombre.
  const transaccionesVisibles = transacciones.filter(tx => {
    if (esDueno) return true;
    if (!usuarioActivo?.nombre) return false;
    
    // Validar que el nombre del cajero activo esté presente en la factura
    const nombreOperador = (tx.cajeroCobrador || '').toLowerCase();
    const miNombre = usuarioActivo.nombre.toLowerCase().trim();
    return nombreOperador.includes(miNombre);
  });

  const filtradas = transaccionesVisibles.filter(tx => {
    const texto = `${tx.id} ${tx.cliente?.nombre || ''} ${tx.cajeroCobrador || ''} ${tx.terminalNombre || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase().trim());
  });

  const totalUSD = filtradas.filter(t => !t.anulada && t.tipo === 'venta').reduce((acc, t) => acc + (parseFloat(t.totalUSD) || 0), 0);
  const totalBS = totalUSD * (parseFloat(tasaCambio) || 1);

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack} title="Volver al POS">
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>
              {esDueno ? 'Registro Global de Ventas' : 'Mis Ventas del Turno'}
            </h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
              {esDueno ? 'Todas las terminales conectadas' : `Operador: ${usuarioActivo?.nombre} (${cajaActiva?.nombre || 'Caja'})`}
            </small>
          </div>
        </div>
      </header>

      {/* TARJETA TOTAL VENTAS VISIBLES */}
      <div style={styles.resumenBar}>
        <div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>
            {esDueno ? 'Total Ventas (Todas las cajas):' : 'Total Cobrado en tu Turno:'}
          </span>
          <strong style={{ fontSize: '1.15rem', color: '#16a34a' }}>${totalUSD.toFixed(2)}</strong>
          <span style={{ fontSize: '0.74rem', color: '#0052cc', marginLeft: '6px' }}>Bs. {totalBS.toFixed(2)}</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#64748b' }}>
          <span>{filtradas.length} Factura(s)</span>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={styles.barraBuscador}>
        <div style={styles.inputWrapper}>
          <Search size={16} color="#64748b" style={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por # ticket, cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBuscador}
          />
        </div>
      </div>

      {/* LISTADO */}
      <div style={styles.cuerpoScroll}>
        {filtradas.length === 0 ? (
          <div style={styles.vacio}>
            <Receipt size={46} color="#cbd5e1" />
            <p style={{ margin: '8px 0 0 0', fontSize: '0.86rem', color: '#64748b' }}>No tienes ventas registradas en este turno.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtradas.map(tx => {
              const anulada = Boolean(tx.anulada);
              return (
                <div key={tx.id} style={{ ...styles.cardTicket, opacity: anulada ? 0.6 : 1, borderColor: anulada ? '#fecaca' : '#e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.92rem', color: anulada ? '#dc2626' : '#0f172a' }}>
                          Ticket #{tx.id}
                        </strong>
                        {anulada && <span style={styles.badgeAnulado}>ANULADA</span>}
                        {tx.terminalNombre && <span style={styles.badgeTerminal}>{tx.terminalNombre}</span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                        Cliente: <strong>{tx.cliente?.nombre || 'Consumidor Final'}</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                        Hora: {tx.fecha || 'Hoy'} {tx.cajeroCobrador ? `• ${tx.cajeroCobrador}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '900', color: anulada ? '#dc2626' : '#16a34a' }}>
                        ${parseFloat(tx.totalUSD || 0).toFixed(2)}
                      </div>
                      <small style={{ color: '#64748b', fontSize: '0.7rem' }}>
                        Bs. {parseFloat(tx.totalBS || 0).toFixed(2)}
                      </small>
                    </div>
                  </div>

                  <div style={styles.accionesTicket}>
                    <button type="button" onClick={() => alVerTicket(tx)} style={styles.btnVerTicket}>
                      <Eye size={13} /> <span>Ver Comprobante</span>
                    </button>

                    {esDueno && !anulada && (
                      <button type="button" onClick={() => alAnularVenta(tx)} style={styles.btnAnularTicket}>
                        <Ban size={13} /> <span>Anular Factura</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resumenBar: { backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  barraBuscador: { padding: '8px 14px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  iconSearch: { position: 'absolute', left: '10px' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none' },
  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  vacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: '#94a3b8' },
  cardTicket: { backgroundColor: '#fff', borderRadius: '12px', padding: '10px 12px', border: '1px solid', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  badgeAnulado: { backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.6rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px' },
  badgeTerminal: { backgroundColor: '#eff6ff', color: '#0052cc', fontSize: '0.6rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bfdbfe' },
  accionesTicket: { display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' },
  btnVerTicket: { flex: 1, padding: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  btnAnularTicket: { padding: '6px 10px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 'bold', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }
};
