import React from 'react';
import { ArrowLeft, MessageCircle, Mail, Globe, Sparkles, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';

export default function SoporteModal({ alVolver, nombreNegocio }) {
  // Números y enlaces de contacto de tu marca
  const telefonoSoporte1 = "584120000000"; // Reemplaza por tu número real
  const mensajeWhatsApp = encodeURIComponent(`Hola, me comunico desde el negocio "${nombreNegocio || 'Mi Negocio'}" solicitando asistencia técnica con el sistema POS.`);

  const abrirWhatsApp = (numero) => {
    window.open(`https://wa.me/${numero}?text=${mensajeWhatsApp}`, '_blank');
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <button type="button" onClick={alVolver} style={styles.btnAtras}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={styles.tituloHeader}>Centro de Ayuda y Soporte</h2>
          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Pantoja Apps · Facilito POS</small>
        </div>
        <div style={{ width: '32px' }} />
      </header>

      <main style={styles.cuerpo}>
        {/* Tarjeta de Marca y Presentación */}
        <div style={styles.cardMarca}>
          <div style={styles.iconoMarcaBox}>
            <Sparkles size={22} color="#0052cc" />
          </div>
          <div>
            <div style={styles.etiquetaDesarrollo}>Desarrollado por Pantoja Apps</div>
            <h3 style={styles.tituloMarca}>Innovación a tu alcance, conectamos tu futuro.</h3>
            <p style={styles.descripcionMarca}>
              Herramientas accesibles y poderosas para modernizar tu negocio y llevar la administración a otro nivel.
            </p>
          </div>
        </div>

        {/* Sección de Canales de Atención Directa */}
        <div style={styles.seccionCanales}>
          <h4 style={styles.tituloSeccion}>¿Necesitas ayuda o soporte técnico?</h4>
          <p style={styles.subtituloSeccion}>
            Nuestro equipo de atención está disponible para resolver dudas de inventario, cajas o renovaciones de licencia.
          </p>

          <div style={styles.tarjetaCanal}>
            <div style={styles.infoCanal}>
              <div style={styles.iconoCanalBox}>
                <MessageCircle size={18} color="#16a34a" />
              </div>
              <div>
                <strong style={styles.nombreCanal}>Soporte Técnico WhatsApp</strong>
                <span style={styles.detalleCanal}>+58 412 · Atención Inmediata</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => abrirWhatsApp(telefonoSoporte1)} 
              style={styles.btnEscribir}
            >
              <MessageCircle size={14} /> Escribir
            </button>
          </div>

          <div style={styles.tarjetaCanal}>
            <div style={styles.infoCanal}>
              <div style={{ ...styles.iconoCanalBox, backgroundColor: '#eff6ff', color: '#0052cc' }}>
                <Mail size={18} />
              </div>
              <div>
                <strong style={styles.nombreCanal}>Correo de Atención</strong>
                <span style={styles.detalleCanal}>soporte@pantojaapps.com</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => window.open('mailto:soporte@pantojaapps.com?subject=Soporte%20Facilito%20POS', '_blank')} 
              style={{ ...styles.btnEscribir, backgroundColor: '#eff6ff', color: '#0052cc', border: '1px solid #bfdbfe' }}
            >
              <Mail size={14} /> Contactar
            </button>
          </div>
        </div>

        {/* Información de Versión y Estado de Seguridad */}
        <div style={styles.cardInfoVersion}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>Facilito POS Pro v2.3</strong>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
            Sistema conectado y protegido en la nube con Supabase. Base de datos aislada por establecimiento.
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
  cardMarca: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  iconoMarcaBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  etiquetaDesarrollo: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#0052cc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tituloMarca: {
    margin: '4px 0 6px 0',
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 1.3
  },
  descripcionMarca: {
    margin: 0,
    fontSize: '0.78rem',
    color: '#64748b',
    lineHeight: 1.45
  },
  seccionCanales: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  tituloSeccion: {
    margin: 0,
    fontSize: '0.88rem',
    fontWeight: '800',
    color: '#0f172a'
  },
  subtituloSeccion: {
    margin: 0,
    fontSize: '0.74rem',
    color: '#64748b',
    lineHeight: 1.4
  },
  tarjetaCanal: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  infoCanal: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0
  },
  iconoCanalBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  nombreCanal: {
    display: 'block',
    fontSize: '0.82rem',
    color: '#1e293b'
  },
  detalleCanal: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '1px'
  },
  btnEscribir: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0
  },
  cardInfoVersion: {
    backgroundColor: '#f1f5f9',
    borderRadius: '14px',
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    marginTop: 'auto'
  }
};
