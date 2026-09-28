import React, { useState } from 'react';
import { 
  ArrowLeft, Search, Plus, Trash2, Edit3, Barcode, 
  Camera, Package, DollarSign, X, CheckCircle2, Truck,
  Boxes, Percent
} from 'lucide-react';

export default function InventarioModal({
  productos = [],
  proveedores = [],
  tasaCambio = 855.66,
  esDueno = true,
  alGuardarProducto,
  alEliminarProducto,
  alVolver,
  alAbrirCamara
}) {
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // Formulario Producto
  const [foto, setFoto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Víveres');
  const [proveedorId, setProveedorId] = useState('');
  const [ivaTipo, setIvaTipo] = useState('exento'); // 'exento' | '16'

  // Presentación de Compra
  const [tipoEmpaque, setTipoEmpaque] = useState('Bulto');
  const [undsPorEmpaque, setUndsPorEmpaque] = useState('1');
  const [costoEmpaqueUSD, setCostoEmpaqueUSD] = useState('');
  
  // Costos y Precios
  const [costoUnitUSD, setCostoUnitUSD] = useState('');
  const [margenPorcentaje, setMargenPorcentaje] = useState('20');
  const [precioVentaUSD, setPrecioVentaUSD] = useState('');
  const [stock, setStock] = useState('');
  const [esPesado, setEsPesado] = useState(false);

  // Precios al mayor
  const [aplicaPrecioMayor, setAplicaPrecioMayor] = useState(false);
  const [precioMayorUSD, setPrecioMayorUSD] = useState('');
  const [cantMinimaMayor, setCantMinimaMayor] = useState(3);

  const tasa = Number(tasaCambio) || 1;

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    const q = busqueda.toLowerCase().trim();
    return (
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.codigo || '').toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q) ||
      (p.proveedorNombre || '').toLowerCase().includes(q)
    );
  });

  // Recálculo automático desde Empaque y Unidades
  const recalcularDesdeEmpaque = (nuevoCostoEmpaque, nuevasUnds, nuevoMargen) => {
    const cEmp = parseFloat(nuevoCostoEmpaque) || 0;
    const uEmp = parseFloat(nuevasUnds) || 1;
    const mPorc = parseFloat(nuevoMargen) || 0;

    if (uEmp > 0 && cEmp > 0) {
      const cUnit = cEmp / uEmp;
      setCostoUnitUSD(cUnit.toFixed(2));
      const pVenta = cUnit * (1 + (mPorc / 100));
      setPrecioVentaUSD(pVenta.toFixed(2));
    }
  };

  const manejarCambioUnds = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setUndsPorEmpaque(val);
    recalcularDesdeEmpaque(costoEmpaqueUSD, val, margenPorcentaje);
  };

  const manejarCambioCostoEmpaque = (e) => {
    const val = e.target.value;
    setCostoEmpaqueUSD(val);
    recalcularDesdeEmpaque(val, undsPorEmpaque, margenPorcentaje);
  };

  const manejarCambioMargen = (e) => {
    const val = e.target.value;
    setMargenPorcentaje(val);
    const cUnit = parseFloat(costoUnitUSD) || 0;
    const m = parseFloat(val) || 0;
    if (cUnit > 0) {
      setPrecioVentaUSD((cUnit * (1 + (m / 100))).toFixed(2));
    }
  };

  const manejarCambioPrecioVenta = (e) => {
    const val = e.target.value;
    setPrecioVentaUSD(val);
    const pVenta = parseFloat(val) || 0;
    const cUnit = parseFloat(costoUnitUSD) || 0;
    if (cUnit > 0 && pVenta > cUnit) {
      setMargenPorcentaje((((pVenta - cUnit) / cUnit) * 100).toFixed(1));
    }
  };

  const abrirFormularioCrear = () => {
    setProductoEditando(null);
    setFoto('');
    setCodigo('');
    setNombre('');
    setCategoria('Víveres');
    setProveedorId('');
    setIvaTipo('exento');
    setTipoEmpaque('Bulto');
    setUndsPorEmpaque('1');
    setCostoEmpaqueUSD('');
    setCostoUnitUSD('');
    setMargenPorcentaje('20');
    setPrecioVentaUSD('');
    setStock('');
    setEsPesado(false);
    setAplicaPrecioMayor(false);
    setPrecioMayorUSD('');
    setCantMinimaMayor(3);
    setModalAbierto(true);
  };

  const abrirFormularioEditar = (p) => {
    setProductoEditando(p);
    setFoto(p.imagen || p.foto || '');
    setCodigo(p.codigo || '');
    setNombre(p.nombre || '');
    setCategoria(p.categoria || 'Víveres');
    setProveedorId(p.proveedorId || '');

    // Detección estricta de IVA guardado
    const esExento = p.ivaTipo === 'exento' || p.exentoIVA === true || p.iva === 0 || !p.ivaTipo;
    setIvaTipo(esExento ? 'exento' : '16');

    setTipoEmpaque(p.tipoEmpaque || 'Bulto');
    setUndsPorEmpaque(p.undsPorEmpaque ? String(p.undsPorEmpaque) : '1');
    setCostoEmpaqueUSD(p.costoEmpaqueUSD !== undefined ? String(p.costoEmpaqueUSD) : (p.costoUSD ? String(p.costoUSD) : ''));

    const cUnit = p.costoUSD !== undefined ? Number(p.costoUSD) : 0;
    const pVenta = p.precioUSD !== undefined ? Number(p.precioUSD) : 0;
    setCostoUnitUSD(cUnit > 0 ? String(cUnit) : '');
    setPrecioVentaUSD(pVenta > 0 ? String(pVenta) : '');

    if (cUnit > 0 && pVenta > cUnit) {
      setMargenPorcentaje((((pVenta - cUnit) / cUnit) * 100).toFixed(0));
    } else {
      setMargenPorcentaje('20');
    }

    setStock(p.stock !== undefined ? String(p.stock) : '');
    setEsPesado(Boolean(p.esPesado));
    setAplicaPrecioMayor(Boolean(p.aplicaPrecioMayor));
    setPrecioMayorUSD(p.precioMayorUSD !== undefined ? String(p.precioMayorUSD) : '');
    setCantMinimaMayor(p.cantMinimaMayor || 3);
    setModalAbierto(true);
  };

  const manejarGuardar = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('El nombre del producto es obligatorio.');
    if (!precioVentaUSD || parseFloat(precioVentaUSD) <= 0) return alert('Ingresa un precio de venta válido.');

    const provObj = proveedores.find(pr => String(pr.id) === String(proveedorId));

    const nuevoProd = {
      id: productoEditando ? productoEditando.id : 'prod_' + Date.now(),
      codigo: codigo.trim() || `GEN-${String(Date.now()).slice(-6)}`,
      nombre: nombre.trim(),
      imagen: foto,
      categoria: categoria || 'Víveres',
      proveedorId: proveedorId || '',
      proveedorNombre: provObj ? provObj.nombre : (productoEditando?.proveedorNombre || ''),
      // IVA explícito garantizado
      ivaTipo: ivaTipo,
      exentoIVA: ivaTipo === 'exento',
      tipoEmpaque: tipoEmpaque,
      undsPorEmpaque: parseFloat(undsPorEmpaque) || 1,
      costoEmpaqueUSD: parseFloat(costoEmpaqueUSD) || parseFloat(costoUnitUSD) || 0,
      costoUSD: parseFloat(costoUnitUSD) || 0,
      precioUSD: parseFloat(precioVentaUSD) || 0,
      stock: parseFloat(stock) || 0,
      esPesado: Boolean(esPesado),
      aplicaPrecioMayor: Boolean(aplicaPrecioMayor),
      precioMayorUSD: aplicaPrecioMayor ? (parseFloat(precioMayorUSD) || 0) : 0,
      cantMinimaMayor: aplicaPrecioMayor ? (parseInt(cantMinimaMayor) || 3) : 0
    };

    if (alGuardarProducto) alGuardarProducto(nuevoProd);
    setModalAbierto(false);
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* Cabecera */}
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Inventario y Catálogo</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            {productos.length} Productos · BCV: <strong>Bs. {tasa.toFixed(2)}</strong>
          </small>
        </div>
        {esDueno && (
          <button type="button" onClick={abrirFormularioCrear} style={styles.btnCrearTop}>
            <Plus size={15} />
            <span>Nuevo</span>
          </button>
        )}
      </header>

      {/* Buscador */}
      <div style={styles.cajaBuscadorContainer}>
        <div style={styles.cajaBuscador}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o distribuidor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputBusqueda}
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} style={styles.btnLimpiar}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <main style={styles.cuerpo}>
        {productosFiltrados.length === 0 ? (
          <div style={styles.vacioBox}>
            <Package size={42} color="#cbd5e1" />
            <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              No se encontraron productos en el inventario.
            </p>
          </div>
        ) : (
          <div style={styles.listaGrid}>
            {productosFiltrados.map((p) => {
              const precioBs = (Number(p.precioUSD || 0) * tasa).toFixed(2);
              
              // Validación inequívoca: Si es exento o no está marcado como 16, es Exento
              const esGravable16 = p.ivaTipo === '16' || p.iva === 16;

              return (
                <div key={p.id} style={styles.cardProducto}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={styles.nombreProd}>{p.nombre}</strong>
                        {p.esPesado && <span style={styles.badgePesado}>Balanza (KG)</span>}

                        {/* BADGE DINÁMICO EXACTO */}
                        {esGravable16 ? (
                          <span style={styles.badgeIva16}>IVA 16%</span>
                        ) : (
                          <span style={styles.badgeExento}>Exento (0%)</span>
                        )}
                      </div>

                      <div style={styles.metaProd}>
                        <span>Cód: {p.codigo}</span> · <span>Cat: {p.categoria}</span>
                      </div>

                      {p.proveedorNombre && (
                        <div style={styles.badgeProveedor}>
                          <Truck size={10} color="#7c3aed" />
                          <span>{p.proveedorNombre}</span>
                        </div>
                      )}

                      <div style={styles.stockFila}>
                        <span>Stock: <strong>{p.stock} {p.esPesado ? 'kg' : 'unds'}</strong></span>
                        {p.costoUSD > 0 && esDueno && (
                          <span style={{ color: '#64748b', fontSize: '0.68rem', marginLeft: '8px' }}>
                            (Costo: ${Number(p.costoUSD).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={styles.precioUSDText}>${Number(p.precioUSD).toFixed(2)}</div>
                      <small style={styles.precioBSText}>Bs. {precioBs}</small>
                    </div>
                  </div>

                  {esDueno && (
                    <div style={styles.accionesFila}>
                      <button type="button" onClick={() => abrirFormularioEditar(p)} style={styles.btnEditar}>
                        <Edit3 size={13} />
                        <span>Editar</span>
                      </button>
                      <button type="button" onClick={() => { if (confirm(`¿Eliminar ${p.nombre}?`)) alEliminarProducto(p.id); }} style={styles.btnEliminar}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {modalAbierto && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBox}>
            <div style={styles.headerModalMini}>
              <strong style={{ fontSize: '0.94rem', color: '#0f2a4a' }}>
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </strong>
              <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCerrarX}><X size={16} /></button>
            </div>

            <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              <div>
                <label style={styles.labelForm}>Nombre del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej: Harina PAN Blanca 1kg"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.inputModal}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Código de Barras</label>
                  <input
                    type="text"
                    placeholder="Escanear o generar"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    style={styles.inputModal}
                  />
                </div>
                <div>
                  <label style={styles.labelForm}>Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    style={styles.inputModal}
                  >
                    <option value="Víveres">Víveres</option>
                    <option value="Charcutería">Charcutería</option>
                    <option value="Carnicería">Carnicería</option>
                    <option value="Verduras y Frutas">Verduras y Frutas</option>
                    <option value="Snacks y Golosinas">Snacks y Golosinas</option>
                    <option value="Bebidas y Licores">Bebidas y Licores</option>
                    <option value="Higiene y Limpieza">Higiene y Limpieza</option>
                  </select>
                </div>
              </div>

              {/* Proveedor Habitual e Impuesto (IVA) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Proveedor Habitual</label>
                  <select
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    style={styles.inputModal}
                  >
                    <option value="">-- Sin asignar --</option>
                    {proveedores.map(pr => (
                      <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.labelForm}>Impuesto (IVA) *</label>
                  <select
                    value={ivaTipo}
                    onChange={(e) => setIvaTipo(e.target.value)}
                    style={{
                      ...styles.inputModal,
                      backgroundColor: ivaTipo === 'exento' ? '#f0fdf4' : '#fff7ed',
                      fontWeight: 'bold',
                      color: ivaTipo === 'exento' ? '#00b050' : '#ea580c'
                    }}
                  >
                    <option value="exento">Exento (0%)</option>
                    <option value="16">IVA (16%)</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN PRESENTACIÓN DE COMPRA 100% DESBLOQUEADA */}
              <div style={styles.bloquePresentacionCompra}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <Boxes size={14} color="#0052cc" />
                  <strong style={{ fontSize: '0.74rem', color: '#0f2a4a' }}>Presentación de Compra</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <div>
                    <small style={styles.labelMiniEmpaque}>Empaque</small>
                    <select
                      value={tipoEmpaque}
                      onChange={(e) => setTipoEmpaque(e.target.value)}
                      style={styles.inputEmpaque}
                    >
                      <option value="Bulto">Bulto</option>
                      <option value="Caja">Caja</option>
                      <option value="Fardo">Fardo</option>
                      <option value="Saco">Saco</option>
                      <option value="Unidad">Unidad</option>
                    </select>
                  </div>

                  <div>
                    <small style={styles.labelMiniEmpaque}>Unds x Empaque *</small>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 20"
                      value={undsPorEmpaque}
                      onChange={manejarCambioUnds}
                      style={{ ...styles.inputEmpaque, backgroundColor: '#ffffff', fontWeight: 'bold' }}
                      required
                    />
                  </div>

                  <div>
                    <small style={styles.labelMiniEmpaque}>Costo Empaque ($)</small>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={costoEmpaqueUSD}
                      onChange={manejarCambioCostoEmpaque}
                      style={{ ...styles.inputEmpaque, backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
              </div>

              {/* Costos y Margen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Costo Unit ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={costoUnitUSD}
                    onChange={(e) => {
                      setCostoUnitUSD(e.target.value);
                      const c = parseFloat(e.target.value) || 0;
                      const m = parseFloat(margenPorcentaje) || 0;
                      if (c > 0) setPrecioVentaUSD((c * (1 + (m / 100))).toFixed(2));
                    }}
                    style={styles.inputModal}
                  />
                </div>

                <div>
                  <label style={styles.labelForm}>Margen %</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="20"
                    value={margenPorcentaje}
                    onChange={manejarCambioMargen}
                    style={styles.inputModal}
                  />
                </div>

                <div>
                  <label style={styles.labelForm}>Precio Venta ($) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={precioVentaUSD}
                    onChange={manejarCambioPrecioVenta}
                    style={{ ...styles.inputModal, fontWeight: 'bold', color: '#00b050', backgroundColor: '#f0fdf4' }}
                    required
                  />
                </div>
              </div>

              {/* Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Stock Actual en Anaquel</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    style={styles.inputModal}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="chkPesado"
                    checked={esPesado}
                    onChange={(e) => setEsPesado(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#00b050', cursor: 'pointer' }}
                  />
                  <label htmlFor="chkPesado" style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#0f2a4a', cursor: 'pointer' }}>
                    A Granel (Balanza)
                  </label>
                </div>
              </div>

              {/* Precio al Mayor */}
              <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="checkbox"
                    id="chkMayor"
                    checked={aplicaPrecioMayor}
                    onChange={(e) => setAplicaPrecioMayor(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#0052cc', cursor: 'pointer' }}
                  />
                  <label htmlFor="chkMayor" style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#0f2a4a', cursor: 'pointer' }}>
                    Habilitar Precio al Mayor (Bulto / Paquete)
                  </label>
                </div>

                {aplicaPrecioMayor && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>
                      <small style={styles.labelForm}>Precio al mayor ($)</small>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={precioMayorUSD}
                        onChange={(e) => setPrecioMayorUSD(e.target.value)}
                        style={styles.inputModal}
                      />
                    </div>
                    <div>
                      <small style={styles.labelForm}>A partir de (cantidad)</small>
                      <input
                        type="number"
                        value={cantMinimaMayor}
                        onChange={(e) => setCantMinimaMayor(e.target.value)}
                        style={styles.inputModal}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" style={styles.btnGuardarModal}>
                {productoEditando ? 'Actualizar Producto' : 'Guardar en Inventario'}
              </button>
            </form>
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
  btnCrearTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  cajaBuscadorContainer: {
    padding: '8px 12px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0
  },
  cajaBuscador: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '6px 10px',
    gap: '6px',
    border: '1px solid #cbd5e1'
  },
  inputBusqueda: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '0.8rem',
    color: '#0f2a4a'
  },
  btnLimpiar: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: 0
  },
  cuerpo: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  vacioBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  },
  listaGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  cardProducto: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  nombreProd: {
    fontSize: '0.84rem',
    color: '#0f2a4a'
  },
  badgePesado: {
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 5px',
    borderRadius: '4px',
    border: '1px solid #bfdbfe'
  },
  badgeExento: {
    backgroundColor: '#f0fdf4',
    color: '#00b050',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #bbf7d0'
  },
  badgeIva16: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #ffedd5'
  },
  badgeProveedor: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f5f3ff',
    color: '#7c3aed',
    fontSize: '0.64rem',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '4px',
    width: 'fit-content',
    marginTop: '2px'
  },
  metaProd: {
    fontSize: '0.68rem',
    color: '#64748b',
    marginTop: '1px'
  },
  stockFila: {
    fontSize: '0.74rem',
    color: '#334155',
    marginTop: '3px'
  },
  precioUSDText: {
    fontSize: '1.05rem',
    fontWeight: '900',
    color: '#00b050'
  },
  precioBSText: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#0052cc'
  },
  accionesFila: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed #f1f5f9'
  },
  btnEditar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f8fafc',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnEliminar: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  bloquePresentacionCompra: {
    backgroundColor: '#f0f9ff',
    borderRadius: '10px',
    padding: '8px 10px',
    border: '1px solid #bae6fd'
  },
  labelMiniEmpaque: {
    fontSize: '0.64rem',
    fontWeight: 'bold',
    color: '#0369a1',
    display: 'block',
    marginBottom: '2px'
  },
  inputEmpaque: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.76rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
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
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    maxWidth: '370px',
    width: '100%',
    maxHeight: '92vh',
    padding: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  headerModalMini: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  btnCerrarX: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  labelForm: {
    fontSize: '0.68rem',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '2px',
    display: 'block'
  },
  inputModal: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 9px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  btnGuardarModal: {
    width: '100%',
    padding: '11px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.84rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '6px'
  }
};
