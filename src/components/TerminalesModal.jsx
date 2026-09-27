import React, { useState } from 'react';
import { 
  ArrowLeft, Monitor, Plus, QrCode, KeyRound, Check, X, 
  Trash2, ShieldCheck, RefreshCw, Smartphone, Layers, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function TerminalesModal({ 
  cajas = [], 
  configEmpresa = {}, 
  cuentaMaster = {},
  alGuardarCaja = () => {}, 
  alEliminarCaja = () => {}, 
  alVolver = () => {} 
}) {
  const [modalNuevaCaja, setModalNuevaCaja] = useState(false);
  const [cajaParaVincular, setCajaParaVincular] = useState(null);

  const [nombreCaja, setNombreCaja] = useState('');
  const [tipoGaveta, setTipoGaveta] = useState('centralizada');

  const generarCodigo6 = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const crearCaja = (e) => {
    e.preventDefault();
    if (!nombreCaja.trim()) return alert('Introduce un nombre para la caja');

    const nueva = {
      id: 'caja_' + Date.now().toString().slice(-6),
      numero: cajas.length + 1,
      nombre: nombreCaja.trim(),
      tipoGaveta,
      codigoEnlace: generarCodigo6(),
      creadaEn: new Date().toLocaleDateString('es-VE')
    };

    alGuardarCaja(nueva);
    setNombreCaja('');
    setTipoGaveta('centralizada');
    setModalNuevaCaja(false);
    setCajaParaVincular(nueva);
  };

  const regenerarCodigo = (caja) => {
    const nuevoCod = generarCodigo6();
    const cajaAct = { ...caja, codigoEnlace: nuevoCod };
    alGuardarCaja(cajaAct);
    setCajaParaVincular(cajaAct);
  };

  // Payload ultraligero para que el QR sea grande y fácil de enfocar
  const payloadQR = cajaParaVincular 
    ? `POS|${cajaParaVincular.id}|${cajaParaVincular.nombre}|${cajaParaVincular.tipoGaveta}|${cajaParaVincular.codigoEnlace}`
    : '';

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack} title="Volver a Ajustes">
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>Control de Cajas y Terminales</h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>Puntos de venta sincronizados</small>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => setModalNuevaCaja(true)} 
          style={styles.btnNuevaCaja}
        >
          <Plus size={15} /> <span>Añadir Caja</span>
        </button>
      </header>

      <div style={styles.bannerInfo}>
        <Layers size={18} color="#0052cc" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.72rem', color: '#1e3a8a', lineHeight: 1.4 }}>
          <strong>Multicajas en Vivo:</strong> Conecta múltiples teléfonos, tablets o PCs Windows. Puedes hacer que todas reporten su dinero a la <strong>Gaveta de la Caja Principal</strong> o que cada una tenga su propio arqueo independiente.
        </div>
      </div>

      <div style={styles.cuerpoScroll}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cajas.map((c, idx) => (
            <div key={c.id} style={styles.cardCaja}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={styles.iconoCajaBox}>
                  <Monitor size={22} color={idx === 0 ? '#16a34a' : '#0052cc'} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{c.nombre}</strong>
                    {idx === 0 && <span style={styles.badgePrincipal}>Caja 01 Principal</span>}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                    Modalidad: <strong style={{ color: c.tipoGaveta === 'centralizada' ? '#0052cc' : '#16a34a' }}>
                      {c.tipoGaveta === 'centralizada' ? 'Cobros a Gaveta Central (Caja 01)' : 'Gaveta Propia Independiente'}
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                    Código de Terminal: <strong style={{ color: '#0f172a', letterSpacing: '1px' }}>{c.codigoEnlace}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setCajaParaVincular(c)}
                  style={styles.btnVincular}
                  title="Ver QR y Código de Enlace para conectar equipo"
                >
                  <QrCode size={14} /> <span>Vincular</span>
                </button>

                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar la terminal ${c.nombre}? Los dispositivos conectados a ella perderán la sincronización.`)) {
                        alEliminarCaja(c.id);
                      }
                    }}
                    style={styles.btnEliminar}
                    title="Eliminar caja"
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalNuevaCaja && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBoxCard}>
            <div style={styles.headerModal}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>Registrar Nueva Caja / Terminal</h3>
              <button type="button" onClick={() => setModalNuevaCaja(false)} style={styles.btnCerrarX}><X size={18} /></button>
            </div>

            <form onSubmit={crearCaja} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
              <div style={styles.campo}>
                <label style={styles.lbl}>Nombre o Ubicación de la Caja *</label>
                <input
                  type="text"
                  placeholder="Ej: Caja 02 - Pasillo, Caja 03 - Balanza..."
                  value={nombreCaja}
                  onChange={(e) => setNombreCaja(e.target.value)}
                  style={styles.inputGrande}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.campo}>
                <label style={styles.lbl}>¿A dónde va el efectivo que cobre esta caja? *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <label 
                    onClick={() => setTipoGaveta('centralizada')}
                    style={{
                      ...styles.opcionGaveta,
                      borderColor: tipoGaveta === 'centralizada' ? '#0052cc' : '#cbd5e1',
                      backgroundColor: tipoGaveta === 'centralizada' ? '#eff6ff' : '#fff'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="tipoGaveta" 
                      checked={tipoGaveta === 'centralizada'} 
                      onChange={() => setTipoGaveta('centralizada')} 
                    />
                    <div>
                      <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block' }}>
                        Gaveta Centralizada (Caja 01)
                      </strong>
                      <small style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Ideal para preventa: los empleados cargan pedidos pero el dinero en efectivo entra a la única gaveta principal del dueño.
                      </small>
                    </div>
                  </label>

                  <label 
                    onClick={() => setTipoGaveta('independiente')}
                    style={{
                      ...styles.opcionGaveta,
                      borderColor: tipoGaveta === 'independiente' ? '#16a34a' : '#cbd5e1',
                      backgroundColor: tipoGaveta === 'independiente' ? '#f0fdf4' : '#fff'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="tipoGaveta" 
                      checked={tipoGaveta === 'independiente'} 
                      onChange={() => setTipoGaveta('independiente')} 
                    />
                    <div>
                      <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block' }}>
                        Gaveta Propia Independiente
                      </strong>
                      <small style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Ideal si esta caja tiene su propia gaveta con dinero físico y el cajero hace su propio Cierre Z separado.
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              <button type="submit" style={styles.btnCrearSubmit}>
                Crear Caja y Generar QR
              </button>
            </form>
          </div>
        </div>
      )}

      {cajaParaVincular && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBoxVinculacion}>
            <div style={styles.headerModal}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>
                  Vincular: {cajaParaVincular.nombre}
                </h3>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Conecta un teléfono, tablet o PC Windows</small>
              </div>
              <button type="button" onClick={() => setCajaParaVincular(null)} style={styles.btnCerrarX}><X size={18} /></button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
              
              <div style={styles.boxMetodoQR}>
                <span style={styles.badgeMetodo}>Opción A: Teléfonos o Tablets</span>
                <p style={{ margin: '4px 0 10px 0', fontSize: '0.74rem', color: '#475569' }}>
                  En el teléfono nuevo, toca <strong>"Vincular Terminal"</strong> y escanea este código:
                </p>
                
                {/* QR CON MÁXIMO TAMAÑO Y MÍNIMA DENSIDAD PARA LECTURA INSTANTÁNEA */}
                <div style={styles.qrContainer}>
                  <QRCodeSVG 
                    value={payloadQR} 
                    size={190} 
                    level="L" 
                    includeMargin={true}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#94a3b8' }}>O TAMBIÉN</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
              </div>

              <div style={styles.boxMetodoPC}>
                <span style={{ ...styles.badgeMetodo, backgroundColor: '#f1f5f9', color: '#334155' }}>
                  Opción B: Para PC Windows / Sin Cámara
                </span>
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.74rem', color: '#475569' }}>
                  En la PC abre el sistema y escribe este código de 6 dígitos:
                </p>

                <div style={styles.displayCodigo6}>
                  {cajaParaVincular.codigoEnlace}
                </div>
                <small style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Válido para autorizar la terminal de inmediato
                </small>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => regenerarCodigo(cajaParaVincular)}
                  style={styles.btnRegenerar}
                >
                  <RefreshCw size={13} /> Generar Nuevo
                </button>

                <button
                  type="button"
                  onClick={() => setCajaParaVincular(null)}
                  style={styles.btnCerrarModalVincular}
                >
                  Listo / Entendido
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnNuevaCaja: { backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.76rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },

  bannerInfo: { backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' },

  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '14px' },
  cardCaja: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  iconoCajaBox: { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgePrincipal: { backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' },
  btnVincular: { backgroundColor: '#eff6ff', color: '#0052cc', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 10px', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  btnEliminar: { background: '#fee2e2', border: '1px solid #fecaca', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBoxCard: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '380px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  modalBoxVinculacion: { background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '360px', maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' },
  headerModal: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },

  campo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  lbl: { fontSize: '0.72rem', fontWeight: 'bold', color: '#475569' },
  inputGrande: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: '600', outline: 'none' },

  opcionGaveta: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer', textAlign: 'left' },
  btnCrearSubmit: { width: '100%', padding: '12px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 'bold', cursor: 'pointer' },

  boxMetodoQR: { width: '100%' },
  badgeMetodo: { display: 'inline-block', backgroundColor: '#eff6ff', color: '#0052cc', fontSize: '0.64rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' },
  qrContainer: { padding: '8px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '14px', display: 'inline-block', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },

  boxMetodoPC: { width: '100%' },
  displayCodigo6: { backgroundColor: '#f8fafc', border: '2px dashed #0052cc', borderRadius: '12px', padding: '10px', fontSize: '1.8rem', fontWeight: '900', color: '#0052cc', letterSpacing: '8px' },
  
  btnRegenerar: { flex: 1, padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  btnCerrarModalVincular: { flex: 1, padding: '10px', backgroundColor: '#0052cc', border: 'none', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }
};
