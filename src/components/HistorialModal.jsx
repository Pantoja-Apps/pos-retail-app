import React, { useState } from 'react';
import { ArrowLeft, Printer, Ban, History, Filter } from 'lucide-react';

export default function HistorialModal({ transacciones, tasaCambio, alVerTicket, alAnularVenta, alVolver }) {
  const [filtro, setFiltro] = useState('activas'); // 'activas', 'anuladas', 'todas'

  const ventas = transacciones.filter(t => t.tipo === 'venta');

  const ventasFiltradas = ventas.filter(v => {
    if (filtro === 'activas') return !v.anulada;
    if (filtro === 'anuladas') return v.anulada;
    return true;
  });

  const totalActivas = ventas.filter(v => !v.anulada).length;
  const totalAnuladas = ventas.filter(v => v.anulada).length;

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}><ArrowLeft color="#333" size={20} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Historial de Ventas</h2>
            <small style={{ color: '#666', fontSize: '0.75rem' }}>{totalActivas} activas · {totalAnuladas} anuladas</small>
          </div>
        </div>
      </header>

      {/* PESTAÑAS DE FILTRO */}
      <div style={styles.barraFiltros}>
        <button
          type="button"
          onClick={() => setFiltro('activas')}
          style={{ ...styles.btnFiltro, ...(filtro === 'activas' ? styles.btnFiltroActivo : {}) }}
        >
          Activas ({totalActivas})
        </button>
        <button
          type="button"
          onClick={() => setFiltro('anuladas')}
          style={{ ...styles.btnFiltro, ...(filtro === 'anuladas' ? styles.btnFiltroAnuladoActivo : {}) }}
        >
          Anuladas ({totalAnuladas})
        </button>
        <button
          type="button"
          onClick={() => setFiltro('todas')}
          style={{ ...styles.btnFiltro, ...(filtro === 'todas' ? styles.btnFiltroActivo : {}) }}
        >
          Todas ({ventas.length})
        </button>
      </div>

      <div style={styles.lista}>
        {ventasFiltradas.length === 0 ? (
          <div style={styles.vacio}>
            <History color="#ccc" size={44} />
            <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#555' }}>
              {filtro === 'anuladas' ? 'No hay facturas anuladas.' : 'No hay ventas para mostrar.'}
            </p>
          </div>
        ) : (
          ventasFiltradas.map((v) => {
            const esAnulada = v.anulada;
            return (
              <div 
                key={v.id} 
                style={{ 
                  ...styles.card, 
                  backgroundColor: esAnulada ? '#fafafa' : '#fff',
                  borderLeft: esAnulada ? '4px solid #d32f2f' : '4px solid #28a745'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#111' }}>Factura #{v.id}</strong>
                      {v.esCredito && <span style={styles.tagCredito}>CRÉDITO</span>}
                      {esAnulada && <span style={styles.tagAnulada}>ANULADA</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '2px' }}>
                      {v.fecha} | {v.cliente?.nombre || 'Consumidor Final'} ({v.cliente?.doc || 'V-00000000'})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: esAnulada ? '#999' : '#28a745', textDecoration: esAnulada ? 'line-through' : 'none' }}>
                      ${v.totalUSD}
                    </div>
                    <small style={{ fontSize: '0.7rem', color: '#666', textDecoration: esAnulada ? 'line-through' : 'none' }}>
                      Bs. {v.totalBS}
                    </small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button type="button" onClick={() => alVerTicket(v)} style={{ ...styles.btnAccion, backgroundColor: '#0052cc', color: '#fff' }}>
                    <Printer size={14} /> Ver Ticket / WhatsApp
                  </button>
                  {!esAnulada && (
                    <button type="button" onClick={() => alAnularVenta(v)} style={{ ...styles.btnAccion, backgroundColor: '#ffebee', color: '#c62828' }} title="Anular y reponer stock">
                      <Ban size={14} /> Anular Venta
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e4e8' },
  btnBack: { background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  barraFiltros: { display: 'flex', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e1e4e8' },
  btnFiltro: { flex: 1, padding: '6px 8px', border: '1px solid #e1e4e8', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', color: '#555', cursor: 'pointer' },
  btnFiltroActivo: { backgroundColor: '#0052cc', color: '#fff', borderColor: '#0052cc' },
  btnFiltroAnuladoActivo: { backgroundColor: '#d32f2f', color: '#fff', borderColor: '#d32f2f' },
  lista: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  card: { padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  vacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%' },
  tagCredito: { fontSize: '0.65rem', backgroundColor: '#fff3e0', color: '#e65100', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' },
  tagAnulada: { fontSize: '0.65rem', backgroundColor: '#ffebee', color: '#c62828', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' },
  btnAccion: { flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }
};
