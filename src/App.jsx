import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, Camera, Trash2, Plus, Minus, DollarSign, X, 
  RefreshCw, User, Search, PauseCircle, PlayCircle, Store, Tag, Percent,
  AlertOctagon, PhoneCall, CheckCircle2, Sparkles
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
  { id: 1, codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', costoUSD: 0.92, precioUSD: 1.10, esPesado: false, aplicaPrecioMayor: true, precioMayorUSD: 0.98, cantMinimaMayor: 3, stock: 50, categoria: 'Víveres', imagen: '' },
  { id: 2, codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', costoUSD: 1.05, precioUSD: 1.35, esPesado: false, aplicaPrecioMayor: true, precioMayorUSD: 1.20, cantMinimaMayor: 3, stock: 40, categoria: 'Víveres', imagen: '' },
  { id: 3, codigo: 'Q-001', nombre: 'Queso Blanco Llanero', costoUSD: 3.50, precioUSD: 4.80, esPesado: true, aplicaPrecioMayor: true, precioMayorUSD: 4.30, cantMinimaMayor: 3, stock: 15.5, categoria: 'Charcutería', imagen: '' },
  { id: 4, codigo: 'J-002', nombre: 'Jamón de Pierna Plumrose', costoUSD: 6.20, precioUSD: 8.50, esPesado: true, aplicaPrecioMayor: false, precioMayorUSD: 0, cantMinimaMayor: 0, stock: 8.2, categoria: 'Charcutería', imagen: '' },
  { id: 5, codigo: 'V-003', nombre: 'Tomate Manzano', costoUSD: 1.10, precioUSD: 1.60, esPesado: true, aplicaPrecioMayor: false, precioMayorUSD: 0, cantMinimaMayor: 0, stock: 25.0, categoria: 'Verduras y Frutas', imagen: '' },
  { id: 6, codigo: '7591472015188', nombre: 'Spray Aclarante Farmatodo', costoUSD: 3.30, precioUSD: 4.50, esPesado: false, aplicaPrecioMayor: false, precioMayorUSD: 0, cantMinimaMayor: 0, stock: 15, categoria: 'Higiene Personal', imagen: '' },
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

const CAJAS_DEFAULT = [
  { id: 'caja_01', numero: 1, nombre: 'Caja 01', tipoGaveta: 'centralizada', codigoEnlace: '100001', creadaEn: 'Inicial' }
];

function normalizarDoc(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function App() {
  const [vistaActual, setVistaActual] = useState('pos');
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);
  const [onlineBackend, setOnlineBackend] = useState(false);
  const [licenciaBloqueada, setLicenciaBloqueada] = useState(false);
  const [modalReactivado, setModalReactivado] = useState(false);
  const [infoLicencia, setInfoLicencia] = useState(null);

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

  const [cuentasEnEspera, setCuentasEnEspera] = useState(() => {
    try {
      const g = localStorage.getItem('pos_espera_final');
      if (g) return JSON.parse(g);
    } catch (e) {}
    return [];
  });

  const [clienteActual, setClienteActual] = useState(CLIENTES_INICIALES[0]);
  const [tasaCambio, setTasaCambio] = useState(855.66);
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
  const [productoParaPesar, setProductoParaPesar] = useState(null);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

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
  useEffect(() => { try { localStorage.setItem('pos_espera_final', JSON.stringify(cuentasEnEspera)); } catch (e) {} }, [cuentasEnEspera]);

  const formatearProducto = (p) => ({
    id: String(p.id),
    codigo: String(p.codigo || p.codigo_barras || '').trim(),
    nombre: p.nombre || '',
    precioUSD: Number(p.precioUSD ?? p.precio_usd ?? p.precio ?? 0),
    costoUSD: Number(p.costoUSD ?? p.costo_usd ?? p.costo ?? 0),
    stock: Number(p.stock ?? 0),
    categoria: p.categoria || p.departamento || 'General',
    esPesado: Boolean(p.esPesado ?? p.es_pesado),
    aplicaPrecioMayor: Boolean(p.aplicaPrecioMayor ?? p.aplica_precio_mayor),
    precioMayorUSD: Number(p.precioMayorUSD ?? p.precio_mayor_usd ?? 0),
    cantMinimaMayor: Number(p.cantMinimaMayor ?? p.cant_minima_mayor ?? 3)
  });

  const sincronizarSilenciosamente = async () => {
    const conectadoSupabase = await dbService.checkConnection();
    setOnlineBackend(conectadoSupabase);

    const negId = cuentaMaster?.negocioId || usuarioActivo?.negocioId;
    if (negId) {
      // Sincronizar cajeros desde Supabase
      const cajerosSupabase = await dbService.getCajeros(negId);
      if (Array.isArray(cajerosSupabase) && cajerosSupabase.length > 0) {
        setCajeros(cajerosSupabase.map(c => ({
          id: c.id,
          nombre: c.nombre,
          pin: c.pin || ''
        })));
      }

      // Sincronizar ventas
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
      setConfigEmpresa(prev => ({ ...prev, nombre: res.negocio.nombre }));
      setUsuarioActivo({ rol: 'dueno', nombre: res.usuario.nombre, negocioId: res.negocio.id });
      if (!cajaActiva) setCajaActiva(CAJAS_DEFAULT[0]);
      setOnlineBackend(true);

      // Cargar cajeros del negocio
      const clist = await dbService.getCajeros(res.negocio.id);
      if (clist?.length) {
        setCajeros(clist.map(c => ({ id: c.id, nombre: c.nombre, pin: c.pin })));
      }
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

  const vincularTerminalPorCodigo = (codigo6) => {
    const coincidencia = cajas.find(c => String(c.codigoEnlace).trim() === String(codigo6).trim());
    if (coincidencia) {
      setCajaActiva({
        id: coincidencia.id,
        nombre: coincidencia.nombre,
        tipoGaveta: coincidencia.tipoGaveta,
        negocioId: cuentaMaster?.negocioId || 'neg_local'
      });
      return true;
    }
    return false;
  };

  const desvincularTerminal = () => {
    if (confirm('¿Deseas desvincular este dispositivo de su caja actual?')) {
      setCajaActiva(null);
      localStorage.removeItem('pos_caja_activa_local');
    }
  };

  const tasaNum = parseFloat(tasaCambio) || 1;
  const subtotalUSD = carrito.reduce((acc, p) => acc + (p.precioUSD * p.cantidad), 0);
  let montoDescuentoCalculado = 0;
  const vDescNum = parseFloat(valorDescuento) || 0;
  if (vDescNum > 0) {
    montoDescuentoCalculado = tipoDescuento === 'porcentaje' ? (subtotalUSD * vDescNum) / 100 : vDescNum;
  }
  montoDescuentoCalculado = Math.min(subtotalUSD, montoDescuentoCalculado);
  const totalUSD = Math.max(0, subtotalUSD - montoDescuentoCalculado);
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
        alVincularTerminalPorCodigo={vincularTerminalPorCodigo}
        alDesvincularTerminal={desvincularTerminal}
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
          infoLicencia={infoLicencia}
          alGuardarConfig={(n) => setConfigEmpresa(n)}
          alExportarBackup={() => {}}
          alImportarBackup={() => {}}
          alAbrirTerminales={() => setVistaActual('terminales')}
          alAbrirUsuarios={() => setVistaActual('usuarios')}
          alVolver={() => setVistaActual('pos')}
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
          alGuardarCaja={(caja) => {
            setCajas(prev => {
              const idx = prev.findIndex(item => item.id === caja.id);
              if (idx >= 0) {
                const copia = [...prev];
                copia[idx] = caja;
                return copia;
              }
              return [...prev, caja];
            });
          }}
          alEliminarCaja={(id) => setCajas(prev => prev.filter(c => c.id !== id))}
          alVolver={() => setVistaActual('configuracion')}
        />
      )}

      {vistaActual === 'inventario' && (
        <InventarioModal 
          productos={productos}
          tasaCambio={tasaCambio}
          esDueno={esDueno}
          alGuardarProducto={(p) => {}}
          alEliminarProducto={(id) => {}}
          alVolver={() => setVistaActual('pos')}
          alAbrirCamara={() => {}}
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

      {vistaActual === 'caja' && (
        <CajaModal 
          transacciones={transacciones}
          gastos={gastosCaja}
          tasaCambio={tasaCambio}
          configEmpresa={configEmpresa}
          usuarioActivo={usuarioActivo}
          alRegistrarGasto={() => {}}
          alEliminarGasto={() => {}}
          alCerrarTurno={() => {}}
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
          alAnularVenta={() => {}}
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

      {/* MOSTRADOR POS PRINCIPAL */}
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
                  <div style={styles.avatarHeaderBox}><Store size={18} color="#0052cc" /></div>
                )}
                <div style={styles.infoNegocio}>
                  <h1 style={styles.nombreNegocio}>{configEmpresa.nombre}</h1>
                  <div style={styles.subtextHeader}>
                    {esDueno ? (
                      <span style={{ color: '#15803d', fontWeight: 'bold' }}>
                        {usuarioActivo.nombre} (Dueño)
                      </span>
                    ) : (
                      <span>
                        {usuarioActivo.nombre} · {cajaActiva?.nombre || 'Caja'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.tasaChip}>
                <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold' }}>BCV</span>
                <button type="button" onClick={obtenerTasaBCV} style={styles.btnSync} title="Sincronizar BCV">
                  <RefreshCw size={10} color="#0052cc" />
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
              <User color="#0052cc" size={16} style={{ flexShrink: 0 }} />
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

          <section style={styles.seccionBuscador}>
            <div ref={wrapperRef} style={{ position: 'relative', flex: 1, display: 'flex', gap: '6px' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribe nombre o código..."
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                style={styles.inputBuscador}
              />
              <button type="button" style={styles.btnAgregar}>Ingresar</button>
            </div>
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
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>${item.precioUSD} c/u</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button type="button" style={styles.btnCant}><Minus size={13}/></button>
                      <span style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{item.cantidad}</span>
                      <button type="button" style={styles.btnCant}><Plus size={13}/></button>
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
              <button type="button" onClick={() => setCarrito([])} style={styles.btnLimpiar}><Trash2 size={17} /></button>
              <button type="button" style={styles.btnPausar}><PauseCircle size={17} /><span style={{ fontSize: '0.76rem', marginLeft: '3px', fontWeight: 'bold' }}>Pausar</span></button>
              <button type="button" onClick={() => { if (carrito.length === 0) return alert('Carrito vacío'); setModalCobroAbierto(true); }} style={styles.btnCobrar}>
                <DollarSign size={18} /> Cobrar Orden
              </button>
            </div>
          </footer>
        </>
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
        guardarClienteEnDB={() => {}}
        alFinalizarVenta={() => { setCarrito([]); setModalCobroAbierto(false); }}
      />

      <ScannerModal 
        abierto={camaraAbierta}
        alDetectar={(cod) => { setCamaraAbierta(false); }}
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
  nombreNegocio: { margin: 0, fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  subtextHeader: { fontSize: '0.72rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tasaChip: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f8fafc', padding: '5px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0 },
  btnSync: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  inputTasaMini: { width: '64px', padding: 0, border: 'none', background: 'transparent', textAlign: 'left', fontWeight: 'bold', fontSize: '0.78rem', color: '#0f172a', outline: 'none' },
  barraClienteMostrador: { backgroundColor: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', gap: '8px', flexShrink: 0 },
  inputDocMostrador: { border: 'none', background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', width: '130px', outline: 'none' },
  nombreClienteTag: { fontSize: '0.78rem', color: '#334155', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  seccionBuscador: { padding: '6px 12px', backgroundColor: '#fff', display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  inputBuscador: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' },
  btnAgregar: { padding: '0 10px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' },
  btnCamara: { display: 'flex', alignItems: 'center', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 9px', cursor: 'pointer' },
  seccionCarrito: { flex: 1, overflowY: 'auto', padding: '8px 12px' },
  carritoVacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' },
  listaItems: { display: 'flex', flexDirection: 'column', gap: '6px' },
  itemFila: { backgroundColor: '#fff', padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', gap: '8px', border: '1px solid #f1f5f9' },
  btnCant: { width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  footer: { backgroundColor: '#fff', padding: '8px 12px 24px 12px', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)', flexShrink: 0 },
  filaTotales: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  totalBs: { fontSize: '1.15rem', fontWeight: 'bold', color: '#0052cc' },
  totalUsd: { fontSize: '1.15rem', fontWeight: '900', color: '#16a34a' },
  botonesAccion: { display: 'flex', gap: '6px' },
  btnLimpiar: { backgroundColor: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '8px', padding: '10px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPausar: { backgroundColor: '#fff7ed', border: 'none', color: '#ea580c', borderRadius: '8px', padding: '10px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnCobrar: { flex: 1, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '0.92rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }
};
