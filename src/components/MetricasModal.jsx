import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Package, PieChart, Award, Calendar, Layers } from 'lucide-react';

export default function MetricasModal({ transaccionesTurno = [], historicoGlobal = [], productos = [], tasaCambio, alVolver }) {
  const tasa = parseFloat(tasaCambio) || 1;
  const [periodo, setPeriodo] = useState('turno'); // 'turno' o 'historico'

  // Si elige 'turno' usa las transacciones del corte actual; si elige 'historico' usa el consolidado permanente
  const fuenteTransacciones = periodo === 'turno' ? transaccionesTurno : historicoGlobal;
  const ventasValidas = fuenteTransacciones.filter(t => t.tipo === 'venta' && !t.anulada);

  // Mapeo exhaustivo de costos de productos
  const mapaCostos = new Map();
  productos.forEach(p => {
    const costoDirecto = parseFloat(p.costoUSD);
    const costoFinal = (!isNaN(costoDirecto) && costoDirecto > 0) 
      ? costoDirecto 
      : (parseFloat(p.precioUSD) || 0) * 0.75;

    mapaCostos.set(p.id, costoFinal);
    if (p.codigo) mapaCostos.set(p.codigo, costoFinal);
    if (p.nombre) mapaCostos.set(p.nombre.toLowerCase().trim(), costoFinal);
  });

  let totalVentasUSD = 0;
  let totalCostoUSD = 0;
  let totalArticulosVendidos = 0;

  const rankingProductos = {};
  const ventasPorCategoria = {};

  ventasValidas.forEach(venta => {
    totalVentasUSD += parseFloat(venta.totalUSD) || 0;

    (venta.items || []).forEach(item => {
      const cant = parseFloat(item.cantidad) || 0;
      const precioU = parseFloat(item.precioUSD) || 0;
      
      let costoU = 0;
      if (item.costoUSD !== undefined && parseFloat(item.costoUSD) > 0) {
        costoU = parseFloat(item.costoUSD);
      } else if (mapaCostos.has(item.id)) {
        costoU = mapaCostos.get(item.id);
      } else if (mapaCostos.has(item.codigo)) {
        costoU = mapaCostos.get(item.codigo);
      } else if (item.nombre && mapaCostos.has(item.nombre.toLowerCase().trim())) {
        costoU = mapaCostos.get(item.nombre.toLowerCase().trim());
      } else {
        costoU = precioU * 0.75;
      }

      const subtotalVenta = precioU * cant;
      const subtotalCosto = costoU * cant;

      totalCostoUSD += subtotalCosto;
      totalArticulosVendidos += cant;

      const claveProd = item.nombre || 'Producto';
      if (!rankingProductos[claveProd]) {
        rankingProductos[claveProd] = { nombre: claveProd, cantidad: 0, totalUSD: 0, gananciaUSD: 0 };
      }
      rankingProductos[claveProd].cantidad += cant;
      rankingProductos[claveProd].totalUSD += subtotalVenta;
      rankingProductos[claveProd].gananciaUSD += (subtotalVenta - subtotalCosto);

      const cat = item.categoria || 'Víveres';
      if (!ventasPorCategoria[cat]) {
        ventasPorCategoria[cat] = { nombre: cat, totalUSD: 0, gananciaUSD: 0 };
      }
      ventasPorCategoria[cat].totalUSD += subtotalVenta;
      ventasPorCategoria[cat].gananciaUSD += (subtotalVenta - subtotalCosto);
    });
  });

  const gananciaNetaUSD = Math.max(0, totalVentasUSD - totalCostoUSD);
  const margenPromedio = totalVentasUSD > 0 ? ((gananciaNetaUSD / totalVentasUSD) * 100) : 0;

  const topProductos = Object.values(rankingProductos)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const categoriasLista = Object.values(ventasPorCategoria)
    .sort((a, b) => b.totalUSD - a.totalUSD);

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Rendimiento y Ganancias</h2>
            <small style={{ color: '#666', fontSize: '0.72rem' }}>
              {periodo === 'turno' ? 'Métricas de la Caja Activa' : 'Consolidado Histórico Permanente'}
            </small>
          </div>
        </div>
      </header>

      {/* SELECTOR DE PERÍODO */}
      <div style={styles.barraFiltros}>
        <button
          type="button"
          onClick={() => setPeriodo('turno')}
          style={{
            ...styles.btnFiltro,
            backgroundColor: periodo === 'turno' ? '#0052cc' : '#fff',
            color: periodo === 'turno' ? '#fff' : '#64748b',
            borderColor: periodo === 'turno' ? '#0052cc' : '#cbd5e1'
          }}
        >
          <Calendar size={14} /> Turno Actual ({transaccionesTurno.filter(t => t.tipo === 'venta' && !t.anulada).length})
        </button>

        <button
          type="button"
          onClick={() => setPeriodo('historico')}
          style={{
            ...styles.btnFiltro,
            backgroundColor: periodo === 'historico' ? '#0052cc' : '#fff',
            color: periodo === 'historico' ? '#fff' : '#64748b',
            borderColor: periodo === 'historico' ? '#0052cc' : '#cbd5e1'
          }}
        >
          <Layers size={14} /> Histórico Total ({historicoGlobal.filter(t => t.tipo === 'venta' && !t.anulada).length})
        </button>
      </div>

      <div style={styles.scrollArea}>
        
        {/* BANNER PRINCIPAL DE GANANCIA NETA */}
        <div style={styles.cardGananciaPrincipal}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <TrendingUp size={18} color="#16a34a" />
            <span style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Ganancia Neta {periodo === 'turno' ? 'en el Turno' : 'Acumulada Total'}
            </span>
          </div>
          <div style={styles.montoGanancia}>+${gananciaNetaUSD.toFixed(2)}</div>
          <div style={{ fontSize: '0.82rem', color: '#0052cc', fontWeight: 'bold' }}>
            Bs. {(gananciaNetaUSD * tasa).toFixed(2)}
          </div>
          <div style={styles.badgeMargen}>
            Margen de Utilidad Promedio: <strong>{margenPromedio.toFixed(1)}%</strong>
          </div>
        </div>

        {/* RESUMEN DE VENTAS Y COSTOS */}
        <div style={styles.gridResumen}>
          <div style={styles.cardMiniResumen}>
            <span style={styles.miniLabel}>Venta Bruta Cobrada</span>
            <div style={{ ...styles.miniValor, color: '#0f172a' }}>${totalVentasUSD.toFixed(2)}</div>
            <small style={styles.miniSub}>Bs. {(totalVentasUSD * tasa).toFixed(2)}</small>
          </div>

          <div style={styles.cardMiniResumen}>
            <span style={styles.miniLabel}>Costo de Mercancía</span>
            <div style={{ ...styles.miniValor, color: '#64748b' }}>${totalCostoUSD.toFixed(2)}</div>
            <small style={styles.miniSub}>{totalArticulosVendidos} und. vendidas</small>
          </div>
        </div>

        {/* TOP 5 PRODUCTOS MÁS VENDIDOS */}
        <div style={styles.seccionTitulo}>
          <Award size={15} color="#eab308" /> PRODUCTOS ESTRELLA MÁS VENDIDOS
        </div>

        <div style={styles.cardLista}>
          {topProductos.length === 0 ? (
            <div style={styles.vacioMini}>Sin ventas registradas en esta vista.</div>
          ) : (
            topProductos.map((prod, idx) => (
              <div key={idx} style={styles.filaTopProd}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.puestoTop}>#{idx + 1}</span>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>{prod.nombre}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {prod.cantidad} unidades vendidas
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#0f172a' }}>
                    ${prod.totalUSD.toFixed(2)}
                  </div>
                  <small style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 'bold' }}>
                    +${prod.gananciaUSD.toFixed(2)} ganancia
                  </small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RENDIMIENTO POR CATEGORÍAS */}
        <div style={{ ...styles.seccionTitulo, marginTop: '16px' }}>
          <PieChart size={15} color="#0052cc" /> RENDIMIENTO POR CATEGORÍAS
        </div>

        <div style={styles.cardLista}>
          {categoriasLista.length === 0 ? (
            <div style={styles.vacioMini}>Sin ventas clasificadas en esta vista.</div>
          ) : (
            categoriasLista.map((cat, idx) => (
              <div key={idx} style={styles.filaCategoria}>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#334155' }}>{cat.nombre}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 'bold' }}>
                    Utilidad limpia: +${cat.gananciaUSD.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#0f172a' }}>
                    ${cat.totalUSD.toFixed(2)}
                  </span>
                  <small style={{ display: 'block', fontSize: '0.67rem', color: '#64748b' }}>
                    Bs. {(cat.totalUSD * tasa).toFixed(2)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  barraFiltros: { display: 'flex', gap: '8px', padding: '10px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnFiltro: { flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '14px 16px 80px 16px', WebkitOverflowScrolling: 'touch' },
  cardGananciaPrincipal: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px', textAlign: 'center', marginBottom: '12px', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.06)' },
  montoGanancia: { fontSize: '2.1rem', fontWeight: '900', color: '#16a34a', margin: '4px 0' },
  badgeMargen: { display: 'inline-block', backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', marginTop: '8px', border: '1px solid #86efac' },
  gridResumen: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' },
  cardMiniResumen: { backgroundColor: '#fff', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' },
  miniLabel: { fontSize: '0.68rem', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '3px' },
  miniValor: { fontSize: '1.15rem', fontWeight: '800' },
  miniSub: { fontSize: '0.68rem', color: '#64748b' },
  seccionTitulo: { fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase' },
  cardLista: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '6px 12px' },
  filaTopProd: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  puestoTop: { backgroundColor: '#fef08a', color: '#854d0e', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 'bold' },
  filaCategoria: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  vacioMini: { textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8', padding: '14px 0', fontStyle: 'italic' }
};
