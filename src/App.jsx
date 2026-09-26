import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, Camera, Trash2, Plus, Minus, DollarSign, X, 
  RefreshCw, Package, User, BookOpen, Wallet, Search, History, 
  PauseCircle, PlayCircle, Settings, Store, TrendingUp, Tag, Percent,
  LogOut, Users, ShieldCheck, UserCheck, Cloud, CloudOff, AlertOctagon, PhoneCall, PartyPopper, CheckCircle2, Sparkles
} from 'lucide-react';

import ScannerModal from './components/ScannerModal';
import ModalCobro from './components/ModalCobro';
import TicketModal from './components/TicketModal';
import InventarioModal from './components/InventarioModal';
import CreditosModal from './components/CreditosModal';
import CajaModal from './components/CajaModal';
import HistorialModal from './components/HistorialModal';
import ConfiguracionModal from './components/ConfiguracionModal';
import MetricasModal from './components/MetricasModal';
import LoginModal from './components/LoginModal';
import UsuariosModal from './components/UsuariosModal';
import { apiService } from './services/api';

const PRODUCTOS_INICIALES = [
  { id: 1, codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', costoUSD: 0.92, precioUSD: 1.10, aplicaPrecioMayor: true, precioMayorUSD: 0.98, cantMinimaMayor: 3, stock: 50, categoria: 'Víveres', imagen: '' },
  { id: 2, codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', costoUSD: 1.05, precioUSD: 1.35, aplicaPrecioMayor: true, precioMayorUSD: 1.20, cantMinimaMayor: 3, stock: 40, categoria: 'Víveres', imagen: '' },
  { id: 3, codigo: '7591003000789', nombre: 'Pasta Corta Plumitas 500g', costoUSD: 0.75, precioUSD: 0.95, aplicaPrecioMayor: true, precioMayorUSD: 0.85, cantMinimaMayor: 4, stock: 60, categoria: 'Víveres', imagen: '' },
  { id: 4, codigo: '7591004000321', nombre: 'Aceite Mazeite 1L', costoUSD: 2.55, precioUSD: 3.20, aplicaPrecioMayor: false, precioMayorUSD: 0, cantMinimaMayor: 0, stock: 25, categoria: 'Víveres', imagen: '' },
  { id: 5, codigo: '7591005000654', nombre: 'Azúcar Montalbán 1kg', costoUSD: 0.98, precioUSD: 1.25, aplicaPrecioMayor: false, precioMayorUSD: 0, cantMinimaMayor: 0, stock: 30, categoria: 'Víveres', imagen: '' },
  { id: 6, codigo: '7591472015188', nombre: 'Spray Aclarante Farmatodo', costoUSD: 3.30, precioUSD: 4.50, aplicaPrecioMayor: false, precioMayorUSD: 0, cantMinimaMayor: 0, stock: 15, categoria: 'Higiene Personal', imagen: '' },
];

const CLIENTES_INICIALES = [
  { id: 1, doc: 'V-00000000', nombre: 'Consumidor Final', telefono: '', saldoPendienteUSD: 0, historialCreditos: [], historialAbonos: [] },
  { id: 2, doc: 'V-22033378', nombre: 'Jetzabel Gonzalez', telefono: '584120000000', saldoPendienteUSD: 0, historialCreditos: [], historialAbonos: [] }
];

const CONFIG_INICIAL = {
  nombre: 'Mi Bodega POS',
  rif: 'J-50000000-0',
  direccion: 'Caracas, Venezuela',
  telefono: '0412-0000000',
  mensajePie: '¡Gracias por su compra! Revise su mercancía',
  logo: '',
  margenDefault: 30
};

function normalizarDoc(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function App() {
  const [vistaActual, setVistaActual] = useState('pos');
  const [onlineBackend, setOnlineBackend] = useState(false);
  const [licenciaBloqueada, setLicenciaBloqueada] = useState(false);
  const [modalReactivado, setModalReactivado] = useState(false);
  const [infoLicencia, setInfoLicencia] = useState(null);

  const prevBloqueadaRef = useRef(false);
  const prevVenceRef = useRef(null);

  const [cuentaMaster, setCuentaMaster] = useState(() => {
    try {
      const g = localStorage.getItem('pos_cuenta_dueno');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return null;
  });

  const [usuarioActivo, setUsuarioActivo] = useState(() => {
    try {
      const g = localStorage.getItem('pos_usuario_activo');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return null;
  });

  const [cajeros, setCajeros] = useState(() => {
    try {
      const g = localStorage.getItem('pos_cajeros_lista');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });
  
  const [configEmpresa, setConfigEmpresa] = useState(() => {
    try {
      const g = localStorage.getItem('pos_config_empresa');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return CONFIG_INICIAL;
  });

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

  const [historicoVentasGlobal, setHistoricoVentasGlobal] = useState(() => {
    try {
      const g = localStorage.getItem('pos_historico_ventas_global');
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

  const [modalDescuentoAbierto, setModalDescuentoAbierto] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState('monto');
  const [valorDescuento, setValorDescuento] = useState('');
  
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [modalEsperaAbierto, setModalEsperaAbierto] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [onScanCallback, setOnScanCallback] = useState(null);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => { try { localStorage.setItem('pos_cuenta_dueno', JSON.stringify(cuentaMaster)); } catch (e) {} }, [cuentaMaster]);
  useEffect(() => { try { localStorage.setItem('pos_usuario_activo', JSON.stringify(usuarioActivo)); } catch (e) {} }, [usuarioActivo]);
  useEffect(() => { try { localStorage.setItem('pos_cajeros_lista', JSON.stringify(cajeros)); } catch (e) {} }, [cajeros]);
  useEffect(() => { try { localStorage.setItem('pos_config_empresa', JSON.stringify(configEmpresa)); } catch (e) {} }, [configEmpresa]);
  useEffect(() => { try { localStorage.setItem('pos_prods_final', JSON.stringify(productos)); } catch (e) {} }, [productos]);
  useEffect(() => { try { localStorage.setItem('pos_clis_final', JSON.stringify(clientes)); } catch (e) {} }, [clientes]);
  useEffect(() => { try { localStorage.setItem('pos_txs_final', JSON.stringify(transacciones)); } catch (e) {} }, [transacciones]);
  useEffect(() => { try { localStorage.setItem('pos_historico_ventas_global', JSON.stringify(historicoVentasGlobal)); } catch (e) {} }, [historicoVentasGlobal]);
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

  const verificarConexionBackend = async () => {
    const negocioTarget = cuentaMaster?.negocioId || usuarioActivo?.negocioId;
    if (negocioTarget) {
      const res = await apiService.consultarLicencia(negocioTarget);
      if (res) {
        setOnlineBackend(true);
        setInfoLicencia(res);

        if (res.activa === false) {
          setLicenciaBloqueada(true);
          prevBloqueadaRef.current = true;
        } else {
          // Detectar si fue reactivada de una suspensión O si se extendieron días desde el panel
          const fechaVenceActual = new Date(res.licenciaHasta).getTime();
          const fechaPrevia = prevVenceRef.current ? new Date(prevVenceRef.current).getTime() : null;

          if (prevBloqueadaRef.current || (fechaPrevia && fechaVenceActual > fechaPrevia)) {
            setModalReactivado(true);
            prevBloqueadaRef.current = false;
          }
          prevVenceRef.current = res.licenciaHasta;
          setLicenciaBloqueada(false);
        }
      } else {
        setOnlineBackend(false);
      }
    }
  };

  useEffect(() => {
    obtenerTasaBCV();
    verificarConexionBackend();
    const intervalo = setInterval(verificarConexionBackend, 8000);
    function handleClickAfuera(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setMostrarPredictivo(false);
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('mousedown', handleClickAfuera);
    };
  }, [cuentaMaster, usuarioActivo]);

  const registrarDueno = async (datos) => {
    const resBackend = await apiService.registrarDueno(datos);
    const negocioId = resBackend?.negocio?.id || 'neg_local_' + Date.now();
    const token = resBackend?.token || '';

    const cuentaFinal = {
      ...datos,
      negocioId,
      token,
      licenciaHasta: resBackend?.negocio?.licenciaHasta || null
    };

    setCuentaMaster(cuentaFinal);
    setConfigEmpresa(prev => ({ ...prev, nombre: datos.nombreNegocio }));
    setUsuarioActivo({ rol: 'dueno', nombre: datos.nombreDueno, negocioId });
    setOnlineBackend(Boolean(resBackend));
  };

  const iniciarSesionDueno = async (correo, password) => {
    const res = await apiService.loginDueno(correo, password);
    if (res && res.usuario) {
      if (res.negocio.suscripcionVencida) {
        setLicenciaBloqueada(true);
        prevBloqueadaRef.current = true;
      }
      setUsuarioActivo({ rol: 'dueno', nombre: res.usuario.nombre, negocioId: res.negocio.id });
      setCuentaMaster(prev => ({
        ...prev,
        token: res.token,
        negocioId: res.negocio.id,
        licenciaHasta: res.negocio.licenciaHasta,
        password: password
      }));
      setOnlineBackend(true);
      return true;
    }
    return false;
  };

  const iniciarSesionCajero = (cajeroId, pin) => {
    const c = cajeros.find(item => item.id === cajeroId);
    if (c && c.pin === pin) {
      setUsuarioActivo({ rol: 'cajero', nombre: c.nombre, id: c.id, negocioId: cuentaMaster?.negocioId });
      return true;
    }
    return false;
  };

  const cerrarSesion = () => {
    if (confirm('¿Cerrar sesión o bloquear la pantalla de caja?')) {
      setUsuarioActivo(null);
    }
  };

  const exportarBackupCompleto = () => {
    const backupData = {
      version: '1.7.0',
      fechaExportacion: new Date().toISOString(),
      cuentaMaster,
      cajeros,
      configEmpresa,
      productos,
      clientes,
      transacciones,
      historicoVentasGlobal
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaNom = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `respaldo_pos_${fechaNom}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importarBackupCompleto = (datos) => {
    if (datos.cuentaMaster) setCuentaMaster(datos.cuentaMaster);
    if (Array.isArray(datos.cajeros)) setCajeros(datos.cajeros);
    if (datos.configEmpresa) setConfigEmpresa(datos.configEmpresa);
    if (Array.isArray(datos.productos)) setProductos(datos.productos);
    if (Array.isArray(datos.clientes)) setClientes(datos.clientes);
    if (Array.isArray(datos.transacciones)) setTransacciones(datos.transacciones);
    if (Array.isArray(datos.historicoVentasGlobal)) setHistoricoVentasGlobal(datos.historicoVentasGlobal);
  };

  const calcularPrecioItem = (prod, cantidad) => {
    const cant = parseInt(cantidad, 10) || 1;
    if (prod.aplicaPrecioMayor && prod.precioMayorUSD > 0 && cant >= (prod.cantMinimaMayor || 3)) {
      return { precioUnitario: parseFloat(prod.precioMayorUSD), esMayor: true };
    }
    return { precioUnitario: parseFloat(prod.precioUSD), esMayor: false };
  };

  const agregarProductoAlCarrito = (prod) => {
    setCarrito(actual => {
      const existe = actual.find(item => item.id === prod.id);
      if (existe) {
        const nuevaCant = existe.cantidad + 1;
        const info = calcularPrecioItem(prod, nuevaCant);
        return actual.map(item => item.id === prod.id ? { 
          ...item, 
          cantidad: nuevaCant, 
          precioUSD: info.precioUnitario, 
          esMayor: info.esMayor 
        } : item);
      }
      const info = calcularPrecioItem(prod, 1);
      return [...actual, { 
        ...prod, 
        cantidad: 1, 
        precioUSD: info.precioUnitario, 
        precioDetalOriginal: prod.precioUSD,
        esMayor: info.esMayor 
      }];
    });
    setBusquedaInput('');
    setMostrarPredictivo(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const modificarCantidadItem = (id, delta) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const nuevaCant = item.cantidad + delta;
          if (nuevaCant <= 0) return null;
          
          const prodOriginal = productos.find(p => p.id === id) || item;
          const info = calcularPrecioItem(prodOriginal, nuevaCant);
          return { 
            ...item, 
            cantidad: nuevaCant, 
            precioUSD: info.precioUnitario, 
            esMayor: info.esMayor 
          };
        }
        return item;
      }).filter(Boolean);
    });
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
      items: [...carrito],
      descuento: { tipo: tipoDescuento, valor: valorDescuento }
    }, ...prev]);
    setCarrito([]);
    setValorDescuento('');
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
          items: [...carrito],
          descuento: { tipo: tipoDescuento, valor: valorDescuento }
        }, ...resto];
      }
      return resto;
    });
    setClienteActual({ ...cuenta.cliente });
    setCarrito([...cuenta.items]);
    if (cuenta.descuento) {
      setTipoDescuento(cuenta.descuento.tipo || 'monto');
      setValorDescuento(cuenta.descuento.valor || '');
    }
    setModalEsperaAbierto(false);
  };

  const descartarCuentaEnEspera = (id) => {
    if (confirm('¿Deseas descartar esta cuenta en espera?')) {
      setCuentasEnEspera(prev => prev.filter(c => c.id !== id));
    }
  };

  const registrarAbonoCliente = (clienteObj, montoAbonadoUSD, desglose) => {
    const docTarget = normalizarDoc(clienteObj.doc);
    const abonoObj = {
      id: Date.now().toString().slice(-6),
      fecha: new Date().toLocaleString('es-VE'),
      totalAbonoUSD: montoAbonadoUSD,
      ...desglose
    };

    setClientes(prev => {
      return prev.map(c => {
        const coincide = normalizarDoc(c.doc) === docTarget || c.id === clienteObj.id;
        if (coincide) {
          const saldoPrevio = parseFloat(c.saldoPendienteUSD) || 0;
          const nuevoSaldo = Math.max(0, saldoPrevio - montoAbonadoUSD);
          const abonosPrev = Array.isArray(c.historialAbonos) ? c.historialAbonos : [];
          return { 
            ...c, 
            saldoPendienteUSD: nuevoSaldo,
            historialAbonos: [abonoObj, ...abonosPrev]
          };
        }
        return c;
      });
    });

    const abonoGlobal = {
      id: abonoObj.id,
      tipo: 'abono',
      cliente: clienteObj.nombre,
      doc: clienteObj.doc,
      fecha: abonoObj.fecha,
      pagoUSD: desglose.pagoUSD,
      pagoBsEfectivo: desglose.pagoBsEfectivo,
      pagoPM: desglose.pagoPM,
      pagoPunto: desglose.pagoPunto,
      totalAbonoUSD: montoAbonadoUSD
    };

    setTransacciones(prev => [abonoGlobal, ...prev]);
    setHistoricoVentasGlobal(prev => [abonoGlobal, ...prev]);
  };

  const tasaNum = parseFloat(tasaCambio) || 1;
  const subtotalUSD = carrito.reduce((acc, p) => acc + (p.precioUSD * p.cantidad), 0);
  
  let montoDescuentoCalculado = 0;
  const vDescNum = parseFloat(valorDescuento) || 0;
  if (vDescNum > 0) {
    if (tipoDescuento === 'porcentaje') {
      montoDescuentoCalculado = (subtotalUSD * vDescNum) / 100;
    } else {
      montoDescuentoCalculado = vDescNum;
    }
  }
  montoDescuentoCalculado = Math.min(subtotalUSD, montoDescuentoCalculado);
  const totalUSD = Math.max(0, subtotalUSD - montoDescuentoCalculado);
  const totalBS = totalUSD * tasaNum;

  const finalizarVenta = (datos) => {
    const idTicket = Math.floor(100000 + Math.random() * 900000);

    const ventaCompleta = { 
      id: idTicket,
      tipo: 'venta',
      anulada: false,
      cajeroCobrador: usuarioActivo ? `${usuarioActivo.nombre} (${usuarioActivo.rol === 'dueno' ? 'Dueño' : 'Cajero'})` : 'Caja Principal',
      items: [...carrito],
      subtotalUSD: subtotalUSD.toFixed(2),
      descuentoUSD: montoDescuentoCalculado.toFixed(2),
      descuentoTexto: vDescNum > 0 ? (tipoDescuento === 'porcentaje' ? `${vDescNum}%` : `$${vDescNum}`) : '',
      ...datos 
    };

    setTransacciones(prev => [ventaCompleta, ...prev]);
    setHistoricoVentasGlobal(prev => [ventaCompleta, ...prev]);

    const negocioTarget = cuentaMaster?.negocioId || usuarioActivo?.negocioId;
    if (negocioTarget) {
      apiService.sincronizarVentas(negocioTarget, [ventaCompleta]).then(r => {
        if (r) setOnlineBackend(true);
      });
    }

    if (datos.esCredito && parseFloat(datos.saldoDeudaUSD) > 0) {
      setClientes(actuales => {
        const nTarget = normalizarDoc(datos.cliente.doc);
        const index = actuales.findIndex(c => normalizarDoc(c.doc) === nTarget);
        const incremento = parseFloat(datos.saldoDeudaUSD);
        
        const compraParaHistorial = {
          id: idTicket,
          fecha: datos.fecha,
          items: [...carrito],
          saldoDeudaUSD: datos.saldoDeudaUSD,
          totalUSD: datos.totalUSD
        };

        if (index >= 0) {
          const act = [...actuales];
          const histPrevio = Array.isArray(act[index].historialCreditos) ? act[index].historialCreditos : [];
          act[index] = { 
            ...act[index], 
            nombre: datos.cliente.nombre || act[index].nombre,
            telefono: datos.cliente.telefono || act[index].telefono,
            saldoPendienteUSD: (act[index].saldoPendienteUSD || 0) + incremento,
            historialCreditos: [compraParaHistorial, ...histPrevio]
          };
          return act;
        }
        return [...actuales, { 
          id: Date.now(), 
          ...datos.cliente, 
          saldoPendienteUSD: incremento,
          historialCreditos: [compraParaHistorial],
          historialAbonos: []
        }];
      });
    }

    setProductos(prods => prods.map(p => {
      const itemVendido = carrito.find(it => it.id === p.id);
      return itemVendido ? { ...p, stock: Math.max(0, (p.stock || 0) - itemVendido.cantidad) } : p;
    }));

    setCarrito([]);
    setValorDescuento('');
    setClienteActual(CLIENTES_INICIALES[0]);
    setModalCobroAbierto(false);
    setTicketModalData(ventaCompleta);
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
          const histLimpio = (c.historialCreditos || []).filter(h => h.id !== venta.id);
          return { 
            ...c, 
            saldoPendienteUSD: Math.max(0, (c.saldoPendienteUSD || 0) - parseFloat(venta.saldoDeudaUSD)),
            historialCreditos: histLimpio
          };
        }
        return c;
      }));
    }

    setTransacciones(txs => txs.map(t => t.id === venta.id ? { ...t, anulada: true } : t));
    setHistoricoVentasGlobal(txs => txs.map(t => t.id === venta.id ? { ...t, anulada: true } : t));
    alert(`Factura #${venta.id} anulada.`);
  };

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

  // 1. PANTALLA DE BLOQUEO POR SUSPENSIÓN
  if (licenciaBloqueada) {
    return (
      <div style={styles.overlayBloqueo} translate="no">
        <div style={styles.cardBloqueo}>
          <div style={styles.iconoBloqueo}>
            <AlertOctagon size={48} color="#ef4444" />
          </div>
          <h2 style={{ margin: '10px 0 4px 0', color: '#0f172a', fontSize: '1.25rem' }}>Servicio Suspendido</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            La suscripción de <strong>{configEmpresa.nombre}</strong> no se encuentra activa en el servidor central.
          </p>

          <div style={styles.cajaAvisoContacto}>
            <PhoneCall size={18} color="#0052cc" />
            <div style={{ textAlign: 'left', fontSize: '0.76rem', color: '#1e293b' }}>
              <div>Para reactivar el punto de venta o reportar tu pago, comunícate con soporte:</div>
              <strong style={{ display: 'block', marginTop: '2px', color: '#0052cc' }}>soporte@pantojaapps.com</strong>
            </div>
          </div>

          <button 
            type="button" 
            onClick={verificarConexionBackend} 
            style={styles.btnReintentarLicencia}
          >
            <RefreshCw size={15} /> Verificar Pago / Reconectar
          </button>
        </div>
      </div>
    );
  }

  if (!usuarioActivo) {
    return (
      <LoginModal 
        cuentaMaster={cuentaMaster}
        cajeros={cajeros}
        alRegistrarDueno={registrarDueno}
        alIniciarSesionDueno={iniciarSesionDueno}
        alIniciarSesionCajero={iniciarSesionCajero}
      />
    );
  }

  const esDueno = usuarioActivo.rol === 'dueno';

  return (
    <div style={styles.contenedor} translate="no">
      {/* 2. MODAL PREMIUM DE FELICITACIONES POR ACTIVACIÓN O RENOVACIÓN */}
      {modalReactivado && (
        <div style={styles.overlayFelicitacion} translate="no">
          <div style={styles.cardFelicitacionPro}>
            {/* Header decorativo verde */}
            <div style={styles.bannerProTop}>
              <div style={styles.iconoGlowCirculo}>
                <Sparkles size={28} color="#15803d" />
              </div>
            </div>

            <div style={{ padding: '16px 20px 22px 20px', textAlign: 'center' }}>
              <div style={styles.pillStatusVerde}>
                <CheckCircle2 size={13} color="#16a34a" />
                <span>Suscripción Verificada</span>
              </div>

              <h2 style={{ margin: '8px 0 6px 0', color: '#0f172a', fontSize: '1.28rem', fontWeight: '800' }}>
                ¡Licencia Activa con Éxito!
              </h2>

              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                Tu cuenta para <strong>{configEmpresa.nombre}</strong> ha sido actualizada en la nube. Tienes acceso completo para continuar cobrando y administrando tu negocio.
              </p>

              {infoLicencia && (
                <div style={styles.infoDiasBoxPro}>
                  <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 'bold' }}>
                    Vigencia Actual: {infoLicencia.diasRestantes} días restantes
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>
                    Válida hasta el {new Date(infoLicencia.licenciaHasta).toLocaleDateString('es-VE')}
                  </div>
                </div>
              )}

              <button 
                type="button" 
                onClick={() => setModalReactivado(false)} 
                style={styles.btnContinuarPro}
              >
                Continuar Facturando
              </button>
            </div>
          </div>
        </div>
      )}

      {vistaActual === 'configuracion' && esDueno && (
        <ConfiguracionModal 
          config={configEmpresa}
          infoLicencia={infoLicencia}
          alGuardarConfig={(nuevaConfig) => setConfigEmpresa(nuevaConfig)}
          alExportarBackup={exportarBackupCompleto}
          alImportarBackup={importarBackupCompleto}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'usuarios' && esDueno && (
        <UsuariosModal 
          cajeros={cajeros}
          alGuardarCajero={(cajero) => {
            setCajeros(prev => {
              const idx = prev.findIndex(item => item.id === cajero.id);
              if (idx >= 0) {
                const copia = [...prev];
                copia[idx] = cajero;
                return copia;
              }
              return [...prev, cajero];
            });
            const negocioTarget = cuentaMaster?.negocioId || usuarioActivo?.negocioId;
            if (negocioTarget) {
              apiService.crearCajero(negocioTarget, cajero.nombre, cajero.pin);
            }
          }}
          alEliminarCajero={(id) => setCajeros(prev => prev.filter(c => c.id !== id))}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'metricas' && esDueno && (
        <MetricasModal 
          transaccionesTurno={transacciones}
          historicoGlobal={historicoVentasGlobal}
          productos={productos}
          tasaCambio={tasaCambio}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'inventario' && (
        <InventarioModal 
          productos={productos}
          esDueno={esDueno}
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
          transacciones={transacciones}
          alRegistrarAbono={registrarAbonoCliente}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'caja' && (
        <CajaModal 
          transacciones={transacciones}
          tasaCambio={tasaCambio}
          configEmpresa={configEmpresa}
          alCerrarTurno={() => { 
            setTransacciones([]); 
            try { localStorage.removeItem('pos_txs_final'); } catch (e) {} 
          }}
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

      {/* MOSTRADOR POS PRINCIPAL */}
      {vistaActual === 'pos' && (
        <>
          <header style={styles.topHeader}>
            {esDueno ? (
              <>
                <div style={styles.headerFila1}>
                  <div style={styles.marcaContainer}>
                    {configEmpresa.logo ? (
                      <img src={configEmpresa.logo} alt="Logo" style={styles.logoMini} />
                    ) : (
                      <div style={styles.avatarIcon}><Store size={18} color="#0052cc" /></div>
                    )}
                    <div style={styles.infoNegocio}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h1 style={styles.nombreNegocio}>{configEmpresa.nombre}</h1>
                        {onlineBackend ? (
                          <span title="Sincronizado con la nube" style={styles.badgeOnline}><Cloud size={11} /> Nube</span>
                        ) : (
                          <span title="Modo local offline" style={styles.badgeOffline}><CloudOff size={11} /> Local</span>
                        )}
                      </div>
                      <div style={{ ...styles.badgeRol, backgroundColor: '#f0fdf4', color: '#15803d' }}>
                        <ShieldCheck size={11} color="#16a34a" />
                        <span>Dueño: {usuarioActivo.nombre}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={cerrarSesion} 
                    style={styles.btnLogout} 
                    title="Cerrar Turno / Salir"
                  >
                    <LogOut size={14} color="#dc2626" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#dc2626' }}>Salir</span>
                  </button>
                </div>

                <div style={styles.headerFila2}>
                  <div style={styles.tasaChip}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold' }}>BCV</span>
                      <button type="button" onClick={obtenerTasaBCV} style={styles.btnSync} title="Sincronizar BCV">
                        <RefreshCw size={10} color="#0052cc" />
                      </button>
                    </div>
                    <input 
                      type="number" 
                      step="any" 
                      value={tasaCambio} 
                      onChange={(e) => setTasaCambio(e.target.value)} 
                      style={styles.inputTasaMini} 
                    />
                  </div>

                  <div style={styles.grupoBotonesDueno}>
                    <button 
                      type="button" 
                      onClick={() => setVistaActual('usuarios')} 
                      style={styles.btnPillHeader} 
                      title="Personal y Cajeros"
                    >
                      <Users size={14} color="#0052cc" />
                      <span>Cajeros</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setVistaActual('metricas')} 
                      style={styles.btnPillHeader} 
                      title="Rendimiento y Ganancias"
                    >
                      <TrendingUp size={14} color="#16a34a" />
                      <span>Ganancias</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setVistaActual('configuracion')} 
                      style={styles.btnPillHeader} 
                      title="Configuración"
                    >
                      <Settings size={14} color="#475569" />
                      <span>Ajustes</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.headerFilaUnicaCajero}>
                <div style={styles.marcaContainer}>
                  {configEmpresa.logo ? (
                    <img src={configEmpresa.logo} alt="Logo" style={styles.logoMini} />
                  ) : (
                    <div style={styles.avatarIcon}><Store size={18} color="#0052cc" /></div>
                  )}
                  <div style={styles.infoNegocio}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h1 style={styles.nombreNegocio}>{configEmpresa.nombre}</h1>
                      {onlineBackend ? (
                        <span title="Sincronizado con la nube" style={styles.badgeOnline}><Cloud size={11} /> Nube</span>
                      ) : (
                        <span title="Modo local offline" style={styles.badgeOffline}><CloudOff size={11} /> Local</span>
                      )}
                    </div>
                    <div style={{ ...styles.badgeRol, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                      <UserCheck size={11} color="#2563eb" />
                      <span>Cajero: {usuarioActivo.nombre}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={styles.tasaChip}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold' }}>BCV</span>
                      <button type="button" onClick={obtenerTasaBCV} style={styles.btnSync} title="Sincronizar BCV">
                        <RefreshCw size={10} color="#0052cc" />
                      </button>
                    </div>
                    <input 
                      type="number" 
                      step="any" 
                      value={tasaCambio} 
                      onChange={(e) => setTasaCambio(e.target.value)} 
                      style={styles.inputTasaMini} 
                    />
                  </div>

                  <button 
                    type="button" 
                    onClick={cerrarSesion} 
                    style={styles.btnLogout} 
                    title="Cerrar Turno / Salir"
                  >
                    <LogOut size={14} color="#dc2626" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#dc2626' }}>Salir</span>
                  </button>
                </div>
              </div>
            )}
          </header>

          <nav style={styles.barraModulos}>
            <button 
              type="button" 
              onClick={() => setVistaActual('inventario')} 
              style={styles.btnTabItem}
            >
              <div style={{ ...styles.iconoTab, backgroundColor: '#eff6ff', color: '#0052cc' }}>
                <Package size={17} />
              </div>
              <span style={styles.textoTab}>Inventario</span>
            </button>

            <button 
              type="button" 
              onClick={() => setVistaActual('creditos')} 
              style={styles.btnTabItem}
            >
              <div style={{ ...styles.iconoTab, backgroundColor: clientesMorosos > 0 ? '#fff7ed' : '#f8fafc', color: clientesMorosos > 0 ? '#ea580c' : '#475569', border: clientesMorosos > 0 ? '1px solid #fed7aa' : '1px solid #e2e8f0' }}>
                <BookOpen size={17} />
                {clientesMorosos > 0 && (
                  <span style={styles.badgeAlertaFlotante}>{clientesMorosos}</span>
                )}
              </div>
              <span style={{ ...styles.textoTab, color: clientesMorosos > 0 ? '#c2410c' : '#475569', fontWeight: clientesMorosos > 0 ? 'bold' : '600' }}>Créditos</span>
            </button>

            <button 
              type="button" 
              onClick={() => setVistaActual('caja')} 
              style={styles.btnTabItem}
            >
              <div style={{ ...styles.iconoTab, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <Wallet size={17} />
              </div>
              <span style={styles.textoTab}>Caja (Z)</span>
            </button>

            <button 
              type="button" 
              onClick={() => setVistaActual('historial')} 
              style={styles.btnTabItem}
            >
              <div style={{ ...styles.iconoTab, backgroundColor: '#faf5ff', color: '#9333ea' }}>
                <History size={17} />
              </div>
              <span style={styles.textoTab}>Ventas</span>
            </button>
          </nav>

          <section style={styles.barraClienteMostrador}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <User color="#0052cc" size={16} style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cédula cliente..."
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
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
                  <Search color="#64748b" size={17} style={styles.iconoInput} />
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
                        <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{p.nombre}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Cód: {p.codigo} | Stock: {p.stock || 0}
                          {p.aplicaPrecioMayor && ` · Mayor: $${p.precioMayorUSD} (≥${p.cantMinimaMayor}u)`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#16a34a' }}>${p.precioUSD.toFixed(2)}</span>
                        <small style={{ display: 'block', fontSize: '0.68rem', color: '#64748b' }}>Bs. {(p.precioUSD * tasaNum).toFixed(2)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={() => { setOnScanCallback(null); setCamaraAbierta(true); }} style={styles.btnCamara}>
              <Camera size={17} />
              <span style={{ fontSize: '0.78rem', marginLeft: '4px', fontWeight: 'bold' }}>Cámara</span>
            </button>
          </section>

          <main style={styles.seccionCarrito}>
            {carrito.length === 0 ? (
              <div style={styles.carritoVacio}>
                <Barcode color="#cbd5e1" size={50} />
                <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#64748b' }}>La caja está vacía. Escanea o busca un producto.</p>
              </div>
            ) : (
              <div style={styles.listaItems}>
                {carrito.map((item) => {
                  const itemSubUSD = item.precioUSD * item.cantidad;
                  const itemSubBS = itemSubUSD * tasaNum;
                  return (
                    <div key={item.id} style={styles.itemFila}>
                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{item.nombre}</strong>
                          {item.esMayor && (
                            <span style={styles.badgeMayorLive}>Mayorista</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: item.esMayor ? '#c2410c' : '#64748b', fontWeight: item.esMayor ? 'bold' : 'normal' }}>
                          ${item.precioUSD.toFixed(2)} | Bs. {(item.precioUSD * tasaNum).toFixed(2)} c/u
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                        <button type="button" onClick={() => modificarCantidadItem(item.id, -1)} style={styles.btnCant}><Minus size={13}/></button>
                        <span style={{ fontWeight: 'bold', fontSize: '0.92rem' }}>{item.cantidad}</span>
                        <button type="button" onClick={() => modificarCantidadItem(item.id, 1)} style={styles.btnCant}><Plus size={13}/></button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>${itemSubUSD.toFixed(2)}</strong>
                        <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Bs. {itemSubBS.toFixed(2)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          <footer style={styles.footer}>
            {carrito.length > 0 && (
              <div style={styles.barraDescuentoLive}>
                <button
                  type="button"
                  onClick={() => setModalDescuentoAbierto(true)}
                  style={{
                    ...styles.btnDescuentoTrigger,
                    backgroundColor: montoDescuentoCalculado > 0 ? '#fff1f2' : '#f8fafc',
                    borderColor: montoDescuentoCalculado > 0 ? '#fecdd3' : '#e2e8f0',
                    color: montoDescuentoCalculado > 0 ? '#e11d48' : '#64748b'
                  }}
                >
                  <Tag size={13} />
                  <span>
                    {montoDescuentoCalculado > 0 
                      ? `Rebaja aplicada: -$${montoDescuentoCalculado.toFixed(2)} (${tipoDescuento === 'porcentaje' ? `${valorDescuento}%` : `$${valorDescuento}`})`
                      : 'Aplicar Descuento / Rebaja'}
                  </span>
                </button>
                {montoDescuentoCalculado > 0 && (
                  <button type="button" onClick={() => setValorDescuento('')} style={styles.btnQuitarDesc} title="Quitar descuento">
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            <div style={styles.filaTotales}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Total Bolívares:</span>
                <div style={styles.totalBs}>Bs. {totalBS.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {montoDescuentoCalculado > 0 ? `Total (Rebaja -$${montoDescuentoCalculado.toFixed(2)}):` : 'Total Divisa:'}
                </span>
                <div style={styles.totalUsd}>${totalUSD.toFixed(2)}</div>
              </div>
            </div>

            <div style={styles.botonesAccion}>
              <button type="button" onClick={() => { setCarrito([]); setValorDescuento(''); setClienteActual(CLIENTES_INICIALES[0]); }} style={styles.btnLimpiar} title="Vaciar Carrito"><Trash2 size={17} /></button>
              <button type="button" onClick={suspenderCuentaActual} style={styles.btnPausar}><PauseCircle size={17} /><span style={{ fontSize: '0.76rem', marginLeft: '3px', fontWeight: 'bold' }}>Pausar</span></button>
              {cuentasEnEspera.length > 0 && (
                <button type="button" onClick={() => setModalEsperaAbierto(true)} style={styles.btnVerEspera}><PlayCircle size={17} /><span style={{ fontSize: '0.76rem', marginLeft: '3px', fontWeight: 'bold' }}>({cuentasEnEspera.length})</span></button>
              )}
              <button type="button" onClick={() => { if (carrito.length === 0) return alert('El carrito está vacío'); setModalCobroAbierto(true); }} style={styles.btnCobrar}><DollarSign size={18} /> Cobrar Orden</button>
            </div>
          </footer>
        </>
      )}

      {modalDescuentoAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Aplicar Descuento / Rebaja</h3>
                <small style={{ color: '#64748b' }}>Subtotal compra: ${subtotalUSD.toFixed(2)}</small>
              </div>
              <button type="button" onClick={() => setModalDescuentoAbierto(false)} style={styles.btnCerrar}><X size={18}/></button>
            </div>

            <div style={styles.tabsDesc}>
              <button
                type="button"
                onClick={() => setTipoDescuento('monto')}
                style={{
                  ...styles.tabDescBtn,
                  backgroundColor: tipoDescuento === 'monto' ? '#0052cc' : 'transparent',
                  color: tipoDescuento === 'monto' ? '#fff' : '#64748b'
                }}
              >
                <DollarSign size={14} /> Rebaja Fija ($)
              </button>
              <button
                type="button"
                onClick={() => setTipoDescuento('porcentaje')}
                style={{
                  ...styles.tabDescBtn,
                  backgroundColor: tipoDescuento === 'porcentaje' ? '#0052cc' : 'transparent',
                  color: tipoDescuento === 'porcentaje' ? '#fff' : '#64748b'
                }}
              >
                <Percent size={14} /> Porcentaje (%)
              </button>
            </div>

            <div style={{ margin: '14px 0' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                {tipoDescuento === 'monto' ? 'Monto a descontar en dólares ($):' : 'Porcentaje a descontar (%):'}
              </label>
              <input
                type="number"
                step="any"
                placeholder={tipoDescuento === 'monto' ? 'Ej: 1.00' : 'Ej: 5 o 10'}
                value={valorDescuento}
                onChange={(e) => setValorDescuento(e.target.value)}
                style={styles.inputDescuento}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {tipoDescuento === 'porcentaje' ? (
                <>
                  <button type="button" onClick={() => setValorDescuento('5')} style={styles.btnChipDesc}>5%</button>
                  <button type="button" onClick={() => setValorDescuento('10')} style={styles.btnChipDesc}>10%</button>
                  <button type="button" onClick={() => setValorDescuento('15')} style={styles.btnChipDesc}>15%</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setValorDescuento('0.50')} style={styles.btnChipDesc}>$0.50</button>
                  <button type="button" onClick={() => setValorDescuento('1.00')} style={styles.btnChipDesc}>$1.00</button>
                  <button type="button" onClick={() => setValorDescuento('2.00')} style={styles.btnChipDesc}>$2.00</button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalDescuentoAbierto(false)}
              style={styles.btnAplicarDescuento}
            >
              Confirmar Descuento
            </button>
          </div>
        </div>
      )}

      {modalEsperaAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div><h3 style={{ margin: 0, fontSize: '1rem' }}>Cuentas en Espera</h3><small style={{ color: '#64748b' }}>Selecciona para reanudar el cobro</small></div>
              <button type="button" onClick={() => setModalEsperaAbierto(false)} style={styles.btnCerrar}><X size={18}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh', overflowY: 'auto' }}>
              {cuentasEnEspera.map(c => {
                const totalCUSD = c.items.reduce((acc, it) => acc + (it.precioUSD * it.cantidad), 0);
                return (
                  <div key={c.id} style={styles.itemEsperaCard}>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>{c.cliente?.nombre || 'Consumidor Final'}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pausada: {c.fecha} • {c.items.length} productos</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#16a34a', marginTop: '2px' }}>${totalCUSD.toFixed(2)} (Bs. {(totalCUSD * tasaNum).toFixed(2)})</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => recuperarCuentaEnEspera(c)} style={{ ...styles.btnMini, backgroundColor: '#0052cc', color: '#fff' }}>Reanudar</button>
                      <button type="button" onClick={() => descartarCuentaEnEspera(c.id)} style={{ ...styles.btnMini, backgroundColor: '#fee2e2', color: '#dc2626' }}><Trash2 size={14}/></button>
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
        configEmpresa={configEmpresa}
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
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc' },
  topHeader: { padding: '8px 12px 6px 12px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #e2e8f0', flexShrink: 0, gap: '6px' },
  headerFila1: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  headerFilaUnicaCajero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  marcaContainer: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 },
  logoMini: { width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e2e8f0', flexShrink: 0 },
  avatarIcon: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoNegocio: { display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  nombreNegocio: { margin: 0, fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badgeRol: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px', marginTop: '1px', width: 'fit-content' },
  badgeOnline: { display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.58rem', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 4px', borderRadius: '4px' },
  badgeOffline: { display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.58rem', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 4px', borderRadius: '4px' },
  btnLogout: { background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0 },
  headerFila2: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px' },
  tasaChip: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f8fafc', padding: '3px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0 },
  btnSync: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  inputTasaMini: { width: '60px', padding: 0, border: 'none', background: 'transparent', textAlign: 'left', fontWeight: 'bold', fontSize: '0.76rem', color: '#0f172a', outline: 'none' },
  grupoBotonesDueno: { display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'flex-end' },
  btnPillHeader: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 'bold', color: '#334155' },
  barraModulos: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '6px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnTabItem: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer', padding: '2px 0' },
  iconoTab: { position: 'relative', width: '38px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' },
  badgeAlertaFlotante: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ea580c', color: '#fff', fontSize: '0.62rem', fontWeight: 'bold', borderRadius: '50%', minWidth: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' },
  textoTab: { fontSize: '0.68rem', fontWeight: '600', color: '#475569' },
  barraClienteMostrador: { backgroundColor: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', gap: '8px', flexShrink: 0 },
  inputDocMostrador: { border: 'none', background: '#f1f5f9', padding: '5px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', width: '130px', outline: 'none' },
  nombreClienteTag: { fontSize: '0.76rem', color: '#334155', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  seccionBuscador: { padding: '6px 12px', backgroundColor: '#fff', display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  inputIconWrapper: { position: 'relative', flex: 1 },
  iconoInput: { position: 'absolute', left: '8px', top: '9px' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 8px 8px 30px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' },
  dropdownPredictivo: { position: 'absolute', top: '40px', left: 0, right: 0, backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 100, border: '1px solid #e2e8f0', overflow: 'hidden' },
  itemPredictivo: { padding: '8px 12px', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  btnAgregar: { padding: '0 10px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' },
  btnCamara: { display: 'flex', alignItems: 'center', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 9px', cursor: 'pointer' },
  seccionCarrito: { flex: 1, overflowY: 'auto', padding: '8px 12px' },
  carritoVacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' },
  listaItems: { display: 'flex', flexDirection: 'column', gap: '6px' },
  itemFila: { backgroundColor: '#fff', padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', gap: '8px', border: '1px solid #f1f5f9' },
  badgeMayorLive: { backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #fed7aa' },
  btnCant: { width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  footer: { backgroundColor: '#fff', padding: '8px 12px 24px 12px', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)', flexShrink: 0 },
  barraDescuentoLive: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' },
  btnDescuentoTrigger: { flex: 1, border: '1px dashed', borderRadius: '8px', padding: '5px 8px', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  btnQuitarDesc: { background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  filaTotales: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  totalBs: { fontSize: '1.15rem', fontWeight: 'bold', color: '#0052cc' },
  totalUsd: { fontSize: '1.15rem', fontWeight: '900', color: '#16a34a' },
  botonesAccion: { display: 'flex', gap: '6px' },
  btnLimpiar: { backgroundColor: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '8px', padding: '10px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPausar: { backgroundColor: '#fff7ed', border: 'none', color: '#ea580c', borderRadius: '8px', padding: '10px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnVerEspera: { backgroundColor: '#eff6ff', border: 'none', color: '#0052cc', borderRadius: '8px', padding: '10px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnCobrar: { flex: 1, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '0.92rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBox: { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '350px', padding: '16px' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  tabsDesc: { display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '2px', marginTop: '6px' },
  tabDescBtn: { flex: 1, border: 'none', padding: '6px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  inputDescuento: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 'bold', outline: 'none' },
  btnChipDesc: { flex: 1, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 0', fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', cursor: 'pointer' },
  btnAplicarDescuento: { width: '100%', padding: '10px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 'bold', cursor: 'pointer' },
  itemEsperaCard: { backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' },
  btnMini: { border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' },

  /* PANTALLA BLOQUEO SUSPENDIDO */
  overlayBloqueo: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#090d16', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px' },
  cardBloqueo: { backgroundColor: '#fff', borderRadius: '20px', padding: '24px 20px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', fontFamily: 'system-ui, sans-serif' },
  iconoBloqueo: { width: '70px', height: '70px', borderRadius: '20px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' },
  cajaAvisoContacto: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0' },
  btnReintentarLicencia: { width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },

  /* MODAL PREMIUM FELICITACIONES ACTIVACIÓN / RENOVACIÓN */
  overlayFelicitacion: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999, padding: '20px' },
  cardFelicitacionPro: { backgroundColor: '#fff', borderRadius: '24px', maxWidth: '360px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', fontFamily: 'system-ui, sans-serif', animation: 'scaleUp 0.25s ease' },
  bannerProTop: { height: '80px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  iconoGlowCirculo: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', position: 'absolute', bottom: '-26px' },
  pillStatusVerde: { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '22px' },
  infoDiasBoxPro: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', margin: '14px 0 18px 0' },
  btnContinuarPro: { width: '100%', padding: '13px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', transition: 'background-color 0.2s' }
};
