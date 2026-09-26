import React, { useState } from 'react';
import { Store, ShieldCheck, KeyRound, Mail, User, ArrowRight, Lock, Users } from 'lucide-react';

export default function LoginModal({ cuentaMaster, cajeros = [], alRegistrarDueno, alIniciarSesionDueno, alIniciarSesionCajero }) {
  const esPrimerRegistro = !cuentaMaster;

  const [modoAcceso, setModoAcceso] = useState('cajero');

  // Primer registro
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [nombreDueno, setNombreDueno] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  // Login Dueño
  const [correoLogin, setCorreoLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // Login Cajero
  const [cajeroSeleccionadoId, setCajeroSeleccionadoId] = useState(cajeros[0]?.id || '');
  const [pinCajero, setPinCajero] = useState('');

  const manejarRegistro = (e) => {
    e.preventDefault();
    if (!nombreNegocio.trim() || !nombreDueno.trim() || !correo.trim() || !password.trim()) {
      return alert('Todos los campos son obligatorios para activar el negocio.');
    }
    if (password.length < 6) {
      return alert('La clave maestra del dueño debe tener al menos 6 caracteres.');
    }

    alRegistrarDueno({
      nombreNegocio: nombreNegocio.trim(),
      nombreDueno: nombreDueno.trim(),
      correo: correo.trim().toLowerCase(),
      password: password.trim(),
      fechaRegistro: new Date().toISOString()
    });
  };

  const manejarLoginDueno = (e) => {
    e.preventDefault();
    if (!correoLogin.trim() || !passwordLogin.trim()) {
      return alert('Ingresa tu correo y contraseña maestra.');
    }

    const exito = alIniciarSesionDueno(correoLogin.trim().toLowerCase(), passwordLogin.trim());
    if (!exito) {
      alert('Credenciales incorrectas. Verifica tu correo o clave maestra.');
    }
  };

  const manejarLoginCajero = (e) => {
    e.preventDefault();
    if (!cajeroSeleccionadoId) return alert('Selecciona tu nombre de cajero.');
    if (pinCajero.trim().length !== 6) return alert('Ingresa tu PIN completo de 6 dígitos.');

    const exito = alIniciarSesionCajero(cajeroSeleccionadoId, pinCajero.trim());
    if (!exito) {
      alert('PIN de 6 dígitos incorrecto.');
      setPinCajero('');
    }
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.cardBox}>
        
        <div style={styles.header}>
          <div style={styles.avatarIcon}>
            <Store size={26} color="#0052cc" />
          </div>
          <h2 style={styles.titulo}>
            {esPrimerRegistro ? 'Bienvenido a tu POS' : (cuentaMaster?.nombreNegocio || 'Punto de Venta')}
          </h2>
          <p style={styles.subtitulo}>
            {esPrimerRegistro 
              ? 'Configura la cuenta maestra del dueño del local' 
              : 'Selecciona cómo deseas ingresar al sistema'}
          </p>
        </div>

        {esPrimerRegistro ? (
          <form onSubmit={manejarRegistro} style={styles.form}>
            <div style={styles.campo}>
              <label style={styles.label}><Store size={13} /> Nombre de tu Negocio / Bodega:</label>
              <input
                type="text"
                placeholder="Ej: Inversiones Los Socios C.A."
                value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><User size={13} /> Nombre del Dueño / Propietario:</label>
              <input
                type="text"
                placeholder="Ej: Ángel Pantoja"
                value={nombreDueno}
                onChange={(e) => setNombreDueno(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><Mail size={13} /> Correo Electrónico Maestro:</label>
              <input
                type="email"
                placeholder="dueno@gmail.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><KeyRound size={13} /> Clave Maestra (Mínimo 6 caracteres):</label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <button type="submit" style={styles.btnSubmit}>
              Activar Negocio y Continuar <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <>
            <div style={styles.tabsSelector}>
              <button
                type="button"
                onClick={() => setModoAcceso('cajero')}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: modoAcceso === 'cajero' ? '#fff' : 'transparent',
                  color: modoAcceso === 'cajero' ? '#0052cc' : '#64748b',
                  boxShadow: modoAcceso === 'cajero' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Users size={14} /> Soy Cajero
              </button>
              <button
                type="button"
                onClick={() => setModoAcceso('dueno')}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: modoAcceso === 'dueno' ? '#fff' : 'transparent',
                  color: modoAcceso === 'dueno' ? '#0052cc' : '#64748b',
                  boxShadow: modoAcceso === 'dueno' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <ShieldCheck size={14} /> Soy el Dueño
              </button>
            </div>

            {modoAcceso === 'cajero' ? (
              <form onSubmit={manejarLoginCajero} style={styles.form}>
                {cajeros.length === 0 ? (
                  <div style={styles.bannerAlerta}>
                    No hay cajeros registrados aún. El dueño debe iniciar sesión primero y darlos de alta en Ajustes.
                  </div>
                ) : (
                  <>
                    <div style={styles.campo}>
                      <label style={styles.label}><User size={13} /> Selecciona tu Nombre:</label>
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
                      <label style={styles.label}><KeyRound size={13} /> Ingresa tu PIN de 6 Dígitos:</label>
                      <input
                        type="password"
                        maxLength="6"
                        placeholder="••••••"
                        value={pinCajero}
                        onChange={(e) => setPinCajero(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{ ...styles.input, textAlign: 'center', letterSpacing: '6px', fontSize: '1.25rem', fontWeight: 'bold' }}
                        autoFocus
                        required
                      />
                      <span style={{ fontSize: '0.66rem', color: pinCajero.length === 6 ? '#16a34a' : '#64748b', textAlign: 'right', fontWeight: 'bold' }}>
                        {pinCajero.length} / 6 dígitos
                      </span>
                    </div>

                    <button type="submit" style={styles.btnSubmit}>
                      Abrir Caja y Facturar <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={manejarLoginDueno} style={styles.form}>
                <div style={styles.bannerInfo}>
                  <ShieldCheck size={16} color="#16a34a" />
                  <span>Propietario: <strong>{cuentaMaster.nombreDueno}</strong></span>
                </div>

                <div style={styles.campo}>
                  <label style={styles.label}><Mail size={13} /> Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="dueno@gmail.com"
                    value={correoLogin}
                    onChange={(e) => setCorreoLogin(e.target.value)}
                    style={styles.input}
                    required
                    autoFocus
                  />
                </div>

                <div style={styles.campo}>
                  <label style={styles.label}><Lock size={13} /> Contraseña Maestra:</label>
                  <input
                    type="password"
                    placeholder="Tu clave maestra"
                    value={passwordLogin}
                    onChange={(e) => setPasswordLogin(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.btnSubmit}>
                  Iniciar Sesión como Dueño <ArrowRight size={16} />
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '16px' },
  cardBox: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '24px 20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { textAlign: 'center', marginBottom: '16px' },
  avatarIcon: { width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', border: '1px solid #dbeafe' },
  titulo: { margin: 0, fontSize: '1.22rem', fontWeight: '800', color: '#0f172a' },
  subtitulo: { margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' },
  tabsSelector: { display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '14px' },
  tabBtn: { flex: 1, border: 'none', padding: '8px 4px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.74rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', backgroundColor: '#fff' },
  btnSubmit: { marginTop: '6px', width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.92rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  bannerInfo: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#166534' },
  bannerAlerta: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px', fontSize: '0.74rem', color: '#c2410c', textAlign: 'center' }
};
