import React, { useState } from 'react';
import { 
  ArrowLeft, Truck, Plus, Search, Phone, FileText, DollarSign, 
  Calendar, CheckCircle2, AlertCircle, Trash2, X, ShoppingCart,
  Layers, ArrowUpRight, Clock, MessageCircle
} from 'lucide-react';

export default function ProveedoresModal({
  proveedores = [],
  compras = [],
  productos = [],
  tasaCambio = 855.66,
  alGuardarProveedor,
  alEliminarProveedor,
  alRegistrarCompra,
  alAbonarCompra,
  alVolver
}) {
  const [pestana, setPestana] = useState('compras'); // 'compras' | 'proveedores' | 'cxp'
  const [busqueda, setBusqueda] = useState('');
  
  // Modales secundarios
  const [modalNuevoProv, setModalNuevoProv] = useState(false);
  const [modalNuevaCompra, setModalNuevaCompra] = useState(false);
  const [modalAbonoCompra, setModalAbonoCompra] = useState(null);
  const [montoAbonoInput, setMontoAbonoInput] = useState('');

  // Formulario Proveedor
  const [provRif, setProvRif] = useState('');
  const [provNombre, setProvNombre] = useState('');
  const [provVendedor, setProvVendedor] = useState('');
  const [provTelefono, setProvTelefono] = useState('');
  const [provDiasCredito, setProvDiasCredito] = useState(15);

  // Formulario Compra
  const [compraProvId, setCompraProvId] = useState('');
  const [compraFacturaNro, setCompraFacturaNro] = useState('');
  const [compraEsCredito, setCompraEsCredito] = useState(false);
  const [compraItems, setCompraItems] = useState([]);
  
  // Selector de producto para compra
  const [prodSeleccionadoId, setProdSeleccionadoId] = useState('');
  const [cantIngreso, setCantIngreso] = useState('');
  const [costoUnitUSD, setCostoUnitUSD] = useState('');

  const tasa = Number(tasaCambio) || 1;

  // Cuentas por pagar pendientes
  const comprasPendientes = compras.filter(c => c.saldoPendienteUSD > 0.005);
  const totalDeudaProveedoresUSD = comprasPendientes.reduce((acc, c) => acc + Number(c.saldoPendienteUSD || 0), 0);

  // 1. Guardar Proveedor
  const manejarGuardarProveedor = (e) => {
    e.preventDefault();
    if (!provNombre.trim()) return alert('Ingresa el nombre de la empresa');

    const nuevo = {
      id: 'prv_' + Date.now(),
      rif: provRif.trim() || 'J-00000000-0',
      nombre: provNombre.trim(),
      vendedor: provVendedor.trim() || 'Principal',
      telefono: provTelefono.trim(),
      diasCredito: Number(provDiasCredito) || 15
    };

    if (alGuardarProveedor) alGuardarProveedor(nuevo);
    setProvRif('');
    setProvNombre('');
    setProvVendedor('');
    setProvTelefono('');
    setModalNuevoProv(false);
  };

  // 2. Agregar ítem a la orden de compra
  const agregarItemCompra = () => {
    const p = productos.find(item => String(item.id) === String(prodSeleccionadoId));
    if (!p) return alert('Selecciona un producto del catálogo');
    const cant = parseFloat(cantIngreso) || 0;
    const costo = parseFloat(costoUnitUSD) || Number(p.costoUSD || 0);

    if (cant <= 0) return alert('Ingresa una cantidad mayor a 0');

    setCompraItems(prev => [
      ...prev,
      {
        id: p.id,
        nombre: p.nombre,
        esPesado: p.esPesado,
        cantidad: cant,
        costoUSD: costo,
        costoAnteriorUSD: Number(p.costoUSD || 0),
        subtotalUSD: cant * costo
      }
    ]);

    setProdSeleccionadoId('');
    setCantIngreso('');
    setCostoUnitUSD('');
  };

  const quitarItemCompra = (idx) => {
    setCompraItems(prev => prev.filter((_, i) => i !== idx));
  };

  // 3. Procesar Factura de Compra
  const totalCompraUSD = compraItems.reduce((acc, it) => acc + it.subtotalUSD, 0);

  const procesarFacturaCompra = (e) => {
    e.preventDefault();
    if (!compraProvId) return alert('Selecciona el proveedor');
    if (compraItems.length === 0) return alert('Agrega al menos un producto a la compra');

    const provObj = proveedores.find(p => String(p.id) === String(compraProvId));

    const nuevaCompra = {
      id: 'cmp_' + Date.now(),
      facturaNro: compraFacturaNro.trim() || `FAC-${String(Date.now()).slice(-5)}`,
      proveedor: provObj || { nombre: 'Proveedor General' },
      fecha: new Date().toISOString(),
      fechaFormateada: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: compraItems,
      totalUSD: totalCompraUSD,
      totalBS: totalCompraUSD * tasa,
      esCredito: compraEsCredito,
      saldoPendienteUSD: compraEsCredito ? totalCompraUSD : 0,
      abonos: []
    };

    if (alRegistrarCompra) alRegistrarCompra(nuevaCompra);
    setCompraItems([]);
    setCompraFacturaNro('');
    setCompraProvId('');
    setCompraEsCredito(false);
    setModalNuevaCompra(false);
  };

  // 4. Registrar Abono a Proveedor
  const procesarAbono = (e) => {
    e.preventDefault();
    const abn = parseFloat(montoAbonoInput) || 0;
    if (abn <= 0) return alert('Monto inválido');
    if (abn > modalAbonoCompra.saldoPendienteUSD + 0.01) return alert('El abono no puede superar el saldo pendiente');

    if (alAbonarCompra) {
      alAbonarCompra(modalAbonoCompra.id, abn);
    }
    setModalAbonoCompra(null);
    setMontoAbonoInput('');
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* Cabecera */}
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Compras y Proveedores</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
            Recepción de mercancía y Cuentas por Pagar (CXP)
          </small>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => setModalNuevaCompra(true)} style={styles.btnAccionHeaderVerde}>
            <ShoppingCart size={14} />
            <span>+ Compra</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={styles.tabsFila}>
        <button
          type="button"
          onClick={() => setPestana('compras')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'compras' ? '#00b050' : 'transparent',
            color: pestana === 'compras' ? '#0f2a4a' : '#64748b'
          }}
        >
          <ShoppingCart size={15} />
          <span>Compras ({compras.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPestana('cxp')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'cxp' ? '#dc2626' : 'transparent',
            color: pestana === 'cxp' ? '#dc2626' : '#64748b'
          }}
        >
          <Clock size={15} />
          <span>Por Pagar ({comprasPendientes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPestana('proveedores')}
          style={{
            ...styles.btnTab,
            borderBottomColor: pestana === 'proveedores' ? '#0052cc' : 'transparent',
            color: pestana === 'proveedores' ? '#0052cc' : '#64748b'
          }}
        >
          <Truck size={15} />
          <span>Proveedores ({proveedores.length})</span>
        </button>
      </div>

      <main style={styles.cuerpo}>
        {/* RESUMEN DEUDA EN CXP */}
        {pestana === 'cxp' && (
          <div style={styles.tarjetaDeudaGlobal}>
            <span style={styles.etiquetaDeuda}>TOTAL DEUDA A PROVEEDORES (CXP)</span>
            <div style={styles.cifraDeudaUSD}>${totalDeudaProveedoresUSD.toFixed(2)}</div>
            <div style={styles.cifraDeudaBS}>Bs. {(totalDeudaProveedoresUSD * tasa).toFixed(2)}</div>
          </div>
        )}

        {/* PESTAÑA: COMPRAS REALIZADAS */}
        {pestana === 'compras' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {compras.length === 0 ? (
              <div style={styles.vacioBox}>
                <ShoppingCart size={40} color="#cbd5e1" />
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  No hay compras registradas. Pulsa <strong>+ Compra</strong> para ingresar mercancía.
                </p>
              </div>
            ) : (
              compras.map(c => (
                <div key={c.id} style={styles.cardCompra}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.86rem', color: '#0f2a4a' }}>Factura: {c.facturaNro}</strong>
                        {c.saldoPendienteUSD > 0.005 ? (
                          <span style={styles.badgePendiente}>Crédito Pendiente</span>
                        ) : (
                          <span style={styles.badgePagado}>Pagada</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#334155', marginTop: '2px' }}>
                        Proveedor: <strong>{c.proveedor?.nombre}</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {c.fechaFormateada} · {c.items?.length || 0} producto(s) cargados
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f2a4a' }}>
                        ${Number(c.totalUSD).toFixed(2)}
                      </div>
                      <small style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Bs. {(Number(c.totalUSD) * tasa).toFixed(2)}
                      </small>
                    </div>
                  </div>

                  {/* Detalle rápido de artículos */}
                  <div style={styles.cajaMiniItems}>
                    {c.items?.map((it, idx) => (
                      <span key={idx} style={styles.pillItem}>
                        {it.nombre} (+{it.cantidad}{it.esPesado ? 'kg' : 'u'} a ${it.costoUSD})
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PESTAÑA: CUENTAS POR PAGAR (CXP) */}
        {pestana === 'cxp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {comprasPendientes.length === 0 ? (
              <div style={styles.vacioBox}>
                <CheckCircle2 size={40} color="#00b050" />
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#00b050', fontWeight: 'bold' }}>
                  ¡Al día! No tienes facturas pendientes por pagar a proveedores.
                </p>
              </div>
            ) : (
              comprasPendientes.map(c => (
                <div key={c.id} style={styles.cardCxp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: '#0f2a4a' }}>{c.proveedor?.nombre}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Factura #{c.facturaNro} · {c.fechaFormateada}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <small style={{ color: '#dc2626', fontSize: '0.68rem', fontWeight: 'bold' }}>SALDO PENDIENTE</small>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#dc2626' }}>
                        ${Number(c.saldoPendienteUSD).toFixed(2)}
                      </div>
                      <small style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Bs. {(Number(c.saldoPendienteUSD) * tasa).toFixed(2)}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setModalAbonoCompra(c);
                        setMontoAbonoInput(c.saldoPendienteUSD.toFixed(2));
                      }}
                      style={styles.btnAbonarProveedor}
                    >
                      <DollarSign size={14} />
                      <span>Registrar Pago / Abono</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PESTAÑA: PROVEEDORES */}
        {pestana === 'proveedores' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button type="button" onClick={() => setModalNuevoProv(true)} style={styles.btnNuevoProveedorRow}>
              <Plus size={16} />
              <span>Registrar Nuevo Distribuidor / Proveedor</span>
            </button>

            {proveedores.length === 0 ? (
              <div style={styles.vacioBox}>
                <Truck size={40} color="#cbd5e1" />
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  No tienes proveedores registrados.
                </p>
              </div>
            ) : (
              proveedores.map(p => {
                const telLimpio = (p.telefono || '').replace(/[^0-9]/g, '');
                const waLink = telLimpio ? `https://wa.me/${telLimpio.startsWith('58') ? telLimpio : `58${telLimpio.replace(/^0/, '')}`}` : null;

                return (
                  <div key={p.id} style={styles.cardProveedor}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: '#0f2a4a' }}>{p.nombre}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>RIF: {p.rif}</div>
                        <div style={{ fontSize: '0.72rem', color: '#334155' }}>
                          Preventista: <strong>{p.vendedor}</strong> {p.telefono && `(${p.telefono})`}
                        </div>
                        <small style={{ color: '#0052cc', fontSize: '0.66rem', fontWeight: 'bold' }}>
                          Plazo Crédito: {p.diasCredito || 15} días
                        </small>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noreferrer" style={styles.btnWaMini} title="Pedir por WhatsApp">
                            <MessageCircle size={15} color="#00b050" />
                          </a>
                        )}
                        <button type="button" onClick={() => alEliminarProveedor(p.id)} style={styles.btnBorrarProv}>
                          <Trash2 size={15} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* MODAL: REGISTRAR NUEVO PROVEEDOR */}
      {modalNuevoProv && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBox}>
            <div style={styles.headerModalMini}>
              <strong style={{ fontSize: '0.9rem', color: '#0f2a4a' }}>Nuevo Proveedor</strong>
              <button type="button" onClick={() => setModalNuevoProv(false)} style={styles.btnCerrarX}><X size={16} /></button>
            </div>

            <form onSubmit={manejarGuardarProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={styles.labelMini}>Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  placeholder="Ej: Empresas Polar / Distribuidora JJ"
                  value={provNombre}
                  onChange={(e) => setProvNombre(e.target.value)}
                  style={styles.inputMini}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelMini}>RIF / Cédula</label>
                  <input
                    type="text"
                    placeholder="J-12345678-0"
                    value={provRif}
                    onChange={(e) => setProvRif(e.target.value)}
                    style={styles.inputMini}
                  />
                </div>
                <div>
                  <label style={styles.labelMini}>Plazo Crédito (Días)</label>
                  <input
                    type="number"
                    value={provDiasCredito}
                    onChange={(e) => setProvDiasCredito(e.target.value)}
                    style={styles.inputMini}
                  />
                </div>
              </div>

              <div>
                <label style={styles.labelMini}>Vendedor / Preventista Asignado</label>
                <input
                  type="text"
                  placeholder="Nombre de la persona que te visita"
                  value={provVendedor}
                  onChange={(e) => setProvVendedor(e.target.value)}
                  style={styles.inputMini}
                />
              </div>

              <div>
                <label style={styles.labelMini}>Teléfono de Pedidos (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="Ej: 04141234567"
                  value={provTelefono}
                  onChange={(e) => setProvTelefono(e.target.value)}
                  style={styles.inputMini}
                />
              </div>

              <button type="submit" style={styles.btnGuardarVerde}>
                Registrar Proveedor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COMPRA Y CARGA AUTOMÁTICA DE INVENTARIO */}
      {modalNuevaCompra && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBoxCompraGrande}>
            <div style={styles.headerModalMini}>
              <strong style={{ fontSize: '0.94rem', color: '#0f2a4a' }}>Recepción de Factura y Carga de Stock</strong>
              <button type="button" onClick={() => setModalNuevaCompra(false)} style={styles.btnCerrarX}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                <div>
                  <label style={styles.labelMini}>Proveedor Distribuidor *</label>
                  <select
                    value={compraProvId}
                    onChange={(e) => setCompraProvId(e.target.value)}
                    style={styles.inputMini}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.labelMini}>Nro Factura / Control</label>
                  <input
                    type="text"
                    placeholder="Ej: 001245"
                    value={compraFacturaNro}
                    onChange={(e) => setCompraFacturaNro(e.target.value)}
                    style={styles.inputMini}
                  />
                </div>
              </div>

              {/* Opción Crédito vs Contado */}
              <div 
                onClick={() => setCompraEsCredito(!compraEsCredito)}
                style={{
                  ...styles.cardSwitchCredito,
                  borderColor: compraEsCredito ? '#dc2626' : '#cbd5e1',
                  backgroundColor: compraEsCredito ? '#fef2f2' : '#f8fafc'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.76rem', color: compraEsCredito ? '#dc2626' : '#0f2a4a', display: 'block' }}>
                    {compraEsCredito ? 'Mercancía recibida a Crédito (Por Pagar)' : 'Mercancía pagada de contado'}
                  </strong>
                  <small style={{ fontSize: '0.64rem', color: '#64748b' }}>
                    {compraEsCredito ? 'Se registrará en Cuentas por Pagar (CXP)' : 'Se asume liquidada al instante'}
                  </small>
                </div>
                <input type="checkbox" checked={compraEsCredito} onChange={() => {}} style={{ accentColor: '#dc2626' }} />
              </div>

              {/* Selector de Producto a Ingresar */}
              <div style={styles.boxAgregarProdACompra}>
                <label style={styles.labelMini}>Agregar Producto del Catálogo</label>
                <select
                  value={prodSeleccionadoId}
                  onChange={(e) => {
                    setProdSeleccionadoId(e.target.value);
                    const sel = productos.find(x => String(x.id) === String(e.target.value));
                    if (sel) setCostoUnitUSD(String(sel.costoUSD || 0));
                  }}
                  style={styles.inputMini}
                >
                  <option value="">-- Selecciona producto --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock})</option>
                  ))}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px', marginTop: '6px' }}>
                  <div>
                    <small style={styles.labelMini}>Cantidad entrante</small>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 24"
                      value={cantIngreso}
                      onChange={(e) => setCantIngreso(e.target.value)}
                      style={styles.inputMini}
                    />
                  </div>
                  <div>
                    <small style={styles.labelMini}>Costo unitario ($)</small>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={costoUnitUSD}
                      onChange={(e) => setCostoUnitUSD(e.target.value)}
                      style={styles.inputMini}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="button" onClick={agregarItemCompra} style={styles.btnMasItem}>
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de productos en esta factura */}
              <div style={styles.listaItemsCompraCargados}>
                <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                  PRODUCTOS A CARGAR EN INVENTARIO ({compraItems.length}):
                </div>
                {compraItems.length === 0 ? (
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                    Agrega los productos que llegaron en la factura arriba.
                  </div>
                ) : (
                  compraItems.map((it, idx) => (
                    <div key={idx} style={styles.filaItemCargado}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.78rem', color: '#0f2a4a' }}>{it.nombre}</strong>
                        <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                          +{it.cantidad}{it.esPesado ? 'kg' : 'u'} x ${it.costoUSD.toFixed(2)}
                          {it.costoUSD > it.costoAnteriorUSD && (
                            <span style={{ color: '#ea580c', fontWeight: 'bold', marginLeft: '4px' }}>
                              (Subió de ${it.costoAnteriorUSD})
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>${it.subtotalUSD.toFixed(2)}</strong>
                      </div>
                      <button type="button" onClick={() => quitarItemCompra(idx)} style={styles.btnQuitarMini}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Factura y Botón Confirmar */}
            <div style={styles.footerFacturaCompra}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL FACTURA:</span>
                <strong style={{ fontSize: '1.25rem', color: '#00b050' }}>${totalCompraUSD.toFixed(2)}</strong>
              </div>
              <button type="button" onClick={procesarFacturaCompra} style={styles.btnGuardarVerde}>
                Guardar Factura y Actualizar Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR ABONO A CXP */}
      {modalAbonoCompra && (
        <div style={styles.overlayModal}>
          <div style={styles.modalBox}>
            <div style={styles.headerModalMini}>
              <strong style={{ fontSize: '0.9rem', color: '#0f2a4a' }}>Abono a Proveedor</strong>
              <button type="button" onClick={() => setModalAbonoCompra(null)} style={styles.btnCerrarX}><X size={16} /></button>
            </div>

            <form onSubmit={procesarAbono} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.74rem', color: '#334155' }}>
                Proveedor: <strong>{modalAbonoCompra.proveedor?.nombre}</strong>
                <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '2px' }}>
                  Deuda Pendiente: ${modalAbonoCompra.saldoPendienteUSD.toFixed(2)} (Bs. {(modalAbonoCompra.saldoPendienteUSD * tasa).toFixed(2)})
                </div>
              </div>

              <div>
                <label style={styles.labelMini}>Monto a Abonar (USD $) *</label>
                <input
                  type="number"
                  step="any"
                  value={montoAbonoInput}
                  onChange={(e) => setMontoAbonoInput(e.target.value)}
                  style={styles.inputMini}
                  required
                />
                <small style={{ fontSize: '0.64rem', color: '#64748b' }}>
                  Equivale a Bs. {((parseFloat(montoAbonoInput) || 0) * tasa).toFixed(2)}
                </small>
              </div>

              <button type="submit" style={styles.btnGuardarVerde}>
                Registrar Pago de Factura
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
  btnAccionHeaderVerde: {
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
    fontSize: '0.76rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
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
  tarjetaDeudaGlobal: {
    backgroundColor: '#0f2a4a',
    borderRadius: '16px',
    padding: '14px',
    color: '#fff',
    boxShadow: '0 4px 14px rgba(15, 42, 74, 0.15)',
    textAlign: 'center'
  },
  etiquetaDeuda: {
    fontSize: '0.66rem',
    fontWeight: '800',
    letterSpacing: '0.8px',
    color: '#fca5a5'
  },
  cifraDeudaUSD: {
    fontSize: '1.75rem',
    fontWeight: '900',
    color: '#ef4444',
    lineHeight: 1.1,
    margin: '3px 0'
  },
  cifraDeudaBS: {
    fontSize: '0.86rem',
    fontWeight: '700',
    color: '#fecaca'
  },
  vacioBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#94a3b8',
    textAlign: 'center',
    padding: '0 16px'
  },
  cardCompra: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  badgePendiente: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #fecaca'
  },
  badgePagado: {
    backgroundColor: '#f0fdf4',
    color: '#00b050',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #bbf7d0'
  },
  cajaMiniItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '4px',
    paddingTop: '6px',
    borderTop: '1px dashed #f1f5f9'
  },
  pillItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '2px 6px',
    fontSize: '0.66rem',
    color: '#475569'
  },
  cardCxp: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #fecaca',
    borderLeft: '4px solid #dc2626',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  btnAbonarProveedor: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnNuevoProveedorRow: {
    padding: '10px',
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    border: '1px dashed #bfdbfe',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  cardProveedor: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #e2e8f0'
  },
  btnWaMini: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none'
  },
  btnBorrarProv: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  overlayModal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    zIndex: 99999999
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    maxWidth: '350px',
    width: '100%',
    padding: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
  },
  modalBoxCompraGrande: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    maxWidth: '380px',
    width: '100%',
    height: '90vh',
    padding: '14px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  headerModalMini: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
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
  labelMini: {
    fontSize: '0.68rem',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '2px',
    display: 'block'
  },
  inputMini: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 9px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  cardSwitchCredito: {
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer'
  },
  boxAgregarProdACompra: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '8px',
    border: '1px solid #e2e8f0'
  },
  btnMasItem: {
    padding: '7px 10px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  listaItemsCompraCargados: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '8px',
    flex: 1,
    overflowY: 'auto'
  },
  filaItemCargado: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 0',
    borderBottom: '1px solid #f1f5f9'
  },
  btnQuitarMini: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  footerFacturaCompra: {
    paddingTop: '8px',
    borderTop: '1px solid #e2e8f0',
    marginTop: '6px'
  },
  btnGuardarVerde: {
    width: '100%',
    padding: '11px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.84rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(0, 176, 80, 0.3)'
  }
};
