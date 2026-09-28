import React, { useState } from 'react';
import { 
  ArrowLeft, TrendingUp, DollarSign, Download, Calendar, 
  Package, PieChart, Star, Layers, FileSpreadsheet, CheckCircle2,
  Filter, ChevronDown
} from 'lucide-react';

export default function MetricasModal({
  transaccionesTurno = [],
  historicoGlobal = [],
  productos = [],
  tasaCambio = 855.66,
  alVolver
}) {
  const [vista, setVista] = useState('turno'); // 'turno' | 'historico'
  const [periodoFiltro, setPeriodoFiltro] = useState('todos'); // 'todos' | 'hoy' | 'ayer' | 'semana' | 'mes' | 'custom'
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const tasa = Number(tasaCambio) || 1;

  // Normalizador universal de ventas para que nunca fallen campos
  const normalizarVenta = (v) => {
    let items = [];
    if (Array.isArray(v.items) && v.items.length > 0) {
      items = v.items;
    } else if (v.detalles && Array.isArray(v.detalles.items)) {
      items = v.detalles.items;
    } else if (typeof v.detalles === 'string') {
      try {
        const parsed = JSON.parse(v.detalles);
        if (Array.isArray(parsed.items)) items = parsed.items;
      } catch (e) {}
    }

    const totalUSD = Number(v.totalUSD ?? v.total_usd ?? v.montoTotal ?? 0);
    const totalBS = Number(v.totalBS ?? v.total_bs ?? (totalUSD * tasa));
    const fecha = v.fecha || v.created_at || v.fechaFormateada || new Date().toISOString();
    const correlativo = v.correlativo || v.id || '00000';
    const clienteNombre = v.cliente?.nombre || v.cliente_nombre || 'Consumidor Final';
    const clienteDoc = v.cliente?.doc || v.cliente_doc || 'V-00000000';
    const clienteTelefono = v.cliente?.telefono || v.cliente_telefono || '';
    const metodoPago = v.metodoPago || v.metodo_pago || 'Efectivo';
    const cajero = v.cajero || v.cajero_nombre || 'Angel Pantoja';
    const caja = v.caja || v.caja_nombre || 'Caja 01';

    return {
      ...v,
      items,
      totalUSD,
      totalBS,
      fecha,
      correlativo,
      clienteNombre,
      clienteDoc,
      clienteTelefono,
      metodoPago,
      cajero,
      caja
    };
  };

  // 1. Filtrado por vista
  const poolVentas = (vista === 'turno' ? transaccionesTurno : historicoGlobal)
    .filter(t => !t.anulada && (vista === 'historico' || !t.cerradoEnTurno))
    .map(normalizarVenta);

  // 2. Filtrado por fechas
  const hoyStr = new Date().toISOString().slice(0, 10);
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().slice(0, 10);

  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const ventasFiltradas = poolVentas.filter(v => {
    if (vista === 'turno') return true;

    const fechaV = (v.fecha || '').slice(0, 10);
    const fechaObj = new Date(v.fecha || Date.now());

    if (periodoFiltro === 'hoy') return fechaV === hoyStr;
    if (periodoFiltro === 'ayer') return fechaV === ayerStr;
    if (periodoFiltro === 'semana') return fechaObj >= sieteDiasAtras;
    if (periodoFiltro === 'mes') return fechaObj >= inicioMes;
    if (periodoFiltro === 'custom') {
      if (fechaInicio && fechaV < fechaInicio) return false;
      if (fechaFin && fechaV > fechaFin) return false;
      return true;
    }
    return true;
  });

  // 3. Cálculos financieros
  let ventaBrutaUSD = 0;
  let costoTotalUSD = 0;
  let totalPiezasVendidas = 0;
  let totalPesoKgVendido = 0;

  const conteoProductos = {};
  const conteoCategorias = {};

  ventasFiltradas.forEach(v => {
    ventaBrutaUSD += v.totalUSD;

    v.items.forEach(it => {
      const cant = Number(it.cantidad || 0);
      const costoUnit = Number(it.costoUSD ?? it.costo ?? 0);
      const precioUnit = Number(it.precioUSD ?? it.precio ?? 0);

      costoTotalUSD += (costoUnit * cant);

      if (it.esPesado || (cant % 1 !== 0)) {
        totalPesoKgVendido += cant;
      } else {
        totalPiezasVendidas += Math.round(cant);
      }

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

  const rankingProductos = Object.values(conteoProductos)
    .sort((a, b) => b.totalUSD - a.totalUSD)
    .slice(0, 5);

  const rankingCategorias = Object.entries(conteoCategorias)
    .map(([cat, data]) => ({ categoria: cat, ...data }))
    .sort((a, b) => b.totalUSD - a.totalUSD);

  // DESCARGA ROBUSTA CON BLOB (Compatible con Android / Chrome / PC)
  const exportarReporteCompleto = () => {
    if (ventasFiltradas.length === 0) {
      alert(`No hay ventas para exportar en la vista "${vista === 'turno' ? 'Turno Actual' : 'Histórico Global'}". Si acabas de cerrar turno, cambia a la pestaña "Histórico Global" para descargar el reporte.`);
      return;
    }

    const filas = [];
    filas.push([
      'Nro Ticket',
      'Fecha y Hora',
      'Cliente',
      'Cedula/RIF',
      'Telefono',
      'Forma de Pago',
      'Articulos Vendidos',
      'Total Venta (USD)',
      'Costo Mercancia (USD)',
      'Ganancia Neta (USD)',
      'Margen Utilidad (%)',
      'Total Venta (BS)',
      'Tasa BCV',
      'Cajero',
      'Caja'
    ]);

    ventasFiltradas.forEach(v => {
      const ticket = v.correlativo.startsWith('#') ? v.correlativo : `#${v.correlativo}`;
      const fechaTexto = v.fechaFormateada || new Date(v.fecha).toLocaleString();
      
      let costoVenta = 0;
      const itemsTextoArr = v.items.map(it => {
        const cUnit = Number(it.costoUSD ?? it.costo ?? 0);
        const cant = Number(it.cantidad || 0);
        costoVenta += (cUnit * cant);
        const sufijo = it.esPesado || (cant % 1 !== 0) ? 'kg' : 'u';
        return `${it.nombre || 'Item'} (${cant}${sufijo})`;
      });

      const itemsCadena = itemsTextoArr.length > 0 ? itemsTextoArr.join('; ') : 'Venta directa';
      const utilidad = Math.max(0, v.totalUSD - costoVenta);
      const margen = v.totalUSD > 0 ? ((utilidad / v.totalUSD) * 100).toFixed(1) : '0.0';

      filas.push([
        ticket,
        fechaTexto,
        v.clienteNombre,
        v.clienteDoc,
        v.clienteTelefono || 'N/A',
        v.metodoPago,
        itemsCadena,
        v.totalUSD.toFixed(2),
        costoVenta.toFixed(2),
        utilidad.toFixed(2),
        `${margen}%`,
        v.totalBS.toFixed(2),
        tasa.toFixed(2),
        v.cajero,
        v.caja
      ]);
    });

    // Escapar celdas para CSV estándar
    const csvString = filas.map(f => f.map(celda => {
      const valor = String(celda ?? '').replace(/"/g, '""');
      return `"${valor}"`;
    }).join(',')).join('\r\n');

    // Blob UTF-8 con BOM para que Excel abra sin problemas de tildes o caracteres
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const etiquetaPeriodo = vista === 'turno' ? 'TurnoActual' : periodoFiltro.toUpperCase();
    link.download = `Reporte_Ventas_${etiquetaPeriodo}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            Auditoría financiera y margen de utilidad · BCV: <strong>Bs. {tasa.toFixed(2)}</strong>
          </small>
        </div>
        <button type="button" onClick={exportarReporteCompleto} style={styles.btnExportarTop} title="Descargar Reporte en Excel">
          <Download size={14} />
          <span>Excel</span>
        </button>
      </header>

      {/* Tabs Principales */}
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
        {/* Selector de Rango de Fechas (Solo en Histórico Global) */}
        {vista === 'historico' && (
          <div style={styles.bloqueFiltroFechas}>
            <div style={styles.filaBotonesPeriodo}>
              {[
                { id: 'todos', label: 'Todo el Histórico' },
                { id: 'hoy', label: 'Hoy' },
                { id: 'ayer', label: 'Ayer' },
                { id: 'semana', label: '7 Días' },
                { id: 'mes', label: 'Este Mes' },
                { id: 'custom', label: 'Rango' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodoFiltro(p.id)}
                  style={{
                    ...styles.btnPeriodoChip,
                    backgroundColor: periodoFiltro === p.id ? '#0f2a4a' : '#ffffff',
                    color: periodoFiltro === p.id ? '#ffffff' : '#475569',
                    borderColor: periodoFiltro === p.id ? '#0f2a4a' : '#cbd5e1'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {periodoFiltro === 'custom' && (
              <div style={styles.gridRangoPersonalizado}>
                <div>
                  <small style={styles.labelFechaMini}>Desde:</small>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    style={styles.inputFecha}
                  />
                </div>
                <div>
                  <small style={styles.labelFechaMini}>Hasta:</small>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    style={styles.inputFecha}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tarjeta Principal: Ganancia Neta */}
        <div style={styles.tarjetaGananciaPrincipal}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#00b050" />
            <span style={styles.etiquetaGanancia}>
              GANANCIA NETA ({vista === 'turno' ? 'EN EL TURNO' : 'EN EL PERÍODO'})
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

        {/* Botón de Descarga del Reporte */}
        <div style={styles.cajaDescargaReporte}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.8rem', color: '#0f2a4a' }}>Descargar Libro de Ventas</strong>
            <small style={{ fontSize: '0.66rem', color: '#64748b', display: 'block' }}>
              Exporta las {ventasFiltradas.length} venta(s) de esta vista con costos y utilidades
            </small>
          </div>
          <button type="button" onClick={exportarReporteCompleto} style={styles.btnDescargarExcel}>
            <FileSpreadsheet size={15} />
            <span>Descargar CSV</span>
          </button>
        </div>

        {/* Ranking Productos Estrella */}
        <div style={styles.seccionCard}>
          <div style={styles.encabezadoSeccion}>
            <Star size={16} color="#d97706" />
            <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Productos Estrella Más Vendidos</strong>
          </div>

          {rankingProductos.length === 0 ? (
            <div style={styles.vacioText}>Sin ventas registradas en esta vista o período.</div>
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

        {/* Rendimiento por Categorías */}
        <div style={styles.seccionCard}>
          <div style={styles.encabezadoSeccion}>
            <PieChart size={16} color="#0052cc" />
            <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Rendimiento por Categorías</strong>
          </div>

          {rankingCategorias.length === 0 ? (
            <div style={styles.vacioText}>Sin ventas clasificadas en esta vista o período.</div>
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
  bloqueFiltroFechas: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  filaBotonesPeriodo: {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    padding: '2px 0'
  },
  btnPeriodoChip: {
    flex: 1,
    whiteSpace: 'nowrap',
    padding: '5px 8px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  gridRangoPersonalizado: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginTop: '4px'
  },
  labelFechaMini: {
    fontSize: '0.64rem',
    fontWeight: 'bold',
    color: '#64748b',
    display: 'block'
  },
  inputFecha: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '5px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.74rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
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
