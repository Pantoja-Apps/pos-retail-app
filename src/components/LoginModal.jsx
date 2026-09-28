import React, { useState } from 'react';
import { 
  ShieldCheck, User, ArrowRight, RefreshCw, AlertCircle, 
  Smartphone, KeyRound, Monitor, CheckCircle2, X
} from 'lucide-react';

export default function LoginModal({
  cuentaMaster,
  cajeros = [],
  cajaActiva,
  alRegistrarDueno,
  alIniciarSesionDueno,
  alIniciarSesionCajero,
  alVincularTerminalPorQR,
  alVincularTerminalPorCodigo,
  alDesvincularTerminal
}) {
  // Predeterminado siempre en Acceso Dueño
  const [pestana, setPestana] = useState('dueno');
  const [esRegistro, setEsRegistro] = useState(!cuentaMaster);

  // Estados Dueño
  const [nombreDueno, setNombreDueno] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados Cajero PIN (6 DÍGITOS)
  const [cajeroSeleccionado, setCajeroSeleccionado] = useState(null);
  const [pinIngresado, setPinIngresado] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // Estados Modal Vinculación Terminal
  const [modalVincularAbierto, setModalVincularAbierto] = useState(false);
  const [codigoEnlaceInput, setCodigoEnlaceInput] = useState('');
  const [errorVincular, setErrorVincular] = useState('');

  const manejarSubmitDueno = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setCargando(true);

    try {
      if (esRegistro) {
        if (!nombreDueno || !nombreNegocio || !correo || !password) {
          setErrorLogin('Por favor completa todos los campos.');
          setCargando(false);
          return;
        }
        await alRegistrarDueno({ nombreDueno, nombreNegocio, correo, password });
      } else {
        const ok = await alIniciarSesionDueno(correo, password);
        if (!ok) {
          setErrorLogin('Correo o contraseña incorrectos.');
        }
      }
    } catch (err) {
      setErrorLogin('Ocurrió un error al procesar el acceso.');
    } finally {
      setCargando(false);
    }
  };

  const pulsarNumeroPin = (num) => {
    if (pinIngresado.length < 6) {
      const nuevoPin = pinIngresado + num;
      setPinIngresado(nuevoPin);
      setErrorPin(false);
      if (nuevoPin.length === 6) {
        verificarPin(nuevoPin);
      }
    }
  };

  const borrarNumeroPin = () => {
    setPinIngresado(prev => prev.slice(0, -1));
    setErrorPin(false);
  };

  const verificarPin = (pin) => {
    if (!cajeroSeleccionado) return;
    const ok = alIniciarSesionCajero(cajeroSeleccionado.id, pin);
    if (!ok) {
      setErrorPin(true);
      setTimeout(() => {
        setPinIngresado('');
        setErrorPin(false);
      }, 700);
    }
  };

  const procesarVinculacion = (e) => {
    e.preventDefault();
    setErrorVincular('');
    const cod = codigoEnlaceInput.trim();
    if (!cod) return;

    if (alVincularTerminalPorCodigo) {
      const exito = alVincularTerminalPorCodigo(cod);
      if (exito) {
        setModalVincularAbierto(false);
        setCodigoEnlaceInput('');
        alert('¡Dispositivo vinculado con éxito a la caja!');
      } else {
        setErrorVincular('Código de caja inválido o no encontrado en el sistema.');
      }
    }
  };

  return (
    <div style={styles.contenedor} translate="no">
      <div style={styles.orbe1} />
      <div style={styles.orbe2} />
      <div style={styles.orbe3} />

      <div style={styles.tarjetaLogin}>
        {/* Cabecera con el Isotipo Oficial y Nombre de Marca */}
        <div style={styles.logoHeader}>
          <img src="/isotipo_login.png" alt="Facilito POS" style={styles.logoImg} />
          <div style={styles.tituloMarca}>
            <span style={{ color: '#0f2a4a' }}>FACILITO </span>
            <span style={{ color: '#00b050' }}>POS</span>
          </div>
          <span style={styles.tagline}>Sistema Integral de Facturación</span>
        </div>

        {/* Pestañas de Selección: 1. Acceso Dueño | 2. Turno Cajeros */}
        <div style={styles.tabsContainer}>
          <button
            type="button"
            onClick={() => { setPestana('dueno'); setErrorLogin(''); }}
            style={{
              ...styles.tabBtn,
              backgroundColor: pestana === 'dueno' ? '#0f2a4a' : 'transparent',
              color: pestana === 'dueno' ? '#fff' : '#64748b'
            }}
          >
            <ShieldCheck size={15} />
            <span>Acceso Dueño</span>
          </button>

          <button
            type="button"
            onClick={() => { setPestana('cajeros'); setCajeroSeleccionado(null); setPinIngresado(''); }}
            style={{
              ...styles.tabBtn,
              backgroundColor: pestana === 'cajeros' ? '#0f2a4a' : 'transparent',
              color: pestana === 'cajeros' ? '#fff' : '#64748b'
            }}
          >
            <User size={15} />
            <span>Turno Cajeros</span>
          </button>
        </div>

        {/* VISTA 1: ACCESO DUEÑO (PREDETERMINADA) */}
        {pestana === 'dueno' && (
          <form onSubmit={manejarSubmitDueno} style={styles.formularioDueno}>
            {errorLogin && <div style={styles.alertaError}>{errorLogin}</div>}

            {esRegistro && (
              <>
                <div style={styles.campo}>
                  <label style={styles.label}>Tu Nombre Completo</label>
                  <input
                    type="text"
                    value={nombreDueno}
                    onChange={(e) => setNombreDueno(e.target.value)}
                    style={styles.input}
                    placeholder="Ej. Ángel Pantoja"
                    required
                  />
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Nombre de tu Comercio</label>
                  <input
                    type="text"
                    value={nombreNegocio}
                    onChange={(e) => setNombreNegocio(e.target.value)}
                    style={styles.input}
                    placeholder="Ej. MiniMarket JJJP"
                    required
                  />
                </div>
              </>
            )}

            <div style={styles.campo}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                style={styles.input}
                placeholder="dueno@gmail.com"
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Contraseña de Administrador</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={cargando} style={styles.btnSubmitDueno}>
              {cargando ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
              <span>{esRegistro ? 'Crear Negocio e Iniciar' : 'Ingresar al Panel'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setEsRegistro(!esRegistro); setErrorLogin(''); }}
              style={styles.btnToggleRegistro}
            >
              {esRegistro ? '¿Ya tienes cuenta registrada? Inicia Sesión' : '¿Nuevo negocio? Regístrate aquí'}
            </button>
          </form>
        )}

        {/* VISTA 2: TURNO CAJEROS CON 6 DÍGITOS */}
        {pestana === 'cajeros' && (
          <div style={styles.cuerpoCajeros}>
            {!cajeroSeleccionado ? (
              <>
                <p style={styles.subtituloGuia}>Selecciona tu perfil para iniciar turno:</p>
                <div style={styles.listaCajerosGrid}>
                  {cajeros.length === 0 ? (
                    <div style={styles.cajaSinCajeros}>
                      <AlertCircle size={22} color="#d97706" />
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.4 }}>
                        No hay cajeros registrados aún. Inicia sesión en <strong>Acceso Dueño</strong> para crear personal.
                      </p>
                    </div>
                  ) : (
                    cajeros.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCajeroSeleccionado(c); setPinIngresado(''); setErrorPin(false); }}
                        style={styles.cardCajeroItem}
                      >
                        <div style={styles.avatarCajero}>
                          <User size={20} color="#0f2a4a" />
                        </div>
                        <span style={styles.nombreCajero}>{c.nombre}</span>
                        <small style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>Cajero</small>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div style={styles.contenedorTecladoPin}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                  <button type="button" onClick={() => { setCajeroSeleccionado(null); setPinIngresado(''); }} style={styles.btnVolverCajeros}>
                    ← Cambiar
                  </button>
                  <strong style={{ fontSize: '0.88rem', color: '#0f2a4a' }}>{cajeroSeleccionado.nombre}</strong>
                  <div style={{ width: '50px' }} />
                </div>

                {/* 6 Indicadores de PIN */}
                <div style={styles.indicadoresPinFila}>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div 
                      key={idx} 
                      style={{
                        ...styles.dotPin,
                        backgroundColor: pinIngresado.length > idx ? (errorPin ? '#dc2626' : '#00b050') : '#e2e8f0',
                        borderColor: errorPin ? '#dc2626' : (pinIngresado.length > idx ? '#00b050' : '#cbd5e1')
                      }} 
                    />
                  ))}
                </div>
                {errorPin && <small style={styles.textoPinInvalido}>PIN Incorrecto (6 dígitos)</small>}

                <div style={styles.tecladoNumerico}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button key={n} type="button" onClick={() => pulsarNumeroPin(n)} style={styles.btnTecla}>
                      {n}
                    </button>
                  ))}
                  <div style={styles.btnTeclaVacia} />
                  <button type="button" onClick={() => pulsarNumeroPin(0)} style={styles.btnTecla}>
                    0
                  </button>
                  <button type="button" onClick={borrarNumeroPin} style={styles.btnTeclaBorrar}>
                    ⌫
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PIE CON INFORMACIÓN DE CAJA Y VINCULACIÓN */}
        <div style={styles.footerVinculacion}>
          <div style={styles.cajaInfoTerminalActual}>
            <Smartphone size={14} color="#64748b" />
            <span style={{ fontSize: '0.72rem', color: '#475569' }}>
              Caja asignada: <strong>{cajaActiva?.nombre || 'Sin vincular'}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalVincularAbierto(true)}
            style={styles.btnAbrirVinculacion}
          >
            <KeyRound size={13} />
            <span>Vincular este dispositivo a una Caja</span>
          </button>
        </div>
      </div>

      {/* MODAL DE VINCULACIÓN POR CÓDIGO */}
      {modalVincularAbierto && (
        <div style={styles.overlayModal} translate="no">
          <div style={styles.cajaModalVinculo}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={20} color="#0f2a4a" />
                <h3 style={{ margin: 0, fontSize: '0.96rem', color: '#0f2a4a', fontWeight: '800' }}>
                  Vincular Dispositivo
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setModalVincularAbierto(false)} 
                style={styles.btnCerrarX}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '0.76rem', color: '#64748b', lineHeight: 1.45 }}>
              Ingresa el código de 6 dígitos configurado en la terminal principal:
            </p>

            {errorVincular && <div style={styles.alertaError}>{errorVincular}</div>}

            <form onSubmit={procesarVinculacion}>
              <input
                type="text"
                maxLength={6}
                placeholder="Código (Ej: 100001)"
                value={codigoEnlaceInput}
                onChange={(e) => setCodigoEnlaceInput(e.target.value.replace(/\D/g, ''))}
                style={styles.inputCodigoVinculo}
                autoFocus
              />

              <button type="submit" style={styles.btnConfirmarVinculo}>
                <CheckCircle2 size={16} />
                <span>Confirmar y Enlazar Caja</span>
              </button>
            </form>

            {cajaActiva && (
              <button
                type="button"
                onClick={() => {
                  if (alDesvincularTerminal) alDesvincularTerminal();
                  setModalVincularAbierto(false);
                }}
                style={styles.btnDesvincularActual}
              >
                Desvincular caja actual ({cajaActiva.nombre})
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatSlow1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.1); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-35px, 30px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  contenedor: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#071529',
    backgroundImage: 'radial-gradient(at 10% 20%, rgba(0, 176, 80, 0.18) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(15, 42, 74, 0.8) 0px, transparent 50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    zIndex: 999999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden'
  },
  orbe1: {
    position: 'absolute',
    top: '-80px',
    left: '-80px',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0, 176, 80, 0.35) 0%, rgba(0, 176, 80, 0) 70%)',
    filter: 'blur(40px)',
    animation: 'floatSlow1 12s ease-in-out infinite',
    pointerEvents: 'none'
  },
  orbe2: {
    position: 'absolute',
    bottom: '-100px',
    right: '-100px',
    width: '380px',
    height: '380px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(15, 42, 74, 0) 70%)',
    filter: 'blur(50px)',
    animation: 'floatSlow2 14s ease-in-out infinite',
    pointerEvents: 'none'
  },
  orbe3: {
    position: 'absolute',
    top: '40%',
    right: '15%',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0, 82, 204, 0.25) 0%, transparent 70%)',
    filter: 'blur(45px)',
    pointerEvents: 'none'
  },
  tarjetaLogin: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    maxWidth: '380px',
    width: '100%',
    padding: '24px 22px 20px 22px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1
  },
  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px'
  },
  logoImg: {
    height: '80px',
    width: '80px',
    objectFit: 'contain'
  },
  tituloMarca: {
    fontSize: '1.25rem',
    fontWeight: '900',
    letterSpacing: '1px',
    marginTop: '6px'
  },
  tagline: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '2px'
  },
  tabsContainer: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    padding: '3px',
    marginBottom: '16px'
  },
  tabBtn: {
    flex: 1,
    border: 'none',
    borderRadius: '10px',
    padding: '9px 10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  cuerpoCajeros: {
    display: 'flex',
    flexDirection: 'column'
  },
  subtituloGuia: {
    margin: '0 0 12px 0',
    fontSize: '0.78rem',
    color: '#64748b',
    textAlign: 'center'
  },
  listaCajerosGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  cardCajeroItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer'
  },
  avatarCajero: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px'
  },
  nombreCajero: {
    fontSize: '0.84rem',
    fontWeight: 'bold',
    color: '#0f2a4a'
  },
  cajaSinCajeros: {
    gridColumn: '1 / -1',
    backgroundColor: '#fffbeb',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'center',
    border: '1px solid #fde68a'
  },
  contenedorTecladoPin: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  btnVolverCajeros: {
    background: 'none',
    border: 'none',
    color: '#00b050',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: 0
  },
  indicadoresPinFila: {
    display: 'flex',
    gap: '10px',
    margin: '10px 0 6px 0'
  },
  dotPin: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid'
  },
  textoPinInvalido: {
    color: '#dc2626',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  tecladoNumerico: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    width: '100%',
    maxWidth: '240px',
    marginTop: '8px'
  },
  btnTecla: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#0f2a4a',
    cursor: 'pointer'
  },
  btnTeclaVacia: {
    background: 'none',
    border: 'none'
  },
  btnTeclaBorrar: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#dc2626',
    cursor: 'pointer'
  },
  formularioDueno: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  alertaError: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#475569'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.84rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  btnSubmitDueno: {
    width: '100%',
    padding: '11px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.86rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '6px',
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.35)'
  },
  btnToggleRegistro: {
    background: 'none',
    border: 'none',
    color: '#0f2a4a',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '4px'
  },
  footerVinculacion: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px dashed #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  cajaInfoTerminalActual: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  btnAbrirVinculacion: {
    background: 'none',
    border: 'none',
    color: '#0052cc',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  overlayModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 9999999
  },
  cajaModalVinculo: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    maxWidth: '340px',
    width: '100%',
    padding: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
  },
  btnCerrarX: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  inputCodigoVinculo: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    textAlign: 'center',
    letterSpacing: '8px',
    fontSize: '1.4rem',
    fontWeight: '900',
    borderRadius: '12px',
    border: '2px solid #cbd5e1',
    outline: 'none',
    color: '#0f2a4a',
    backgroundColor: '#f8fafc',
    marginBottom: '12px'
  },
  btnConfirmarVinculo: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.86rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  btnDesvincularActual: {
    width: '100%',
    marginTop: '8px',
    padding: '8px',
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
