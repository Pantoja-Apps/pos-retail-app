import React, { useState } from 'react';
import { 
  ArrowLeft, Store, Save, Users, Smartphone, Image as ImageIcon, 
  Trash2, UploadCloud, CheckCircle2, Shield
} from 'lucide-react';
import { optimizarImagen } from '../utils/imageOptimizer';

export default function ConfiguracionModal({
  config,
  cajas = [],
  cajeros = [],
  alGuardarConfig,
  alAbrirTerminales,
  alAbrirUsuarios,
  alVolver
}) {
  const [nombre, setNombre] = useState(config.nombre || '');
  const [rif, setRif] = useState(config.rif || '');
  const [direccion, setDireccion] = useState(config.direccion || '');
  const [telefono, setTelefono] = useState(config.telefono || '');
  const [mensajePie, setMensajePie] = useState(config.mensajePie || '');
  const [logo, setLogo] = useState(config.logo || '');
  const [procesandoLogo, setProcesandoLogo] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const manejarSubidaLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesandoLogo(true);
    try {
      // Comprime a 250px maximo para el encabezado y ticket
      const base64Optimo = await optimizarImagen(file, 250, 0.8);
      setLogo(base64Optimo);
    } catch (err) {
      alert('Error optimizando el logo.');
    } finally {
      setProcesandoLogo(false);
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    const configNueva = {
      ...config,
      nombre: nombre.trim() || 'Mi Negocio',
      rif: rif.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      mensajePie: mensajePie.trim(),
      logo: logo
    };

    alGuardarConfig(configNueva);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2000);
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={styles.tituloHeader}>Ajustes y Configuración</h2>
        <div style={{ width: '32px' }} />
      </header>

      <main style={styles.cuerpo}>
        {/* Accesos Rápidos a Módulos de Personal y Cajas */}
        <div style={styles.seccionAccesos}>
          <button type="button" onClick={alAbrirUsuarios} style={styles.btnAcceso}>
            <div style={styles.iconoBoxAcceso}>
              <Users size={18} color="#0f2a4a" />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ fontSize: '0.84rem', color: '#0f2a4a', display: 'block' }}>Personal y Cajeros</strong>
              <small style={{ fontSize: '0.7rem', color: '#64748b' }}>{cajeros.length} usuario(s) registrados</small>
            </div>
          </button>

          <button type="button" onClick={alAbrirTerminales} style={styles.btnAcceso}>
            <div style={{ ...styles.iconoBoxAcceso, backgroundColor: '#f0fdf4' }}>
              <Smartphone size={18} color="#00b050" />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ fontSize: '0.84rem', color: '#0f2a4a', display: 'block' }}>Cajas y Terminales</strong>
              <small style={{ fontSize: '0.7rem', color: '#64748b' }}>{cajas.length} caja(s) activas</small>
            </div>
          </button>
        </div>

        {/* Formulario de Datos del Negocio y Logo */}
        <form onSubmit={guardar} style={styles.cardForm}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Store size={18} color="#0f2a4a" />
            <h3 style={{ margin: 0, fontSize: '0.92rem', color: '#0f2a4a', fontWeight: '800' }}>
              Datos del Establecimiento
            </h3>
          </div>

          {/* Subida y Preview del Logo del Negocio */}
          <div style={styles.cajaLogoSeccion}>
            <label style={styles.label}>Logo del Negocio (Ticket y Pantalla)</label>
            <div style={styles.filaLogoPreview}>
              <div style={styles.previewLogoBox}>
                {logo ? (
                  <img src={logo} alt="Logo" style={styles.imgLogoPreview} />
                ) : (
                  <ImageIcon size={28} color="#94a3b8" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={styles.btnSubirArchivo}>
                  <UploadCloud size={14} />
                  <span>{procesandoLogo ? 'Comprimiendo...' : (logo ? 'Cambiar Logo' : 'Subir Imagen')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarSubidaLogo}
                    disabled={procesandoLogo}
                    style={{ display: 'none' }}
                  />
                </label>

                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo('')}
                    style={styles.btnQuitarLogo}
                  >
                    <Trash2 size={13} />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
            <small style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
              Se comprime automáticamente para guardarse seguro sin conexión y en tickets.
            </small>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Nombre Comercial</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={styles.input}
              placeholder="Ej. MiniMarket JJJP"
              required
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>RIF / Cédula Fiscal</label>
            <input
              type="text"
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              style={styles.input}
              placeholder="Ej. J-50000000-0"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Teléfono de Contacto</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={styles.input}
              placeholder="0412-0000000"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Dirección Física</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              style={styles.input}
              placeholder="Calle principal, local 1"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Mensaje al pie del ticket</label>
            <input
              type="text"
              value={mensajePie}
              onChange={(e) => setMensajePie(e.target.value)}
              style={styles.input}
              placeholder="¡Gracias por su compra! Revise su mercancía"
            />
          </div>

          <button type="submit" style={styles.btnGuardar}>
            {guardadoExitoso ? (
              <>
                <CheckCircle2 size={16} />
                <span>¡Cambios Guardados!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Ajustes</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

const styles = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    padding: '10px 14px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  btnAtras: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#334155'
  },
  tituloHeader: {
    margin: 0,
    fontSize: '0.96rem',
    fontWeight: '800',
    color: '#0f2a4a'
  },
  cuerpo: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  seccionAccesos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  btnAcceso: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '12px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  iconoBoxAcceso: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardForm: {
    backgroundColor: '#fff',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  cajaLogoSeccion: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingBottom: '8px',
    borderBottom: '1px dashed #e2e8f0'
  },
  filaLogoPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px'
  },
  previewLogoBox: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },
  imgLogoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  btnSubirArchivo: {
    backgroundColor: '#0f2a4a',
    color: '#fff',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  btnQuitarLogo: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: 0
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
  btnGuardar: {
    marginTop: '6px',
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
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.25)'
  }
};
