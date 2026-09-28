import React, { useState } from 'react';
import { 
  User, ShieldCheck, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';

export default function LoginModal({
  cuentaMaster,
  cajeros = [],
  cajaActiva,
  alRegistrarDueno,
  alIniciarSesionDueno,
  alIniciarSesionCajero
}) {
  const [pestana, setPestana] = useState('cajeros'); // 'cajeros' | 'dueno'
  const [esRegistro, setEsRegistro] = useState(!cuentaMaster);

  // Estados dueño
  const [nombreDueno, setNombreDueno] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados cajero PIN
  const [cajeroSeleccionado, setCajeroSeleccionado] = useState(null);
  const [pinIngresado, setPinIngresado] = useState('');
  const [errorPin, setErrorPin] = useState(false);

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
    if (pinIngresado.length < 4) {
      const nuevoPin = pinIngresado + num;
      setPinIngresado(nuevoPin);
      setErrorPin(false);
      if (nuevoPin.length === 4) {
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

  return (
    <div style={styles.contenedor} translate="no">
      {/* Orbes de fondo animados */}
      <div style={styles.orbe1} />
      <div style={styles.orbe2} />
      <div style={styles.orbe3} />

      <div style={styles.tarjetaLogin}>
        {/* Cabecera con la imagen oficial real */}
        <div style={styles.logoHeader}>
          <img src="/logo_oficial_real.png" alt="Facilito POS Logo" style={styles.logoImg} />
          <span style={styles.tagline}>Sistema Integral de Facturación</span>
        </div>

        {/* Pestañas de Selección */}
        <div style={styles.tabsContainer}>
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
        </div>

        {/* PESTAÑA: CAJEROS */}
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
                        No hay cajeros registrados aún. Inicia sesión como dueño para crear personal.
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                  <button type="button" onClick={() => { setCajeroSeleccionado(null); setPinIngresado(''); }} style={styles.btnVolverCajeros}>
                    ← Cambiar
                  </button>
                  <strong style={{ fontSize: '0.88rem', color: '#0f2a4a' }}>{cajeroSeleccionado.nombre}</strong>
                  <div style={{ width: '50px' }} />
                </div>

                <div style={styles.indicadoresPinFila}>
                  {[0, 1, 2, 3].map((idx) => (
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
                {errorPin && <small style={styles.textoPinInvalido}>PIN Incorrecto</small>}

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

        {/* PESTAÑA: DUEÑO */}
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
      </div>

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
    padding: '28px 22px 24px 22px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1
  },
  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '18px'
  },
  logoImg: {
    height: '56px',
    maxWidth: '230px',
    objectFit: 'contain'
  },
  tagline: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: '700',
    marginTop: '6px'
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
    gap: '12px',
    margin: '12px 0 6px 0'
  },
  dotPin: {
    width: '16px',
    height: '16px',
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
    marginTop: '10px'
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
  }
};
