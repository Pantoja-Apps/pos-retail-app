import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, Edit3, Trash2, Camera, Package, Box, Layers, RefreshCw, X } from 'lucide-react';

const CATEGORIAS_CONFIG = [
  { nombre: 'Víveres', margen: 20, exento: true },
  { nombre: 'Bebidas', margen: 30, exento: false },
  { nombre: 'Snacks / Chucherías', margen: 35, exento: false },
  { nombre: 'Charcutería / Lácteos', margen: 25, exento: true },
  { nombre: 'Limpieza y Hogar', margen: 35, exento: false },
  { nombre: 'Higiene Personal', margen: 35, exento: false },
  { nombre: 'Licores', margen: 40, exento: false },
  { nombre: 'Otros', margen: 30, exento: false }
];

export default function InventarioModal({ productos, alGuardarProducto, alEliminarProducto, alVolver, alAbrirCamara }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [prodEditando, setProdEditando] = useState(null);

  // Campos del formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Víveres');
  const [modoCompra, setModoCompra] = useState('unidad'); // 'unidad' o 'bulto'
  
  const [costoBulto, setCostoBulto] = useState('');
  const [unidadesPorBulto, setUnidadesPorBulto] = useState('20');
  const [cantidadBultosIngresados, setCantidadBultosIngresados] = useState('1');

  const [costoUnitario, setCostoUnitario] = useState('');
  const [stockUnidades, setStockUnidades] = useState('10');

  const [margenGanancia, setMargenGanancia] = useState('20');
  const [precioVentaUSD, setPrecioVentaUSD] = useState('');
  const [aplicaIVA, setAplicaIVA] = useState(false);

  const productoExistente = productos.find(p => p.codigo && p.codigo === codigo.trim() && (!prodEditando || prodEditando.id !== p.id));

  const abrirFormulario = (producto = null) => {
    if (producto) {
      setProdEditando(producto);
      setCodigo(producto.codigo || '');
      setNombre(producto.nombre || '');
      setCategoria(producto.categoria || 'Víveres');
      setModoCompra('unidad');
      setCostoUnitario(producto.costoUSD !== undefined ? producto.costoUSD.toString() : '');
      setStockUnidades((producto.stock || 0).toString());
      setMargenGanancia(producto.margenGanancia !== undefined ? producto.margenGanancia.toString() : '20');
      setPrecioVentaUSD(producto.precioUSD.toString());
      setAplicaIVA(Boolean(producto.aplicaIVA));
      setCostoBulto('');
      setUnidadesPorBulto('20');
      setCantidadBultosIngresados('1');
    } else {
      setProdEditando(null);
      setCodigo('');
      setNombre('');
      setCategoria('Víveres');
      setModoCompra('unidad');
      setCostoBulto('');
      setUnidadesPorBulto('20');
      setCantidadBultosIngresados('1');
      setCostoUnitario('');
      setStockUnidades('10');
      setMargenGanancia('20');
      setPrecioVentaUSD('');
      setAplicaIVA(false);
    }
    setModalFormAbierto(true);
  };

  const aplicarDatosProductoExistente = (prod) => {
    setNombre(prod.nombre);
    setCategoria(prod.categoria || 'Víveres');
    if (prod.costoUSD) setCostoUnitario(prod.costoUSD.toString());
    setMargenGanancia((prod.margenGanancia || 20).toString());
    setPrecioVentaUSD(prod.precioUSD.toString());
    setAplicaIVA(Boolean(prod.aplicaIVA));
  };

  const manejarCambioCodigo = (nuevoCod) => {
    setCodigo(nuevoCod);
    const encontrado = productos.find(p => p.codigo === nuevoCod.trim() && (!prodEditando || prodEditando.id !== p.id));
    if (encontrado) {
      aplicarDatosProductoExistente(encontrado);
    }
  };

  const manejarCambioCategoria = (catNombre) => {
    setCategoria(catNombre);
    const catConf = CATEGORIAS_CONFIG.find(c => c.nombre === catNombre);
    if (catConf) {
      setMargenGanancia(catConf.margen.toString());
      setAplicaIVA(!catConf.exento);
      recalcularPrecioConMargen(costoUnitario, catConf.margen);
    }
  };

  const recalcularCostoBulto = (cBulto, uBulto) => {
    const c = parseFloat(cBulto) || 0;
    const u = parseFloat(uBulto) || 1;
    if (u > 0) {
      const unit = (c / u).toFixed(4);
      setCostoUnitario(unit);
      recalcularPrecioConMargen(unit, margenGanancia);
    }
  };

  const recalcularPrecioConMargen = (cUnit, mGan) => {
    const c = parseFloat(cUnit) || 0;
    const m = parseFloat(mGan) || 0;
    if (c > 0 && m < 100) {
      const p = (c / (1 - (m / 100))).toFixed(2);
      setPrecioVentaUSD(p);
    }
  };

  const unidadesCalculadasQueEntran = modoCompra === 'bulto'
    ? (parseInt(cantidadBultosIngresados, 10) || 0) * (parseInt(unidadesPorBulto, 10) || 0)
    : (parseInt(stockUnidades, 10) || 0);

  const stockFinalResultante = productoExistente
    ? (productoExistente.stock || 0) + unidadesCalculadasQueEntran
    : (prodEditando ? (parseInt(stockUnidades, 10) || 0) : unidadesCalculadasQueEntran);

  const guardar = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !precioVentaUSD) return alert('Nombre y precio de venta son requeridos.');

    const cUnit = parseFloat(costoUnitario) || 0;
    const pVenta = parseFloat(precioVentaUSD) || 0;

    const targetId = productoExistente ? productoExistente.id : (prodEditando ? prodEditando.id : Date.now());

    const productoFinal = {
      id: targetId,
      codigo: codigo.trim() || Date.now().toString().slice(-8),
      nombre: nombre.trim(),
      categoria: categoria,
      costoUSD: cUnit,
      margenGanancia: parseFloat(margenGanancia) || 0,
      precioUSD: pVenta,
      stock: stockFinalResultante,
      aplicaIVA: aplicaIVA,
      imagen: prodEditando ? prodEditando.imagen : (productoExistente ? productoExistente.imagen : '')
    };

    alGuardarProducto(productoFinal);
    setModalFormAbierto(false);
  };

  const listaFiltrada = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.includes(busqueda);
    const matchCat = categoriaFiltro === 'Todas' || (p.categoria || 'Víveres') === categoriaFiltro;
    return matchBusqueda && matchCat;
  });

  const cNum = parseFloat(costoUnitario) || 0;
  const pNum = parseFloat(precioVentaUSD) || 0;
  const gananciaNetaUSD = Math.max(0, pNum - cNum);

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}><ArrowLeft color="#333" size={20} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Inventario de Productos</h2>
            <small style={{ color: '#666', fontSize: '0.72rem' }}>{productos.length} ítems en stock</small>
          </div>
        </div>
        <button type="button" onClick={() => abrirFormulario(null)} style={styles.btnNuevo}>
          <Plus size={16} /> Nuevo
        </button>
      </header>

      {/* FILTROS Y BÚSQUEDA */}
      <div style={styles.seccionBusqueda}>
        <div style={styles.inputWrapper}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBuscador}
          />
        </div>
        <div style={styles.chipsCategorias}>
          <button
            type="button"
            onClick={() => setCategoriaFiltro('Todas')}
            style={{ ...styles.chip, ...(categoriaFiltro === 'Todas' ? styles.chipActivo : {}) }}
          >
            Todas
          </button>
          {CATEGORIAS_CONFIG.map(cat => (
            <button
              key={cat.nombre}
              type="button"
              onClick={() => setCategoriaFiltro(cat.nombre)}
              style={{ ...styles.chip, ...(categoriaFiltro === cat.nombre ? styles.chipActivo : {}) }}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div style={styles.lista}>
        {listaFiltrada.length === 0 ? (
          <div style={styles.vacio}>
            <Package color="#cbd5e1" size={48} />
            <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#64748b' }}>No se encontraron productos.</p>
          </div>
        ) : (
          listaFiltrada.map(p => {
            const gan = (p.precioUSD - (p.costoUSD || 0)).toFixed(2);
            return (
              <div key={p.id} style={styles.cardItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{p.nombre}</strong>
                    <span style={styles.badgeCat}>{p.categoria || 'Víveres'}</span>
                    {p.aplicaIVA ? (
                      <span style={styles.badgeIVA}>IVA 16%</span>
                    ) : (
                      <span style={styles.badgeExento}>Exento</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    Cód: {p.codigo} · Stock: <strong style={{ color: p.stock <= 5 ? '#dc2626' : '#0f172a' }}>{p.stock}</strong> und.
                  </div>
                  {p.costoUSD > 0 && (
                    <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: '600', marginTop: '2px' }}>
                      Costo: ${p.costoUSD.toFixed(2)} | Ganancia: +${gan}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0052cc' }}>${p.precioUSD.toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => abrirFormulario(p)} style={styles.btnAccionEdit} title="Editar"><Edit3 size={13} /></button>
                    <button type="button" onClick={() => alEliminarProducto(p.id)} style={styles.btnAccionDel} title="Eliminar"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FORMULARIO FLOTANTE (zIndex 9999 para que ScannerModal en 20000 flote encima) */}
      {modalFormAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                {prodEditando ? 'Modificar Producto' : 'Ingresar / Reabastecer Mercancía'}
              </strong>
              <button type="button" onClick={() => setModalFormAbierto(false)} style={styles.btnCerrarModal}><X size={18} /></button>
            </div>

            <form onSubmit={guardar} style={styles.formScroll}>
              
              {/* CÓDIGO CON BOTÓN DE CÁMARA */}
              <div style={styles.campo}>
                <label style={styles.label}>Código de Barras:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Escanea o escribe código..."
                    value={codigo}
                    onChange={(e) => manejarCambioCodigo(e.target.value)}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      alAbrirCamara((scanned) => manejarCambioCodigo(scanned));
                    }}
                    style={styles.btnCamaraForm}
                    title="Escanear con cámara"
                  >
                    <Camera size={16} />
                  </button>
                </div>
              </div>

              {/* AVISO DE REABASTECIMIENTO */}
              {productoExistente && (
                <div style={styles.alertaExistente}>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={13} /> ¡Producto existente detectado!
                  </div>
                  <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                    Se sumará la nueva mercancía al stock actual de <strong>{productoExistente.stock} und.</strong>
                  </div>
                </div>
              )}

              {/* NOMBRE */}
              <div style={styles.campo}>
                <label style={styles.label}>Nombre del Producto:</label>
                <input
                  type="text"
                  placeholder="Ej: Harina PAN Blanca 1kg"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              {/* CATEGORÍA E IMPUESTO */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ ...styles.campo, flex: 1.4 }}>
                  <label style={styles.label}>Categoría:</label>
                  <select
                    value={categoria}
                    onChange={(e) => manejarCambioCategoria(e.target.value)}
                    style={styles.select}
                  >
                    {CATEGORIAS_CONFIG.map(c => (
                      <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ ...styles.campo, flex: 1 }}>
                  <label style={styles.label}>Régimen IVA:</label>
                  <button
                    type="button"
                    onClick={() => setAplicaIVA(!aplicaIVA)}
                    style={{
                      ...styles.btnIVA,
                      backgroundColor: aplicaIVA ? '#fef3c7' : '#f0fdf4',
                      borderColor: aplicaIVA ? '#fde047' : '#bbf7d0',
                      color: aplicaIVA ? '#854d0e' : '#166534'
                    }}
                  >
                    {aplicaIVA ? 'Aplica 16%' : 'Exento (0%)'}
                  </button>
                </div>
              </div>

              {/* SELECTOR DE ENTRADA (POR BULTO O POR UNIDAD) */}
              <div style={styles.boxCalculadora}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#1e293b' }}>
                    {prodEditando ? 'Ajustar Inventario:' : '¿Cómo ingresas la mercancía?:'}
                  </span>
                  <div style={styles.tabsCompra}>
                    <button
                      type="button"
                      onClick={() => setModoCompra('unidad')}
                      style={{ ...styles.tabBtn, backgroundColor: modoCompra === 'unidad' ? '#0052cc' : 'transparent', color: modoCompra === 'unidad' ? '#fff' : '#64748b' }}
                    >
                      Por Unidad
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoCompra('bulto')}
                      style={{ ...styles.tabBtn, backgroundColor: modoCompra === 'bulto' ? '#0052cc' : 'transparent', color: modoCompra === 'bulto' ? '#fff' : '#64748b' }}
                    >
                      Por Bulto/Caja
                    </button>
                  </div>
                </div>

                {modoCompra === 'bulto' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      <div>
                        <label style={styles.labelMini}>Cant. Bultos:</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={cantidadBultosIngresados}
                          onChange={(e) => setCantidadBultosIngresados(e.target.value)}
                          style={{ ...styles.inputMini, fontWeight: 'bold', textAlign: 'center' }}
                        />
                      </div>
                      <div>
                        <label style={styles.labelMini}>Unid. x Bulto:</label>
                        <input
                          type="number"
                          placeholder="20"
                          value={unidadesPorBulto}
                          onChange={(e) => {
                            setUnidadesPorBulto(e.target.value);
                            recalcularCostoBulto(costoBulto, e.target.value);
                          }}
                          style={{ ...styles.inputMini, textAlign: 'center' }}
                        />
                      </div>
                      <div>
                        <label style={styles.labelMini}>Costo Bulto ($):</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="20.00"
                          value={costoBulto}
                          onChange={(e) => {
                            setCostoBulto(e.target.value);
                            recalcularCostoBulto(e.target.value, unidadesPorBulto);
                          }}
                          style={styles.inputMini}
                        />
                      </div>
                    </div>

                    <div style={styles.resumenBultoBox}>
                      <span>Unidades a ingresar: <strong>{unidadesCalculadasQueEntran} und.</strong></span>
                      <span>Costo unitario calculado: <strong>${costoUnitario || '0.00'}</strong></span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.labelMini}>Costo Unitario ($):</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={costoUnitario}
                        onChange={(e) => {
                          setCostoUnitario(e.target.value);
                          recalcularPrecioConMargen(e.target.value, margenGanancia);
                        }}
                        style={{ ...styles.input, fontWeight: 'bold' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.labelMini}>
                        {productoExistente ? 'Unidades a Añadir:' : 'Stock Inicial (und):'}
                      </label>
                      <input
                        type="number"
                        placeholder="10"
                        value={stockUnidades}
                        onChange={(e) => setStockUnidades(e.target.value)}
                        style={{ ...styles.input, fontWeight: 'bold', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                )}

                {/* MARGEN DE GANANCIA */}
                <div style={{ marginTop: '8px' }}>
                  <label style={styles.labelMini}>Margen Ganancia Deseado (%):</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="25"
                    value={margenGanancia}
                    onChange={(e) => {
                      setMargenGanancia(e.target.value);
                      recalcularPrecioConMargen(costoUnitario, e.target.value);
                    }}
                    style={{ ...styles.input, fontWeight: 'bold' }}
                  />
                </div>
              </div>

              {/* PRECIO DE VENTA Y STOCK TOTAL RESULTANTE */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <div style={{ ...styles.campo, flex: 1.2 }}>
                  <label style={{ ...styles.label, color: '#0052cc' }}>Precio Venta al Detal ($):</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={precioVentaUSD}
                    onChange={(e) => setPrecioVentaUSD(e.target.value)}
                    style={{ ...styles.input, fontSize: '1.05rem', fontWeight: '900', color: '#0052cc' }}
                    required
                  />
                </div>

                <div style={{ ...styles.campo, flex: 0.9 }}>
                  <label style={styles.label}>Stock Final en Tienda:</label>
                  <div style={styles.cajaStockFinal}>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{stockFinalResultante}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>und.</span>
                  </div>
                </div>
              </div>

              {/* GANANCIA ESTIMADA */}
              {pNum > 0 && cNum > 0 && (
                <div style={styles.bannerGanancia}>
                  <span>Ganancia Neta por Unidad:</span>
                  <strong style={{ color: '#16a34a' }}>+${gananciaNetaUSD.toFixed(2)}</strong>
                </div>
              )}

              <div style={{ marginTop: '14px', paddingBottom: '70px' }}>
                <button type="submit" style={styles.btnGuardarForm}>
                  {productoExistente ? `Reabastecer (+${unidadesCalculadasQueEntran} und.)` : (prodEditando ? 'Guardar Cambios' : 'Registrar Producto')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnNuevo: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' },
  seccionBusqueda: { padding: '8px 14px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  inputWrapper: { position: 'relative', marginBottom: '8px' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 8px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  chipsCategorias: { display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' },
  chip: { border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', padding: '4px 10px', borderRadius: '16px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  chipActivo: { backgroundColor: '#0052cc', color: '#fff', borderColor: '#0052cc' },
  lista: { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' },
  vacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%' },
  cardItem: { backgroundColor: '#fff', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  badgeCat: { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' },
  badgeIVA: { backgroundColor: '#fef3c7', color: '#854d0e', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' },
  badgeExento: { backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' },
  btnAccionEdit: { background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0052cc' },
  btnAccionDel: { background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#dc2626' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '12px' },
  modalBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '370px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' },
  btnCerrarModal: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  formScroll: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' },
  label: { fontSize: '0.72rem', fontWeight: 'bold', color: '#475569' },
  labelMini: { fontSize: '0.66rem', fontWeight: 'bold', color: '#64748b' },
  input: { width: '100%', boxSizing: 'border-box', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  inputMini: { width: '100%', boxSizing: 'border-box', padding: '6px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', backgroundColor: '#fff' },
  btnIVA: { width: '100%', padding: '7px 6px', borderRadius: '8px', border: '1px solid', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCamaraForm: { backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  alertaExistente: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '8px 10px', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '8px' },
  boxCalculadora: { backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '8px' },
  tabsCompra: { display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' },
  tabBtn: { border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' },
  resumenBultoBox: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', padding: '6px 8px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '0.72rem', color: '#334155', marginTop: '6px' },
  cajaStockFinal: { backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' },
  bannerGanancia: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#dcfce7', padding: '8px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', color: '#166534', marginTop: '6px' },
  btnGuardarForm: { width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' }
};
