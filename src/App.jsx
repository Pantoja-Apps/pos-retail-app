import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, Camera, Trash2, Plus, Minus, DollarSign, X, 
  RefreshCw, Package, User, BookOpen, Wallet, Search, History, 
  PauseCircle, PlayCircle 
} from 'lucide-react';

import ScannerModal from './components/ScannerModal';
import ModalCobro from './components/ModalCobro';
import TicketModal from './components/TicketModal';
import InventarioModal from './components/InventarioModal';
import CreditosModal from './components/CreditosModal';
import CajaModal from './components/CajaModal';
import HistorialModal from './components/HistorialModal';

const PRODUCTOS_INICIALES = [
  { id: 1, codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', precioUSD: 1.10, stock: 50, imagen: '' },
  { id: 2, codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', precioUSD: 1.35, stock: 40, imagen: '' },
  { id: 3, codigo: '7591003000789', nombre: 'Pasta Corta Plumitas 500g', precioUSD: 0.95, stock: 60, imagen: '' },
  { id: 4, codigo: '7591004000321', nombre: 'Aceite Mazeite 1L', precioUSD: 3.20, stock: 25, imagen: '' },
  { id: 5, codigo: '7591005000654', nombre: 'Azúcar Montalbán 1kg', precioUSD: 1.25, stock: 30, imagen: '' },
  { id: 6, codigo: '7591472015188', nombre: 'Spray Aclarante Farmatodo', precioUSD: 4.50, stock: 15, imagen: '' },
];

const CLIENTES_INICIALES = [
  { id: 1, doc: 'V-00000000', nombre: 'Consumidor Final', telefono: '', saldoPendienteUSD: 0 },
  { id: 2, doc: 'V-22033378', nombre: 'Jetzabel Gonzalez', telefono: '584120000000', saldoPendienteUSD: 0 }
];

function normalizarDoc(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function App() {
  const [vistaActual, setVistaActual] = useState('pos');
  
  const [productos, setProductos] = useState(() => {
    try {
      const g = localStorage.getItem('pos_prods_final');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return PRODUCTOS_INICIALES;
  });

  const [clientes, setClientes] = useState(() => {
    try {
      const g = localStorage.getItem('pos_clis_final');
      if (g) {
        const parseados = JSON.parse(g);
        // Garantizar unicidad por documento al arrancar
        const unicos = [];
        const docsVistos = new Set();
        for (const c of parseados) {
          const docNorm = normalizarDoc(c.doc);
          if (!docsVistos.has(docNorm)) {
            docsVistos.add(docNorm);
            unicos.push(c);
          }
        }
        return unicos;
      }
    } catch (e) {}
    return CLIENTES_INICIALES;
  });

  const [transacciones, setTransacciones] = useState(() => {
    try {
      const g = localStorage.getItem('pos_txs_final');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });

  const [cuentasEnEspera, setCuentasEnEspera] = useState(() => {
    try {
      const g = localStorage.getItem('pos_espera_final');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });

  const [clienteActual, setClienteActual] = useState(CLIENTES_INICIALES[0]);
  const [tasaCambio, setTasaCambio] = useState(45.50);
  const [carrito, setCarrito] = useState([]);
  const [busquedaInput, setBusquedaInput] = useState('');
  const [mostrarPredictivo, setMostrarPredictivo] = useState(false);
  
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [modalEsperaAbierto, setModalEsperaAbierto] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [onScanCallback, setOnScanCallback] = useState(null);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => { try { localStorage.setItem('pos_prods_final', JSON.stringify(productos)); } catch (e) {} }, [productos]);
  useEffect(() => { try { localStorage.setItem('pos_clis_final', JSON.stringify(clientes)); } catch (e) {} }, [clientes]);
  useEffect(() => { try { localStorage.setItem('pos_txs_final', JSON.stringify(transacciones)); } catch (e) {} }, [transacciones]);
  useEffect(() => { try { localStorage.setItem('pos_espera_final', JSON.stringify(cuentasEnEspera)); } catch (e) {} }, [cuentasEnEspera]);

  const obtenerTasaBCV = async () => {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        if (data.promedio) setTasaCambio(data.promedio);
      }
    } catch (e) {}
  };

  useEffect(() => {
    obtenerTasaBCV();
    function handleClickAfuera(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setMostrarPredictivo(false);
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const agregarProductoAlCarrito = (prod) => {
    setCarrito(actual => {
      const existe = actual.find(item => item.id === prod.id);
      if (existe) return actual.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...actual, { ...prod, cantidad: 1 }];
    });
    setBusquedaInput('');
    setMostrarPredictivo(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const procesarBusquedaOEnter = (e) => {
    if (e) e.preventDefault();
    const limpio = busquedaInput.trim().toLowerCase();
    if (!limpio) return;

    const coincidenciaExactaCodigo = productos.find(p => p.codigo === busquedaInput.trim());
    if (coincidenciaExactaCodigo) {
      agregarProductoAlCarrito(coincidenciaExactaCodigo);
      return;
    }

    const coincidenciaNombre = productos.find(p => p.nombre.toLowerCase().includes(limpio) || p.codigo.includes(limpio));
    if (coincidenciaNombre) {
      agregarProductoAlCarrito(coincidenciaNombre);
    } else {
      alert('Producto o código "' + busquedaInput + '" no encontrado.');
    }
  };

  const suspenderCuentaActual = () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    setCuentasEnEspera(prev => [{
      id: Date.now(),
      fecha: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
      cliente: { ...clienteActual },
      items: [...carrito]
    }, ...prev]);
    setCarrito([]);
    setClienteActual(CLIENTES_INICIALES[0]);
  };

  const recuperarCuentaEnEspera = (cuenta) => {
    setCuentasEnEspera(prev => {
      const resto = prev.filter(c => c.id !== cuenta.id);
      if (carrito.length > 0) {
        return [{
          id: Date.now(),
          fecha: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
          cliente: { ...clienteActual },
          items: [...carrito]
        }, ...resto];
      }
      return resto;
    });
    setClienteActual({ ...cuenta.cliente });
    setCarrito([...cuenta.items]);
    setModalEsperaAbierto(false);
  };

  const descartarCuentaEnEspera = (id) => {
    if (confirm('¿Deseas descartar esta cuenta en espera?')) {
      setCuentasEnEspera(prev => prev.filter(c => c.id !== id));
    }
  };

  // REGISTRO DE ABONO ROBUSTO: Identifica por documento normalizado o ID exacto sin duplicar
  const registrarAbonoCliente = (clienteObj, montoAbonadoUSD, desglose) => {
    const docTarget = normalizarDoc(clienteObj.doc);
    
    setClientes(prev => {
      return prev.map(c => {
        const coincide = normalizarDoc(c.doc) === docTarget || c.id === clienteObj.id;
        if (coincide) {
          const saldoPrevio = parseFloat(c.saldoPendienteUSD) || 0;
          const nuevoSaldo = Math.max(0, saldoPrevio - montoAbonadoUSD);
          return { ...c, saldoPendienteUSD: nuevoSaldo };
        }
        return c;
      });
    });

    setTransacciones(prev => [{
      id: Date.now().toString().slice(-6),
      tipo: 'abono',
      cliente: clienteObj.nombre,
      doc: clienteObj.doc,
      fecha: new Date().toLocaleString('es-VE'),
      pagoUSD: desglose.pagoUSD,
      pagoPM: desglose.pagoPM,
      pagoPunto: desglose.pagoPunto,
      totalAbonoUSD: montoAbonadoUSD
    }, ...prev]);
  };

  const finalizarVenta = (datos) => {
    const idTicket = Math.floor(100000 + Math.random() * 900000);
    const nuevoTicket = { id: idTicket, items: [...carrito], ...datos };

    setTransacciones(prev => [{ id: idTicket, tipo: 'venta', ...datos, items: [...carrito] }, ...prev]);

    if (datos.esCredito && parseFloat(datos.saldoDeudaUSD) > 0) {
      setClientes(actuales => {
        const nTarget = normalizarDoc(datos.cliente.doc);
        const index = actuales.findIndex(c => normalizarDoc(c.doc) === nTarget);
        const incremento = parseFloat(datos.saldoDeudaUSD);
        if (index >= 0) {
          const act = [...actuales];
          act[index] = { 
            ...act[index], 
            nombre: datos.cliente.nombre || act[index].nombre,
            telefono: datos.cliente.telefono || act[index].telefono,
            saldoPendienteUSD: (act[index].saldoPendienteUSD || 0) + incremento 
          };
          return act;
        }
        return [...actuales, { id: Date.now(), ...datos.cliente, saldoPendienteUSD: incremento }];
      });
    }

    setProductos(prods => prods.map(p => {
      const itemVendido = carrito.find(it => it.id === p.id);
      return itemVendido ? { ...p, stock: Math.max(0, (p.stock || 0) - itemVendido.cantidad) } : p;
    }));

    setCarrito([]);
    setClienteActual(CLIENTES_INICIALES[0]);
    setModalCobroAbierto(false);
    setTicketModalData(nuevoTicket);
  };

  const anularVenta = (venta) => {
    if (!confirm(`¿Confirmas anular la factura #${venta.id}? Se repondrá la mercancía al inventario.`)) return;

    setProductos(prods => prods.map(p => {
      const dev = (venta.items || []).find(it => it.id === p.id);
      return dev ? { ...p, stock: (p.stock || 0) + dev.cantidad } : p;
    }));

    if (venta.esCredito && parseFloat(venta.saldoDeudaUSD) > 0) {
      setClientes(clis => clis.map(c => {
        if (normalizarDoc(c.doc) === normalizarDoc(venta.cliente?.doc)) {
          return { ...c, saldoPendienteUSD: Math.max(0, (c.saldoPendienteUSD || 0) - parseFloat(venta.saldoDeudaUSD)) };
        }
        return c;
      }));
    }

    setTransacciones(txs => txs.map(t => t.id === venta.id ? { ...t, anulada: true } : t));
    alert(`Factura #${venta.id} anulada.`);
  };

  const tasaNum = parseFloat(tasaCambio) || 1;
  const totalUSD = carrito.reduce((acc, p) => acc + (p.precioUSD * p.cantidad), 0);
  const totalBS = totalUSD * tasaNum;
  
  // Clientes únicos con saldo moroso
  const clientesMorosos = clientes.filter(c => (parseFloat(c.saldoPendienteUSD) || 0) > 0.01).length;
  const productosSugeridos = busquedaInput.trim().length > 0 
    ? productos.filter(p => p.nombre.toLowerCase().includes(busquedaInput.trim().toLowerCase()) || p.codigo.includes(busquedaInput.trim())).slice(0, 5) 
    : [];

  const clienteEncontrado = clientes.find(c => {
    const cDoc = normalizarDoc(c.doc);
    const currDoc = normalizarDoc(clienteActual.doc);
    return cDoc === currDoc || (currDoc.length >= 6 && (cDoc.endsWith(currDoc) || currDoc.endsWith(cDoc)));
  });
  const saldoActualMostrador = clienteEncontrado ? (clienteEncontrado.saldoPendienteUSD || 0) : (clienteActual.saldoPendienteUSD || 0);

  return (
    <div style={styles.contenedor} translate="no">
      {vistaActual === 'inventario' && (
        <InventarioModal 
          productos={productos}
          alGuardarProducto={(p) => setProductos(prev => {
            const idx = prev.findIndex(item => item.id === p.id);
            if (idx >= 0) { const cp = [...prev]; cp[idx] = p; return cp; }
            return [...prev, p];
          })}
          alEliminarProducto={(id) => {
            if (confirm('¿Eliminar producto?')) setProductos(prev => prev.filter(p => p.id !== id));
          }}
          alVolver={() => setVistaActual('pos')}
          alAbrirCamara={(cb) => { setOnScanCallback(() => cb); setCamaraAbierta(true); }}
        />
      )}

      {vistaActual === 'creditos' && (
        <CreditosModal 
          clientes={clientes}
          tasaCambio={tasaCambio}
          alRegistrarAbono={registrarAbonoCliente}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'caja' && (
        <CajaModal 
          transacciones={transacciones}
          tasaCambio={tasaCambio}
          alCerrarTurno={() => { setTransacciones([]); try { localStorage.removeItem('pos_txs_final'); } catch (e) {} }}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'historial' && (
        <HistorialModal 
          transacciones={transacciones}
          tasaCambio={tasaCambio}
          alVerTicket={(t) => setTicketModalData(t)}
          alAnularVenta={anularVenta}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'pos' && (
        <>
          <header style={styles.header}>
            <div>
              <h1 style={styles.titulo}>Punto de Venta POS</h1>
              <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setVistaActual('inventario')} style={styles.btnNav}><Package size={13} /> Inventario</button>
                <button type="button" onClick={() => setVistaActual('creditos')} style={{ ...styles.btnNav, backgroundColor: clientesMorosos > 0 ? '#fff3e0' : '#e6f0ff', color: clientesMorosos > 0 ? '#e65100' : '#0052cc' }}>
                  <BookOpen size={13} /> Créditos {clientesMorosos > 0 ? `(${clientesMorosos})` : ''}
                </button>
                <button type="button" onClick={() => setVistaActual('caja')} style={{ ...styles.btnNav, backgroundColor: '#e8f5e9', color: '#2e7d32' }}><Wallet size={13} /> Caja</button>
                <button type="button" onClick={() => setVistaActual('historial')} style={{ ...styles.btnNav, backgroundColor: '#f3e5f5', color: '#6f42c1' }}><History size={13} /> Ventas</button>
              </div>
            </div>
            <div style={styles.boxTasa}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#555' }}>Tasa BCV (Bs):</span>
                <button type="button" onClick={obtenerTasaBCV} style={styles.btnSyncTasa}><RefreshCw size={12} /></button>
              </div>
              <input type="number" step="any" value={tasaCambio} onChange={(e) => setTasaCambio(e.target.value)} style={styles.inputTasa} />
            </div>
          </header>

          <section style={styles.barraClienteMostrador}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <User color="#0052cc" size={16} />
              <input
                type="text"
                placeholder="Cédula cliente (ej: 24808845)..."
                value={clienteActual.doc === 'V-00000000' ? '' : clienteActual.doc}
                onChange={(e) => {
                  const valor = e.target.value;
                  const inLimpio = normalizarDoc(valor);
                  const encontrado = clientes.find(c => {
                    const cLimpio = normalizarDoc(c.doc);
                    return cLimpio === inLimpio || (inLimpio.length >= 6 && (cLimpio.endsWith(inLimpio) || inLimpio.endsWith(cLimpio)));
                  });

                  if (encontrado) {
                    setClienteActual({ ...encontrado });
                  } else {
                    setClienteActual(prev => ({ ...prev, doc: valor, nombre: valor ? 'Cliente Nuevo' : 'Consumidor Final', saldoPendienteUSD: 0 }));
                  }
                }}
                style={styles.inputDocMostrador}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={styles.nombreClienteTag}>{clienteActual.nombre}</span>
              {saldoActualMostrador > 0 && (
                <div style={{ fontSize: '0.68rem', color: '#c62828', fontWeight: 'bold' }}>Debe: ${saldoActualMostrador.toFixed(2)}</div>
              )}
            </div>
          </section>

          <section style={styles.seccionBuscador}>
            <div ref={wrapperRef} style={{ position: 'relative', flex: 1, display: 'flex', gap: '6px' }}>
              <form onSubmit={procesarBusquedaOEnter} style={{ display: 'flex', flex: 1, gap: '6px' }}>
                <div style={styles.inputIconWrapper}>
                  <Search color="#666" size={18} style={styles.iconoInput} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escribe nombre o código..."
                    value={busquedaInput}
                    onChange={(e) => { setBusquedaInput(e.target.value); setMostrarPredictivo(true); }}
                    onFocus={() => setMostrarPredictivo(true)}
                    style={styles.inputBuscador}
                  />
                </div>
                <button type="submit" style={styles.btnAgregar}>Ingresar</button>
              </form>

              {mostrarPredictivo && productosSugeridos.length > 0 && (
                <div style={styles.dropdownPredictivo}>
                  {productosSugeridos.map(p => (
                    <div key={p.id} onClick={() => agregarProductoAlCarrito(p)} style={styles.itemPredictivo}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#111' }}>{p.nombre}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Cód: {p.codigo} | Stock: {p.stock || 0}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#28a745' }}>${p.precioUSD.toFixed(2)}</span>
                        <small style={{ display: 'block', fontSize: '0.68rem', color: '#555' }}>Bs. {(p.precioUSD * tasaNum).toFixed(2)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={() => { setOnScanCallback(null); setCamaraAbierta(true); }} style={styles.btnCamara}>
              <Camera size={19} />
              <span style={{ fontSize: '0.8rem', marginLeft: '5px', fontWeight: '600' }}>Cámara</span>
            </button>
          </section>

          <main style={styles.seccionCarrito}>
            {carrito.length === 0 ? (
              <div style={styles.carritoVacio}>
                <Barcode color="#ccd0d5" size={54} />
                <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>La caja está vacía. Escanea o busca un producto.</p>
              </div>
            ) : (
              <div style={styles.listaItems}>
                {carrito.map((item) => {
                  const subtotalUSD = item.precioUSD * item.cantidad;
                  const subtotalBS = subtotalUSD * tasaNum;
                  return (
                    <div key={item.id} style={styles.itemFila}>
                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#222' }}>{item.nombre}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>${item.precioUSD.toFixed(2)} | Bs. {(item.precioUSD * tasaNum).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                        <button type="button" onClick={() => setCarrito(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad - 1 } : i).filter(i => i.cantidad > 0))} style={styles.btnCant}><Minus size={14}/></button>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.cantidad}</span>
                        <button type="button" onClick={() => setCarrito(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))} style={styles.btnCant}><Plus size={14}/></button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                        <strong style={{ fontSize: '0.95rem', color: '#111' }}>${subtotalUSD.toFixed(2)}</strong>
                        <small style={{ color: '#666', fontSize: '0.75rem' }}>Bs. {subtotalBS.toFixed(2)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          <footer style={styles.footer}>
            <div style={styles.filaTotales}>
              <div><span style={{ fontSize: '0.8rem', color: '#666' }}>Total Bolívares:</span><div style={styles.totalBs}>Bs. {totalBS.toFixed(2)}</div></div>
              <div style={{ textAlign: 'right' }}><span style={{ fontSize: '0.8rem', color: '#666' }}>Total Divisa:</span><div style={styles.totalUsd}>${totalUSD.toFixed(2)}</div></div>
            </div>

            <div style={styles.botonesAccion}>
              <button type="button" onClick={() => { setCarrito([]); setClienteActual(CLIENTES_INICIALES[0]); }} style={styles.btnLimpiar}><Trash2 size={18} /></button>
              <button type="button" onClick={suspenderCuentaActual} style={styles.btnPausar}><PauseCircle size={18} /><span style={{ fontSize: '0.78rem', marginLeft: '4px', fontWeight: 'bold' }}>En Espera</span></button>
              {cuentasEnEspera.length > 0 && (
                <button type="button" onClick={() => setModalEsperaAbierto(true)} style={styles.btnVerEspera}><PlayCircle size={18} /><span style={{ fontSize: '0.78rem', marginLeft: '4px', fontWeight: 'bold' }}>({cuentasEnEspera.length})</span></button>
              )}
              <button type="button" onClick={() => { if (carrito.length === 0) return alert('El carrito está vacío'); setModalCobroAbierto(true); }} style={styles.btnCobrar}><DollarSign size={20} /> Cobrar Orden</button>
            </div>
          </footer>
        </>
      )}

      {modalEsperaAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div><h3 style={{ margin: 0, fontSize: '1rem' }}>Cuentas en Espera</h3><small style={{ color: '#666' }}>Selecciona para reanudar el cobro</small></div>
              <button type="button" onClick={() => setModalEsperaAbierto(false)} style={styles.btnCerrar}><X size={18}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh', overflowY: 'auto' }}>
              {cuentasEnEspera.map(c => {
                const totalCUSD = c.items.reduce((acc, it) => acc + (it.precioUSD * it.cantidad), 0);
                return (
                  <div key={c.id} style={styles.itemEsperaCard}>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>{c.cliente?.nombre || 'Consumidor Final'}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#666' }}>Pausada: {c.fecha} • {c.items.length} productos</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#28a745', marginTop: '2px' }}>${totalCUSD.toFixed(2)} (Bs. {(totalCUSD * tasaNum).toFixed(2)})</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => recuperarCuentaEnEspera(c)} style={{ ...styles.btnMini, backgroundColor: '#0052cc', color: '#fff' }}>Reanudar</button>
                      <button type="button" onClick={() => descartarCuentaEnEspera(c.id)} style={{ ...styles.btnMini, backgroundColor: '#ffebee', color: '#c62828' }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ModalCobro 
        abierto={modalCobroAbierto}
        alCerrar={() => setModalCobroAbierto(false)}
        totalUSD={totalUSD.toFixed(2)}
        totalBS={totalBS.toFixed(2)}
        tasaCambio={tasaCambio}
        clienteActual={clienteActual}
        setClienteActual={setClienteActual}
        clientes={clientes}
        guardarClienteEnDB={(cli) => {
          setClientes(prev => {
            const docNorm = normalizarDoc(cli.doc);
            const idx = prev.findIndex(c => normalizarDoc(c.doc) === docNorm);
            if (idx >= 0) {
              const cp = [...prev];
              cp[idx] = { ...cp[idx], ...cli };
              return cp;
            }
            return [...prev, cli];
          });
        }}
        alFinalizarVenta={finalizarVenta}
      />

      <TicketModal 
        ticket={ticketModalData}
        alCerrar={() => setTicketModalData(null)}
      />

      <ScannerModal 
        abierto={camaraAbierta}
        alDetectar={(cod) => {
          if (onScanCallback) {
            onScanCallback(cod);
          } else {
            const prod = productos.find(p => p.codigo === cod);
            if (prod) agregarProductoAlCarrito(prod);
            else alert('Código no encontrado: ' + cod);
          }
        }}
        alCerrar={() => setCamaraAbierta(false)}
      />
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f6f8' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e4e8' },
  titulo: { margin: 0, fontSize: '1.05rem', color: '#111' },
  btnNav: { background: '#e6f0ff', color: '#0052cc', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  boxTasa: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  btnSyncTasa: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#0052cc' },
  inputTasa: { width: '85px', padding: '4px 6px', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', outline: 'none' },
  barraClienteMostrador: { backgroundColor: '#fff', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', gap: '10px' },
  inputDocMostrador: { border: 'none', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 'bold', width: '170px', outline: 'none' },
  nombreClienteTag: { fontSize: '0.78rem', color: '#334155', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  seccionBuscador: { padding: '10px 16px', backgroundColor: '#fff', display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8' },
  inputIconWrapper: { position: 'relative', flex: 1 },
  iconoInput: { position: 'absolute', left: '10px', top: '10px' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '9px 10px 9px 34px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' },
  dropdownPredictivo: { position: 'absolute', top: '44px', left: 0, right: 0, backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 100, border: '1px solid #e1e4e8', overflow: 'hidden' },
  itemPredictivo: { padding: '8px 12px', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  btnAgregar: { padding: '0 14px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
  btnCamara: { display: 'flex', alignItems: 'center', backgroundColor: '#20c997', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' },
  seccionCarrito: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  carritoVacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' },
  listaItems: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemFila: { backgroundColor: '#fff', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: '10px' },
  btnCant: { width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  footer: { backgroundColor: '#fff', padding: '14px 16px 32px 16px', borderTop: '1px solid #e1e4e8', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' },
  filaTotales: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  totalBs: { fontSize: '1.25rem', fontWeight: 'bold', color: '#0052cc' },
  totalUsd: { fontSize: '1.25rem', fontWeight: 'bold', color: '#28a745' },
  botonesAccion: { display: 'flex', gap: '8px' },
  btnLimpiar: { backgroundColor: '#ffebe6', border: 'none', color: '#de350b', borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPausar: { backgroundColor: '#fff3e0', border: 'none', color: '#e65100', borderRadius: '8px', padding: '12px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnVerEspera: { backgroundColor: '#e6f0ff', border: 'none', color: '#0052cc', borderRadius: '8px', padding: '12px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnCobrar: { flex: 1, backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' },
  modalBox: { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '350px', padding: '16px' },
  btnCerrar: { background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemEsperaCard: { backgroundColor: '#f8f9fa', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' },
  btnMini: { border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }
};
