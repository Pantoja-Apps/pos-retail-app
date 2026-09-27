import React, { useState } from 'react';
import { Store, ShieldCheck, UserCheck, KeyRound, Mail, ArrowRight, UserPlus, LogIn, Lock } from 'lucide-react';

export default function LoginModal({ cuentaMaster, cajeros = [], alRegistrarDueno, alIniciarSesionDueno, alIniciarSesionCajero }) {
  // Si no hay cuenta dueña guardada, permite alternar entre iniciar sesión o registrar
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [rolLogin, setRolLogin] = useState('dueno'); // 'dueno' | 'cajero'

  // Formulario Registro Dueño
  const [formRegistro, setFormRegistro] = useState({
    nombreNegocio: '',
    nombreDueno: '',
    correo: '',
    password: ''
  });

  // Formulario Login Dueño
  const [correoLogin, setCorreoLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // Formulario Login Cajero
  const [cajeroSeleccionadoId, setCajeroSeleccionadoId] = useState(cajeros[0]?.id || '');
  const [pinCajero, setPinCajero] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async (e) => {
    e.preventDefault();
    if (!formRegistro.nombreNegocio.trim() || !formRegistro.nombreDueno.trim()) {
      return alert('Por favor llena los datos del negocio y del dueño.');
    }
    if (!formRegistro.correo.includes('@')) return alert('Introduce un correo válido.');
    if (formRegistro.password.length < 6) return alert('La contraseña debe tener al menos 6 caracteres.');

    setCargando(true);
    try {
      await alRegistrarDueno(formRegistro);
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginDueno = async (e) => {
    e.preventDefault();
    if (!correoLogin.trim() || !passwordLogin.trim()) {
      return alert('Introduce tu correo y contraseña.');
    }
    setCargando(true);
    try {
      const ok = await alIniciarSesionDueno(correoLogin.trim(), passwordLogin.trim());
      if (!ok) {
        alert('Credenciales incorrectas o servidor no disponible. Verifica tus datos.');
      }
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginCajero = (e) => {
    e.preventDefault();
    if (!cajeroSeleccionadoId) return alert('Selecciona tu usuario de cajero.');
    if (!pinCajero.trim()) return alert('Introduce tu PIN de 4 dígitos.');

    const ok = alIniciarSesionCajero(Number(cajeroSeleccionadoId), pinCajero.trim());
    if (!ok) {
      alert('PIN de cajero incorrecto.');
      setPinCajero('');
    }
  };

  return (
    <div style={styles.contenedorFondo} translate="no">
      <div style={styles.cardLogin}>
        
        {/* ENCABEZADO CON LOGO */}
        <div style={styles.header}>
          <div style={styles.avatarIcon}>
            <Store size={32} color="#0052cc" />
          </div>
          <h2 style={styles.titulo}>Mi Bodega POS</h2>
          <p style={styles.subtitulo}>Sistema de Punto de Venta y Gestión</p>
        </div>

        {/* SELECTOR PRINCIPAL: INICIAR SESIÓN VS REGISTRARSE */}
        <div style={styles.barraPillsNav}>
          <button
            type="button"
            onClick={() => setModo('login')}
            style={{
              ...styles.btnPillNav,
              backgroundColor: modo === 'login' ? '#0052cc' : 'transparent',
              color: modo === 'login' ? '#fff' : '#64748b'
            }}
          >
            <LogIn size={15} /> Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={() => setModo('registro')}
            style={{
              ...styles.btnPillNav,
              backgroundColor: modo === 'registro' ? '#0052cc' : 'transparent',
              color: modo === 'registro' ? '#fff' : '#64748b'
            }}
          >
            <UserPlus size={15} /> Registrar Negocio
          </button>
        </div>

        {/* 1. MODO INICIAR SESIÓN */}
        {modo === 'login' && (
          <div style={{ marginTop: '14px' }}>
            {/* SUB-TABS: DUEÑO VS CAJERO */}
            <div style={styles.selectorRol}>
              <button
                type="button"
                onClick={() => setRolLogin('dueno')}
                style={{
                  ...styles.btnRol,
                  backgroundColor: rolLogin === 'dueno' ? '#fff' : 'transparent',
                  color: rolLogin === 'dueno' ? '#0f172a' : '#64748b',
                  boxShadow: rolLogin === 'dueno' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <ShieldCheck size={14} color={rolLogin === 'dueno' ? '#16a34a' : '#64748b'} />
                <span>Dueño / Master</span>
              </button>

              <button
                type="button"
                onClick={() => setRolLogin('cajero')}
                style={{
                  ...styles.btnRol,
                  backgroundColor: rolLogin === 'cajero' ? '#fff' : 'transparent',
                  color: rolLogin === 'cajero' ? '#0f172a' : '#64748b',
                  boxShadow: rolLogin === 'cajero' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <UserCheck size={14} color={rolLogin === 'cajero' ? '#0052cc' : '#64748b'} />
                <span>Cajero</span>
              </button>
            </div>

            {/* FORMULARIO LOGIN DUEÑO */}
            {rolLogin === 'dueno' && (
              <form onSubmit={manejarLoginDueno} style={styles.form}>
                <div style={styles.campo}>
                  <label style={styles.lbl}>Correo Electrónico Maestro</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={16} color="#64748b" style={styles.inputIcon} />
                    <input
                      type="email"
                      placeholder="dueno@gmail.com"
                      value={correoLogin}
                      onChange={(e) => setCorreoLogin(e.target.value)}
                      style={styles.inputWithIcon}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div style={styles.campo}>
                  <label style={styles.lbl}>Clave Maestra</label>
                  <div style={styles.inputWrapper}>
                    <Lock size={16} color="#64748b" style={styles.inputIcon} />
                    <input
                      type="password"
                      placeholder="••••••"
                      value={passwordLogin}
                      onChange={(e) => setPasswordLogin(e.target.value)}
                      style={styles.inputWithIcon}
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={cargando} style={styles.btnPrincipal}>
                  {cargando ? 'Verificando...' : 'Acceder al POS'} <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* FORMULARIO LOGIN CAJERO */}
            {rolLogin === 'cajero' && (
              <form onSubmit={manejarLoginCajero} style={styles.form}>
                {cajeros.length === 0 ? (
                  <div style={styles.avisoSinCajeros}>
                    No hay cajeros creados. Inicia sesión como <strong>Dueño</strong> para añadir cajeros desde la barra superior.
                  </div>
                ) : (
                  <>
                    <div style={styles.campo}>
                      <label style={styles.lbl}>Selecciona tu Nombre de Cajero</label>
                      <select
                        value={cajeroSeleccionadoId}
                        onChange={(e) => setCajeroSeleccionadoId(e.target.value)}
                        style={styles.select}
                      >
                        {cajeros.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.campo}>
                      <label style={styles.lbl}>PIN de Seguridad (4 Dígitos)</label>
                      <div style={styles.inputWrapper}>
                        <KeyRound size={16} color="#64748b" style={styles.inputIcon} />
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="••••"
                          value={pinCajero}
                          onChange={(e) => setPinCajero(e.target.value)}
                          style={{ ...styles.inputWithIcon, letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button type="submit" style={styles.btnPrincipal}>
                      Abrir Turno de Caja <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        )}

        {/* 2. MODO REGISTRAR NEGOCIO */}
        {modo === 'registro' && (
          <form onSubmit={manejarRegistro} style={{ ...styles.form, marginTop: '14px' }}>
            <div style={styles.campo}>
              <label style={styles.lbl}>Nombre de tu Negocio / Bodega *</label>
              <input
                type="text"
                placeholder="Ej: Inversiones Los Socios C.A."
                value={formRegistro.nombreNegocio}
                onChange={(e) => setFormRegistro({ ...formRegistro, nombreNegocio: e.target.value })}
                style={styles.input}
                required
                autoFocus
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Nombre del Propietario *</label>
              <input
                type="text"
                placeholder="Ej: Ángel Pantoja"
                value={formRegistro.nombreDueno}
                onChange={(e) => setFormRegistro({ ...formRegistro, nombreDueno: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Correo Electrónico Maestro *</label>
              <input
                type="email"
                placeholder="dueno@gmail.com"
                value={formRegistro.correo}
                onChange={(e) => setFormRegistro({ ...formRegistro, correo: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Clave Maestra (Mín. 6 caracteres) *</label>
              <input
                type="password"
                placeholder="••••••"
                value={formRegistro.password}
                onChange={(e) => setFormRegistro({ ...formRegistro, password: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <button type="submit" disabled={cargando} style={styles.btnPrincipal}>
              {cargando ? 'Configurando Negocio...' : 'Crear Cuenta y Comenzar'} <ArrowRight size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

const styles = {
  contenedorFondo: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  cardLogin: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '24px 20px',
    maxWidth: '380px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '14px'
  },
  avatarIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 8px auto',
    boxShadow: '0 4px 12px rgba(0, 82, 204, 0.12)'
  },
  titulo: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: '900',
    color: '#0f172a'
  },
  subtitulo: {
    margin: '2px 0 0 0',
    fontSize: '0.74rem',
    color: '#64748b'
  },
  barraPillsNav: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    backgroundColor: '#f1f5f9',
    padding: '3px',
    borderRadius: '12px'
  },
  btnPillNav: {
    border: 'none',
    borderRadius: '9px',
    padding: '8px 4px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  selectorRol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '3px',
    borderRadius: '10px',
    marginBottom: '10px'
  },
  btnRol: {
    border: 'none',
    borderRadius: '8px',
    padding: '7px 4px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    cursor: 'pointer'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  lbl: {
    fontSize: '0.72rem',
    fontWeight: 'bold',
    color: '#475569'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.86rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px'
  },
  inputWithIcon: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px 10px 36px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.86rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.86rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  btnPrincipal: {
    marginTop: '6px',
    width: '100%',
    padding: '12px',
    backgroundColor: '#0052cc',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(0, 82, 204, 0.25)'
  },
  avisoSinCajeros: {
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#9a3412',
    fontSize: '0.76rem',
    padding: '12px',
    borderRadius: '10px',
    lineHeight: 1.4,
    textAlign: 'center'
  }
};
