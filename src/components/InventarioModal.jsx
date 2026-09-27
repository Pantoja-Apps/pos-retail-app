import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Search, Edit2, Trash2, Camera, X, 
  Package, DollarSign, Tag, Scale, Percent, Image as ImageIcon, Check, Boxes, RefreshCw
} from 'lucide-react';

export default function InventarioModal({ productos, tasaCambio = 1, esDueno, alGuardarProducto, alEliminarProducto, alVolver, alAbrirCamara }) {
  const [busqueda, setBusqueda] = useState('');
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [avisoExistente, setAvisoExistente] = useState('');
  const [stockASumar, setStockASumar] = useState('');

  const tasaNum = parseFloat(tasaCambio) || 1;

  const [form, setForm] = useState({
    id: null,
    codigo: '',
    nombre: '',
    esPesado: false,
    comproPorBulto: false,
    costoBultoUSD: '',
    unidadesPorBulto: '',
    costoUSD: '',
    margenGanancia: '30',
    precioUSD: '',
    aplicaIVA: false,
    aplicaPrecioMayor: false,
    margenMayor: '15',
    precioMayorUSD: '',
    cantMinimaMayor: '3',
    stock: '',
    categoria: 'Víveres',
    imagen: ''
  });

  const abrirCrear = () => {
    setProductoEditar(null);
    setAvisoExistente('');
    setStockASumar('');
    setForm({
      id: null,
      codigo: '',
      nombre: '',
      esPesado: false,
      comproPorBulto: false,
      costoBultoUSD: '',
      unidadesPorBulto: '',
      costoUSD: '',
      margenGanancia: '30',
      precioUSD: '',
      aplicaIVA: false,
      aplicaPrecioMayor: false,
      margenMayor: '15',
      precioMayorUSD: '',
      cantMinimaMayor: '3',
      stock: '',
      categoria: 'Víveres',
      imagen: ''
    });
    setModalFormularioAbierto(true);
  };

  const cargarDatosProducto = (prod, esDetectadoPorScan = false) => {
    setProductoEditar(prod);
    const c = parseFloat(prod.costoUSD) || 0;
    const p = parseFloat(prod.precioUSD) || 0;
    let m = '30';
    if (c > 0 && p >= c) {
      m = (((p - c) / c) * 100).toFixed(0);
    }

    if (esDetectadoPorScan) {
      setAvisoExistente(`¡Producto ya registrado! (Stock actual: ${prod.stock} ${prod.esPesado ? 'Kg' : 'und'})`);
    } else {
      setAvisoExistente('');
    }

    setForm({
      id: prod.id,
      codigo: prod.codigo || '',
      nombre: prod.nombre || '',
      esPesado: Boolean(prod.esPesado),
      comproPorBulto: Boolean(prod.comproPorBulto),
      costoBultoUSD: prod.costoBultoUSD !== undefined && prod.costoBultoUSD !== null ? prod.costoBultoUSD.toString() : '',
      unidadesPorBulto: prod.unidadesPorBulto !== undefined && prod.unidadesPorBulto !== null ? prod.unidadesPorBulto.toString() : '',
      costoUSD: prod.costoUSD !== undefined && prod.costoUSD !== null ? prod.costoUSD.toString() : '',
      margenGanancia: m,
      precioUSD: prod.precioUSD ? prod.precioUSD.toString() : '',
      aplicaIVA: Boolean(prod.aplicaIVA),
      aplicaPrecioMayor: Boolean(prod.aplicaPrecioMayor),
      margenMayor: prod.margenMayor ? prod.margenMayor.toString() : '15',
      precioMayorUSD: prod.precioMayorUSD ? prod.precioMayorUSD.toString() : '',
      cantMinimaMayor: prod.cantMinimaMayor ? prod.cantMinimaMayor.toString() : '3',
      stock: prod.stock !== undefined && prod.stock !== null ? prod.stock.toString() : '',
      categoria: prod.categoria || 'Víveres',
      imagen: prod.imagen || ''
    });
  };

  // Escaneo inteligente en formulario
  const manejarEscanearEnForm = () => {
    alAbrirCamara((codEscaneado) => {
      const limpio = (codEscaneado || '').trim();
      const existente = productos.find(p => p.codigo === limpio);

      if (existente) {
        cargarDatosProducto(existente, true);
      } else {
        setAvisoExistente('');
        setForm(prev => ({ ...prev, codigo: limpio }));
      }
    });
  };

  const recalcularDesdeBulto = (costoB, unidB, margenG = form.margenGanancia, margenM = form.margenMayor) => {
    const cb = parseFloat(costoB) || 0;
    const ub = parseFloat(unidB) || 0;
    let costoUnit = 0;
    if (cb > 0 && ub > 0) {
      costoUnit = cb / ub;
    }

    const mg = parseFloat(margenG) || 0;
    const mm = parseFloat(margenM) || 0;

    const p = costoUnit > 0 ? (costoUnit * (1 + mg / 100)).toFixed(2) : form.precioUSD;
    const pm = (costoUnit > 0 && form.aplicaPrecioMayor) ? (costoUnit * (1 + mm / 100)).toFixed(2) : form.precioMayorUSD;

    setForm(prev => ({
      ...prev,
      costoBultoUSD: costoB,
      unidadesPorBulto: unidB,
      costoUSD: costoUnit > 0 ? costoUnit.toFixed(4) : prev.costoUSD,
      precioUSD: p,
      precioMayorUSD: pm
    }));
  };

  const manejarCambioCostoDirecto = (val) => {
    const c = parseFloat(val) || 0;
    const m = parseFloat(form.margenGanancia) || 0;
    const p = c > 0 ? (c * (1 + m / 100)).toFixed(2) : form.precioUSD;
    let pm = form.precioMayorUSD;
    if (form.aplicaPrecioMayor && c > 0) {
      const mm = parseFloat(form.margenMayor) || 0;
      pm = (c * (1 + mm / 100)).toFixed(2);
    }
    setForm(prev => ({ ...prev, costoUSD: val, precioUSD: p, precioMayorUSD: pm }));
  };

  const manejarCambioMargen = (val) => {
    const m = parseFloat(val) || 0;
    const c = parseFloat(form.costoUSD) || 0;
    const p = c > 0 ? (c * (1 + m / 100)).toFixed(2) : form.precioUSD;
    setForm(prev => ({ ...prev, margenGanancia: val, precioUSD: p }));
  };

  const manejarCambioPrecioManual = (val) => {
    const p = parseFloat(val) || 0;
    const c = parseFloat(form.costoUSD) || 0;
    let m = form.margenGanancia;
    if (c > 0 && p >= c) {
      m = (((p - c) / c) * 100).toFixed(0);
    }
    setForm(prev => ({ ...prev, precioUSD: val, margenGanancia: m }));
  };

  const manejarCambioMargenMayor = (val) => {
    const mm = parseFloat(val) || 0;
    const c = parseFloat(form.costoUSD) || 0;
    const pm = c > 0 ? (c * (1 + mm / 100)).toFixed(2) : form.precioMayorUSD;
    setForm(prev => ({ ...prev, margenMayor: val, precioMayorUSD: pm }));
  };

  const manejarImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('El nombre del producto es obligatorio.');
    if (!form.precioUSD || parseFloat(form.precioUSD) <= 0) return alert('El precio de venta debe ser mayor a 0.');

    let stockFinal = parseFloat(form.stock) || 0;
    const addStock = parseFloat(stockASumar) || 0;
    if (addStock > 0) {
      stockFinal += addStock;
    }

    const prodFinal = {
      ...form,
      id: form.id || Date.now(),
      codigo: form.codigo.trim() || 'PROD-' + Date.now().toString().slice(-6),
      esPesado: Boolean(form.esPesado),
      comproPorBulto: Boolean(form.comproPorBulto),
      costoBultoUSD: parseFloat(form.costoBultoUSD) || 0,
      unidadesPorBulto: parseFloat(form.unidadesPorBulto) || 0,
      costoUSD: parseFloat(form.costoUSD) || 0,
      margenGanancia: parseFloat(form.margenGanancia) || 0,
      precioUSD: parseFloat(form.precioUSD),
      aplicaIVA: Boolean(form.aplicaIVA),
      aplicaPrecioMayor: Boolean(form.aplicaPrecioMayor),
      precioMayorUSD: form.aplicaPrecioMayor ? (parseFloat(form.precioMayorUSD) || 0) : 0,
      cantMinimaMayor: form.aplicaPrecioMayor ? (parseFloat(form.cantMinimaMayor) || 3) : 0,
      stock: stockFinal
    };

    alGuardarProducto(prodFinal);
    setModalFormularioAbierto(false);
  };

  const prodsFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const costoNum = parseFloat(form.costoUSD) || 0;
  const precioNum = parseFloat(form.precioUSD) || 0;
  const gananciaNetaUSD = Math.max(0, precioNum - costoNum);
  const precioBS = precioNum * tasaNum;

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}>
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>Control de Inventario</h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>{productos.length} productos registrados</small>
          </div>
        </div>
        {esDueno && (
          <button type="button" onClick={abrirCrear} style={styles.btnCrear}>
            <Plus size={16} /> <span>Nuevo</span>
          </button>
        )}
      </header>

      <div style={styles.barraBusqueda}>
        <Search size={16} color="#64748b" />
        <input 
          type="text" 
          placeholder="Buscar producto o código..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          style={styles.inputSearch} 
        />
      </div>

      <div style={styles.listaProductos}>
        {prodsFiltrados.length === 0 ? (
          <div style={styles.vacio}>No se encontraron productos en el inventario.</div>
        ) : (
          prodsFiltrados.map(p => (
            <div key={p.id} style={styles.cardProducto}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} style={styles.thumbProd} />
                ) : (
                  <div style={{ ...styles.iconoTipo, backgroundColor: p.esPesado ? '#ecfdf5' : '#eff6ff', color: p.esPesado ? '#059669' : '#0052cc' }}>
                    {p.esPesado ? <Scale size={18} /> : <Package size={18} />}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nombre}
                    </strong>
                    {p.esPesado && <span style={styles.badgePesado}>Por Peso</span>}
                    {p.aplicaIVA && <span style={styles.badgeIVA}>IVA</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Cód: {p.codigo} · Stock: <strong style={{ color: p.stock <= 5 ? '#dc2626' : '#1e293b' }}>{p.stock} {p.esPesado ? 'Kg' : 'u'}</strong>
                    {p.aplicaPrecioMayor && ` · Mayor: $${p.precioMayorUSD}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#16a34a' }}>
                    ${parseFloat(p.precioUSD).toFixed(2)}
                  </span>
                  <small style={{ display: 'block', fontSize: '0.66rem', color: '#64748b' }}>
                    {p.esPesado ? 'por Kilo' : 'por Unidad'}
                  </small>
                </div>

                {esDueno && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => { cargarDatosProducto(p, false); setModalFormularioAbierto(true); }} style={styles.btnAccionEdit} title="Editar">
                      <Edit2 size={14} color="#0052cc" />
                    </button>
                    <button type="button" onClick={() => alEliminarProducto(p.id)} style={styles.btnAccionDelete} title="Eliminar">
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {modalFormularioAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBoxPro}>
            <div style={styles.headerModalPro}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>
                  {productoEditar ? 'Actualizar Producto Existente' : 'Nuevo Producto'}
                </h3>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>
                  {productoEditar ? 'Modifica precios, costos o suma nuevo stock' : 'Configuración de catálogo y balanza'}
                </small>
              </div>
              <button type="button" onClick={() => setModalFormularioAbierto(false)} style={styles.btnCerrar}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* AVISO SI FUE DETECTADO POR CÁMARA */}
                {avisoExistente && (
                  <div style={styles.bannerAvisoExistente}>
                    <RefreshCw size={14} color="#0284c7" />
                    <span>{avisoExistente}</span>
                  </div>
                )}

                {/* 1. FOTO ARRIBA CENTRADA */}
                <div style={styles.contenedorFotoTop}>
                  <label style={styles.labelFotoAvatar}>
                    {form.imagen ? (
                      <img src={form.imagen} alt="Producto" style={styles.avatarPreview} />
                    ) : (
                      <div style={styles.avatarVacio}>
                        <ImageIcon size={26} color="#94a3b8" />
                        <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 'bold', marginTop: '3px' }}>Añadir Foto</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={manejarImagen} style={{ display: 'none' }} />
                  </label>
                  {form.imagen && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, imagen: '' }))} style={styles.btnQuitarFoto}>
                      Quitar Foto
                    </button>
                  )}
                </div>

                {/* 2. MODALIDAD: UNIDAD O PESO */}
                <div style={styles.selectorModoPro}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, esPesado: false })}
                    style={{
                      ...styles.btnTipoPill,
                      backgroundColor: !form.esPesado ? '#0052cc' : '#f8fafc',
                      color: !form.esPesado ? '#fff' : '#64748b',
                      borderColor: !form.esPesado ? '#0052cc' : '#cbd5e1'
                    }}
                  >
                    <Package size={15} /> Por Unidad (Pza)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, esPesado: true })}
                    style={{
                      ...styles.btnTipoPill,
                      backgroundColor: form.esPesado ? '#059669' : '#f8fafc',
                      color: form.esPesado ? '#fff' : '#64748b',
                      borderColor: form.esPesado ? '#059669' : '#cbd5e1'
                    }}
                  >
                    <Scale size={15} /> Por Peso (Kg / Gramos)
                  </button>
                </div>

                {/* 3. DESCRIPCIÓN */}
                <div style={styles.campo}>
                  <label style={styles.lbl}>Nombre del Producto *</label>
                  <input 
                    type="text" 
                    value={form.nombre} 
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
                    placeholder="Ej: Harina PAN, Queso Paisa, Carne Molida..." 
                    style={styles.inputGrande} 
                    required 
                  />
                </div>

                {/* 4. COMPRA POR BULTO */}
                <div style={styles.seccionBultoBox}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 'bold', color: '#b45309', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={form.comproPorBulto} 
                      onChange={(e) => setForm({ ...form, comproPorBulto: e.target.checked })} 
                    />
                    <Boxes size={14} color="#b45309" />
                    <span>¿Compraste por Bulto / Fardo / Saco?</span>
                  </label>

                  {form.comproPorBulto && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                      <div style={styles.campo}>
                        <label style={{ ...styles.lbl, color: '#92400e' }}>Costo Total del Bulto ($)</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.costoBultoUSD} 
                          onChange={(e) => recalcularDesdeBulto(e.target.value, form.unidadesPorBulto)} 
                          placeholder="Ej: 21.85" 
                          style={{ ...styles.input, borderColor: '#fde68a' }} 
                        />
                      </div>
                      <div style={styles.campo}>
                        <label style={{ ...styles.lbl, color: '#92400e' }}>{form.esPesado ? 'Kilos que trae el bulto' : 'Unidades que trae el bulto'}</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.unidadesPorBulto} 
                          onChange={(e) => recalcularDesdeBulto(form.costoBultoUSD, e.target.value)} 
                          placeholder="Ej: 20" 
                          style={{ ...styles.input, borderColor: '#fde68a' }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. CÁLCULO DE RENTABILIDAD & PRECIO */}
                <div style={styles.seccionCostosPro}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cálculo de Rentabilidad
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 'bold', color: '#0052cc', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={form.aplicaIVA} 
                        onChange={(e) => setForm({ ...form, aplicaIVA: e.target.checked })} 
                      />
                      <span>Grava IVA (16%)</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={styles.campo}>
                      <label style={styles.lbl}>
                        {form.comproPorBulto ? 'Costo Unitario ($)' : (form.esPesado ? 'Costo x Kg ($)' : 'Costo Compra ($)')}
                      </label>
                      <input 
                        type="number" 
                        step="any" 
                        value={form.costoUSD} 
                        onChange={(e) => manejarCambioCostoDirecto(e.target.value)} 
                        placeholder="0.00" 
                        style={styles.input} 
                      />
                    </div>
                    <div style={styles.campo}>
                      <label style={styles.lbl}>Margen Ganancia (%)</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.margenGanancia} 
                          onChange={(e) => manejarCambioMargen(e.target.value)} 
                          placeholder="30" 
                          style={styles.input} 
                        />
                        <Percent size={11} color="#64748b" style={{ position: 'absolute', right: '8px', top: '10px' }} />
                      </div>
                    </div>
                  </div>

                  <div style={styles.displayPrecioVenta}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 'bold', display: 'block' }}>
                        {form.esPesado ? 'PRECIO DE VENTA X KILO' : 'PRECIO DE VENTA DETAL'}
                      </span>
                      <small style={{ fontSize: '0.64rem', color: '#047857' }}>
                        Ganancia limpia: +${gananciaNetaUSD.toFixed(2)}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#047857' }}>$</span>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.precioUSD} 
                          onChange={(e) => manejarCambioPrecioManual(e.target.value)} 
                          placeholder="0.00" 
                          style={styles.inputPrecioDestacado} 
                          required 
                        />
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#0052cc', marginTop: '1px' }}>
                        Bs. {precioBS.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. CÓDIGO Y CATEGORÍA CON DETECCIÓN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <div style={styles.campo}>
                    <label style={styles.lbl}>Código de Barras / SKU</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        value={form.codigo} 
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })} 
                        placeholder="Autogenerado" 
                        style={styles.input} 
                      />
                      <button 
                        type="button" 
                        onClick={manejarEscanearEnForm} 
                        style={styles.btnCamaraIcon}
                        title="Escanear Código (Detecta si ya existe)"
                      >
                        <Camera size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={styles.campo}>
                    <label style={styles.lbl}>Categoría</label>
                    <select 
                      value={form.categoria} 
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })} 
                      style={styles.select}
                    >
                      <option value="Víveres">Víveres</option>
                      <option value="Charcutería">Charcutería</option>
                      <option value="Carnicería">Carnicería</option>
                      <option value="Verduras y Frutas">Verduras y Frutas</option>
                      <option value="Panadería">Panadería</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Lácteos">Lácteos</option>
                      <option value="Higiene Personal">Higiene Personal</option>
                      <option value="Limpieza">Limpieza</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>

                {/* 7. CONTROL DE STOCK (DIRECTO O SUMAR) */}
                <div style={{ display: 'grid', gridTemplateColumns: productoEditar ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  <div style={styles.campo}>
                    <label style={styles.lbl}>
                      {productoEditar ? 'Stock Actual' : (form.esPesado ? 'Stock Inicial (Kilos)' : 'Stock Inicial (Unidades)')}
                    </label>
                    <input 
                      type="number" 
                      step="any" 
                      value={form.stock} 
                      onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                      placeholder="0" 
                      style={styles.input} 
                    />
                  </div>

                  {productoEditar && (
                    <div style={styles.campo}>
                      <label style={{ ...styles.lbl, color: '#059669' }}>+ Sumar Entrada Stock</label>
                      <input 
                        type="number" 
                        step="any" 
                        value={stockASumar} 
                        onChange={(e) => setStockASumar(e.target.value)} 
                        placeholder="Ej: +10 o +20" 
                        style={{ ...styles.input, borderColor: '#10b981', backgroundColor: '#f0fdf4' }} 
                      />
                    </div>
                  )}
                </div>

                {/* 8. TARIFA AL MAYOR */}
                <div style={styles.seccionMayorista}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={form.aplicaPrecioMayor} 
                      onChange={(e) => setForm({ ...form, aplicaPrecioMayor: e.target.checked })} 
                    />
                    <span>Habilitar Tarifa al Mayor</span>
                  </label>

                  {form.aplicaPrecioMayor && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                      <div style={styles.campo}>
                        <label style={styles.lbl}>Margen (%)</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.margenMayor} 
                          onChange={(e) => manejarCambioMargenMayor(e.target.value)} 
                          placeholder="15" 
                          style={styles.input} 
                        />
                      </div>
                      <div style={styles.campo}>
                        <label style={styles.lbl}>Precio Mayor ($)</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.precioMayorUSD} 
                          onChange={(e) => setForm({ ...form, precioMayorUSD: e.target.value })} 
                          placeholder="0.00" 
                          style={styles.input} 
                        />
                      </div>
                      <div style={styles.campo}>
                        <label style={styles.lbl}>{form.esPesado ? 'Desde (Kg)' : 'Cant. Mín'}</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={form.cantMinimaMayor} 
                          onChange={(e) => setForm({ ...form, cantMinimaMayor: e.target.value })} 
                          placeholder="3" 
                          style={styles.input} 
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div style={styles.footerModalPro}>
                <button type="button" onClick={() => setModalFormularioAbierto(false)} style={styles.btnCancelarPro}>
                  Cancelar
                </button>
                <button type="submit" style={styles.btnGuardarPro}>
                  <Check size={16} /> {productoEditar ? 'Actualizar Producto' : 'Guardar Producto'}
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
  btnCrear: { backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  barraBusqueda: { padding: '8px 14px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  inputSearch: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', color: '#1e293b' },
  listaProductos: { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' },
  vacio: { textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem', padding: '40px 0' },
  cardProducto: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  thumbProd: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' },
  iconoTipo: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgePesado: { backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bbf7d0' },
  badgeIVA: { backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', border: '1px solid #fde68a' },
  btnAccionEdit: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  btnAccionDelete: { background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBoxPro: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '390px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  headerModalPro: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  
  bannerAvisoExistente: { backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '8px', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#0369a1', fontWeight: 'bold' },

  contenedorFotoTop: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '2px 0 4px 0' },
  labelFotoAvatar: { width: '80px', height: '80px', borderRadius: '16px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', overflow: 'hidden' },
  avatarPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarVacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  btnQuitarFoto: { background: 'none', border: 'none', color: '#dc2626', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 },

  selectorModoPro: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  btnTipoPill: { border: '1px solid', borderRadius: '10px', padding: '8px', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },

  seccionBultoBox: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 12px' },
  seccionCostosPro: { backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '10px 12px' },
  displayPrecioVenta: { marginTop: '8px', backgroundColor: '#fff', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  inputPrecioDestacado: { width: '85px', border: 'none', background: 'transparent', textAlign: 'right', fontSize: '1.2rem', fontWeight: '900', color: '#047857', outline: 'none' },

  seccionMayorista: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px' },

  campo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  lbl: { fontSize: '0.7rem', fontWeight: 'bold', color: '#475569' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', background: '#fff' },
  inputGrande: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: '600', outline: 'none', background: '#fff' },
  select: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', background: '#fff' },
  btnCamaraIcon: { background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },

  footerModalPro: { padding: '12px 14px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', gap: '8px' },
  btnCancelarPro: { flex: 1, padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 'bold', color: '#475569', cursor: 'pointer' },
  btnGuardarPro: { flex: 2, padding: '10px', backgroundColor: '#0052cc', border: 'none', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 'bold', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
};
