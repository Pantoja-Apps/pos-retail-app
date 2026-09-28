import React, { useState } from 'react';
import { 
  ArrowLeft, TrendingUp, DollarSign, Download, Calendar, 
  Package, PieChart, Star, Layers, FileSpreadsheet, CheckCircle2
} from 'lucide-react';

export default function MetricasModal({
  transaccionesTurno = [],
  historicoGlobal = [],
  productos = [],
  tasaCambio = 855.66,
  alVolver
}) {
  const [vista, setVista] = useState('turno'); // 'turno' | 'historico'
  const tasa = Number(tasaCambio) || 1;

  // Filtrar ventas no anuladas según la vista seleccionada
  const ventasActivas = (vista === 'turno' ? transaccionesTurno : historicoGlobal).filter(t => !t.anulada);

  // 1. CÁLCULO DE INGRESOS, COSTOS Y UTILIDAD
  let ventaBrutaUSD = 0;
  let costoTotalUSD = 0;
  let totalPiezasVendidas = 0;
  let totalPesoKgVendido = 0;

  // Contadores para productos estrella y categorías
  const conteoProductos = {};
  const conteoCategorias = {};

  ventasActivas.forEach(v => {
    const totalVenta = Number(v.totalUSD || v.total_usd || 0);
    ventaBrutaUSD += totalVenta;

    const items = Array.isArray(v.items) ? v.items : (v.detalles?.items || []);
    items.forEach(it => {
      const cant = Number(it.cantidad || 0);
      const costoUnit = Number(it.costoUSD || it.costo || 0);
      const precioUnit = Number(it.precioUSD || it.precio || 0);

      // Costo acumulado
      costoTotalUSD += (costoUnit * cant);

      // Cantidades
      if (it.esPesado || (cant % 1 !== 0)) {
        totalPesoKgVendido += cant;
      } else {
        totalPiezasVendidas += Math.round(cant);
      }

      // Conteo para ranking de productos
      const prodNombre = it.nombre || 'Producto';
      if (!conteoProductos[prodNombre]) {
        conteoProductos[prodNombre] = {
          nombre: prodNombre,
          cantidad: 0,
          totalUSD: 0,
          esPesado: Boolean(it.esPesado || (cant % 1 !== 0))
        };
      }
      conteoProductos[prodNombre].cantidad += cant;
      conteoProductos[prodNombre].totalUSD += (precioUnit * cant);

      // Categorías
      const cat = it.categoria || 'Víveres';
      if (!conteoCategorias[cat]) {
        conteoCategorias[cat] = { totalUSD: 0, cantidad: 0 };
      }
      conteoCategorias[cat].totalUSD += (precioUnit * cant);
      conteoCategorias[cat].cantidad += cant;
    });
  });

  const gananciaNetaUSD = Math.max(0, ventaBrutaUSD - costoTotalUSD);
  const gananciaNetaBS = gananciaNetaUSD * tasa;
  const ventaBrutaBS = ventaBrutaUSD * tasa;
  const margenUtilidad = ventaBrutaUSD > 0 ? ((gananciaNetaUSD / ventaBrutaUSD) * 100).toFixed(1) : '0.0';

  // Ordenar productos estrella (Top 5 más vendidos)
  const rankingProductos = Object.values(conteoProductos)
    .sort((a, b) => b.totalUSD - a.totalUSD)
    .slice(0, 5);

  // Ordenar categorías
  const rankingCategorias = Object.entries(conteoCategorias)
    .map(([cat, data]) => ({ categoria: cat, ...data }))
    .sort((a, b) => b.totalUSD - a.totalUSD);

  // FUNCIÓN PARA EXPORTAR REPORTE A EXCEL (CSV)
  const exportarReporteCSV = () => {
    if (ventasActivas.length === 0) return alert('No hay ventas registradas para exportar.');

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Ticket,Fecha,Cliente,Cedula,Forma de Pago,Total USD,Total BS,Tasa BCV,Cajero\n';

    ventasActivas.forEach(v => {
      const ticket = v.correlativo ? `#${v.correlativo}` : `#${String(v.id).slice(-6)}`;
      const fecha = (v.fechaFormateada || v.fecha || '').replace(',', '');
      const cliente = (v.cliente?.nombre || v.cliente_nombre || 'Consumidor Final').replace(',', '');
      const cedula = (v.cliente?.doc || v.cliente_doc || 'V-00000000').replace(',', '');
      const pago = (v.metodoPago || 'Efectivo').replace(',', '');
      const usd = Number(v.totalUSD || 0).toFixed(2);
      const bs = Number(v.totalBS || (Number(v.totalUSD || 0) * tasa)).toFixed(2);
      const cajero = (v.cajero || 'Angel Pantoja').replace(',', '');

      csvContent += `${ticket},${fecha},${cliente},${cedula},${pago},${usd},${bs},${tasa.toFixed(2)},${cajero}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Ventas_${vista.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* Cabecera */}
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Rendimiento y Ganancias</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            Métricas contables y utilidad neta · BCV: <strong>Bs. {tasa.toFixed(2)}</strong>
          </small>
        </div>
        <button type="button" onClick={exportarReporteCSV} style={styles.btnExportarTop} title="Descargar Excel / CSV">
          <Download size={14} />
          <span>Excel</span>
        </button>
      </header>

      {/* Tabs Turno Actual vs Histórico Total */}
      <div style={styles.tabsFila}>
        <button
          type="button"
          onClick={() => setVista('turno')}
          style={{
            ...styles.btnTab,
            borderBottomColor: vista === 'turno' ? '#00b050' : 'transparent',
            color: vista === 'turno' ? '#0f2a4a' : '#64748b'
          }}
        >
          <Calendar size={15} />
          <span>Turno Actual ({transaccionesTurno.filter(t => !t.anulada && !t.cerradoEnTurno).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setVista('historico')}
          style={{
            ...styles.btnTab,
            borderBottomColor: vista === 'historico' ? '#00b050' : 'transparent',
            color: vista === 'historico' ? '#0f2a4a' : '#64748b'
          }}
        >
          <Layers size={15} />
          <span>Histórico Global ({historicoGlobal.filter(t => !t.anulada).length})</span>
        </button>
      </div>

      <main style={styles.cuerpo}>
        {/* Tarjeta Principal: Ganancia Neta */}
        <div style={styles.tarjetaGananciaPrincipal}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#00b050" />
            <span style={styles.etiquetaGanancia}>
              GANANCIA NETA ({vista === 'turno' ? 'EN EL TURNO' : 'ACUMULADA'})
            </span>
          </div>

          <div style={styles.cifraGananciaUSD}>+${gananciaNetaUSD.toFixed(2)}</div>
          <div style={styles.cifraGananciaBS}>Bs. {gananciaNetaBS.toFixed(2)}</div>

          <div style={styles.pillMargen}>
            Margen de Utilidad Promedio: <strong>{margenUtilidad}%</strong>
          </div>
        </div>

        {/* Tarjetas Secundarias: Venta Bruta y Costo */}
        <div style={styles.gridSecundario}>
          <div style={styles.cardDetalle}>
            <small style={styles.subLabelDetalle}>Venta Bruta Facturada</small>
            <strong style={styles.valorCardSec}>${ventaBrutaUSD.toFixed(2)}</strong>
            <span style={styles.textoPieDetalle}>Bs. {ventaBrutaBS.toFixed(2)}</span>
          </div>

          <div style={styles.cardDetalle}>
            <small style={styles.subLabelDetalle}>Costo de Mercancía</small>
            <strong style={{ ...styles.valorCardSec, color: '#dc2626' }}>${costoTotalUSD.toFixed(2)}</strong>
            <span style={styles.textoPieDetalle}>
              {totalPiezasVendidas} unids {totalPesoKgVendido > 0 && `· ${totalPesoKgVendido.toFixed(2)}kg`}
            </span>
          </div>
        </div>

        {/* Botón de Exportación Rápida */}
        <div style={styles.cajaDescargaReporte}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.8rem', color: '#0f2a4a' }}>Descargar Libro de Ventas</strong>
            <small style={{ fontSize: '0.66rem', color: '#64748b', display: 'block' }}>
              Exporta la lista de facturas de esta vista en formato Excel / CSV
            </small>
          </div>
          <button type="button" onClick={exportarReporteCSV} style={styles.btnDescargarExcel}>
            <FileSpreadsheet size={15} />
            <span>Descargar CSV</span>
          </button>
        </div>

        {/* Sección: Productos Estrella */}
        <div style={styles.seccionCard}>
          <div style={styles.encabezadoSeccion}>
            <Star size={16} color="#d97706" />
            <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Productos Estrella Más Vendidos</strong>
          </div>

          {rankingProductos.length === 0 ? (
            <div style={styles.vacioText}>Sin ventas registradas en esta vista.</div>
          ) : (
            <div style={styles.listaRanking}>
              {rankingProductos.map((p, idx) => (
                <div key={idx} style={styles.itemRanking}>
                  <div style={styles.circuloRanking}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.nombreRanking}>{p.nombre}</div>
                    <small style={styles.subRanking}>
                      {p.esPesado ? `${Number(p.cantidad).toFixed(3)} kg vendidos` : `${Math.round(p.cantidad)} unids vendidas`}
                    </small>
                  </div>
                  <strong style={styles.montoRanking}>${p.totalUSD.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Rendimiento por Categorías */}
        <div style={styles.seccionCard}>
          <div style={styles.encabezadoSeccion}>
            <PieChart size={16} color="#0052cc" />
            <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Rendimiento por Categorías</strong>
          </div>

          {rankingCategorias.length === 0 ? (
            <div style={styles.vacioText}>Sin ventas clasificadas en esta vista.</div>
          ) : (
            <div style={styles.listaRanking}>
              {rankingCategorias.map((c, idx) => {
                const porcentajeCat = ventaBrutaUSD > 0 ? ((c.totalUSD / ventaBrutaUSD) * 100).toFixed(0) : 0;
                return (
                  <div key={idx} style={styles.itemCategoria}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0f2a4a' }}>{c.categoria}</strong>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#0052cc' }}>${c.totalUSD.toFixed(2)}</strong>
                        <small style={{ color: '#64748b', fontSize: '0.66rem', marginLeft: '6px' }}>({porcentajeCat}%)</small>
                      </div>
                    </div>
                    {/* Barra de progreso */}
                    <div style={styles.barraFondo}>
                      <div style={{ ...styles.barraProgreso, width: `${porcentajeCat}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
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
  btnExportarTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f0fdf4',
    color: '#00b050',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer'
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
  tarjetaGananciaPrincipal: {
    backgroundColor: '#0f2a4a',
    borderRadius: '18px',
    padding: '14px 16px',
    textAlign: 'center',
    color: '#fff',
    boxShadow: '0 4px 14px rgba(15, 42, 74, 0.15)'
  },
  etiquetaGanancia: {
    fontSize: '0.68rem',
    fontWeight: '800',
    letterSpacing: '0.8px',
    color: '#94a3b8'
  },
  cifraGananciaUSD: {
    fontSize: '1.85rem',
    fontWeight: '900',
    color: '#00b050',
    lineHeight: 1.1,
    margin: '3px 0'
  },
  cifraGananciaBS: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#bfdbfe'
  },
  pillMargen: {
    display: 'inline-block',
    marginTop: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '3px 10px',
    fontSize: '0.7rem',
    color: '#e2e8f0'
  },
  gridSecundario: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  cardDetalle: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0'
  },
  subLabelDetalle: {
    color: '#64748b',
    fontSize: '0.68rem',
    fontWeight: 'bold'
  },
  valorCardSec: {
    fontSize: '1.2rem',
    fontWeight: '900',
    color: '#0f2a4a',
    display: 'block',
    margin: '2px 0'
  },
  textoPieDetalle: {
    fontSize: '0.66rem',
    color: '#94a3b8'
  },
  cajaDescargaReporte: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px'
  },
  btnDescargarExcel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  seccionCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '12px',
    border: '1px solid #e2e8f0'
  },
  encabezadoSeccion: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  },
  vacioText: {
    textAlign: 'center',
    padding: '14px',
    fontSize: '0.76rem',
    color: '#94a3b8'
  },
  listaRanking: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  itemRanking: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9'
  },
  circuloRanking: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nombreRanking: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#0f2a4a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  subRanking: {
    fontSize: '0.66rem',
    color: '#64748b'
  },
  montoRanking: {
    fontSize: '0.84rem',
    color: '#00b050',
    fontWeight: '800'
  },
  itemCategoria: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '6px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9'
  },
  barraFondo: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  barraProgreso: {
    height: '100%',
    backgroundColor: '#0052cc',
    borderRadius: '3px'
  }
};
