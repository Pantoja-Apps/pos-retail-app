import React, { useState, useRef } from 'react';
import { ArrowLeft, Save, Upload, Building, Phone, MapPin, FileText, Download, RotateCcw, ShieldCheck } from 'lucide-react';

export default function ConfiguracionModal({ 
  config, 
  alGuardarConfig, 
  alExportarBackup, 
  alImportarBackup, 
  alVolver 
}) {
  const [nombre, setNombre] = useState(config.nombre || '');
  const [rif, setRif] = useState(config.rif || '');
  const [direccion, setDireccion] = useState(config.direccion || '');
  const [telefono, setTelefono] = useState(config.telefono || '');
  const [mensajePie, setMensajePie] = useState(config.mensajePie || '');
  const [logo, setLogo] = useState(config.logo || '');

  const fileInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const manejarLogo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        return alert('La imagen es muy pesada. Debe pesar menos de 2MB.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const manejarSubidaBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const datos = JSON.parse(event.target.result);
        if (confirm('¿Restaurar esta base de datos? Se actualizarán el inventario, clientes y ventas con los datos del respaldo.')) {
          alImportarBackup(datos);
          alert('¡Base de datos restaurada con éxito!');
        }
      } catch (err) {
        alert('Archivo de respaldo inválido o corrupto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('El nombre del negocio es obligatorio.');

    alGuardarConfig({
      ...config,
      nombre: nombre.trim(),
      rif: rif.trim() || 'J-00000000-0',
      direccion: direccion.trim() || 'Caracas, Venezuela',
      telefono: telefono.trim(),
      mensajePie: mensajePie.trim(),
      logo: logo
    });

    alert('Configuración guardada exitosamente.');
    alVolver();
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Ajustes del Negocio</h2>
            <small style={{ color: '#666', fontSize: '0.72rem' }}>Personalización y Respaldos</small>
          </div>
        </div>
      </header>

      <form onSubmit={guardar} style={styles.scrollArea}>
        
        {/* LOGO DEL NEGOCIO */}
        <div style={styles.seccionCard}>
          <span style={styles.tituloSeccion}>Logotipo del Comercio</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <div style={styles.previewLogoBox}>
              {logo ? (
                <img src={logo} alt="Logo" style={styles.previewImg} />
              ) : (
                <Building size={28} color="#94a3b8" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={manejarLogo}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={styles.btnSubirLogo}
              >
                <Upload size={14} /> Subir Imagen / Logo
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo('')}
                  style={styles.btnQuitarLogo}
                >
                  Quitar logotipo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATOS FISCALES Y DE CONTACTO */}
        <div style={styles.seccionCard}>
          <span style={styles.tituloSeccion}>Datos de la Empresa / Bodega</span>
          
          <div style={styles.campo}>
            <label style={styles.label}>Nombre Comercial:</label>
            <input
              type="text"
              placeholder="Ej: Inversiones Los Socios C.A."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>RIF / C.I.:</label>
            <input
              type="text"
              placeholder="Ej: J-12345678-9"
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Teléfono de Contacto:</label>
            <input
              type="text"
              placeholder="Ej: 0412-1234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Dirección Física:</label>
            <input
              type="text"
              placeholder="Ej: Av. Principal, Local 02"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Mensaje al Pie del Ticket:</label>
            <textarea
              rows="2"
              placeholder="Ej: ¡Gracias por su compra! Revise su mercancía antes de salir."
              value={mensajePie}
              onChange={(e) => setMensajePie(e.target.value)}
              style={styles.textarea}
            />
          </div>
        </div>

        {/* COPIA DE SEGURIDAD Y RESPALDOS */}
        <div style={styles.seccionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#0052cc" />
            <span style={styles.tituloSeccion}>Copia de Seguridad y Restauración</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 10px 0' }}>
            Descarga un respaldo con tu inventario, deudas de clientes y ventas, o restáuralo si cambias de teléfono.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={alExportarBackup}
              style={styles.btnBackupExport}
            >
              <Download size={14} /> Descargar Copia (JSON)
            </button>

            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={manejarSubidaBackup}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => backupInputRef.current && backupInputRef.current.click()}
              style={styles.btnBackupImport}
            >
              <RotateCcw size={14} /> Restaurar Copia
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', paddingBottom: '30px' }}>
          <button type="submit" style={styles.btnGuardar}>
            <Save size={16} /> Guardar Ajustes
          </button>
        </div>

      </form>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '14px 16px', WebkitOverflowScrolling: 'touch' },
  seccionCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  tituloSeccion: { fontSize: '0.76rem', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.3px' },
  previewLogoBox: { width: '56px', height: '56px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%', objectFit: 'contain' },
  btnSubirLogo: { backgroundColor: '#eff6ff', color: '#0052cc', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '7px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  btnQuitarLogo: { background: 'none', border: 'none', color: '#dc2626', fontSize: '0.7rem', cursor: 'pointer', marginTop: '4px', display: 'block', padding: 0 },
  campo: { display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '10px' },
  label: { fontSize: '0.72rem', fontWeight: 'bold', color: '#475569' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', resize: 'none', fontFamily: 'inherit' },
  btnBackupExport: { flex: 1, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '9px 6px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnBackupImport: { flex: 1, backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 6px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnGuardar: { width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
};
