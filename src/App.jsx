import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, Camera, Trash2, Plus, Minus, DollarSign, X, 
  RefreshCw, User, Search, PauseCircle, PlayCircle, Store
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
import TerminalesModal from './components/TerminalesModal';
import ModalPeso from './components/ModalPeso';
import SoporteModal from './components/SoporteModal';
import MenuLateral from './components/MenuLateral';
import { dbService } from './services/dbService';

const PRODUCTOS_INICIALES = [
  { id: 'prod_1', codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', costoUSD: 0.92, precioUSD: 1.10, esPesado: false, aplicaPrecioMayor: true, precioMayorUSD: 0.98, cantMinimaMayor: 3, stock: 50, categoria: 'Víveres', imagen: '' },
  { id: 'prod_2', codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', costoUSD: 1.05, precioUSD: 1.35, esPesado: false, aplicaPrecioMayor: true, precioMayorUSD: 1.20, cantMinimaMayor: 3, stock: 40, categoria: 'Víveres', imagen: '' }
];

const CLIENTES_INICIALES = [
  { id: 1, doc: 'V-00000000', nombre: 'Consumidor Final', telefono: '', saldoPendienteUSD: 0, historialCreditos: [], historialAbonos: [] }
];

const CONFIG_INICIAL = {
  nombre: 'Mi Bodega POS',
  rif: 'J-50000000-0',
  direccion: 'Caracas, Venezuela',
  telefono: '0412-0000000',
  mensajePie: '¡Gracias por su compra! Revise su mercancía',
  logo: ''
};

const CAJAS_DEFAULT = [
  { id: 'caja_01', numero: 1, nombre: 'Caja 01', tipoGaveta: 'centralizada', codigoEnlace: '100001', creadaEn: 'Inicial' }
];

export default function App() {
  const [vistaActual, setVistaActual] = useState('pos');
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);
  const [onlineBackend, setOnlineBackend] = useState(false);

  const [cuentaMaster, setCuentaMaster] = useState(() => {
    try {
      const g = localStorage.getItem('pos_cuenta_dueno');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return null;
  });

  const [cajas, setCajas] = useState(() => {
    try {
      const g = localStorage.getItem('pos_cajas_lista');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return CAJAS_DEFAULT;
  });

  const [cajaActiva, setCajaActiva] = useState(() => {
    try {
      const g = localStorage.getItem('pos_caja_activa_local');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return CAJAS_DEFAULT[0];
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

  const currentNegocioId = cuentaMaster?.negocioId || usuarioActivo?.negocioId || 'neg_local';

  const [productos, setProductos] = useState(() => {
    try {
      const g = localStorage.getItem(`pos_prods_${currentNegocioId}`);
      if (g) return JSON.parse(g);
    } catch (e) {}
    return PRODUCTOS_INICIALES;
  });

  const [clientes, setClientes] = useState(() => {
    try {
      const g = localStorage.getItem('pos_clis_final');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return CLIENTES_INICIALES;
  });

  const [transacciones, setTransacciones] = useState(() => {
    try {
      const g = localStorage.getItem(`pos_txs_${currentNegocioId}`);
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });

  const [gastosCaja, setGastosCaja] = useState(() => {
    try {
      const g = localStorage.getItem('pos_gastos_caja');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });

  const [historicoVentasGlobal, setHistoricoVentasGlobal] = useState(() => {
    try {
      const g = localStorage.getItem(`pos_historico_${currentNegocioId}`);
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });

  const [pedidosPausados, setPedidosPausados] = useState(() => {
    try {
      const g = localStorage.getItem('pos_pedidos_pausados');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });
  const [modalPausadosAbierto, setModalPausadosAbierto] = useState(false);

  const [clienteActual, setClienteActual] = useState(CLIENTES_INICIALES[0]);
  const [tasaCambio, setTasaCambio] = useState(855.66);
  const [carrito, setCarrito] = useState([]);
  const [busquedaInput, setBusquedaInput] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [productoParaPesar, setProductoParaPesar] = useState(null);

  useEffect(() => { try { localStorage.setItem('pos_cuenta_dueno', JSON.stringify(cuentaMaster)); } catch (e) {} }, [cuentaMaster]);
  useEffect(() => { try { localStorage.setItem('pos_cajas_lista', JSON.stringify(cajas)); } catch (e) {} }, [cajas]);
  useEffect(() => { try { localStorage.setItem('pos_caja_activa_local', JSON.stringify(cajaActiva)); } catch (e) {} }, [cajaActiva]);
  useEffect(() => { try { localStorage.setItem('pos_usuario_activo', JSON.stringify(usuarioActivo)); } catch (e) {} }, [usuarioActivo]);
  useEffect(() => { try { localStorage.setItem('pos_cajeros_lista', JSON.stringify(cajeros)); } catch (e) {} }, [cajeros]);
  useEffect(() => { try { localStorage.setItem('pos_config_empresa', JSON.stringify(configEmpresa)); } catch (e) {} }, [configEmpresa]);
  useEffect(() => { try { localStorage.setItem(`pos_prods_${currentNegocioId}`, JSON.stringify(productos)); } catch (e) {} }, [productos, currentNegocioId]);
  useEffect(() => { try { localStorage.setItem('pos_clis_final', JSON.stringify(clientes)); } catch (e) {} }, [clientes]);
  useEffect(() => { try { localStorage.setItem(`pos_txs_${currentNegocioId}`, JSON.stringify(transacciones)); } catch (e) {} }, [transacciones, currentNegocioId]);
  useEffect(() => { try { localStorage.setItem('pos_gastos_caja', JSON.stringify(gastosCaja)); } catch (e) {} }, [gastosCaja]);
  useEffect(() => { try { localStorage.setItem(`pos_historico_${currentNegocioId}`, JSON.stringify(historicoVentasGlobal)); } catch (e) {} }, [historicoVentasGlobal, currentNegocioId]);
  useEffect(() => { try { localStorage.setItem('pos_pedidos_pausados', JSON.stringify(pedidosPausados)); } catch (e) {} }, [pedidosPausados]);

  const sincronizarSilenciosamente = async () => {
    const conectadoSupabase = await dbService.checkConnection();
    setOnlineBackend(conectadoSupabase);

    const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId;
    if (negId) {
      const cajerosSupabase = await dbService.getCajeros(negId);
      if (Array.isArray(cajerosSupabase) && cajerosSupabase.length > 0) {
        setCajeros(cajerosSupabase.map(c => ({ id: c.id, nombre: c.nombre, pin: c.pin || '' })));
      }

      const prodsCloud = await dbService.getProductos(negId);
      if (Array.isArray(prodsCloud) && prodsCloud.length > 0) {
        setProductos(prodsCloud);
      }

      const negData = await dbService.getNegocio(negId);
      if (negData) {
        setConfigEmpresa(prev => ({
          ...prev,
          nombre: negData.nombre || prev.nombre,
          rif: negData.rif || prev.rif,
          direccion: negData.direccion || prev.direccion,
          telefono: negData.telefono || prev.telefono,
          logo: negData.logo || prev.logo,
          mensajePie: negData.mensaje_pie || prev.mensajePie
        }));
      }

      const ventasSupabase = await dbService.getVentas(negId);
      if (Array.isArray(ventasSupabase) && ventasSupabase.length > 0) {
        setTransacciones(actuales => {
          const idsExistentes = new Set(actuales.map(v => String(v.id)));
          const nuevas = ventasSupabase.filter(v => !idsExistentes.has(String(v.id)));
          return nuevas.length > 0 ? [...nuevas, ...actuales] : actuales;
        });
      }
    }
  };

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
    sincronizarSilenciosamente();
    const intervalo = setInterval(sincronizarSilenciosamente, 4000);
    return () => clearInterval(intervalo);
  }, [cuentaMaster, usuarioActivo]);

  const manejarCambioBusqueda = (texto) => {
    setBusquedaInput(texto);
    if (!texto.trim()) {
      setSugerencias([]);
      return;
    }
    const q = texto.toLowerCase().trim();
    const coincidencias = productos.filter(p => 
      p.nombre?.toLowerCase().includes(q) || 
      p.codigo?.toLowerCase().includes(q)
    ).slice(0, 6);
    setSugerencias(coincidencias);
  };

  const agregarAlCarrito = (producto, cantidadManual = null) => {
    if (producto.esPesado && cantidadManual === null) {
      setProductoParaPesar(producto);
      setSugerencias([]);
      setBusquedaInput('');
      return;
    }

    const cantidadAAgregar = cantidadManual !== null ? cantidadManual : 1;

    setCarrito(prev => {
      const idx = prev.findIndex(item => String(item.id) === String(producto.id));
      if (idx >= 0) {
        const itemExistente = prev[idx];
        const nuevaCant = parseFloat((itemExistente.cantidad + cantidadAAgregar).toFixed(3));
        
        let precioAplicado = producto.precioUSD;
        if (producto.aplicaPrecioMayor && nuevaCant >= (producto.cantMinimaMayor || 3)) {
          precioAplicado = producto.precioMayorUSD;
        }

        const copia = [...prev];
        copia[idx] = { ...itemExistente, cantidad: nuevaCant, precioUSD: precioAplicado };
        return copia;
      } else {
        let precioAplicado = producto.precioUSD;
        if (producto.aplicaPrecioMayor && cantidadAAgregar >= (producto.cantMinimaMayor || 3)) {
          precioAplicado = producto.precioMayorUSD;
        }

        return [...prev, { ...producto, cantidad: cantidadAAgregar, precioUSD: precioAplicado }];
      }
    });

    setBusquedaInput('');
    setSugerencias([]);
  };

  const ejecutarBusquedaDirecta = (e) => {
    if (e) e.preventDefault();
    if (!busquedaInput.trim()) return;

    const q = busquedaInput.trim().toLowerCase();
    const coincidenciaExacta = productos.find(p => p.codigo?.toLowerCase() === q);
    if (coincidenciaExacta) {
      agregarAlCarrito(coincidenciaExacta);
      return;
    }

    const coincidenciaNombre = productos.find(p => p.nombre?.toLowerCase().includes(q));
    if (coincidenciaNombre) {
      agregarAlCarrito(coincidenciaNombre);
      return;
    }

    alert('Producto no encontrado');
  };

  const actualizarCantidadItem = (index, delta) => {
    setCarrito(prev => {
      const item = prev[index];
      const nuevaCant = parseFloat((item.cantidad + delta).toFixed(3));
      if (nuevaCant <= 0) return prev.filter((_, i) => i !== index);

      let precioAplicado = item.precioUSD;
      const prodOriginal = productos.find(p => String(p.id) === String(item.id));
      if (prodOriginal && prodOriginal.aplicaPrecioMayor) {
        if (nuevaCant >= (prodOriginal.cantMinimaMayor || 3)) {
          precioAplicado = prodOriginal.precioMayorUSD;
        } else {
          precioAplicado = prodOriginal.precioUSD;
        }
      }

      const copia = [...prev];
      copia[index] = { ...item, cantidad: nuevaCant, precioUSD: precioAplicado };
      return copia;
    });
  };

  const pausarCuentaActual = () => {
    if (carrito.length === 0) {
      if (pedidosPausados.length > 0) setModalPausadosAbierto(true);
      else alert('No hay productos en caja para pausar.');
      return;
    }

    const nuevoPausado = {
      id: 'pausa_' + Date.now(),
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cliente: clienteActual,
      carrito: [...carrito],
      totalUSD: carrito.reduce((a, b) => a + (b.precioUSD * b.cantidad), 0)
    };

    setPedidosPausados(prev => [nuevoPausado, ...prev]);
    setCarrito([]);
    setClienteActual(CLIENTES_INICIALES[0]);
    alert('Orden guardada en pausa.');
  };

  const reanudarPedido = (pedido) => {
    if (carrito.length > 0) {
      if (!confirm('¿Reemplazar los artículos actuales por esta orden en pausa?')) return;
    }
    setCarrito(pedido.carrito);
    setClienteActual(pedido.cliente || CLIENTES_INICIALES[0]);
    setPedidosPausados(prev => prev.filter(p => p.id !== pedido.id));
    setModalPausadosAbierto(false);
  };

  const eliminarPedidoPausado = (id) => {
    if (confirm('¿Eliminar orden pausada?')) {
      setPedidosPausados(prev => prev.filter(p => p.id !== id));
    }
  };

  const guardarClienteEnDB = (cli) => {
    setClientes(prev => {
      const idx = prev.findIndex(c => c.doc?.toUpperCase().trim() === cli.doc?.toUpperCase().trim());
      if (idx >= 0) {
        const cp = [...prev];
        cp[idx] = { ...cp[idx], ...cli };
        return cp;
      }
      return [...prev, { id: Date.now(), ...cli, saldoPendienteUSD: 0, historialCreditos: [], historialAbonos: [] }];
    });
  };

  // FINALIZAR VENTA COMPLETA
  const alFinalizarVenta = async (datosVenta) => {
    const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId || 'neg_local';
    const ahora = new Date();

    const ventaCompleta = {
      id: datosVenta.id || 'vta_' + Date.now(),
      correlativo: (transacciones.length + 1).toString().padStart(5, '0'),
      fecha: ahora.toISOString(),
      fechaFormateada: ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      negocio_id: negId,
      cajero: usuarioActivo?.nombre || 'Angel Pantoja',
      caja: cajaActiva?.nombre || 'Caja 01',
      cliente: datosVenta.cliente || clienteActual,
      items: datosVenta.items || [...carrito],
      totalUSD: parseFloat(datosVenta.totalUSD || totalUSD),
      totalBS: parseFloat(datosVenta.totalBS || totalBS),
      tasaCambio: parseFloat(tasaCambio),
      metodoPago: datosVenta.metodoPago || 'efectivo_usd',
      montoRecibido: parseFloat(datosVenta.montoRecibido || datosVenta.totalUSD || totalUSD),
      vueltoUSD: parseFloat(datosVenta.vueltoUSD || 0),
      vueltoBS: parseFloat(datosVenta.vueltoBS || 0)
    };

    // 1. Guardar en el turno actual (Caja e Historial)
    setTransacciones(prev => [ventaCompleta, ...prev]);
    setHistoricoVentasGlobal(prev => [ventaCompleta, ...prev]);

    // 2. Descontar Stock
    setProductos(prevProds => {
      const copia = [...prevProds];
      ventaCompleta.items.forEach(itemVendido => {
        const idx = copia.findIndex(p => String(p.id) === String(itemVendido.id));
        if (idx >= 0) {
          const stockActual = parseFloat(copia[idx].stock) || 0;
          const cantVendida = parseFloat(itemVendido.cantidad) || 1;
          const nuevoStock = Math.max(0, stockActual - cantVendida);
          copia[idx] = { ...copia[idx], stock: parseFloat(nuevoStock.toFixed(3)) };
          dbService.upsertProducto(copia[idx], negId);
        }
      });
      return copia;
    });

    // 3. Persistir en Supabase
    await dbService.registrarVenta({
      id: ventaCompleta.id,
      negocio_id: negId,
      fecha: ventaCompleta.fecha,
      total_usd: ventaCompleta.totalUSD,
      total_bs: ventaCompleta.totalBS,
      tasa_cambio: ventaCompleta.tasaCambio,
      cliente_nombre: ventaCompleta.cliente?.nombre || 'Consumidor Final',
      cliente_doc: ventaCompleta.cliente?.doc || 'V-00000000',
      cajero_nombre: ventaCompleta.cajero,
      caja_nombre: ventaCompleta.caja,
      detalles: ventaCompleta
    });

    // 4. Limpiar caja y desplegar ticket
    setCarrito([]);
    setClienteActual(CLIENTES_INICIALES[0]);
    setModalCobroAbierto(false);
    setTicketModalData(ventaCompleta);
  };

  const registrarDueno = async (datos) => {
    const negocioId = 'neg_' + Date.now().toString(36);
    const duenoId = 'usr_' + Date.now();
    const cuentaFinal = { ...datos, negocioId, duenoId };

    await dbService.registrarNegocio(
      { id: negocioId, nombre: datos.nombreNegocio },
      { id: duenoId, nombre: datos.nombreDueno, correo: datos.correo, password: datos.password }
    );

    setCuentaMaster(cuentaFinal);
    setConfigEmpresa(prev => ({ ...prev, nombre: datos.nombreNegocio }));
    setUsuarioActivo({ rol: 'dueno', nombre: datos.nombreDueno, negocioId });
    setCajaActiva(CAJAS_DEFAULT[0]);
    setOnlineBackend(true);
    return true;
  };

  const iniciarSesionDueno = async (correo, password) => {
    const correoLimpio = correo.toLowerCase().trim();
    const res = await dbService.loginDueno(correoLimpio, password);
    if (res && res.usuario) {
      const cuentaRecuperada = {
        nombreDueno: res.usuario.nombre,
        correo: correoLimpio,
        password: password,
        negocioId: res.negocio.id,
        nombreNegocio: res.negocio.nombre
      };

      setCuentaMaster(cuentaRecuperada);
      setConfigEmpresa(prev => ({
        ...prev,
        nombre: res.negocio.nombre,
        rif: res.negocio.rif || prev.rif,
        direccion: res.negocio.direccion || prev.direccion,
        telefono: res.negocio.telefono || prev.telefono,
        logo: res.negocio.logo || prev.logo,
        mensajePie: res.negocio.mensaje_pie || prev.mensajePie
      }));
      setUsuarioActivo({ rol: 'dueno', nombre: res.usuario.nombre, negocioId: res.negocio.id });
      if (!cajaActiva) setCajaActiva(CAJAS_DEFAULT[0]);
      setOnlineBackend(true);

      const clist = await dbService.getCajeros(res.negocio.id);
      if (clist?.length) setCajeros(clist.map(c => ({ id: c.id, nombre: c.nombre, pin: c.pin })));

      const prods = await dbService.getProductos(res.negocio.id);
      if (prods?.length) setProductos(prods);

      return true;
    }

    if (cuentaMaster && (cuentaMaster.correo?.toLowerCase() === correoLimpio)) {
      if (cuentaMaster.password === password) {
        setUsuarioActivo({ rol: 'dueno', nombre: cuentaMaster.nombreDueno || 'Dueño', negocioId: cuentaMaster.negocioId || 'neg_local' });
        if (!cajaActiva) setCajaActiva(CAJAS_DEFAULT[0]);
        return true;
      }
    }

    return false;
  };

  const iniciarSesionCajero = (cajeroId, pin) => {
    const c = cajeros.find(item => String(item.id) === String(cajeroId));
    if (c && String(c.pin).trim() === String(pin).trim()) {
      setUsuarioActivo({ rol: 'cajero', nombre: c.nombre, id: c.id, negocioId: cuentaMaster?.negocioId || cajaActiva?.negocioId || 'neg_local' });
      return true;
    }
    return false;
  };

  const cerrarSesion = () => {
    if (confirm('¿Cerrar turno y salir a la pantalla de inicio?')) {
      setUsuarioActivo(null);
    }
  };

  const guardarConfiguracion = async (nuevaConf) => {
    setConfigEmpresa(nuevaConf);
    const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId;
    if (negId) {
      await dbService.actualizarConfigNegocio(negId, nuevaConf);
    }
  };

  const guardarProducto = async (producto) => {
    const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId || 'neg_local';
    setProductos(prev => {
      const idx = prev.findIndex(item => String(item.id) === String(producto.id));
      if (idx >= 0) {
        const cp = [...prev];
        cp[idx] = producto;
        return cp;
      }
      return [producto, ...prev];
    });

    await dbService.upsertProducto(producto, negId);
  };

  const eliminarProducto = async (prodId) => {
    const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId || 'neg_local';
    setProductos(prev => prev.filter(p => String(p.id) !== String(prodId)));
    await dbService.eliminarProducto(prodId, negId);
  };

  const tasaNum = parseFloat(tasaCambio) || 1;
  const subtotalUSD = carrito.reduce((acc, p) => acc + (p.precioUSD * p.cantidad), 0);
  const totalUSD = subtotalUSD;
  const totalBS = totalUSD * tasaNum;

  const clientesMorosos = clientes.filter(c => (parseFloat(c.saldoPendienteUSD) || 0) > 0.01).length;

  if (!usuarioActivo) {
    return (
      <LoginModal 
        cuentaMaster={cuentaMaster}
        cajeros={cajeros}
        cajaActiva={cajaActiva}
        alRegistrarDueno={registrarDueno}
        alIniciarSesionDueno={iniciarSesionDueno}
        alIniciarSesionCajero={iniciarSesionCajero}
        alVincularTerminalPorCodigo={() => false}
        alDesvincularTerminal={() => setCajaActiva(null)}
      />
    );
  }

  const esDueno = usuarioActivo.rol === 'dueno';

  return (
    <div style={styles.contenedor} translate="no">
      <MenuLateral 
        abierto={menuLateralAbierto}
        alCerrar={() => setMenuLateralAbierto(false)}
        configEmpresa={configEmpresa}
        usuarioActivo={usuarioActivo}
        cajaActiva={cajaActiva}
        onlineBackend={onlineBackend}
        clientesMorosos={clientesMorosos}
        alNavegar={(vista) => setVistaActual(vista)}
        alCerrarSesion={cerrarSesion}
      />

      {/* VISTAS MODALES */}
      {vistaActual === 'soporte' && (
        <SoporteModal nombreNegocio={configEmpresa.nombre} alVolver={() => setVistaActual('pos')} />
      )}

      {vistaActual === 'configuracion' && esDueno && (
        <ConfiguracionModal 
          config={configEmpresa}
          cajas={cajas}
          cajeros={cajeros}
          alGuardarConfig={guardarConfiguracion}
          alAbrirTerminales={() => setVistaActual('terminales')}
          alAbrirUsuarios={() => setVistaActual('usuarios')}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'inventario' && (
        <InventarioModal 
          productos={productos}
          tasaCambio={tasaCambio}
          esDueno={esDueno}
          alGuardarProducto={guardarProducto}
          alEliminarProducto={eliminarProducto}
          alVolver={() => setVistaActual('pos')}
          alAbrirCamara={() => setCamaraAbierta(true)}
        />
      )}

      {vistaActual === 'usuarios' && esDueno && (
        <UsuariosModal 
          cajeros={cajeros}
          alGuardarCajero={async (cajero) => {
            const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId || 'neg_local';
            const cajeroObj = {
              id: String(cajero.id || Date.now()),
              negocio_id: negId,
              nombre: cajero.nombre,
              pin: String(cajero.pin)
            };
            setCajeros(prev => {
              const idx = prev.findIndex(item => String(item.id) === String(cajeroObj.id));
              if (idx >= 0) {
                const cp = [...prev];
                cp[idx] = cajeroObj;
                return cp;
              }
              return [...prev, cajeroObj];
            });
            await dbService.upsertCajero(cajeroObj);
          }}
          alEliminarCajero={async (id) => {
            setCajeros(prev => prev.filter(c => String(c.id) !== String(id)));
            await dbService.eliminarCajero(id);
          }}
          alVolver={() => setVistaActual('configuracion')}
        />
      )}

      {vistaActual === 'terminales' && esDueno && (
        <TerminalesModal 
          cajas={cajas}
          configEmpresa={configEmpresa}
          cuentaMaster={cuentaMaster}
          alGuardarCaja={(caja) => setCajas(prev => [...prev, caja])}
          alEliminarCaja={(id) => setCajas(prev => prev.filter(c => c.id !== id))}
          alVolver={() => setVistaActual('configuracion')}
        />
      )}

      {vistaActual === 'creditos' && (
        <CreditosModal 
          clientes={clientes}
          tasaCambio={tasaCambio}
          transacciones={transacciones}
          alRegistrarAbono={() => {}}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {/* CAJA Y CUADRE Z CONECTADO DIRECTO */}
      {vistaActual === 'caja' && (
        <CajaModal 
          transacciones={transacciones}
          gastos={gastosCaja}
          tasaCambio={tasaCambio}
          configEmpresa={configEmpresa}
          usuarioActivo={usuarioActivo}
          cajaActiva={cajaActiva}
          alRegistrarGasto={(g) => setGastosCaja(prev => [g, ...prev])}
          alEliminarGasto={(id) => setGastosCaja(prev => prev.filter(g => g.id !== id))}
          alCerrarTurno={() => {
            alert('Turno cerrado exitosamente.');
            setTransacciones([]);
            setGastosCaja([]);
          }}
          alVolver={() => setVistaActual('pos')}
        />
      )}

      {vistaActual === 'historial' && (
        <HistorialModal 
          transacciones={transacciones}
          tasaCambio={tasaCambio}
          usuarioActivo={usuarioActivo}
          cajaActiva={cajaActiva}
          alVerTicket={(t) => setTicketModalData(t)}
          alAnularVenta={(id) => {
            if (confirm('¿Anular esta venta?')) {
              setTransacciones(prev => prev.filter(t => t.id !== id));
            }
          }}
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

      {/* PANTALLA PRINCIPAL CAJA */}
      {vistaActual === 'pos' && (
        <>
          <header style={styles.topHeader}>
            <div style={styles.headerFila1}>
              <div 
                style={styles.logoTriggerClickable} 
                onClick={() => setMenuLateralAbierto(true)}
              >
                {configEmpresa.logo ? (
                  <img src={configEmpresa.logo} alt="Logo" style={styles.logoHeaderImg} />
                ) : (
                  <div style={styles.avatarHeaderBox}><Store size={18} color="#0f2a4a" /></div>
                )}
                <div style={styles.infoNegocio}>
                  <h1 style={styles.nombreNegocio}>{configEmpresa.nombre}</h1>
                  <div style={styles.subtextHeader}>
                    {esDueno ? (
                      <span style={{ color: '#00b050', fontWeight: 'bold' }}>
                        {usuarioActivo.nombre} (Dueño)
                      </span>
                    ) : (
                      <span>{usuarioActivo.nombre} · {cajaActiva?.nombre || 'Caja'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.tasaChip}>
                <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold' }}>BCV</span>
                <button type="button" onClick={obtenerTasaBCV} style={styles.btnSync} title="Sincronizar BCV">
                  <RefreshCw size={10} color="#0f2a4a" />
                </button>
                <input 
                  type="number" 
                  step="any" 
                  value={tasaCambio} 
                  onChange={(e) => setTasaCambio(e.target.value)} 
                  style={styles.inputTasaMini} 
                />
              </div>
            </div>
          </header>

          <section style={styles.barraClienteMostrador}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <User color="#0f2a4a" size={16} style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cédula cliente..."
                value={clienteActual.doc === 'V-00000000' ? '' : clienteActual.doc}
                onChange={(e) => setClienteActual(prev => ({ ...prev, doc: e.target.value }))}
                style={styles.inputDocMostrador}
              />
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={styles.nombreClienteTag}>{clienteActual.nombre}</span>
            </div>
          </section>

          {/* BUSCADOR CON SUGERENCIAS FLOTANTES */}
          <section style={styles.seccionBuscador}>
            <form onSubmit={ejecutarBusquedaDirecta} style={{ position: 'relative', flex: 1, display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Escribe nombre o código..."
                value={busquedaInput}
                onChange={(e) => manejarCambioBusqueda(e.target.value)}
                style={styles.inputBuscador}
              />
              {busquedaInput && (
                <button type="button" onClick={() => { setBusquedaInput(''); setSugerencias([]); }} style={styles.btnLimpiarInput}>
                  <X size={14} />
                </button>
              )}
              <button type="submit" style={styles.btnAgregar}>Ingresar</button>

              {sugerencias.length > 0 && (
                <div style={styles.desplegableSugerencias}>
                  {sugerencias.map((item) => (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        agregarAlCarrito(item);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        agregarAlCarrito(item);
                      }}
                      style={styles.itemSugerencia}
                    >
                      <div style={styles.miniImgSugerencia}>
                        {item.imagen ? (
                          <img src={item.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Barcode size={16} color="#94a3b8" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#0f2a4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.nombre}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          Cód: {item.codigo} · Stock: {item.stock} {item.esPesado && '· (Balanza)'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#00b050' }}>${item.precioUSD.toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <button type="button" onClick={() => setCamaraAbierta(true)} style={styles.btnCamara}>
              <Camera size={17} />
              <span style={{ fontSize: '0.78rem', marginLeft: '4px', fontWeight: 'bold' }}>Cámara</span>
            </button>
          </section>

          <main style={styles.seccionCarrito}>
            {carrito.length === 0 ? (
              <div style={styles.carritoVacio}>
                <Barcode color="#cbd5e1" size={50} />
                <p style={{ marginTop: '8px', fontSize: '0.88rem', color: '#64748b' }}>La caja está vacía.</p>
              </div>
            ) : (
              <div style={styles.listaItems}>
                {carrito.map((item, idx) => (
                  <div key={idx} style={styles.itemFila}>
                    <div style={{ flex: 2 }}>
                      <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{item.nombre}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ${item.precioUSD} c/u {item.esPesado && '· KG'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button type="button" onClick={() => actualizarCantidadItem(idx, item.esPesado ? -0.1 : -1)} style={styles.btnCant}><Minus size={13}/></button>
                      <span style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{item.cantidad}</span>
                      <button type="button" onClick={() => actualizarCantidadItem(idx, item.esPesado ? 0.1 : 1)} style={styles.btnCant}><Plus size={13}/></button>
                    </div>
                    <div style={{ textAlign: 'right', flex: 1 }}>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>${(item.precioUSD * item.cantidad).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <footer style={styles.footer}>
            <div style={styles.filaTotales}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Total Bolívares:</span>
                <div style={styles.totalBs}>Bs. {totalBS.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Total Divisa:</span>
                <div style={styles.totalUsd}>${totalUSD.toFixed(2)}</div>
              </div>
            </div>

            <div style={styles.botonesAccion}>
              <button type="button" onClick={() => setCarrito([])} style={styles.btnLimpiar} title="Vaciar"><Trash2 size={17} /></button>
              
              <button 
                type="button" 
                onClick={pausarCuentaActual} 
                style={{
                  ...styles.btnPausar,
                  backgroundColor: pedidosPausados.length > 0 ? '#ffedd5' : '#fff7ed',
                  borderColor: pedidosPausados.length > 0 ? '#f97316' : '#fdba74'
                }}
              >
                <PauseCircle size={17} color="#ea580c" />
                <span style={{ fontSize: '0.76rem', marginLeft: '3px', fontWeight: 'bold', color: '#ea580c' }}>
                  {pedidosPausados.length > 0 ? `Pausa (${pedidosPausados.length})` : 'Pausar'}
                </span>
              </button>

              <button type="button" onClick={() => { if (carrito.length === 0) return alert('Carrito vacío'); setModalCobroAbierto(true); }} style={styles.btnCobrar}>
                <DollarSign size={18} /> Cobrar Orden
              </button>
            </div>
          </footer>
        </>
      )}

      {/* BALANZA DIGITAL */}
      {productoParaPesar && (
        <ModalPeso
          producto={productoParaPesar}
          tasaCambio={tasaCambio}
          alConfirmar={(pesoKilos) => {
            agregarAlCarrito(productoParaPesar, pesoKilos);
            setProductoParaPesar(null);
          }}
          alCerrar={() => setProductoParaPesar(null)}
        />
      )}

      {/* CUENTAS EN PAUSA */}
      {modalPausadosAbierto && (
        <div style={styles.overlayPausados}>
          <div style={styles.boxPausados}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PauseCircle color="#ea580c" size={20} />
                <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: '800', color: '#0f2a4a' }}>
                  Cuentas en Pausa ({pedidosPausados.length})
                </h3>
              </div>
              <button type="button" onClick={() => setModalPausadosAbierto(false)} style={styles.btnCerrarX}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
              {pedidosPausados.map((p) => (
                <div key={p.id} style={styles.itemPausadoCard}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>
                      {p.cliente?.nombre || 'Consumidor Final'}
                    </strong>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {p.fecha} · {p.carrito?.length} artículo(s)
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#00b050', marginTop: '2px' }}>
                      ${p.totalUSD.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => reanudarPedido(p)} style={styles.btnReanudar}>
                      <PlayCircle size={15} />
                      <span>Reanudar</span>
                    </button>
                    <button type="button" onClick={() => eliminarPedidoPausado(p.id)} style={styles.btnBorrarPausado}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRO */}
      <ModalCobro 
        abierto={modalCobroAbierto}
        alCerrar={() => setModalCobroAbierto(false)}
        totalUSD={totalUSD.toFixed(2)}
        totalBS={totalBS.toFixed(2)}
        tasaCambio={tasaCambio}
        clienteActual={clienteActual}
        setClienteActual={setClienteActual}
        clientes={clientes}
        guardarClienteEnDB={guardarClienteEnDB}
        alFinalizarVenta={alFinalizarVenta}
      />

      {/* MODAL TICKET */}
      {ticketModalData && (
        <TicketModal
          datos={ticketModalData}
          config={configEmpresa}
          tasaCambio={tasaCambio}
          alCerrar={() => setTicketModalData(null)}
        />
      )}

      <ScannerModal 
        abierto={camaraAbierta}
        alDetectar={(codigoLeido) => {
          const prod = productos.find(p => p.codigo === codigoLeido);
          if (prod) agregarAlCarrito(prod);
          else alert(`Código ${codigoLeido} no registrado.`);
          setCamaraAbierta(false);
        }}
        alCerrar={() => setCamaraAbierta(false)}
      />
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc' },
  topHeader: { padding: '8px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  headerFila1: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '10px' },
  logoTriggerClickable: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: 'pointer' },
  logoHeaderImg: { width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain', border: '1px solid #cbd5e1', flexShrink: 0, backgroundColor: '#fff' },
  avatarHeaderBox: { width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #bfdbfe' },
  infoNegocio: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  nombreNegocio: { margin: 0, fontSize: '0.96rem', fontWeight: '800', color: '#0f2a4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  subtextHeader: { fontSize: '0.72rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tasaChip: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f8fafc', padding: '5px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0 },
  btnSync: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  inputTasaMini: { width: '64px', padding: 0, border: 'none', background: 'transparent', textAlign: 'left', fontWeight: 'bold', fontSize: '0.78rem', color: '#0f172a', outline: 'none' },
  barraClienteMostrador: { backgroundColor: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', gap: '8px', flexShrink: 0 },
  inputDocMostrador: { border: 'none', background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', width: '130px', outline: 'none' },
  nombreClienteTag: { fontSize: '0.78rem', color: '#334155', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  seccionBuscador: { padding: '6px 12px', backgroundColor: '#fff', display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, position: 'relative' },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 28px 8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' },
  btnLimpiarInput: { position: 'absolute', right: '86px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 },
  desplegableSugerencias: { position: 'absolute', top: '42px', left: 0, right: '70px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 99999, maxHeight: '250px', overflowY: 'auto' },
  itemSugerencia: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  miniImgSugerencia: { width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  btnAgregar: { padding: '0 12px', backgroundColor: '#0f2a4a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 },
  btnCamara: { display: 'flex', alignItems: 'center', backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 9px', cursor: 'pointer', flexShrink: 0 },
  seccionCarrito: { flex: 1, overflowY: 'auto', padding: '8px 12px' },
  carritoVacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' },
  listaItems: { display: 'flex', flexDirection: 'column', gap: '6px' },
  itemFila: { backgroundColor: '#fff', padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', gap: '8px', border: '1px solid #f1f5f9' },
  btnCant: { width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  footer: { backgroundColor: '#fff', padding: '8px 12px 24px 12px', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)', flexShrink: 0 },
  filaTotales: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  totalBs: { fontSize: '1.15rem', fontWeight: 'bold', color: '#0f2a4a' },
  totalUsd: { fontSize: '1.15rem', fontWeight: '900', color: '#00b050' },
  botonesAccion: { display: 'flex', gap: '6px' },
  btnLimpiar: { backgroundColor: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '8px', padding: '10px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPausar: { border: '1px solid', borderRadius: '8px', padding: '10px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnCobrar: { flex: 1, backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '0.92rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  overlayPausados: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999999 },
  boxPausados: { backgroundColor: '#fff', borderRadius: '20px', maxWidth: '360px', width: '100%', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  itemPausadoCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  btnReanudar: { backgroundColor: '#eff6ff', color: '#0052cc', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 10px', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  btnBorrarPausado: { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }
};
