import React, { useState, useEffect } from 'react';
import { 
  Store, ShieldCheck, UserCheck, KeyRound, Mail, ArrowRight, 
  UserPlus, LogIn, Lock, QrCode, Monitor, Camera, X, RefreshCw, Smartphone
} from 'lucide-react';
import ScannerModal from './ScannerModal';
import { dbService } from '../services/dbService';

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
  const [modo, setModo] = useState('login'); // 'login' | 'registro' | 'vincular'
  const [rolLogin, setRolLogin] = useState('dueno');

  const [formRegistro, setFormRegistro] = useState({
    nombreNegocio: '',
    nombreDueno: '',
    correo: '',
    password: ''
  });

  const [correoLogin, setCorreoLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const [cajeroSeleccionadoId, setCajeroSeleccionadoId] = useState('');
  const [pinCajero, setPinCajero] = useState('');
  const [cargando, setCargando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const [modalEscanearQR, setModalEscanearQR] = useState(false);
  const [modalCodigoPC, setModalCodigoPC] = useState(false);
  const [inputCodigo6, setInputCodigo6] = useState('');

  // Cargar cajeros desde Supabase si se conoce el negocio o caja activa
  const sincronizarCajerosSupabase = async () => {
    setSincronizando(true);
    try {
      const negId = cajaActiva?.negocioId || cuentaMaster?.negocioId;
      if (negId) {
        const lista = await dbService.getCajeros(negId);
        if (Array.isArray(lista) && lista.length > 0) {
          if (typeof alActualizarCajerosLista === 'function') {
            alActualizarCajerosLista(lista);
          }
          setCajeroSeleccionadoId(String(lista[0].id));
        }
      }
    } catch (e) {
      console.error('Error sincronizando cajeros:', e);
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
      return alert('Por favor llena el nombre de tu negocio y el nombre del dueño.');
    }
    if (!formRegistro.correo.includes('@')) return alert('Introduce un correo válido.');
    if (formRegistro.password.length < 6) return alert('La contraseña debe tener al menos 6 caracteres.');

    setCargando(true);
    try {
      await alRegistrarDueno(formRegistro);
    } catch (err) {
      console.error(err);
      alert('Error creando cuenta. Revisa tu conexión.');
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
      if (!ok) alert('Credenciales incorrectas o negocio no registrado.');
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginCajero = (e) => {
    e.preventDefault();
    if (!cajeroSeleccionadoId) return alert('Selecciona tu nombre de empleado.');
    if (!pinCajero.trim()) return alert('Introduce tu PIN.');

    const ok = alIniciarSesionCajero(String(cajeroSeleccionadoId), pinCajero.trim()) ||
               alIniciarSesionCajero(Number(cajeroSeleccionadoId), pinCajero.trim());

    if (!ok) {
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
          codigoEnlace: p[4],
          negocioId: p[5] || 'neg_local'
        };
      } else {
        data = JSON.parse(texto);
      }

      if (data && (data.cajaId || data.id)) {
        setModalEscanearQR(false);
        alVincularTerminalPorQR(data);
        setModo('login');
        setRolLogin('cajero');
        alert(`¡Dispositivo vinculado con éxito como ${data.cajaNombre || data.nombre}!`);
        await sincronizarCajerosSupabase();
      }
    } catch {
      alert('Código QR no válido para vinculación.');
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
      setModo('login');
      setRolLogin('cajero');
      alert('¡Dispositivo vinculado con éxito a la caja!');
      await sincronizarCajerosSupabase();
    } else {
      alert('Código no encontrado. Asegúrate de haber creado la terminal en el teléfono del Dueño.');
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
          <h2 style={styles.titulo}>Facilito POS</h2>
          
          {cajaActiva && (
            <div style={styles.badgeTerminalConectada}>
              <Monitor size={12} color="#16a34a" />
              <span>Terminal: <strong>{cajaActiva.nombre}</strong></span>
              <button 
                type="button" 
                onClick={alDesvincularTerminal}
                style={styles.btnDesvincularMini}
                title="Cambiar caja"
              >
                (Cambiar)
              </button>
            </div>
          )}
        </div>

        {/* SELECTOR DE ACCIÓN: LOGIN | REGISTRO | VINCULAR */}
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
            <LogIn size={14} /> Entrar
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
            <UserPlus size={14} /> Nuevo Negocio
          </button>

          <button 
            type="button" 
            onClick={() => setModo('vincular')} 
            style={{ 
              ...styles.btnPillNav, 
              backgroundColor: modo === 'vincular' ? '#0052cc' : 'transparent',
              color: modo === 'vincular' ? '#fff' : '#64748b' 
            }}
          >
            <Smartphone size={14} /> Vincular
          </button>
        </div>

        {/* 1. MODO: INICIAR SESIÓN */}
        {modo === 'login' && (
          <div style={{ marginTop: '14px' }}>
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

            {/* Login Dueño */}
            {rolLogin === 'dueno' && (
              <form onSubmit={manejarLoginDueno} style={styles.form}>
                <div style={styles.campo}>
                  <label style={styles.lbl}>Correo Electrónico Maestro</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={16} color="#64748b" style={styles.inputIcon} />
                    <input 
                      type="email" 
                      placeholder="dueno@negocio.com"
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

            {/* Login Cajero */}
            {rolLogin === 'cajero' && (
              <form onSubmit={manejarLoginCajero} style={styles.form}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.lbl}>Empleado / Cajero</label>
                  <button 
                    type="button" 
                    onClick={sincronizarCajerosSupabase}
                    disabled={sincronizando}
                    style={styles.btnSincronizarCajeros}
                  >
                    <RefreshCw size={11} className={sincronizando ? 'animate-spin' : ''} />
                    <span>{sincronizando ? 'Cargando...' : 'Actualizar'}</span>
                  </button>
                </div>

                {cajeros.length === 0 ? (
                  <div style={styles.avisoSinCajeros}>
                    No hay cajeros en esta terminal. Primero crea los cajeros desde la cuenta del <strong>Dueño</strong> (Módulo Cajeros) o vincula esta caja en la pestaña <strong>"Vincular"</strong> arriba.
                  </div>
                ) : (
                  <>
                    <select 
                      value={cajeroSeleccionadoId}
                      onChange={(e) => setCajeroSeleccionadoId(e.target.value)}
                      style={styles.selectCajeroVisible}
                    >
                      {cajeros.map(c => (
                        <option key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>

                    <div style={styles.campo}>
                      <label style={styles.lbl}>PIN de Seguridad (4 Dígitos)</label>
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
                      Abrir Turno de Cobro <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        )}

        {/* 2. MODO: REGISTRO DE NUEVO NEGOCIO */}
        {modo === 'registro' && (
          <form onSubmit={manejarRegistro} style={{ ...styles.form, marginTop: '14px' }}>
            <div style={styles.campo}>
              <label style={styles.lbl}>Nombre del Negocio / Establecimiento *</label>
              <input 
                type="text" 
                placeholder="Ej: Bodega Don José"
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
                placeholder="Ej: José Pérez"
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
                placeholder="jose@ejemplo.com"
                value={formRegistro.correo}
                onChange={(e) => setFormRegistro({ ...formRegistro, correo: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Clave Maestra (Mínimo 6 caracteres) *</label>
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
              {cargando ? 'Configurando Espacio...' : 'Crear Cuenta y Comenzar'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* 3. MODO: VINCULAR DISPOSITIVO SECUNDARIO */}
        {modo === 'vincular' && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
              Vincula este teléfono, tablet o PC para usarlo como punto de cobro secundario en tu negocio.
            </p>

            <button 
              type="button" 
              onClick={() => setModalEscanearQR(true)}
              style={styles.btnOpcionVinculacion}
            >
              <QrCode size={20} color="#0052cc" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.84rem', color: '#0f172a' }}>Escanear Código QR</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Apunta a la pantalla del Dueño (Ajustes &gt; Terminales)</span>
              </div>
            </button>

            <button 
              type="button" 
              onClick={() => setModalCodigoPC(true)}
              style={styles.btnOpcionVinculacion}
            >
              <Monitor size={20} color="#16a34a" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.84rem', color: '#0f172a' }}>Ingresar Código de 6 Dígitos</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ideal para computadoras o equipos sin cámara</span>
              </div>
            </button>
          </div>
        )}

      </div>

      {/* MODAL SCANNER QR */}
      <ScannerModal 
        abierto={modalEscanearQR}
        alDetectar={procesarDeteccionQR}
        alCerrar={() => setModalEscanearQR(false)}
      />

      {/* MODAL CÓDIGO 6 DÍGITOS */}
      {modalCodigoPC && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBoxCard}>
            <div style={styles.headerModal}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#0f172a', fontWeight: '800' }}>Vincular Terminal por Código</h3>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Ingresa el código generado en la pantalla del Dueño</small>
              </div>
              <button type="button" onClick={() => setModalCodigoPC(false)} style={styles.btnCerrarX}><X size={18} /></button>
            </div>

            <form onSubmit={procesarVinculacionPC} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={styles.campo}>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Ej: 100001"
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
  avatarIcon: { width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' },
  titulo: { margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' },
  
  badgeTerminalConectada: { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', marginTop: '6px' },
  btnDesvincularMini: { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.66rem', fontWeight: 'bold', padding: 0 },
  
  barraPillsNav: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '12px', gap: '2px' },
  btnPillNav: { border: 'none', borderRadius: '9px', padding: '8px 2px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s' },
  
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
  
  selectCajeroVisible: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '2px solid #0052cc', fontSize: '0.92rem', fontWeight: '700', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a', display: 'block' },
  inputPinVisible: { width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1.25rem', fontWeight: '900', letterSpacing: '8px', textAlign: 'center', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a' },
  
  btnPrincipal: { marginTop: '4px', width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0, 82, 204, 0.25)' },
  avisoSinCajeros: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.74rem', padding: '10px', borderRadius: '10px', lineHeight: 1.4, textAlign: 'center' },
  
  btnOpcionVinculacion: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', textAlign: 'left' },
  
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBoxCard: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '340px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  headerModal: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  inputCodigo6: { width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: '2px solid #0052cc', fontSize: '1.4rem', fontWeight: '900', textAlign: 'center', letterSpacing: '6px', color: '#0052cc', outline: 'none' }
};
