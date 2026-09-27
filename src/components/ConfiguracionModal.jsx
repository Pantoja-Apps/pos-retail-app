import React, { useState } from 'react';
import { 
  ArrowLeft, Store, Save, Download, Upload, ShieldCheck, 
  Percent, Image as ImageIcon, Building, Phone, MapPin, 
  MessageSquare, FileText, Monitor, ChevronRight
} from 'lucide-react';

export default function ConfiguracionModal({ 
  config = {}, 
  cajas = [],
  infoLicencia = null, 
  alGuardarConfig = () => {}, 
  alExportarBackup = () => {}, 
  alImportarBackup = () => {}, 
  alAbrirTerminales = () => {},
  alVolver = () => {} 
}) {
  const [form, setForm] = useState({
    nombre: config.nombre || 'Mi Bodega POS',
    rif: config.rif || 'J-50000000-0',
    direccion: config.direccion || 'Caracas, Venezuela',
    telefono: config.telefono || '0412-0000000',
    mensajePie: config.mensajePie || '¡Gracias por su compra! Revise su mercancía',
    logo: config.logo || '',
    margenDefault: config.margenDefault || 30
  });

  const manejarLogo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const manejarImportacionArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm('¿Restaurar este respaldo completo? Se actualizarán productos, clientes, transacciones y cajas.')) {
            alImportarBackup(parsed);
            alert('¡Respaldo importado con éxito!');
          }
        } catch (err) {
          alert('El archivo seleccionado no es un respaldo válido en formato JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('El nombre de la empresa es obligatorio.');
    alGuardarConfig(form);
    alert('Configuración guardada exitosamente.');
    alVolver();
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack} title="Volver al POS">
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>Configuración del Sistema</h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Datos del negocio, terminales y respaldos</small>
          </div>
        </div>

        <button type="button" onClick={guardar} style={styles.btnGuardarTop}>
          <Save size={15} /> <span>Guardar</span>
        </button>
      </header>

      <div style={styles.cuerpoScroll}>
        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* SECCIÓN NUEVA: ACCESO A GESTIÓN DE TERMINALES Y CAJAS */}
          <div style={styles.seccionCard}>
            <div style={styles.tituloSeccion}>
              <Monitor size={16} color="#0052cc" />
              <strong>Puntos de Venta y Terminales</strong>
            </div>

            <p style={{ margin: '4px 0 10px 0', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
              Administra los teléfonos, tablets o PCs Windows conectadas. Configura si el dinero va a una sola gaveta central o si cada caja tiene arqueo independiente.
            </p>

            <button 
              type="button" 
              onClick={alAbrirTerminales} 
              style={styles.btnIrTerminales}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.iconCircleTerminal}><Monitor size={15} color="#0052cc" /></div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block' }}>
                    Administrar Cajas ({cajas.length} activas)
                  </strong>
                  <small style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Vincular por Código QR o Código de 6 Dígitos
                  </small>
                </div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </button>
          </div>

          {/* DATOS DE LA EMPRESA & LOGO */}
          <div style={styles.seccionCard}>
            <div style={styles.tituloSeccion}>
              <Building size={16} color="#0052cc" />
              <strong>Datos Fiscales y Comerciales</strong>
            </div>

            {/* LOGOTIPO */}
            <div style={styles.contenedorLogo}>
              <label style={styles.labelLogo}>
                {form.logo ? (
                  <img src={form.logo} alt="Logo" style={styles.logoPreview} />
                ) : (
                  <div style={styles.logoVacio}>
                    <ImageIcon size={26} color="#94a3b8" />
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 'bold', marginTop: '3px' }}>Logo Ticket</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={manejarLogo} style={{ display: 'none' }} />
              </label>
              {form.logo && (
                <button type="button" onClick={() => setForm(prev => ({ ...prev, logo: '' }))} style={styles.btnQuitarLogo}>
                  Quitar Logotipo
                </button>
              )}
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Nombre Comercial de la Empresa / Bodega *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                style={styles.inputGrande}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div style={styles.campo}>
                <label style={styles.lbl}>RIF o C.I. *</label>
                <input
                  type="text"
                  value={form.rif}
                  onChange={(e) => setForm({ ...form, rif: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.campo}>
                <label style={styles.lbl}>Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Dirección Comercial (Aparece en Ticket)</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.lbl}>Mensaje al Pie del Ticket</label>
              <input
                type="text"
                value={form.mensajePie}
                onChange={(e) => setForm({ ...form, mensajePie: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          {/* RESPALDOS DE DATOS */}
          <div style={styles.seccionCard}>
            <div style={styles.tituloSeccion}>
              <Download size={16} color="#059669" />
              <strong>Respaldos y Seguridad Local</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={alExportarBackup} style={styles.btnExportar}>
                <Download size={14} /> Exportar Copia
              </button>

              <label style={styles.btnImportar}>
                <Upload size={14} /> Restaurar Copia
                <input type="file" accept=".json" onChange={manejarImportacionArchivo} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <button type="submit" style={styles.btnGuardarBottom}>
            <Save size={16} /> Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnGuardarTop: { backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.76rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
  
  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '14px' },
  seccionCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  tituloSeccion: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: '#0f172a', marginBottom: '4px' },

  btnIrTerminales: { width: '100%', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  iconCircleTerminal: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  contenedorLogo: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '4px 0 10px 0' },
  labelLogo: { width: '90px', height: '90px', borderRadius: '14px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%', objectFit: 'contain' },
  logoVacio: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  btnQuitarLogo: { background: 'none', border: 'none', color: '#dc2626', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 },

  campo: { display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' },
  lbl: { fontSize: '0.7rem', fontWeight: 'bold', color: '#475569' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none' },
  inputGrande: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: '600', outline: 'none' },

  btnExportar: { padding: '10px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  btnImportar: { padding: '10px', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },

  btnGuardarBottom: { width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }
};
