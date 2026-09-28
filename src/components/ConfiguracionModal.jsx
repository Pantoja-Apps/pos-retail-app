import React, { useState } from 'react';
import { 
  ArrowLeft, Store, Save, ShieldAlert, Monitor, 
  Download, Upload, HelpCircle, Image as ImageIcon, Trash2
} from 'lucide-react';

export default function ConfiguracionModal({ 
  config, 
  cajas = [], 
  infoLicencia, 
  alGuardarConfig, 
  alExportarBackup, 
  alImportarBackup, 
  alAbrirTerminales,
  alAbrirSoporte,
  alVolver 
}) {
  const [datos, setDatos] = useState({ ...config });
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    alGuardarConfig(datos);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2000);
  };

  const handleSubirLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evento) => {
      setDatos(prev => ({ ...prev, logo: evento.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubirArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evento) => {
      try {
        const json = JSON.parse(evento.target.result);
        if (confirm('¿Restaurar respaldo completo? Los datos actuales serán reemplazados por este archivo.')) {
          alImportarBackup(json);
          alert('¡Respaldo importado correctamente!');
        }
      } catch (err) {
        alert('Archivo de respaldo inválido o dañado.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Ajustes del Sistema</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Configuración general y soporte</small>
        </div>
        <div style={{ width: '32px' }} />
      </header>

      <main style={styles.cuerpo}>
        <form onSubmit={handleSubmit} style={styles.formulario}>
          {/* Logo y Datos del Comercio */}
          <div style={styles.cardSeccion}>
            <div style={styles.tituloSeccion}>
              <Store size={16} color="#0052cc" />
              <span>Datos del Comercio y Marca</span>
            </div>

            {/* Selector de Logo */}
            <div style={styles.contenedorLogo}>
              <div style={styles.previewLogoBox}>
                {datos.logo ? (
                  <img src={datos.logo} alt="Logo comercio" style={styles.logoImg} />
                ) : (
                  <div style={styles.logoVacio}>
                    <ImageIcon size={26} color="#94a3b8" />
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>Sin Logo</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={styles.btnSubirLogo}>
                  <Upload size={13} />
                  <span>{datos.logo ? 'Cambiar Logo' : 'Subir Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleSubirLogo} style={{ display: 'none' }} />
                </label>
                {datos.logo && (
                  <button 
                    type="button" 
                    onClick={() => setDatos(prev => ({ ...prev, logo: '' }))} 
                    style={styles.btnQuitarLogo}
                  >
                    <Trash2 size={13} /> Quitar Logo
                  </button>
                )}
                <small style={{ fontSize: '0.66rem', color: '#64748b' }}>Aparece en tickets y en el menú lateral.</small>
              </div>
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Nombre Comercial</label>
              <input 
                type="text" 
                value={datos.nombre || ''} 
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} 
                style={styles.input} 
                required 
              />
            </div>

            <div style={styles.filaCampos}>
              <div style={styles.campo}>
                <label style={styles.label}>RIF / Cédula</label>
                <input 
                  type="text" 
                  value={datos.rif || ''} 
                  onChange={(e) => setDatos({ ...datos, rif: e.target.value })} 
                  style={styles.input} 
                />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Teléfono Contacto</label>
                <input 
                  type="text" 
                  value={datos.telefono || ''} 
                  onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} 
                  style={styles.input} 
                />
              </div>
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Dirección del Negocio</label>
              <input 
                type="text" 
                value={datos.direccion || ''} 
                onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} 
                style={styles.input} 
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Mensaje al pie del ticket</label>
              <input 
                type="text" 
                value={datos.mensajePie || ''} 
                onChange={(e) => setDatos({ ...datos, mensajePie: e.target.value })} 
                style={styles.input} 
              />
            </div>

            <button type="submit" style={styles.btnGuardar}>
              <Save size={15} />
              <span>{guardadoExitoso ? '¡Cambios Guardados!' : 'Guardar Datos'}</span>
            </button>
          </div>
        </form>

        {/* Accesos Rápidos */}
        <div style={styles.cardSeccion}>
          <div style={styles.tituloSeccion}>
            <Monitor size={16} color="#0052cc" />
            <span>Terminales y Asistencia</span>
          </div>

          <button type="button" onClick={alAbrirTerminales} style={styles.btnModuloItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.iconoPill}>
                <Monitor size={16} color="#0052cc" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>Gestión de Cajas Registradoras</strong>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>
                  {cajas.length} caja(s) configurada(s) · Enlace QR
                </span>
              </div>
            </div>
            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)', color: '#94a3b8' }} />
          </button>

          <button type="button" onClick={alAbrirSoporte} style={{ ...styles.btnModuloItem, marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ ...styles.iconoPill, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <HelpCircle size={16} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>Centro de Ayuda y Soporte Técnico</strong>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>
                  WhatsApp directo, reporte de pagos y contacto
                </span>
              </div>
            </div>
            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)', color: '#94a3b8' }} />
          </button>
        </div>

        {/* Copias de Seguridad */}
        <div style={styles.cardSeccion}>
          <div style={styles.tituloSeccion}>
            <ShieldAlert size={16} color="#ea580c" />
            <span>Respaldo y Seguridad de Datos</span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
            Descarga un archivo seguro con todos tus productos, clientes y transacciones para guardarlo en tu computadora o pendrive.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={alExportarBackup} style={styles.btnBackup}>
              <Download size={14} /> Exportar JSON
            </button>
            <label style={styles.btnBackupImport}>
              <Upload size={14} /> Importar JSON
              <input type="file" accept=".json" onChange={handleSubirArchivo} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
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
    color: '#0f172a'
  },
  cuerpo: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  cardSeccion: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  },
  tituloSeccion: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.84rem',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '12px'
  },
  contenedorLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '14px'
  },
  previewLogoBox: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  logoVacio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSubirLogo: {
    backgroundColor: '#0052cc',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  btnQuitarLogo: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '5px 10px',
    borderRadius: '8px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '10px'
  },
  filaCampos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#475569'
  },
  input: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.84rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  btnGuardar: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0052cc',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '6px'
  },
  btnModuloItem: {
    width: '100%',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  },
  iconoPill: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnBackup: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#ea580c',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  btnBackupImport: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#475569',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  }
};
