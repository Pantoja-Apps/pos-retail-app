import React, { useState } from 'react';
import { 
  ArrowLeft, TrendingUp, DollarSign, Download, Calendar, 
  Package, PieChart, Star, Layers, FileSpreadsheet, CheckCircle2,
  Printer, Share2, ShieldCheck, X, Wallet, CreditCard, Smartphone, Banknote,
  ArrowUpRight, ShoppingBag, BarChart3
} from 'lucide-react';

export default function MetricasModal({
  transaccionesTurno = [],
  historicoGlobal = [],
  gastos = [],
  productos = [],
  tasaCambio = 855.66,
  configEmpresa,
  usuarioActivo,
  alVolver
}) {
  const [vista, setVista] = useState('turno'); // 'turno' | 'historico'
  const [moneda, setMoneda] = useState('USD'); // 'USD' | 'BS'
  const [periodoFiltro, setPeriodoFiltro] = useState('todos'); // 'todos' | 'hoy' | 'ayer' | 'semana' | 'mes' | 'custom'
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [modalReporteEjecutivo, setModalReporteEjecutivo] = useState(false);

  const tasa = Number(tasaCambio) || 1;

  // 1. Normalizador universal de ventas
  const normalizarVenta = (v) => {
    let items = [];
    if (Array.isArray(v.items) && v.items.length > 0) items = v.items;
    else if (v.detalles && Array.isArray(v.detalles.items)) items = v.detalles.items;
    else if (typeof v.detalles === 'string') {
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
    const pagos = Array.isArray(v.pagos) ? v.pagos : [];
    const esCredito = Boolean(v.esCredito);

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
      pagos,
      esCredito,
      cajero,
      caja
    };
  };

  // 2. Pool base según vista
  const poolVentas = (vista === 'turno' ? transaccionesTurno : historicoGlobal)
    .filter(t => !t.anulada && (vista === 'historico' || !t.cerradoEnTurno))
    .map(normalizarVenta);

  // 3. Filtrado por fechas
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

  // 4. Totales financieros
  let ventaBrutaUSD = 0;
  let costoTotalUSD = 0;
  let totalPiezasVendidas = 0;
  let totalPesoKgVendido = 0;

  // Medios de pago
  const flujoMedios = {
    usd: 0,
    bs_efectivo: 0,
    pago_movil: 0,
    punto: 0,
    credito: 0
  };

  const conteoProductos = {};
  const conteoCategorias = {};

  ventasFiltradas.forEach(v => {
    ventaBrutaUSD += v.totalUSD;

    // Métodos de pago
    if (v.esCredito) {
      flujoMedios.credito += v.totalUSD;
    } else if (v.pagos && v.pagos.length > 0) {
      v.pagos.forEach(p => {
        const met = (p.metodo || '').toLowerCase();
        const mUSD = Number(p.montoUSD || (Number(p.montoBS || p.monto || 0) / tasa));
        if (met.includes('usd') || met.includes('$')) flujoMedios.usd += mUSD;
        else if (met.includes('móvil') || met.includes('movil')) flujoMedios.pago_movil += mUSD;
        else if (met.includes('punto') || met.includes('tarjeta')) flujoMedios.punto += mUSD;
        else flujoMedios.bs_efectivo += mUSD;
      });
    } else {
      const met = (v.metodoPago || '').toLowerCase();
      if (met.includes('usd') || met === 'efectivo_usd') flujoMedios.usd += v.totalUSD;
      else if (met.includes('movil') || met === 'pago_movil') flujoMedios.pago_movil += v.totalUSD;
      else if (met.includes('punto') || met === 'punto_venta') flujoMedios.punto += v.totalUSD;
      else flujoMedios.bs_efectivo += v.totalUSD;
    }

    // Artículos
    v.items.forEach(it => {
      const cant = Number(it.cantidad || 0);
      const costoUnit = Number(it.costoUSD ?? it.costo ?? 0);
      const precioUnit = Number(it.precioUSD ?? it.precio ?? 0);

      costoTotalUSD += (costoUnit * cant);

      if (it.esPesado || (cant % 1 !== 0)) totalPesoKgVendido += cant;
      else totalPiezasVendidas += Math.round(cant);

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

  // Gastos del período/turno
  let totalGastosUSD = 0;
  if (vista === 'turno') {
    gastos.forEach(g => {
      totalGastosUSD += Number(g.montoUSD || (Number(g.monto || 0) / tasa));
    });
  }

  // Utilidad Líquida Operativa
  const gananciaBrutaUSD = Math.max(0, ventaBrutaUSD - costoTotalUSD);
  const gananciaNetaUSD = Math.max(0, gananciaBrutaUSD - totalGastosUSD);
  const margenUtilidad = ventaBrutaUSD > 0 ? ((gananciaNetaUSD / ventaBrutaUSD) * 100).toFixed(1) : '0.0';
  const ticketPromedioUSD = ventasFiltradas.length > 0 ? (ventaBrutaUSD / ventasFiltradas.length) : 0;

  // Valoración Patrimonial del Inventario
  let valorInventarioCostoUSD = 0;
  let valorInventarioVentaUSD = 0;
  productos.forEach(p => {
    const stk = Number(p.stock || 0);
    valorInventarioCostoUSD += (Number(p.costoUSD || 0) * stk);
    valorInventarioVentaUSD += (Number(p.precioUSD || 0) * stk);
  });
  const gananciaProyectadaInventario = Math.max(0, valorInventarioVentaUSD - valorInventarioCostoUSD);

  // Rankings
  const rankingProductos = Object.values(conteoProductos)
    .sort((a, b) => b.totalUSD - a.totalUSD)
    .slice(0, 5);

  const rankingCategorias = Object.entries(conteoCategorias)
    .map(([cat, data]) => ({ categoria: cat, ...data }))
    .sort((a, b) => b.totalUSD - a.totalUSD);

  // Formateador monetario según switch
  const formatMonto = (montoUSD) => {
    if (moneda === 'BS') {
      return `Bs. ${(Number(montoUSD) * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${Number(montoUSD).toFixed(2)}`;
  };

  // EXPORTAR CSV AUDITABLE
  const exportarCSV = () => {
    if (ventasFiltradas.length === 0) return alert('No hay ventas registradas en esta vista.');

    const filas = [
      ['Nro Ticket', 'Fecha y Hora', 'Cliente', 'Cedula/RIF', 'Telefono', 'Forma de Pago', 'Articulos', 'Total Venta (USD)', 'Costo (USD)', 'Ganancia (USD)', 'Margen %', 'Total Venta (BS)', 'Tasa BCV', 'Cajero', 'Caja']
    ];

    ventasFiltradas.forEach(v => {
      let costoV = 0;
      const itemsTexto = v.items.map(it => {
        costoV += (Number(it.costoUSD ?? it.costo ?? 0) * Number(it.cantidad || 0));
        return `${it.nombre} (${it.cantidad}${it.esPesado ? 'kg' : 'u'})`;
      }).join('; ');

      const util = Math.max(0, v.totalUSD - costoV);
      const marg = v.totalUSD > 0 ? ((util / v.totalUSD) * 100).toFixed(1) : '0.0';

      filas.push([
        v.correlativo.startsWith('#') ? v.correlativo : `#${v.correlativo}`,
        v.fechaFormateada || new Date(v.fecha).toLocaleString(),
        v.clienteNombre,
        v.clienteDoc,
        v.clienteTelefono || 'N/A',
        v.metodoPago,
        itemsTexto || 'Venta directa',
        v.totalUSD.toFixed(2),
        costoV.toFixed(2),
        util.toFixed(2),
        `${marg}%`,
        v.totalBS.toFixed(2),
        tasa.toFixed(2),
        v.cajero,
        v.caja
      ]);
    });

    const csvContent = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_Ventas_${vista.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const compartirReporteEjecutivoWhatsApp = () => {
    let t = `*📈 INFORME FINANCIERO Y RENDIMIENTO*\n`;
    t += `*${(configEmpresa?.nombre || 'FACILITO POS').toUpperCase()}*\n`;
    if (configEmpresa?.rif) t += `RIF: ${configEmpresa.rif}\n`;
    t += `================================\n`;
    t += `Período: ${vista === 'turno' ? 'Turno Actual' : periodoFiltro.toUpperCase()}\n`;
    t += `Fecha de Emisión: ${new Date().toLocaleString()}\n`;
    t += `Total Operaciones: ${ventasFiltradas.length} ticket(s)\n`;
    t += `Ticket Promedio: $${ticketPromedioUSD.toFixed(2)} (Bs. ${(ticketPromedioUSD * tasa).toFixed(2)})\n`;
    t += `================================\n`;
    t += `*RESULTADOS FINANCIEROS:*\n`;
    t += `  • Venta Bruta Facturada: $${ventaBrutaUSD.toFixed(2)} (Bs. ${(ventaBrutaUSD * tasa).toFixed(2)})\n`;
    t += `  • Costo de Mercancía:    $${costoTotalUSD.toFixed(2)}\n`;
    if (totalGastosUSD > 0) t += `  • Salidas y Gastos:      -$${totalGastosUSD.toFixed(2)}\n`;
    t += `  • *GANANCIA NETA REAL:*  +$${gananciaNetaUSD.toFixed(2)} (Bs. ${(gananciaNetaUSD * tasa).toFixed(2)})\n`;
    t += `  • *Margen de Utilidad:*   ${margenUtilidad}%\n`;
    t += `--------------------------------\n`;
    t += `*FLUJO DE CAJA POR MÉTODO:*\n`;
    t += `  • Efectivo Divisas ($): $${flujoMedios.usd.toFixed(2)}\n`;
    t += `  • Pago Móvil:          Bs. ${(flujoMedios.pago_movil * tasa).toFixed(2)}\n`;
    t += `  • Punto Débito:        Bs. ${(flujoMedios.punto * tasa).toFixed(2)}\n`;
    t += `  • Efectivo Bolívares:  Bs. ${(flujoMedios.bs_efectivo * tasa).toFixed(2)}\n`;
    if (flujoMedios.credito > 0) t += `  • Cuentas por Cobrar:  $${flujoMedios.credito.toFixed(2)}\n`;
    t += `================================\n`;
    t += `Tasa BCV Oficial: Bs. ${tasa.toFixed(2)} / USD\n`;
    t += `Informe auditado por Facilito POS\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(t)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* Cabecera */}
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Rendimiento y Finanzas</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            Control Ejecutivo · BCV: <strong>Bs. {tasa.toFixed(2)}</strong>
          </small>
        </div>

        {/* Switch de Moneda Maestro */}
        <div style={styles.switchMonedaBox}>
          <button
            type="button"
            onClick={() => setMoneda('USD')}
            style={{
              ...styles.btnMonedaSwitch,
              backgroundColor: moneda === 'USD' ? '#00b050' : 'transparent',
              color: moneda === 'USD' ? '#fff' : '#64748b'
            }}
          >
            $
          </button>
          <button
            type="button"
            onClick={() => setMoneda('BS')}
            style={{
              ...styles.btnMonedaSwitch,
              backgroundColor: moneda === 'BS' ? '#0052cc' : 'transparent',
              color: moneda === 'BS' ? '#fff' : '#64748b'
            }}
          >
            Bs
          </button>
        </div>
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
        {/* Selector de Fechas (Solo en Histórico) */}
        {vista === 'historico' && (
          <div style={styles.bloqueFiltroFechas}>
            <div style={styles.filaBotonesPeriodo}>
              {[
                { id: 'todos', label: 'Todo' },
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

        {/* Tarjeta Principal: Ganancia Neta Real */}
        <div style={styles.tarjetaGananciaPrincipal}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#00b050" />
            <span style={styles.etiquetaGanancia}>
              UTILIDAD NETA {vista === 'turno' ? 'DEL TURNO' : 'DEL PERÍODO'}
            </span>
          </div>

          <div style={styles.cifraGananciaUSD}>{formatMonto(gananciaNetaUSD)}</div>
          <div style={styles.cifraSecundaria}>
            {moneda === 'USD' ? `Bs. ${(gananciaNetaUSD * tasa).toFixed(2)}` : `$${gananciaNetaUSD.toFixed(2)}`}
          </div>

          <div style={styles.filaPillsGanancia}>
            <span style={styles.pillMargen}>
              Margen de Ganancia: <strong>{margenUtilidad}%</strong>
            </span>
            <span style={styles.pillTicketMedio}>
              Ticket Promedio: <strong>{formatMonto(ticketPromedioUSD)}</strong>
            </span>
          </div>
        </div>

        {/* Tablero de KPIs Cuádruple */}
        <div style={styles.gridKpis}>
          <div style={styles.cardKpi}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <ShoppingBag size={14} color="#0052cc" />
              <small style={styles.kpiLabel}>Venta Bruta</small>
            </div>
            <strong style={styles.kpiValor}>{formatMonto(ventaBrutaUSD)}</strong>
            <span style={styles.kpiSub}>{ventasFiltradas.length} operaciones</span>
          </div>

          <div style={styles.cardKpi}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <Package size={14} color="#dc2626" />
              <small style={styles.kpiLabel}>Costo Mercancía</small>
            </div>
            <strong style={{ ...styles.kpiValor, color: '#dc2626' }}>{formatMonto(costoTotalUSD)}</strong>
            <span style={styles.kpiSub}>{totalPiezasVendidas}u · {totalPesoKgVendido.toFixed(2)}kg</span>
          </div>

          <div style={styles.cardKpi}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <Wallet size={14} color="#d97706" />
              <small style={styles.kpiLabel}>Gastos Operativos</small>
            </div>
            <strong style={{ ...styles.kpiValor, color: '#d97706' }}>{formatMonto(totalGastosUSD)}</strong>
            <span style={styles.kpiSub}>{gastos.length} deducciones</span>
          </div>

          <div style={styles.cardKpi}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <DollarSign size={14} color="#00b050" />
              <small style={styles.kpiLabel}>Utilidad Bruta</small>
            </div>
            <strong style={{ ...styles.kpiValor, color: '#00b050' }}>{formatMonto(gananciaBrutaUSD)}</strong>
            <span style={styles.kpiSub}>Antes de gastos</span>
          </div>
        </div>

        {/* Flujo de Caja por Método de Pago */}
        <div style={styles.seccionCard}>
          <div style={styles.encabezadoSeccion}>
            <BarChart3 size={16} color="#0052cc" />
            <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Distribución de Cobros por Método</strong>
          </div>

          <div style={styles.gridMediosCobro}>
            {[
              { label: 'Efectivo ($)', icon: DollarSign, color: '#00b050', val: flujoMedios.usd },
              { label: 'Pago Móvil (Bs)', icon: Smartphone, color: '#0052cc', val: flujoMedios.pago_movil },
              { label: 'Punto Débito', icon: CreditCard, color: '#7c3aed', val: flujoMedios.punto },
              { label: 'Efectivo (Bs)', icon: Banknote, color: '#d97706', val: flujoMedios.bs_efectivo },
              { label: 'Cuentas x Cobrar', icon: Wallet, color: '#dc2626', val: flujoMedios.credito }
            ].map((m, i) => {
              const Icon = m.icon;
              const porcentaje = ventaBrutaUSD > 0 ? ((m.val / ventaBrutaUSD) * 100).toFixed(0) : 0;
              return (
                <div key={i} style={styles.itemMedioRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ ...styles.iconoMiniMedio, backgroundColor: `${m.color}15` }}>
                      <Icon size={12} color={m.color} />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#334155', fontWeight: '600' }}>{m.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.8rem', color: '#0f2a4a' }}>{formatMonto(m.val)}</strong>
                    <small style={{ color: '#64748b', fontSize: '0.64rem', marginLeft: '4px' }}>({porcentaje}%)</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Valoración Patrimonial del Inventario */}
        <div style={styles.cardValoracionInventario}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={16} color="#0052cc" />
              <strong style={{ fontSize: '0.82rem', color: '#0f2a4a' }}>Capital Invertido en Inventario</strong>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 'bold' }}>
              {productos.length} Productos
            </span>
          </div>

          <div style={styles.gridInventarioValores}>
            <div>
              <small style={{ color: '#64748b', fontSize: '0.66rem' }}>Costo de Adquisición</small>
              <div style={{ fontSize: '0.96rem', fontWeight: '900', color: '#0f2a4a' }}>
                {formatMonto(valorInventarioCostoUSD)}
              </div>
            </div>
            <div>
              <small style={{ color: '#64748b', fontSize: '0.66rem' }}>Valor de Venta Proyectado</small>
              <div style={{ fontSize: '0.96rem', fontWeight: '900', color: '#0052cc' }}>
                {formatMonto(valorInventarioVentaUSD)}
              </div>
            </div>
            <div>
              <small style={{ color: '#64748b', fontSize: '0.66rem' }}>Ganancia Proyectada</small>
              <div style={{ fontSize: '0.96rem', fontWeight: '900', color: '#00b050' }}>
                +{formatMonto(gananciaProyectadaInventario)}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones de Exportación Premium */}
        <div style={styles.cajaExportacionPremium}>
          <button type="button" onClick={() => setModalReporteEjecutivo(true)} style={styles.btnReporteFormal}>
            <Printer size={15} />
            <span>Emitir Informe Ejecutivo</span>
          </button>
          <button type="button" onClick={exportarCSV} style={styles.btnExcelCSV}>
            <FileSpreadsheet size={15} />
            <span>Exportar Excel (CSV)</span>
          </button>
        </div>

        {/* Productos Estrella */}
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
                  <strong style={styles.montoRanking}>{formatMonto(p.totalUSD)}</strong>
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
                        <strong style={{ fontSize: '0.82rem', color: '#0052cc' }}>{formatMonto(c.totalUSD)}</strong>
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

      {/* MODAL INFORME EJECUTIVO AUDITABLE IMPRIMIBLE / WHATSAPP */}
      {modalReporteEjecutivo && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBoxInforme}>
            <div style={styles.barraControlInforme}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={17} color="#00b050" />
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#0f2a4a' }}>
                  Informe Financiero de Auditoría
                </h3>
              </div>
              <button type="button" onClick={() => setModalReporteEjecutivo(false)} style={styles.btnCerrarX}>
                <X size={16} />
              </button>
            </div>

            {/* Documento Imprimible */}
            <div id="area-informe-financiero" style={styles.papelInforme}>
              <div style={{ textAlign: 'center', lineHeight: 1.35 }}>
                {configEmpresa?.logo && (
                  <img src={configEmpresa.logo} alt="Logo" style={styles.logoInforme} />
                )}
                <h3 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: '900', color: '#0f2a4a' }}>
                  {(configEmpresa?.nombre || 'FACILITO POS').toUpperCase()}
                </h3>
                {configEmpresa?.rif && <div style={{ fontSize: '0.66rem', color: '#475569' }}>RIF: {configEmpresa.rif}</div>}
                {configEmpresa?.direccion && <div style={{ fontSize: '0.64rem', color: '#64748b' }}>{configEmpresa.direccion}</div>}
                {configEmpresa?.telefono && <div style={{ fontSize: '0.64rem', color: '#64748b' }}>TEL: {configEmpresa.telefono}</div>}

                <div style={styles.tagInformeTitulo}>
                  ESTADO DE RENDIMIENTO Y RESULTADOS FINANCIEROS
                </div>
              </div>

              <div style={styles.lineaDobleCorte} />

              <div style={styles.infoMetaInforme}>
                <div style={styles.filaMetaInforme}>
                  <span>PERÍODO AUDITADO:</span>
                  <strong>{vista === 'turno' ? 'TURNO ACTUAL' : periodoFiltro.toUpperCase()}</strong>
                </div>
                <div style={styles.filaMetaInforme}>
                  <span>FECHA DE EMISIÓN:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div style={styles.filaMetaInforme}>
                  <span>EMITIDO POR:</span>
                  <span>{usuarioActivo?.nombre || 'Angel Pantoja'} (Gerencia)</span>
                </div>
                <div style={styles.filaMetaInforme}>
                  <span>TASA OFICIAL BCV:</span>
                  <strong>Bs. {tasa.toFixed(2)} / USD</strong>
                </div>
              </div>

              <div style={styles.lineaDobleCorte} />

              {/* Renglones Financieros */}
              <div style={styles.seccionResultados}>
                <div style={styles.filaResultado}>
                  <span>Ventas Brutas Facturadas ({ventasFiltradas.length} ops):</span>
                  <strong>${ventaBrutaUSD.toFixed(2)}</strong>
                </div>
                <div style={styles.filaResultado}>
                  <span>Costo de Mercancía Vendida (CMV):</span>
                  <span style={{ color: '#dc2626' }}>-${costoTotalUSD.toFixed(2)}</span>
                </div>
                <div style={styles.filaResultado}>
                  <span>Utilidad Bruta de Venta:</span>
                  <strong>${gananciaBrutaUSD.toFixed(2)}</strong>
                </div>

                {totalGastosUSD > 0 && (
                  <div style={styles.filaResultado}>
                    <span>Deducción por Gastos Operativos:</span>
                    <span style={{ color: '#dc2626' }}>-${totalGastosUSD.toFixed(2)}</span>
                  </div>
                )}

                <div style={styles.lineaFina} />

                <div style={styles.filaResultadoDestacada}>
                  <span>UTILIDAD NETA REAL:</span>
                  <span style={{ color: '#00b050' }}>+${gananciaNetaUSD.toFixed(2)}</span>
                </div>
                <div style={{ ...styles.filaResultadoDestacada, fontSize: '0.86rem', color: '#0052cc' }}>
                  <span>EQUIVALENTE EN BOLÍVARES:</span>
                  <span>Bs. {(gananciaNetaUSD * tasa).toFixed(2)}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
                  Margen Neto sobre Ventas: <strong>{margenUtilidad}%</strong> · Ticket Promedio: <strong>${ticketPromedioUSD.toFixed(2)}</strong>
                </div>
              </div>

              <div style={styles.lineaDobleCorte} />

              {/* Desglose de Medios de Pago */}
              <div style={{ fontSize: '0.68rem', color: '#0f2a4a' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>RECAUDO POR FORMA DE PAGO:</strong>
                <div style={styles.filaResultado}>
                  <span>• Efectivo Divisas ($):</span>
                  <strong>${flujoMedios.usd.toFixed(2)}</strong>
                </div>
                <div style={styles.filaResultado}>
                  <span>• Pago Móvil:</span>
                  <strong>Bs. {(flujoMedios.pago_movil * tasa).toFixed(2)} (${flujoMedios.pago_movil.toFixed(2)})</strong>
                </div>
                <div style={styles.filaResultado}>
                  <span>• Punto Débito:</span>
                  <strong>Bs. {(flujoMedios.punto * tasa).toFixed(2)} (${flujoMedios.punto.toFixed(2)})</strong>
                </div>
                <div style={styles.filaResultado}>
                  <span>• Efectivo Bolívares:</span>
                  <strong>Bs. {(flujoMedios.bs_efectivo * tasa).toFixed(2)} (${flujoMedios.bs_efectivo.toFixed(2)})</strong>
                </div>
                {flujoMedios.credito > 0 && (
                  <div style={styles.filaResultado}>
                    <span>• Cuentas por Cobrar (Crédito):</span>
                    <strong style={{ color: '#dc2626' }}>${flujoMedios.credito.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div style={styles.lineaDobleCorte} />

              <div style={{ textAlign: 'center', fontSize: '0.64rem', color: '#64748b' }}>
                <ShieldCheck size={13} color="#00b050" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                <span>Documento Financiero Certificado para Auditoría y Contabilidad</span>
              </div>
            </div>

            {/* Acciones */}
            <div style={styles.accionesInformeFila}>
              <button type="button" onClick={() => window.print()} style={styles.btnImprimirInforme}>
                <Printer size={15} />
                <span>Imprimir Informe</span>
              </button>
              <button type="button" onClick={compartirReporteEjecutivoWhatsApp} style={styles.btnWhatsAppInforme}>
                <Share2 size={15} />
                <span>WhatsApp</span>
              </button>
              <button type="button" onClick={() => setModalReporteEjecutivo(false)} style={styles.btnListoInforme}>
                <span>Cerrar</span>
              </button>
            </div>
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
  switchMonedaBox: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '2px',
    border: '1px solid #e2e8f0'
  },
  btnMonedaSwitch: {
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.72rem',
    fontWeight: '900',
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
  cifraSecundaria: {
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#bfdbfe'
  },
  filaPillsGanancia: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    marginTop: '8px',
    flexWrap: 'wrap'
  },
  pillMargen: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '3px 8px',
    fontSize: '0.68rem',
    color: '#e2e8f0'
  },
  pillTicketMedio: {
    backgroundColor: 'rgba(0, 176, 80, 0.2)',
    borderRadius: '8px',
    padding: '3px 8px',
    fontSize: '0.68rem',
    color: '#bbf7d0'
  },
  gridKpis: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  cardKpi: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '9px 10px',
    border: '1px solid #e2e8f0'
  },
  kpiLabel: {
    color: '#64748b',
    fontSize: '0.66rem',
    fontWeight: 'bold'
  },
  kpiValor: {
    fontSize: '1.05rem',
    fontWeight: '900',
    color: '#0f2a4a',
    display: 'block',
    margin: '1px 0'
  },
  kpiSub: {
    fontSize: '0.64rem',
    color: '#94a3b8'
  },
  seccionCard: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid #e2e8f0'
  },
  encabezadoSeccion: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  },
  gridMediosCobro: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  itemMedioRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9'
  },
  iconoMiniMedio: {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardValoracionInventario: {
    backgroundColor: '#eff6ff',
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid #bfdbfe'
  },
  gridInventarioValores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px'
  },
  cajaExportacionPremium: {
    display: 'flex',
    gap: '8px'
  },
  btnReporteFormal: {
    flex: 1.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 42, 74, 0.2)'
  },
  btnExcelCSV: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 176, 80, 0.2)'
  },
  vacioText: {
    textAlign: 'center',
    padding: '12px',
    fontSize: '0.74rem',
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
  },
  overlayModal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    zIndex: 99999999
  },
  modalBoxInforme: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '370px',
    width: '100%',
    height: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
    overflow: 'hidden'
  },
  barraControlInforme: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
    flexShrink: 0
  },
  btnCerrarX: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  papelInforme: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    padding: '14px 14px 20px 14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '0.72rem',
    color: '#0f172a'
  },
  logoInforme: {
    maxHeight: '48px',
    maxWidth: '120px',
    objectFit: 'contain',
    marginBottom: '6px'
  },
  tagInformeTitulo: {
    display: 'inline-block',
    fontSize: '0.64rem',
    color: '#0f2a4a',
    fontWeight: '900',
    marginTop: '4px',
    backgroundColor: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '6px'
  },
  lineaDobleCorte: {
    borderTop: '2px dashed #94a3b8',
    margin: '8px 0'
  },
  lineaFina: {
    borderTop: '1px solid #e2e8f0',
    margin: '6px 0'
  },
  infoMetaInforme: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '0.68rem',
    color: '#1e293b'
  },
  filaMetaInforme: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  seccionResultados: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  filaResultado: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem'
  },
  filaResultadoDestacada: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1rem',
    fontWeight: '900'
  },
  accionesInformeFila: {
    padding: '10px 14px 14px 14px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    gap: '6px',
    flexShrink: 0
  },
  btnImprimirInforme: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnWhatsAppInforme: {
    flex: 1.2,
    padding: '10px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnListoInforme: {
    padding: '10px 14px',
    backgroundColor: '#f1f5f9',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
