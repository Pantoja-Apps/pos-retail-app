import React, { useState } from 'react';
import { 
  ArrowLeft, Search, Plus, Trash2, Edit3, Barcode, 
  Camera, Package, DollarSign, X, CheckCircle2, Truck
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
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Víveres');
  const [proveedorId, setProveedorId] = useState('');
  const [costoUSD, setCostoUSD] = useState('');
  const [precioUSD, setPrecioUSD] = useState('');
  const [stock, setStock] = useState('');
  const [esPesado, setEsPesado] = useState(false);
  const [aplicaPrecioMayor, setAplicaPrecioMayor] = useState(false);
  const [precioMayorUSD, setPrecioMayorUSD] = useState('');
  const [cantMinimaMayor, setCantMinimaMayor] = useState(3);

  const tasa = Number(tasaCambio) || 1;

  const productosFiltrados = productos.filter(p => {
    const q = busqueda.toLowerCase().trim();
    return (
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.codigo || '').toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q) ||
      (p.proveedorNombre || '').toLowerCase().includes(q)
    );
  });

  const abrirFormularioCrear = () => {
    setProductoEditando(null);
    setCodigo('');
    setNombre('');
    setCategoria('Víveres');
    setProveedorId('');
    setCostoUSD('');
    setPrecioUSD('');
    setStock('');
    setEsPesado(false);
    setAplicaPrecioMayor(false);
    setPrecioMayorUSD('');
    setCantMinimaMayor(3);
    setModalAbierto(true);
  };

  const abrirFormularioEditar = (p) => {
    setProductoEditando(p);
    setCodigo(p.codigo || '');
    setNombre(p.nombre || '');
    setCategoria(p.categoria || 'Víveres');
    setProveedorId(p.proveedorId || '');
    setCostoUSD(p.costoUSD !== undefined ? String(p.costoUSD) : '');
    setPrecioUSD(p.precioUSD !== undefined ? String(p.precioUSD) : '');
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
    if (!precioUSD || parseFloat(precioUSD) <= 0) return alert('Ingresa un precio válido en dólares.');

    const provObj = proveedores.find(pr => String(pr.id) === String(proveedorId));

    const nuevoProd = {
      id: productoEditando ? productoEditando.id : 'prod_' + Date.now(),
      codigo: codigo.trim() || `GEN-${String(Date.now()).slice(-6)}`,
      nombre: nombre.trim(),
      categoria: categoria || 'Víveres',
      proveedorId: proveedorId || '',
      proveedorNombre: provObj ? provObj.nombre : (productoEditando?.proveedorNombre || ''),
      costoUSD: parseFloat(costoUSD) || 0,
      precioUSD: parseFloat(precioUSD) || 0,
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
            {productos.length} Productos · Tasa BCV: <strong>Bs. {tasa.toFixed(2)}</strong>
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
            placeholder="Buscar por nombre, código o proveedor..."
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
              const costoBs = (Number(p.costoUSD || 0) * tasa).toFixed(2);

              return (
                <div key={p.id} style={styles.cardProducto}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={styles.nombreProd}>{p.nombre}</strong>
                        {p.esPesado && <span style={styles.badgePesado}>Balanza</span>}
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

                  {/* Acciones */}
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

      {/* MODAL CREAR / EDITAR PRODUCTO CON SELECTOR DE PROVEEDOR */}
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
                    <option value="Bebidas y Licores">Bebidas y Licores</option>
                    <option value="Higiene y Limpieza">Higiene y Limpieza</option>
                    <option value="Golosinas">Golosinas</option>
                  </select>
                </div>
              </div>

              {/* SELECTOR DE PROVEEDOR HABITUAL */}
              <div>
                <label style={styles.labelForm}>Proveedor / Distribuidor Habitual</label>
                <select
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  style={styles.inputModal}
                >
                  <option value="">-- Sin proveedor asignado --</option>
                  {proveedores.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Costo de Compra ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={costoUSD}
                    onChange={(e) => setCostoUSD(e.target.value)}
                    style={styles.inputModal}
                  />
                </div>
                <div>
                  <label style={styles.labelForm}>Precio de Venta ($) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={precioUSD}
                    onChange={(e) => setPrecioUSD(e.target.value)}
                    style={styles.inputModal}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Stock Inicial</label>
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
                    style={{ width: '16px', height: '16px', accentColor: '#00b050' }}
                  />
                  <label htmlFor="chkPesado" style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#0f2a4a' }}>
                    Producto a Granel (Balanza / KG)
                  </label>
                </div>
              </div>

              {/* Precio al mayor opcional */}
              <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="checkbox"
                    id="chkMayor"
                    checked={aplicaPrecioMayor}
                    onChange={(e) => setAplicaPrecioMayor(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#0052cc' }}
                  />
                  <label htmlFor="chkMayor" style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#0f2a4a' }}>
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
    maxWidth: '360px',
    width: '100%',
    maxHeight: '90vh',
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
    padding: '10px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '6px'
  }
};
