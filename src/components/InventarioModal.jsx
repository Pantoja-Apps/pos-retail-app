import React, { useState } from 'react';
import { 
  ArrowLeft, Search, Plus, Edit2, Trash2, Camera, 
  Package, Check, X, Image as ImageIcon, Box
} from 'lucide-react';
import { optimizarImagen } from '../utils/imageOptimizer';

const CATEGORIAS_PREDEFINIDAS = [
  'Víveres',
  'Charcutería',
  'Carnicería y Pollo',
  'Verduras y Frutas',
  'Bebidas y Refrescos',
  'Lácteos y Huevos',
  'Panadería y Dulces',
  'Higiene Personal',
  'Limpieza del Hogar',
  'Snacks y Golosinas',
  'Licores',
  'Farmacia / Droguería',
  'Mascotas',
  'General',
  '+ Otra Categoría...'
];

const EMPAQUES_COMPRA = [
  'Unidad suelta',
  'Bulto',
  'Caja',
  'Saco / Costal',
  'Fardo',
  'Paila / Galón',
  'Cesta / Huacal'
];

export default function InventarioModal({
  productos = [],
  tasaCambio = 855.66,
  esDueno = true,
  alGuardarProducto,
  alEliminarProducto,
  alVolver,
  alAbrirCamara
}) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);

  // Formulario Producto
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [costoUSD, setCostoUSD] = useState('');
  const [precioUSD, setPrecioUSD] = useState('');
  const [margenGanancia, setMargenGanancia] = useState('30');
  const [stock, setStock] = useState('');
  const [categoriaSelect, setCategoriaSelect] = useState('Víveres');
  const [categoriaOtra, setCategoriaOtra] = useState('');
  const [esPesado, setEsPesado] = useState(false);
  
  // Presentación de compra (Bulto/Caja/Saco)
  const [tipoEmpaque, setTipoEmpaque] = useState('Unidad suelta');
  const [unidadesPorEmpaque, setUnidadesPorEmpaque] = useState('1');
  const [costoEmpaqueUSD, setCostoEmpaqueUSD] = useState('');

  // Precios al Mayor
  const [aplicaMayor, setAplicaMayor] = useState(false);
  const [precioMayorUSD, setPrecioMayorUSD] = useState('');
  const [cantMinimaMayor, setCantMinimaMayor] = useState('3');
  const [imagen, setImagen] = useState('');
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  const categoriasDisponibles = ['Todas', ...new Set(productos.map(p => p.categoria || 'General'))];

  // Cálculo de Costo Unitario cuando se ingresa Costo por Bulto/Caja
  const manejarCambioCostoEmpaque = (costoEmpVal) => {
    setCostoEmpaqueUSD(costoEmpVal);
    const cTotal = parseFloat(costoEmpVal) || 0;
    const cant = parseFloat(unidadesPorEmpaque) || 1;
    if (cTotal > 0 && cant > 0) {
      const unit = (cTotal / cant).toFixed(2);
      setCostoUSD(unit);
      const m = parseFloat(margenGanancia) || 0;
      if (m > 0) {
        setPrecioUSD((parseFloat(unit) * (1 + m / 100)).toFixed(2));
      }
    }
  };

  const manejarCambioUnidadesEmpaque = (cantVal) => {
    setUnidadesPorEmpaque(cantVal);
    const cant = parseFloat(cantVal) || 1;
    const cTotal = parseFloat(costoEmpaqueUSD) || 0;
    if (cTotal > 0 && cant > 0) {
      const unit = (cTotal / cant).toFixed(2);
      setCostoUSD(unit);
      const m = parseFloat(margenGanancia) || 0;
      if (m > 0) {
        setPrecioUSD((parseFloat(unit) * (1 + m / 100)).toFixed(2));
      }
    }
  };

  const manejarCambioCosto = (costoVal) => {
    setCostoUSD(costoVal);
    const c = parseFloat(costoVal) || 0;
    const m = parseFloat(margenGanancia) || 0;
    if (c > 0 && m > 0) {
      setPrecioUSD((c * (1 + m / 100)).toFixed(2));
    }
  };

  const manejarCambioMargen = (margenVal) => {
    setMargenGanancia(margenVal);
    const c = parseFloat(costoUSD) || 0;
    const m = parseFloat(margenVal) || 0;
    if (c > 0 && m > 0) {
      setPrecioUSD((c * (1 + m / 100)).toFixed(2));
    }
  };

  const manejarCambioPrecio = (precioVal) => {
    setPrecioUSD(precioVal);
    const p = parseFloat(precioVal) || 0;
    const c = parseFloat(costoUSD) || 0;
    if (c > 0 && p >= c) {
      setMargenGanancia((((p - c) / c) * 100).toFixed(1));
    }
  };

  const abrirCreacion = () => {
    setProductoEnEdicion(null);
    setCodigo('');
    setNombre('');
    setCostoUSD('');
    setPrecioUSD('');
    setMargenGanancia('30');
    setStock('');
    setCategoriaSelect('Víveres');
    setCategoriaOtra('');
    setEsPesado(false);
    setTipoEmpaque('Unidad suelta');
    setUnidadesPorEmpaque('1');
    setCostoEmpaqueUSD('');
    setAplicaMayor(false);
    setPrecioMayorUSD('');
    setCantMinimaMayor('3');
    setImagen('');
    setModalFormAbierto(true);
  };

  const abrirEdicion = (p) => {
    setProductoEnEdicion(p);
    setCodigo(p.codigo || '');
    setNombre(p.nombre || '');
    const c = p.costoUSD ? String(p.costoUSD) : '';
    const pr = p.precioUSD ? String(p.precioUSD) : '';
    setCostoUSD(c);
    setPrecioUSD(pr);
    if (parseFloat(c) > 0 && parseFloat(pr) > 0) {
      setMargenGanancia((((parseFloat(pr) - parseFloat(c)) / parseFloat(c)) * 100).toFixed(1));
    } else {
      setMargenGanancia('30');
    }
    setStock(p.stock !== undefined ? String(p.stock) : '0');
    
    if (CATEGORIAS_PREDEFINIDAS.includes(p.categoria)) {
      setCategoriaSelect(p.categoria);
      setCategoriaOtra('');
    } else {
      setCategoriaSelect('+ Otra Categoría...');
      setCategoriaOtra(p.categoria || '');
    }

    setEsPesado(Boolean(p.esPesado));
    setTipoEmpaque(p.tipoEmpaque || 'Unidad suelta');
    setUnidadesPorEmpaque(p.unidadesPorEmpaque ? String(p.unidadesPorEmpaque) : '1');
    setCostoEmpaqueUSD(p.costoEmpaqueUSD ? String(p.costoEmpaqueUSD) : '');

    setAplicaMayor(Boolean(p.aplicaPrecioMayor));
    setPrecioMayorUSD(p.precioMayorUSD ? String(p.precioMayorUSD) : '');
    setCantMinimaMayor(p.cantMinimaMayor ? String(p.cantMinimaMayor) : '3');
    setImagen(p.imagen || '');
    setModalFormAbierto(true);
  };

  const procesarFotoProducto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesandoFoto(true);
    try {
      const base64Mini = await optimizarImagen(file, 260, 0.7);
      setImagen(base64Mini);
    } catch (err) {
      alert('Error procesando foto.');
    } finally {
      setProcesandoFoto(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('El nombre es obligatorio');

    const catFinal = categoriaSelect === '+ Otra Categoría...' 
      ? (categoriaOtra.trim() || 'General') 
      : categoriaSelect;

    const nuevoProd = {
      id: productoEnEdicion ? String(productoEnEdicion.id) : 'prod_' + Date.now(),
      codigo: codigo.trim() || 'PROD-' + Date.now().toString().slice(-6),
      nombre: nombre.trim(),
      costoUSD: parseFloat(costoUSD) || 0,
      precioUSD: parseFloat(precioUSD) || 0,
      stock: parseFloat(stock) || 0,
      categoria: catFinal,
      esPesado: Boolean(esPesado),
      tipoEmpaque: tipoEmpaque,
      unidadesPorEmpaque: parseFloat(unidadesPorEmpaque) || 1,
      costoEmpaqueUSD: parseFloat(costoEmpaqueUSD) || 0,
      aplicaPrecioMayor: Boolean(aplicaMayor),
      precioMayorUSD: parseFloat(precioMayorUSD) || 0,
      cantMinimaMayor: parseFloat(cantMinimaMayor) || 3,
      imagen: imagen || (productoEnEdicion ? productoEnEdicion.imagen : '')
    };

    await alGuardarProducto(nuevoProd);
    setModalFormAbierto(false);
  };

  const productosFiltrados = productos.filter(p => {
    const coincideTexto = p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
                          p.codigo?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    return coincideTexto && coincideCategoria;
  });

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Inventario de Productos</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>{productos.length} artículos registrados</small>
        </div>
        {esDueno ? (
          <button type="button" onClick={abrirCreacion} style={styles.btnNuevo}>
            <Plus size={16} />
          </button>
        ) : <div style={{ width: '32px' }} />}
      </header>

      {/* Buscador */}
      <div style={styles.barraBusqueda}>
        <div style={styles.cajaInputBusqueda}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBusqueda}
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} style={styles.btnLimpiarBusqueda}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Selector de Categorías */}
      <div style={styles.carruselCategorias}>
        {categoriasDisponibles.map((cat, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCategoriaFiltro(cat)}
            style={{
              ...styles.chipCategoria,
              backgroundColor: categoriaFiltro === cat ? '#0f2a4a' : '#fff',
              color: categoriaFiltro === cat ? '#fff' : '#64748b',
              borderColor: categoriaFiltro === cat ? '#0f2a4a' : '#cbd5e1'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Productos */}
      <main style={styles.cuerpo}>
        {productosFiltrados.length === 0 ? (
          <div style={styles.vacioBox}>
            <Package size={42} color="#cbd5e1" />
            <p style={{ margin: '8px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>No se encontraron productos.</p>
          </div>
        ) : (
          <div style={styles.listaGrid}>
            {productosFiltrados.map((p) => {
              const precioBs = (p.precioUSD * tasaCambio).toFixed(2);
              return (
                <div key={p.id} style={styles.cardItem}>
                  <div style={styles.itemImgBox}>
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} style={styles.itemImg} />
                    ) : (
                      <Package size={22} color="#94a3b8" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={styles.itemNombre}>{p.nombre}</strong>
                      {p.esPesado && <span style={styles.badgeBalanza}>KG</span>}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                      Cód: {p.codigo} · Stock: <strong>{p.stock}</strong> · {p.categoria || 'General'}
                    </div>
                    {p.tipoEmpaque && p.tipoEmpaque !== 'Unidad suelta' && (
                      <div style={{ fontSize: '0.64rem', color: '#475569', fontStyle: 'italic' }}>
                        Compra: {p.tipoEmpaque} ({p.unidadesPorEmpaque} unids/paq)
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                      <span style={styles.precioUSDTag}>${Number(p.precioUSD).toFixed(2)}</span>
                      <span style={styles.precioBSTag}>Bs. {precioBs}</span>
                    </div>
                    {p.aplicaPrecioMayor && (
                      <div style={{ fontSize: '0.64rem', color: '#0284c7', fontWeight: 'bold' }}>
                        Mayor: ${Number(p.precioMayorUSD).toFixed(2)} (desde {p.cantMinimaMayor} unids)
                      </div>
                    )}
                  </div>

                  {esDueno && (
                    <div style={styles.accionesItem}>
                      <button type="button" onClick={() => abrirEdicion(p)} style={styles.btnEditar}>
                        <Edit2 size={14} />
                      </button>
                      <button type="button" onClick={() => { if (confirm(`¿Eliminar ${p.nombre}?`)) alEliminarProducto(p.id); }} style={styles.btnBorrar}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Formulario */}
      {modalFormAbierto && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBox}>
            <div style={styles.headerModalForm}>
              <h3 style={{ margin: 0, fontSize: '0.94rem', color: '#0f2a4a', fontWeight: '800' }}>
                {productoEnEdicion ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button type="button" onClick={() => setModalFormAbierto(false)} style={styles.btnCerrarX}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardar} style={styles.formProducto}>
              <div style={styles.filaFotoInput}>
                <div style={styles.previewFotoProd}>
                  {imagen ? (
                    <img src={imagen} alt="Preview" style={styles.imgProdPreview} />
                  ) : (
                    <ImageIcon size={24} color="#94a3b8" />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={styles.btnTomarFoto}>
                    <Camera size={14} />
                    <span>{procesandoFoto ? 'Comprimiendo...' : (imagen ? 'Cambiar Foto' : 'Tomar / Subir Foto')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={procesarFotoProducto}
                      disabled={procesandoFoto}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {imagen && (
                    <button type="button" onClick={() => setImagen('')} style={styles.btnQuitarFoto}>
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.campoForm}>
                <label style={styles.labelForm}>Nombre del Producto *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.inputForm}
                  placeholder="Ej. Harina PAN Blanca 1kg"
                  required
                />
              </div>

              <div style={styles.campoForm}>
                <label style={styles.labelForm}>Código de Barras</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  style={styles.inputForm}
                  placeholder="759100..."
                />
              </div>

              {/* SECCIÓN MAYORISTA: TIPO DE EMPAQUE DE COMPRA */}
              <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#0f2a4a' }}>📦 Presentación de Compra al Proveedor</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                  <div>
                    <label style={styles.labelForm}>¿Cómo se compra?</label>
                    <select
                      value={tipoEmpaque}
                      onChange={(e) => setTipoEmpaque(e.target.value)}
                      style={{ ...styles.inputForm, backgroundColor: '#fff' }}
                    >
                      {EMPAQUES_COMPRA.map((emp, i) => (
                        <option key={i} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                  {tipoEmpaque !== 'Unidad suelta' && (
                    <div>
                      <label style={styles.labelForm}>Unidades por empaque</label>
                      <input
                        type="number"
                        step="any"
                        value={unidadesPorEmpaque}
                        onChange={(e) => manejarCambioUnidadesEmpaque(e.target.value)}
                        style={styles.inputForm}
                        placeholder="24"
                      />
                    </div>
                  )}
                </div>

                {tipoEmpaque !== 'Unidad suelta' && (
                  <div>
                    <label style={styles.labelForm}>Costo Total del {tipoEmpaque} ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={costoEmpaqueUSD}
                      onChange={(e) => manejarCambioCostoEmpaque(e.target.value)}
                      style={styles.inputForm}
                      placeholder="Ej. 24.00"
                    />
                  </div>
                )}
              </div>

              {/* Costo Unitario, Margen % y Precio de Venta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div style={styles.campoForm}>
                  <label style={styles.labelForm}>Costo Unit ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={costoUSD}
                    onChange={(e) => manejarCambioCosto(e.target.value)}
                    style={styles.inputForm}
                    placeholder="0.90"
                  />
                </div>
                <div style={styles.campoForm}>
                  <label style={styles.labelForm}>Margen %</label>
                  <input
                    type="number"
                    step="any"
                    value={margenGanancia}
                    onChange={(e) => manejarCambioMargen(e.target.value)}
                    style={styles.inputForm}
                    placeholder="30"
                  />
                </div>
                <div style={styles.campoForm}>
                  <label style={styles.labelForm}>Precio ($) *</label>
                  <input
                    type="number"
                    step="any"
                    value={precioUSD}
                    onChange={(e) => manejarCambioPrecio(e.target.value)}
                    style={{ ...styles.inputForm, fontWeight: 'bold', color: '#00b050' }}
                    placeholder="1.20"
                    required
                  />
                </div>
              </div>

              {/* Stock y Categorías */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '8px' }}>
                <div style={styles.campoForm}>
                  <label style={styles.labelForm}>Stock Actual</label>
                  <input
                    type="number"
                    step="any"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    style={styles.inputForm}
                    placeholder="50"
                  />
                </div>
                <div style={styles.campoForm}>
                  <label style={styles.labelForm}>Categoría del Producto</label>
                  <select
                    value={categoriaSelect}
                    onChange={(e) => setCategoriaSelect(e.target.value)}
                    style={{ ...styles.inputForm, backgroundColor: '#fff' }}
                  >
                    {CATEGORIAS_PREDEFINIDAS.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {categoriaSelect === '+ Otra Categoría...' && (
                <div style={styles.campoForm}>
                  <label style={styles.labelForm}>Escribe la nueva categoría:</label>
                  <input
                    type="text"
                    value={categoriaOtra}
                    onChange={(e) => setCategoriaOtra(e.target.value)}
                    style={styles.inputForm}
                    placeholder="Ej. Artículos de Fiesta"
                    required
                  />
                </div>
              )}

              {/* Casilla Granel */}
              <label style={styles.filaCheckbox}>
                <input
                  type="checkbox"
                  checked={esPesado}
                  onChange={(e) => setEsPesado(e.target.checked)}
                />
                <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '600' }}>
                  Es producto pesado / Granel (Pide KG o Gramos)
                </span>
              </label>

              {/* Casilla Precio al Mayor */}
              <label style={styles.filaCheckbox}>
                <input
                  type="checkbox"
                  checked={aplicaMayor}
                  onChange={(e) => setAplicaMayor(e.target.checked)}
                />
                <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '600' }}>
                  Habilitar Precio al Mayor
                </span>
              </label>

              {aplicaMayor && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={styles.campoForm}>
                    <label style={styles.labelForm}>Precio Mayor ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={precioMayorUSD}
                      onChange={(e) => setPrecioMayorUSD(e.target.value)}
                      style={styles.inputForm}
                      placeholder="1.05"
                      required={aplicaMayor}
                    />
                  </div>
                  <div style={styles.campoForm}>
                    <label style={styles.labelForm}>A partir de (Cant)</label>
                    <input
                      type="number"
                      step="any"
                      value={cantMinimaMayor}
                      onChange={(e) => setCantMinimaMayor(e.target.value)}
                      style={styles.inputForm}
                      placeholder="3"
                    />
                  </div>
                </div>
              )}

              <button type="submit" style={styles.btnGuardarProducto}>
                <Check size={16} />
                <span>{productoEnEdicion ? 'Actualizar Producto' : 'Guardar en Inventario'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  btnAtras: { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155' },
  tituloHeader: { margin: 0, fontSize: '0.96rem', fontWeight: '800', color: '#0f2a4a' },
  btnNuevo: { backgroundColor: '#00b050', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  barraBusqueda: { padding: '8px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' },
  cajaInputBusqueda: { display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '6px 10px', gap: '6px' },
  inputBusqueda: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.84rem' },
  btnLimpiarBusqueda: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 },
  carruselCategorias: { display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  chipCategoria: { border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  cuerpo: { flex: 1, overflowY: 'auto', padding: '10px 12px' },
  vacioBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: '#94a3b8' },
  listaGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  cardItem: { backgroundColor: '#fff', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  itemImgBox: { width: '46px', height: '46px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemNombre: { fontSize: '0.84rem', color: '#0f2a4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badgeBalanza: { backgroundColor: '#eff6ff', color: '#0052cc', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bfdbfe' },
  precioUSDTag: { fontSize: '0.86rem', fontWeight: '800', color: '#00b050' },
  precioBSTag: { fontSize: '0.74rem', fontWeight: 'bold', color: '#64748b' },
  accionesItem: { display: 'flex', gap: '6px' },
  btnEditar: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0f2a4a' },
  btnBorrar: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' },
  overlayModal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999999 },
  modalBox: { backgroundColor: '#fff', borderRadius: '20px', maxWidth: '380px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '18px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  headerModalForm: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  formProducto: { display: 'flex', flexDirection: 'column', gap: '10px' },
  filaFotoInput: { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px dashed #e2e8f0' },
  previewFotoProd: { width: '54px', height: '54px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  imgProdPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  btnTomarFoto: { backgroundColor: '#0f2a4a', color: '#fff', padding: '7px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  btnQuitarFoto: { background: 'none', border: 'none', color: '#dc2626', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: 0 },
  campoForm: { display: 'flex', flexDirection: 'column', gap: '3px' },
  labelForm: { fontSize: '0.7rem', fontWeight: '700', color: '#475569' },
  inputForm: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', backgroundColor: '#f8fafc' },
  filaCheckbox: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '2px' },
  btnGuardarProducto: { marginTop: '6px', width: '100%', padding: '11px', backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
};
