import React from 'react';
import { ArrowLeft, MessageCircle, Mail, ShieldCheck } from 'lucide-react';

export default function SoporteModal({ alVolver, nombreNegocio }) {
  const telefonoSoporte1 = "584120000000"; // Reemplaza por tu número
  const mensajeWhatsApp = encodeURIComponent(`Hola, me comunico desde el negocio "${nombreNegocio || 'Mi Negocio'}" solicitando soporte técnico con Facilito POS.`);

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
        {/* Tarjeta de Marca Oficial con el Logotipo */}
        <div style={styles.cardMarca}>
          <div style={styles.cajaLogoOficial}>
            <img src="/logo.svg" alt="Facilito POS Logo" style={styles.logoOficialImg} />
          </div>
          <div style={styles.divisorMarca} />
          <div>
            <div style={styles.etiquetaDesarrollo}>Desarrollado por Pantoja Apps</div>
            <h3 style={styles.tituloMarca}>Innovación a tu alcance, conectamos tu futuro.</h3>
            <p style={styles.descripcionMarca}>
              Herramientas accesibles y poderosas para modernizar tu negocio y llevar la administración a otro nivel.
            </p>
          </div>
        </div>

        {/* Canales de Contacto Directo */}
        <div style={styles.seccionCanales}>
          <h4 style={styles.tituloSeccion}>¿Necesitas ayuda o soporte técnico?</h4>
          <p style={styles.subtituloSeccion}>
            Nuestro equipo de atención está disponible para resolver dudas de inventario, cajas o renovaciones de licencia.
          </p>

          <div style={styles.tarjetaCanal}>
            <div style={styles.infoCanal}>
              <div style={styles.iconoCanalBox}>
                <MessageCircle size={18} color="#00b050" />
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
              <div style={{ ...styles.iconoCanalBox, backgroundColor: '#eff6ff', color: '#0f2a4a' }}>
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
              style={styles.btnContactarMail}
            >
              <Mail size={14} /> Contactar
            </button>
          </div>
        </div>

        {/* Información de Versión */}
        <div style={styles.cardInfoVersion}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#00b050" />
            <strong style={{ fontSize: '0.84rem', color: '#0f2a4a' }}>Facilito POS Pro v2.3</strong>
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
  cardMarca: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '18px 16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  cajaLogoOficial: {
    width: '100%',
    height: '65px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  logoOficialImg: {
    maxHeight: '100%',
    maxWidth: '240px',
    objectFit: 'contain'
  },
  divisorMarca: {
    height: '1px',
    backgroundColor: '#f1f5f9',
    width: '100%'
  },
  etiquetaDesarrollo: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#00b050',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tituloMarca: {
    margin: '4px 0 6px 0',
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#0f2a4a',
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
    color: '#0f2a4a'
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
    color: '#0f2a4a'
  },
  detalleCanal: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '1px'
  },
  btnEscribir: {
    backgroundColor: '#f0fdf4',
    color: '#00b050',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0
  },
  btnContactarMail: {
    backgroundColor: '#f0f4f8',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '7px 12px',
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
