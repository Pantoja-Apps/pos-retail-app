import React from 'react';
import { 
  Store, ShoppingCart, Package, Users, Receipt, Clock, 
  BarChart3, Settings, HelpCircle, LogOut, X, Wifi, WifiOff,
  Truck, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function MenuLateral({
  abierto,
  alCerrar,
  configEmpresa,
  usuarioActivo,
  cajaActiva,
  onlineBackend,
  clientesMorosos = 0,
  alNavegar,
  alCerrarSesion
}) {
  if (!abierto) return null;

  const esDueno = usuarioActivo?.rol === 'dueno';

  const secciones = [
    {
      titulo: 'OPERACIONES DE CAJA',
      items: [
        { id: 'pos', label: 'Caja Mostrador (Ventas)', icon: ShoppingCart, color: '#00b050' },
        { id: 'caja', label: 'Arqueo y Cierre de Caja (Z)', icon: Clock, color: '#0052cc' }
      ]
    },
    {
      titulo: 'GESTIÓN COMERCIAL',
      items: [
        { id: 'inventario', label: 'Inventario y Catálogo', icon: Package, color: '#d97706' },
        { id: 'proveedores', label: 'Compras y Proveedores', icon: Truck, color: '#7c3aed', soloDueno: true },
        { 
          id: 'creditos', 
          label: 'Créditos y Clientes', 
          icon: Users, 
          color: '#0284c7',
          badge: clientesMorosos > 0 ? `${clientesMorosos} por cobrar` : null 
        }
      ]
    },
    {
      titulo: 'AUDITORÍA Y FINANZAS',
      items: [
        { id: 'historial', label: 'Historial de Ventas', icon: Receipt, color: '#475569' },
        { id: 'metricas', label: 'Rendimiento y Ganancias', icon: BarChart3, color: '#059669', soloDueno: true },
        { id: 'configuracion', label: 'Configuración del Sistema', icon: Settings, color: '#334155', soloDueno: true },
        { id: 'soporte', label: 'Soporte y Asistencia', icon: HelpCircle, color: '#64748b' }
      ]
    }
  ];

  return (
    <div style={styles.overlay} onClick={alCerrar} translate="no">
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera Ejecutiva Azul Marino */}
        <div style={styles.cabeceraHero}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {configEmpresa?.logo ? (
                <img src={configEmpresa.logo} alt="Logo" style={styles.logoEmpresa} />
              ) : (
                <div style={styles.avatarComercio}>
                  <Store size={22} color="#0f2a4a" />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h3 style={styles.nombreComercio}>{configEmpresa?.nombre || 'FACILITO POS'}</h3>
                <div style={styles.badgeRol}>
                  <ShieldCheck size={11} color="#00b050" />
                  <span>{usuarioActivo?.nombre || 'Angel Pantoja'} ({esDueno ? 'Dueño' : cajaActiva?.nombre || 'Cajero'})</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={alCerrar} style={styles.btnCerrarDrawer}>
              <X size={16} />
            </button>
          </div>

          {/* Estado de Sincronización en la Nube */}
          <div style={styles.tarjetaStatusNube}>
            {onlineBackend ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={styles.puntoVerdePulsante} />
                <Wifi size={12} color="#4ade80" />
                <span style={{ fontSize: '0.68rem', color: '#f0fdf4', fontWeight: 'bold' }}>
                  Conectado y Sincronizado en la Nube
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WifiOff size={12} color="#fcd34d" />
                <span style={{ fontSize: '0.68rem', color: '#fef3c7', fontWeight: 'bold' }}>
                  Modo Local Operativo (Offline)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Navegación Segmentada */}
        <nav style={styles.cuerpoNav}>
          {secciones.map((sec, sIdx) => {
            const itemsVisibles = sec.items.filter(it => !it.soloDueno || esDueno);
            if (itemsVisibles.length === 0) return null;

            return (
              <div key={sIdx} style={styles.seccionGrupo}>
                <span style={styles.tituloSeccionTag}>{sec.titulo}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {itemsVisibles.map(it => {
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          alNavegar(it.id);
                          alCerrar();
                        }}
                        style={styles.itemNavegacionBtn}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ ...styles.cajaIcono, backgroundColor: `${it.color}15`, color: it.color }}>
                            <Icon size={16} />
                          </div>
                          <span style={styles.labelItem}>{it.label}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {it.badge && (
                            <span style={styles.badgeNotificacion}>{it.badge}</span>
                          )}
                          <ChevronRight size={14} color="#94a3b8" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Pie con Botón de Salir */}
        <div style={styles.footerDrawer}>
          <button type="button" onClick={() => { alCerrarSesion(); alCerrar(); }} style={styles.btnCerrarSesion}>
            <LogOut size={16} />
            <span>Cerrar Turno y Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 999999999,
    display: 'flex',
    animation: 'fadeIn 0.2s ease-out'
  },
  drawer: {
    width: '300px',
    height: '100%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '8px 0 35px rgba(0,0,0,0.2)',
    boxSizing: 'border-box'
  },
  cabeceraHero: {
    backgroundColor: '#0f2a4a',
    padding: '16px 14px 14px 14px',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0
  },
  logoEmpresa: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    objectFit: 'contain',
    backgroundColor: '#ffffff',
    padding: '2px',
    border: '1.5px solid rgba(255,255,255,0.2)'
  },
  avatarComercio: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  nombreComercio: {
    margin: '0 0 2px 0',
    fontSize: '0.94rem',
    fontWeight: '900',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  badgeRol: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.66rem',
    color: '#94a3b8'
  },
  btnCerrarDrawer: {
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ffffff'
  },
  tarjetaStatusNube: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  puntoVerdePulsante: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#00b050',
    boxShadow: '0 0 8px #00b050'
  },
  cuerpoNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  seccionGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  tituloSeccionTag: {
    fontSize: '0.62rem',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '0.6px',
    padding: '0 8px 3px 8px'
  },
  itemNavegacionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left'
  },
  cajaIcono: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  labelItem: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  badgeNotificacion: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '1px 6px',
    borderRadius: '6px',
    border: '1px solid #fecaca'
  },
  footerDrawer: {
    padding: '12px 14px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#ffffff'
  },
  btnCerrarSesion: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer'
  }
};
