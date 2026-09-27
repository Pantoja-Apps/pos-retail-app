import React, { useState, useEffect } from 'react';
import { 
  Store, ShieldCheck, UserCheck, KeyRound, Mail, ArrowRight, 
  UserPlus, LogIn, Lock, QrCode, Monitor, Camera, X, RefreshCw
} from 'lucide-react';
import ScannerModal from './ScannerModal';
import { apiService } from '../services/api';

export default function LoginModal({ 
  cuentaMaster, 
  cajeros = [], 
  cajaActiva,
  alRegistrarDueno, 
  alIniciarSesionDueno, 
  alIniciarSesionCajero,
  alVincularTerminalPorQR,
  alVincularTerminalPorCodigo,
  alDesvincularTerminal,
  alActualizarCajerosLista
}) {
  const esTerminalSecundaria = Boolean(cajaActiva && cajaActiva.id !== 'caja_01');
  const [modo, setModo] = useState('login');
  const [rolLogin, setRolLogin] = useState(esTerminalSecundaria ? 'cajero' : 'dueno');

  const [formRegistro, setFormRegistro] = useState({
    nombreNegocio: '',
    nombreDueno: '',
    correo: '',
    password: ''
  });

  const [correoLogin, setCorreoLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const [cajeroSeleccionadoId, setCajeroSeleccionadoId] = useState(cajeros[0]?.id ? String(cajeros[0].id) : '');
  const [pinCajero, setPinCajero] = useState('');
  const [cargando, setCargando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const [modalEscanearQR, setModalEscanearQR] = useState(false);
  const [modalCodigoPC, setModalCodigoPC] = useState(false);
  const [inputCodigo6, setInputCodigo6] = useState('');

  const cargarCajerosServidor = async () => {
    setSincronizando(true);
    try {
      const lista = await apiService.obtenerCajeros('neg_local');
      if (Array.isArray(lista) && lista.length > 0) {
        if (typeof alActualizarCajerosLista === 'function') {
          alActualizarCajerosLista(lista);
        }
        setCajeroSeleccionadoId(String(lista[0].id));
      }
    } catch (e) {
      console.error('Error al sincronizar cajeros:', e);
    } finally {
      setSincronizando(false);
    }
  };

  useEffect(() => {
    if (cajeros.length > 0 && !cajeroSeleccionadoId) {
      setCajeroSeleccionadoId(String(cajeros[0].id));
    }
  }, [cajeros]);

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
        alert('Credenciales incorrectas.');
      }
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginCajero = (e) => {
    e.preventDefault();
    if (!cajeroSeleccionadoId) return alert('Selecciona tu usuario de cajero.');
    if (!pinCajero.trim()) return alert('Introduce tu PIN de seguridad.');

    // Comparar tanto por string como por número para evitar discrepancias
    const ok = alIniciarSesionCajero(Number(cajeroSeleccionadoId), pinCajero.trim()) ||
               alIniciarSesionCajero(String(cajeroSeleccionadoId), pinCajero.trim());

    if (!ok) {
      // Verificación directa en la lista actual por si acaso
      const cajeroObj = cajeros.find(c => String(c.id) === String(cajeroSeleccionadoId));
      if (cajeroObj && String(cajeroObj.pin) === String(pinCajero.trim())) {
        window.location.reload();
        return;
      }
      alert('PIN de cajero incorrecto.');
      setPinCajero('');
    }
  };

  const procesarDeteccionQR = async (texto) => {
    try {
      let data = null;
      if (texto.startsWith('POS|')) {
        const p = texto.split('|');
        data = {
          cajaId: p[1],
          cajaNombre: p[2],
          tipoGaveta: p[3] || 'centralizada',
          codigoEnlace: p[4]
        };
      } else {
        data = JSON.parse(texto);
      }

      if (data && data.cajaId) {
        setModalEscanearQR(false);
        alVincularTerminalPorQR(data);
        setRolLogin('cajero');
        alert(`¡Terminal vinculada con éxito como ${data.cajaNombre}!`);
        await cargarCajerosServidor();
      }
    } catch (err) {
      alert('Código QR no reconocido.');
    }
  };

  const procesarVinculacionPC = async (e) => {
    e.preventDefault();
    const cod = inputCodigo6.trim();
    if (cod.length !== 6) return alert('Introduce el código de 6 dígitos.');

    const ok = alVincularTerminalPorCodigo(cod);
    if (ok) {
      setModalCodigoPC(false);
      setInputCodigo6('');
      setRolLogin('cajero');
      alert('¡PC vinculada con éxito a la caja!');
      await cargarCajerosServidor();
    } else {
      alert('Código no encontrado o incorrecto.');
    }
  };

  return (
    <div style={styles.contenedorFondo} translate="no">
      <div style={styles.cardLogin}>
        
        {/* ENCABEZADO */}
        <div style={styles.header}>
          <div style={styles.avatarIcon}>
            <Store size={32} color="#0052cc" />
          </div>
          <h2 style={styles.titulo}>Mi Bodega POS</h2>
          
          {cajaActiva ? (
            <div style={styles.badgeTerminalConectada}>
              <Monitor size={12} color="#16a34a" />
              <span>Terminal Activa: <strong>{cajaActiva.nombre}</strong></span>
              <button 
                type="button" 
                onClick={alDesvincularTerminal}
                style={styles.btnDesvincularMini}
                title="Desvincular este dispositivo"
              >
                (Cambiar)
              </button>
            </div>
          ) : (
            <p style={styles.subtitulo}>Sistema de Punto de Venta y Gestión</p>
          )}
        </div>

        {/* NAVEGACIÓN SUPERIOR */}
        {!esTerminalSecundaria && (
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
        )}

        {/* MODO INICIAR SESIÓN */}
        {modo === 'login' && (
          <div style={{ marginTop: esTerminalSecundaria ? '6px' : '14px' }}>
            
            {!esTerminalSecundaria && (
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
            )}

            {/* LOGIN DUEÑO */}
            {rolLogin === 'dueno' && !esTerminalSecundaria && (
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

            {/* LOGIN CAJERO */}
            {rolLogin === 'cajero' && (
              <form onSubmit={manejarLoginCajero} style={styles.form}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.lbl}>Selecciona tu Nombre de Empleado</label>
                  <button 
                    type="button" 
                    onClick={cargarCajerosServidor}
                    disabled={sincronizando}
                    style={styles.btnSincronizarCajeros}
                    title="Actualizar lista desde el servidor"
                  >
                    <RefreshCw size={11} className={sincronizando ? 'animate-spin' : ''} /> 
                    <span>{sincronizando ? 'Conectando...' : 'Sincronizar'}</span>
                  </button>
                </div>

                {cajeros.length === 0 ? (
                  <div style={styles.avisoSinCajeros}>
                    No hay cajeros creados. Abre el POS como <strong>Dueño</strong> en el teléfono principal para enviar la información al servidor, y luego toca <strong>"Sincronizar"</strong> aquí.
                  </div>
                ) : (
                  <>
                    <select
                      value={cajeroSeleccionadoId}
                      onChange={(e) => setCajeroSeleccionadoId(e.target.value)}
                      style={styles.selectCajeroVisible}
                    >
                      {cajeros.map(c => (
                        <option key={c.id} value={String(c.id)} style={{ color: '#0f172a', backgroundColor: '#fff' }}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>

                    <div style={styles.campo}>
                      <label style={styles.lbl}>PIN de Seguridad</label>
                      <div style={styles.inputWrapper}>
                        <KeyRound size={16} color="#0052cc" style={styles.inputIcon} />
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="••••"
                          value={pinCajero}
                          onChange={(e) => setPinCajero(e.target.value.replace(/[^0-9]/g, ''))}
                          style={styles.inputPinVisible}
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

        {/* REGISTRO NEGOCIO */}
        {modo === 'registro' && !esTerminalSecundaria && (
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

        {/* VINCULACIÓN DUAL */}
        {!cajaActiva && (
          <div style={styles.seccionPieVinculacion}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px' }}>
              ¿Es este un dispositivo secundario para un empleado?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setModalEscanearQR(true)}
                style={styles.btnVinculacionSecundaria}
              >
                <QrCode size={14} color="#0052cc" />
                <span>Escanear QR</span>
              </button>

              <button
                type="button"
                onClick={() => setModalCodigoPC(true)}
                style={styles.btnVinculacionSecundaria}
              >
                <Monitor size={14} color="#16a34a" />
                <span>Código PC (6 Díg)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      <ScannerModal
        abierto={modalEscanearQR}
        alDetectar={procesarDeteccionQR}
        alCerrar={() => setModalEscanearQR(false)}
      />

      {modalCodigoPC && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBoxCard}>
            <div style={styles.headerModal}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>Vincular Terminal por Código</h3>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Para PC Windows o dispositivos sin cámara</small>
              </div>
              <button type="button" onClick={() => setModalCodigoPC(false)} style={styles.btnCerrarX}><X size={18} /></button>
            </div>

            <form onSubmit={procesarVinculacionPC} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={styles.campo}>
                <label style={styles.lbl}>Escribe el Código de 6 Dígitos generado en la pantalla del dueño:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ej: 956390"
                  value={inputCodigo6}
                  onChange={(e) => setInputCodigo6(e.target.value.replace(/[^0-9]/g, ''))}
                  style={styles.inputCodigo6}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" style={styles.btnPrincipal}>
                Vincular este Equipo
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  contenedorFondo: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  cardLogin: { backgroundColor: '#fff', borderRadius: '24px', padding: '24px 20px', maxWidth: '380px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  header: { textAlign: 'center', marginBottom: '14px' },
  avatarIcon: { width: '60px', height: '60px', borderRadius: '18px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', boxShadow: '0 4px 12px rgba(0, 82, 204, 0.12)' },
  titulo: { margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' },
  subtitulo: { margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' },
  badgeTerminalConectada: { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', marginTop: '6px' },
  btnDesvincularMini: { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.66rem', fontWeight: 'bold', padding: 0 },

  barraPillsNav: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '12px' },
  btnPillNav: { border: 'none', borderRadius: '9px', padding: '8px 4px', fontSize: '0.76rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', transition: 'all 0.2s' },
  selectorRol: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px', borderRadius: '10px', marginBottom: '10px' },
  btnRol: { border: 'none', borderRadius: '8px', padding: '7px 4px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  lbl: { fontSize: '0.72rem', fontWeight: 'bold', color: '#334155' },
  btnSincronizarCajeros: { background: 'none', border: 'none', color: '#0052cc', fontSize: '0.68rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px' },
  inputWithIcon: { width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a' },
  
  // ESTILOS DE MÁXIMO CONTRASTE Y VISIBILIDAD PARA EL TELÉFONO SECUNDARIO
  selectCajeroVisible: { 
    width: '100%', 
    boxSizing: 'border-box', 
    padding: '11px 12px', 
    borderRadius: '10px', 
    border: '2px solid #0052cc', 
    fontSize: '0.94rem', 
    fontWeight: '700', 
    outline: 'none', 
    backgroundColor: '#ffffff', 
    color: '#0f172a',
    display: 'block',
    appearance: 'auto',
    cursor: 'pointer'
  },
  inputPinVisible: { 
    width: '100%', 
    boxSizing: 'border-box', 
    padding: '10px 12px 10px 38px', 
    borderRadius: '10px', 
    border: '1.5px solid #cbd5e1', 
    fontSize: '1.3rem', 
    fontWeight: '900', 
    letterSpacing: '8px', 
    textAlign: 'center', 
    outline: 'none', 
    backgroundColor: '#ffffff', 
    color: '#0f172a' 
  },

  btnPrincipal: { marginTop: '6px', width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0, 82, 204, 0.25)' },
  avisoSinCajeros: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.76rem', padding: '12px', borderRadius: '10px', lineHeight: 1.4, textAlign: 'center' },

  seccionPieVinculacion: { marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0', textAlign: 'center' },
  btnVinculacionSecundaria: { backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 4px', fontSize: '0.72rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBoxCard: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '340px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  headerModal: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  inputCodigo6: { width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: '2px solid #0052cc', fontSize: '1.4rem', fontWeight: '900', textAlign: 'center', letterSpacing: '6px', color: '#0052cc', outline: 'none' }
};
