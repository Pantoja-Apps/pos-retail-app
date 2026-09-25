import React, { useState, useRef } from 'react';
import { ArrowLeft, Store, Save, Image as ImageIcon, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ConfiguracionModal({ config, alGuardarConfig, alVolver }) {
  const [nombre, setNombre] = useState(config.nombre || 'Mi Bodega');
  const [rif, setRif] = useState(config.rif || 'J-00000000-0');
  const [direccion, setDireccion] = useState(config.direccion || 'Caracas, Venezuela');
  const [telefono, setTelefono] = useState(config.telefono || '0412-0000000');
  const [mensajePie, setMensajePie] = useState(config.mensajePie || '¡Gracias por su compra!');
  const [logo, setLogo] = useState(config.logo || '');
  const [margenDefault, setMargenDefault] = useState(config.margenDefault || 30);
  const [guardadoExito, setGuardadoExito] = useState(false);

  const fileInputRef = useRef(null);

  const manejarLogo = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 220;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setLogo(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
    reader.readAsDataURL(file);
  };

  const guardar = (e) => {
    e.preventDefault();
    alGuardarConfig({
      nombre: nombre.trim() || 'Mi Bodega',
      rif: rif.trim() || 'J-00000000-0',
      direccion: direccion.trim() || 'Caracas, Venezuela',
      telefono: telefono.trim() || '0412-0000000',
      mensajePie: mensajePie.trim() || '¡Gracias por su compra!',
      logo: logo,
      margenDefault: parseFloat(margenDefault) || 30,
    });
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 2500);
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
            <small style={{ color: '#666', fontSize: '0.72rem' }}>Identidad, Tickets y Preferencias</small>
          </div>
        </div>
      </header>

      <form onSubmit={guardar} style={styles.scrollArea}>
        
        {guardadoExito && (
          <div style={styles.bannerExito}>
            <CheckCircle2 size={16} /> ¡Configuración guardada exitosamente!
          </div>
        )}

        {/* LOGO DEL NEGOCIO */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <ImageIcon size={16} color="#0052cc" />
            <span style={styles.cardTitle}>Logo del Comercio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
            <div 
              style={styles.logoBox} 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Toca para subir logo"
            >
              {logo ? (
                <img src={logo} alt="Logo" style={styles.logoImg} />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <Store size={26} />
                  <div style={{ fontSize: '0.65rem', marginTop: '4px' }}>Subir Logo</div>
                </div>
              )}
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={manejarLogo} 
              style={{ display: 'none' }} 
            />
            <div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.72rem', color: '#64748b' }}>
                Aparecerá en el encabezado de los tickets físicos y digitales.
              </p>
              {logo && (
                <button 
                  type="button" 
                  onClick={() => setLogo('')} 
                  style={styles.btnQuitarLogo}
                >
                  <Trash2 size={12} /> Quitar logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATOS FISCALES Y DE CONTACTO */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Store size={16} color="#0052cc" />
            <span style={styles.cardTitle}>Información de la Empresa</span>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Nombre Comercial / Bodega:</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej: Inversiones La Estrella C.A." 
              style={styles.input} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ ...styles.campo, flex: 1 }}>
              <label style={styles.label}>RIF / C.I.:</label>
              <input 
                type="text" 
                value={rif} 
                onChange={(e) => setRif(e.target.value)} 
                placeholder="J-12345678-0" 
                style={styles.input} 
                required 
              />
            </div>
            <div style={{ ...styles.campo, flex: 1 }}>
              <label style={styles.label}>Teléfono / WhatsApp:</label>
              <input 
                type="text" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                placeholder="0412-1234567" 
                style={styles.input} 
              />
            </div>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Dirección Comercial:</label>
            <input 
              type="text" 
              value={direccion} 
              onChange={(e) => setDireccion(e.target.value)} 
              placeholder="Calle Principal, Local 01" 
              style={styles.input} 
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Mensaje al pie del ticket:</label>
            <input 
              type="text" 
              value={mensajePie} 
              onChange={(e) => setMensajePie(e.target.value)} 
              placeholder="Ej: ¡Gracias por su compra! Revise su mercancía" 
              style={styles.input} 
            />
          </div>
        </div>

        {/* PARÁMETROS OPERATIVOS */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <ShieldCheck size={16} color="#0052cc" />
            <span style={styles.cardTitle}>Parámetros de Venta</span>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Margen de Ganancia Sugerido Base (%):</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                value={margenDefault} 
                onChange={(e) => setMargenDefault(e.target.value)} 
                style={{ ...styles.input, width: '90px', textAlign: 'center', fontWeight: 'bold' }} 
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Porcentaje predeterminado al crear nuevos productos.
              </span>
            </div>
          </div>
        </div>

        {/* ESPACIADO INFERIOR AMPLIO PARA BOTÓN */}
        <div style={{ marginTop: '14px', paddingBottom: '90px' }}>
          <button type="submit" style={styles.btnGuardar}>
            <Save size={16} /> Guardar Cambios
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
  bannerExito: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '12px', border: '1px solid #bbf7d0' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' },
  cardTitle: { fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b' },
  logoBox: { width: '68px', height: '68px', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#f8fafc' },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  btnQuitarLogo: { background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: 0 },
  campo: { display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '10px' },
  label: { fontSize: '0.73rem', fontWeight: 'bold', color: '#475569' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  btnGuardar: { width: '100%', padding: '13px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,82,204,0.25)' }
};
