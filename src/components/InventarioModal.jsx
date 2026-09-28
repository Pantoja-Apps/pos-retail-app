import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Search, Plus, Trash2, Edit3, Barcode, 
  Camera, Package, DollarSign, X, CheckCircle2, Truck,
  Image as ImageIcon, Percent, Layers, AlertTriangle, Box
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

  // Estados del Formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Víveres');
  const [proveedorId, setProveedorId] = useState('');
  const [imagen, setImagen] = useState('');
  
  // Costos, Precios y Margen
  const [costoUSD, setCostoUSD] = useState('');
  const [precioUSD, setPrecioUSD] = useState('');
  const [margenPorcentaje, setMargenPorcentaje] = useState('30');
  
  // Presentación / Empaque mayorista
  const [tipoEmpaque, setTipoEmpaque] = useState('unidad'); // 'unidad' | 'bulto' | 'caja' | 'saco' | 'paquete' | 'cesta'
  const [unidadesPorEmpaque, setUnidadesPorEmpaque] = useState('1');
  const [costoEmpaqueUSD, setCostoEmpaqueUSD] = useState('');
  
  // Régimen fiscal
  const [exentoIVA, setExentoIVA] = useState(true);
  
  // Inventario y modalidades
  const [stock, setStock] = useState('');
  const [esPesado, setEsPesado] = useState(false);
  const [aplicaPrecioMayor, setAplicaPrecioMayor] = useState(false);
  const [precioMayorUSD, setPrecioMayorUSD] = useState('');
  const [cantMinimaMayor, setCantMinimaMayor] = useState(3);

  const fileInputRef = useRef(null);
  const tasa = Number(tasaCambio) || 1;

  // Filtrado en tiempo real
  const productosFiltrados = productos.filter(p => {
    const q = busqueda.toLowerCase().trim();
    return (
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.codigo || '').toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q) ||
      (p.proveedorNombre || '').toLowerCase().includes(q)
    );
  });

  // Manejo de Fotos (Compresión a Base64)
  const manejarCargaImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 360;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImagen(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Recálculo automático de Costo por Unidad si compran por Bulto/Caja/Saco
  const actualizarCostoPorEmpaque = (costoEmp, unds) => {
    setCostoEmpaqueUSD(costoEmp);
    const cTotal = parseFloat(costoEmp) || 0;
    const uTotal = parseFloat(unds) || 1;
    if (cTotal > 0 && uTotal > 0) {
      const unitario = (cTotal / uTotal).toFixed(2);
      setCostoUSD(unitario);
      if (margenPorcentaje) {
        const mg = parseFloat(margenPorcentaje) || 0;
        setPrecioUSD((parseFloat(unitario) * (1 + mg / 100)).toFixed(2));
      }
    }
  };

  // Recálculo de Precio a partir del Margen %
  const manejarCambioMargen = (mg) => {
    setMargenPorcentaje(mg);
    const c = parseFloat(costoUSD) || 0;
    const m = parseFloat(mg) || 0;
    if (c > 0) {
      setPrecioUSD((c * (1 + m / 100)).toFixed(2));
    }
  };

  const abrirFormularioCrear = () => {
    setProductoEditando(null);
    setCodigo('');
    setNombre('');
    setCategoria('Víveres');
    setProveedorId('');
    setImagen('');
    setCostoUSD('');
    setPrecioUSD('');
    setMargenPorcentaje('30');
    setTipoEmpaque('unidad');
    setUnidadesPorEmpaque('1');
    setCostoEmpaqueUSD('');
    setExentoIVA(true);
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
    setImagen(p.imagen || '');
    setCostoUSD(p.costoUSD !== undefined ? String(p.costoUSD) : '');
    setPrecioUSD(p.precioUSD !== undefined ? String(p.precioUSD) : '');
    
    // Calcular margen existente
    if (p.costoUSD && p.precioUSD && Number(p.costoUSD) > 0) {
      const mg = (((Number(p.precioUSD) - Number(p.costoUSD)) / Number(p.costoUSD)) * 100).toFixed(0);
      setMargenPorcentaje(mg);
    } else {
      setMargenPorcentaje('30');
    }

    setTipoEmpaque(p.tipoEmpaque || 'unidad');
    setUnidadesPorEmpaque(p.unidadesPorEmpaque ? String(p.unidadesPorEmpaque) : '1');
    setCostoEmpaqueUSD(p.costoEmpaqueUSD ? String(p.costoEmpaqueUSD) : '');
    setExentoIVA(p.exentoIVA !== undefined ? Boolean(p.exentoIVA) : true);
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
    if (!precioUSD || parseFloat(precioUSD) <= 0) return alert('Ingresa un precio de venta válido.');

    const provObj = proveedores.find(pr => String(pr.id) === String(proveedorId));

    const nuevoProd = {
      id: productoEditando ? productoEditando.id : 'prod_' + Date.now(),
      codigo: codigo.trim() || `GEN-${String(Date.now()).slice(-6)}`,
      nombre: nombre.trim(),
      categoria: categoria || 'Víveres',
      proveedorId: proveedorId || '',
      proveedorNombre: provObj ? provObj.nombre : (productoEditando?.proveedorNombre || ''),
      imagen: imagen || '',
      costoUSD: parseFloat(costoUSD) || 0,
      precioUSD: parseFloat(precioUSD) || 0,
      tipoEmpaque: tipoEmpaque || 'unidad',
      unidadesPorEmpaque: parseFloat(unidadesPorEmpaque) || 1,
      costoEmpaqueUSD: parseFloat(costoEmpaqueUSD) || 0,
      exentoIVA: Boolean(exentoIVA),
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

      {/* Buscador con Botón de Escáner Cámara */}
      <div style={styles.cajaBuscadorContainer}>
        <div style={styles.cajaBuscador}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre, código, proveedor..."
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
        {alAbrirCamara && (
          <button type="button" onClick={alAbrirCamara} style={styles.btnCamaraBuscador} title="Escanear Código">
            <Camera size={16} />
          </button>
        )}
      </div>

      <main style={styles.cuerpo}>
        {productosFiltrados.length === 0 ? (
          <div style={styles.vacioBox}>
            <Package size={42} color="#cbd5e1" />
            <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              No se encontraron productos en el catálogo.
            </p>
          </div>
        ) : (
          <div style={styles.listaGrid}>
            {productosFiltrados.map((p) => {
              const precioBs = (Number(p.precioUSD || 0) * tasa).toFixed(2);
              const costoUSDNum = Number(p.costoUSD || 0);
              const stockNum = Number(p.stock || 0);
              const esBajoStock = stockNum <= 5;

              return (
                <div key={p.id} style={styles.cardProducto}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {/* Imagen o Placeholder */}
                    <div style={styles.cajaImgThumbnail}>
                      {p.imagen ? (
                        <img src={p.imagen} alt="" style={styles.imgThumb} />
                      ) : (
                        <Barcode size={22} color="#94a3b8" />
                      )}
                    </div>

                    {/* Datos del Producto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <strong style={styles.nombreProd}>{p.nombre}</strong>
                        {p.esPesado ? (
                          <span style={styles.badgePesado}>Balanza (KG)</span>
                        ) : p.tipoEmpaque && p.tipoEmpaque !== 'unidad' && (
                          <span style={styles.badgeEmpaque}>{p.tipoEmpaque} ({p.unidadesPorEmpaque}u)</span>
                        )}
                        <span style={p.exentoIVA ? styles.badgeExento : styles.badgeIva}>
                          {p.exentoIVA ? 'Exento' : 'IVA 16%'}
                        </span>
                      </div>

                      <div style={styles.metaProd}>
                        <span>Cód: <strong>{p.codigo}</strong></span> · <span>Cat: {p.categoria}</span>
                      </div>

                      {p.proveedorNombre && (
                        <div style={styles.badgeProveedor}>
                          <Truck size={10} color="#7c3aed" />
                          <span>{p.proveedorNombre}</span>
                        </div>
                      )}

                      <div style={styles.stockFila}>
                        <span style={{ color: esBajoStock ? '#dc2626' : '#334155', fontWeight: 'bold' }}>
                          Stock: {p.stock} {p.esPesado ? 'kg' : 'unds'}
                          {esBajoStock && <span style={{ fontSize: '0.64rem', marginLeft: '4px' }}>(¡Bajo!)</span>}
                        </span>
                        {costoUSDNum > 0 && esDueno && (
                          <span style={{ color: '#64748b', fontSize: '0.68rem', marginLeft: '8px' }}>
                            Costo: ${costoUSDNum.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={styles.precioUSDText}>${Number(p.precioUSD).toFixed(2)}</div>
                      <small style={styles.precioBSText}>Bs. {precioBs}</small>
                      {p.aplicaPrecioMayor && (
                        <div style={styles.precioMayorTag}>
                          Mayor: ${Number(p.precioMayorUSD).toFixed(2)} (x{p.cantMinimaMayor})
                        </div>
                      )}
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

      {/* MODAL CREAR / EDITAR PRODUCTO COMPLETO */}
      {modalAbierto && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBox}>
            <div style={styles.headerModalMini}>
              <strong style={{ fontSize: '0.94rem', color: '#0f2a4a' }}>
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto al Catálogo'}
              </strong>
              <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCerrarX}><X size={16} /></button>
            </div>

            <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, overflowY: 'auto' }}>
              
              {/* Sección Foto y Cámara */}
              <div style={styles.seccionFotoRow}>
                <div style={styles.previewFotoBox} onClick={() => fileInputRef.current?.click()}>
                  {imagen ? (
                    <img src={imagen} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <Camera size={20} />
                      <span style={{ fontSize: '0.62rem', display: 'block' }}>Foto</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={manejarCargaImagen}
                  style={{ display: 'none' }}
                />

                <div style={{ flex: 1 }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.btnSubirFoto}>
                    <Camera size={14} />
                    <span>{imagen ? 'Cambiar Foto' : 'Tomar / Subir Foto'}</span>
                  </button>
                  {imagen && (
                    <button type="button" onClick={() => setImagen('')} style={styles.btnQuitarFoto}>
                      Quitar Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Nombre */}
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

              {/* Código y Categoría */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Código de Barras</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      placeholder="759..."
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      style={styles.inputModal}
                    />
                    {alAbrirCamara && (
                      <button type="button" onClick={alAbrirCamara} style={styles.btnScanMini} title="Escanear">
                        <Barcode size={14} />
                      </button>
                    )}
                  </div>
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
                    <option value="Panadería">Panadería</option>
                  </select>
                </div>
              </div>

              {/* Proveedor y Régimen Fiscal (IVA) */}
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
                  <label style={styles.labelForm}>Impuesto (IVA)</label>
                  <select
                    value={exentoIVA ? 'exento' : 'gravado'}
                    onChange={(e) => setExentoIVA(e.target.value === 'exento')}
                    style={styles.inputModal}
                  >
                    <option value="exento">Exento (0%)</option>
                    <option value="gravado">Gravado (16%)</option>
                  </select>
                </div>
              </div>

              {/* Presentación de Compra al Mayor (Bulto, Caja, Saco, Cesta) */}
              <div style={styles.cajaMayoristaBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Box size={14} color="#0052cc" />
                  <strong style={{ fontSize: '0.72rem', color: '#0f2a4a' }}>Presentación de Compra</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <div>
                    <small style={styles.labelForm}>Empaque</small>
                    <select
                      value={tipoEmpaque}
                      onChange={(e) => setTipoEmpaque(e.target.value)}
                      style={styles.inputModal}
                    >
                      <option value="unidad">Unidad / Detal</option>
                      <option value="bulto">Bulto</option>
                      <option value="caja">Caja</option>
                      <option value="saco">Saco</option>
                      <option value="paquete">Paquete</option>
                      <option value="cesta">Cesta / Huacal</option>
                    </select>
                  </div>

                  {tipoEmpaque !== 'unidad' ? (
                    <>
                      <div>
                        <small style={styles.labelForm}>Unds x Empaque</small>
                        <input
                          type="number"
                          placeholder="Ej: 20"
                          value={unidadesPorEmpaque}
                          onChange={(e) => actualizarCostoPorEmpaque(costoEmpaqueUSD, e.target.value)}
                          style={styles.inputModal}
                        />
                      </div>
                      <div>
                        <small style={styles.labelForm}>Costo Empaque ($)</small>
                        <input
                          type="number"
                          step="any"
                          placeholder="Ej: 18.40"
                          value={costoEmpaqueUSD}
                          onChange={(e) => actualizarCostoPorEmpaque(e.target.value, unidadesPorEmpaque)}
                          style={styles.inputModal}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{ gridColumn: 'span 2' }}>
                      <small style={styles.labelForm}>Costo Unitario ($)</small>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={costoUSD}
                        onChange={(e) => {
                          setCostoUSD(e.target.value);
                          if (margenPorcentaje) {
                            const c = parseFloat(e.target.value) || 0;
                            const m = parseFloat(margenPorcentaje) || 0;
                            setPrecioUSD((c * (1 + m / 100)).toFixed(2));
                          }
                        }}
                        style={styles.inputModal}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Costos, Margen y Precio de Venta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Costo Unit ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={costoUSD}
                    onChange={(e) => setCostoUSD(e.target.value)}
                    style={styles.inputModal}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={styles.labelForm}>Margen %</label>
                  <input
                    type="number"
                    value={margenPorcentaje}
                    onChange={(e) => manejarCambioMargen(e.target.value)}
                    style={styles.inputModal}
                    placeholder="30"
                  />
                </div>
                <div>
                  <label style={styles.labelForm}>Precio Venta ($) *</label>
                  <input
                    type="number"
                    step="any"
                    value={precioUSD}
                    onChange={(e) => setPrecioUSD(e.target.value)}
                    style={{ ...styles.inputModal, fontWeight: 'bold', color: '#00b050' }}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Stock y Balanza */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelForm}>Stock Actual</label>
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
                    A Granel (Balanza / KG)
                  </label>
                </div>
              </div>

              {/* Precio al Mayor opcional */}
              <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
                {productoEditando ? 'Actualizar Producto' : 'Guardar Producto en Catálogo'}
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
    display: 'flex',
    gap: '6px',
    flexShrink: 0
  },
  cajaBuscador: {
    flex: 1,
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
  btnCamaraBuscador: {
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
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
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cajaImgThumbnail: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },
  imgThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  nombreProd: {
    fontSize: '0.86rem',
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
  badgeEmpaque: {
    backgroundColor: '#f0fdf4',
    color: '#00b050',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 5px',
    borderRadius: '4px',
    border: '1px solid #bbf7d0',
    textTransform: 'capitalize'
  },
  badgeExento: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 5px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0'
  },
  badgeIva: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 5px',
    borderRadius: '4px',
    border: '1px solid #fed7aa'
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
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#00b050'
  },
  precioBSText: {
    fontSize: '0.72rem',
    fontWeight: 'bold',
    color: '#0052cc'
  },
  precioMayorTag: {
    fontSize: '0.62rem',
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: '1px'
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
    borderRadius: '24px',
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
  seccionFotoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1'
  },
  previewFotoBox: {
    width: '54px',
    height: '54px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0
  },
  btnSubirFoto: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnQuitarFoto: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.66rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '2px 0 0 2px'
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
  btnScanMini: {
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  cajaMayoristaBox: {
    backgroundColor: '#eff6ff',
    borderRadius: '10px',
    padding: '8px',
    border: '1px solid #bfdbfe'
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
    boxShadow: '0 3px 10px rgba(0, 176, 80, 0.3)',
    marginTop: '4px'
  }
};
