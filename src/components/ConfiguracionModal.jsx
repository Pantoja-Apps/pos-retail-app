import React, { useState, useRef } from 'react';
import { ArrowLeft, Save, Upload, Download, Building, Phone, MapPin, FileText, Image, ShieldCheck, Calendar, Clock } from 'lucide-react';

export default function ConfiguracionModal({ config, alGuardarConfig, alExportarBackup, alImportarBackup, alVolver, infoLicencia }) {
  const [form, setForm] = useState({ ...config });
  const fileInputRef = useRef(null);

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

  const guardar = (e) => {
    e.preventDefault();
    alGuardarConfig(form);
    alert('Configuración guardada correctamente.');
    alVolver();
  };

  const manejarArchivoBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const datos = JSON.parse(event.target.result);
        if (confirm('¿Restaurar datos desde este respaldo? Se sobrescribirán los datos actuales.')) {
          alImportarBackup(datos);
          alert('¡Respaldo restaurado con éxito!');
          alVolver();
        }
      } catch (err) {
        alert('Archivo de respaldo no válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}>
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Ajustes del Negocio</h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Datos fiscales, logo y suscripción</small>
          </div>
        </div>
      </header>

      <div style={styles.cuerpo}>
        {/* TARJETA DETALLES DE LICENCIA */}
        <section style={styles.cardLicencia}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color="#16a34a" />
              <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Estado de la Licencia SaaS</strong>
            </div>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: infoLicencia?.activa ? '#dcfce7' : '#fee2e2',
              color: infoLicencia?.activa ? '#15803d' : '#b91c1c'
            }}>
              {infoLicencia?.activa ? 'ACTIVA' : 'INACTIVA / SUSPENDIDA'}
            </span>
          </div>

          <div style={styles.gridLicencia}>
            <div style={styles.itemLicencia}>
              <Calendar size={14} color="#64748b" />
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Válida hasta</span>
                <strong style={{ fontSize: '0.8rem', color: '#1e293b' }}>
                  {infoLicencia?.licenciaHasta ? new Date(infoLicencia.licenciaHasta).toLocaleDateString('es-VE') : 'No sincronizado'}
                </strong>
              </div>
            </div>

            <div style={styles.itemLicencia}>
              <Clock size={14} color="#0052cc" />
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Tiempo restante</span>
                <strong style={{ fontSize: '0.8rem', color: infoLicencia?.diasRestantes <= 5 ? '#dc2626' : '#16a34a' }}>
                  {infoLicencia?.diasRestantes !== undefined ? `${infoLicencia.diasRestantes} días` : '--'}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* FORMULARIO DE DATOS */}
        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={styles.seccionCampos}>
            <div style={styles.campo}>
              <label style={styles.label}><Building size={13} /> Nombre del Comercio:</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><FileText size={13} /> RIF / Documento Fiscal:</label>
              <input
                type="text"
                value={form.rif}
                onChange={(e) => setForm({ ...form, rif: e.target.value })}
                style={styles.input}
                placeholder="Ej: J-12345678-0"
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><Phone size={13} /> Teléfono de Contacto:</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                style={styles.input}
                placeholder="Ej: 0412-1234567"
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><MapPin size={13} /> Dirección Física:</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                style={styles.input}
                placeholder="Ej: Av. Principal, Local 2"
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><FileText size={13} /> Mensaje al Pie del Ticket:</label>
              <input
                type="text"
                value={form.mensajePie}
                onChange={(e) => setForm({ ...form, mensajePie: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}><Image size={13} /> Logotipo del Negocio:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                {form.logo && (
                  <img src={form.logo} alt="Logo" style={styles.previewLogo} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={manejarLogo}
                  style={{ fontSize: '0.78rem' }}
                />
              </div>
            </div>
          </div>

          <button type="submit" style={styles.btnGuardar}>
            <Save size={16} /> Guardar Ajustes
          </button>
        </form>

        {/* COPIAS DE SEGURIDAD LOCAL */}
        <section style={styles.seccionBackup}>
          <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
            Copias de Seguridad del Negocio
          </strong>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={alExportarBackup} style={styles.btnBackup}>
              <Download size={14} /> Exportar Respaldo
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.btnBackup}>
              <Upload size={14} /> Importar Respaldo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={manejarArchivoBackup}
              style={{ display: 'none' }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cuerpo: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  cardLicencia: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  gridLicencia: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' },
  itemLicencia: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' },
  seccionCampos: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  previewLogo: { width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' },
  btnGuardar: { width: '100%', padding: '11px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  seccionBackup: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' },
  btnBackup: { flex: 1, padding: '9px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 'bold', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }
};
