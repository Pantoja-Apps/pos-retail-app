import React from 'react';
import { 
  X, Store, Package, BookOpen, Wallet, History, 
  TrendingUp, Settings, HelpCircle, LogOut, ShieldCheck, UserCheck, 
  ChevronRight, Wifi, WifiOff
} from 'lucide-react';

export default function MenuLateral({ 
  abierto, 
  alCerrar, 
  configEmpresa, 
  usuarioActivo, 
  cajaActiva, 
  onlineBackend = false,
  clientesMorosos = 0,
  alNavegar, 
  alCerrarSesion 
}) {
  if (!abierto) return null;

  const esDueno = usuarioActivo?.rol === 'dueno';

  const items = [
    { id: 'pos', label: 'Punto de Venta (Caja)', icon: Store, color: '#0052cc', bg: '#eff6ff', soloDueno: false },
    { id: 'inventario', label: 'Inventario de Productos', icon: Package, color: '#0052cc', bg: '#eff6ff', soloDueno: false },
    { 
      id: 'creditos', 
      label: 'Créditos y Deudores', 
      icon: BookOpen, 
      color: clientesMorosos > 0 ? '#ea580c' : '#475569', 
      bg: clientesMorosos > 0 ? '#fff7ed' : '#f8fafc', 
      badge: clientesMorosos > 0 ? `${clientesMorosos} pendientes` : null,
      soloDueno: false 
    },
    { id: 'caja', label: 'Cierre de Caja (Z)', icon: Wallet, color: '#16a34a', bg: '#f0fdf4', soloDueno: false },
    { id: 'historial', label: 'Historial de Ventas', icon: History, color: '#9333ea', bg: '#faf5ff', soloDueno: false },
    { id: 'metricas', label: 'Ganancias y Rendimiento', icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4', soloDueno: true },
    { id: 'configuracion', label: 'Ajustes y Configuración', icon: Settings, color: '#475569', bg: '#f1f5f9', soloDueno: true },
    { id: 'soporte', label: 'Centro de Ayuda y Soporte', icon: HelpCircle, color: '#059669', bg: '#ecfdf5', soloDueno: false }
  ];

  const itemsFiltrados = items.filter(it => !it.soloDueno || esDueno);

  return (
    <div style={styles.overlay} onClick={alCerrar} translate="no">
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Perfil / Negocio */}
        <div style={styles.perfilHeader}>
          <div style={styles.perfilInfo}>
            <div style={{ position: 'relative' }}>
              {configEmpresa.logo ? (
                <img src={configEmpresa.logo} alt="Logo" style={styles.avatarLogo} />
              ) : (
                <div style={styles.avatarDefault}>
                  <Store size={22} color="#0052cc" />
                </div>
              )}
              {/* Punto indicador de conexión sobre el logo */}
              <span 
                style={{
                  ...styles.dotStatus,
                  backgroundColor: onlineBackend ? '#16a34a' : '#d97706',
                  boxShadow: onlineBackend ? '0 0 0 2px #fff, 0 0 6px rgba(22, 163, 74, 0.6)' : '0 0 0 2px #fff'
                }} 
                title={onlineBackend ? 'Online' : 'Offline'}
              />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={styles.nombreNegocio}>{configEmpresa.nombre || 'Mi Negocio'}</h3>
              <div style={styles.filaBadges}>
                <span style={esDueno ? styles.badgeRolDueno : styles.badgeRolCajero}>
                  {esDueno ? <ShieldCheck size={11} /> : <UserCheck size={11} />}
                  <span>{usuarioActivo?.nombre || 'Usuario'}</span>
                </span>
                {cajaActiva?.nombre && (
                  <span style={styles.badgeCaja}>{cajaActiva.nombre}</span>
                )}
              </div>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrarDrawer}>
            <X size={18} />
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav style={styles.listaNav}>
          {itemsFiltrados.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  alNavegar(it.id);
                  alCerrar();
                }}
                style={styles.itemBoton}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ ...styles.iconoContenedor, backgroundColor: it.bg, color: it.color }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={styles.itemLabel}>{it.label}</span>
                    {it.badge && <span style={styles.itemBadge}>{it.badge}</span>}
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>
            );
          })}
        </nav>

        {/* Pie del Menú con Estado de Conexión Profesional */}
        <div style={styles.footerDrawer}>
          <button
            type="button"
            onClick={() => {
              alCerrar();
              alCerrarSesion();
            }}
            style={styles.btnCerrarTurno}
          >
            <LogOut size={16} color="#dc2626" />
            <span>Cerrar Turno / Salir</span>
          </button>

          {/* Estado de Red / Servidor en el pie */}
          <div style={styles.cajaEstadoConexion}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span 
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: onlineBackend ? '#16a34a' : '#d97706'
                }} 
              />
              <span style={{ fontSize: '0.68rem', fontWeight: '700', color: onlineBackend ? '#166534' : '#92400e' }}>
                {onlineBackend ? 'Servidor Online' : 'Modo Offline'}
              </span>
            </div>
            <div style={styles.textoVersion}>Facilito POS Pro · Pantoja Apps</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(3px)',
    zIndex: 99999,
    display: 'flex'
  },
  drawer: {
    width: '82%',
    maxWidth: '320px',
    backgroundColor: '#fff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
  },
  perfilHeader: {
    padding: '16px 14px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  perfilInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: 1
  },
  avatarLogo: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    objectFit: 'contain',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    display: 'block'
  },
  avatarDefault: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bfdbfe'
  },
  dotStatus: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  nombreNegocio: {
    margin: 0,
    fontSize: '0.92rem',
    fontWeight: '800',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  filaBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '4px'
  },
  badgeRolDueno: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.62rem',
    fontWeight: '700',
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  badgeRolCajero: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.62rem',
    fontWeight: '700',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  badgeCaja: {
    fontSize: '0.62rem',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  btnCerrarDrawer: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  listaNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemBoton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 10px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    width: '100%'
  },
  iconoContenedor: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemLabel: {
    display: 'block',
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  itemBadge: {
    display: 'block',
    fontSize: '0.66rem',
    color: '#ea580c',
    fontWeight: 'bold',
    marginTop: '1px'
  },
  footerDrawer: {
    padding: '12px 14px 18px 14px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  btnCerrarTurno: {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #fecaca',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  cajaEstadoConexion: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 4px 0 4px',
    borderTop: '1px dashed #e2e8f0'
  },
  textoVersion: {
    fontSize: '0.66rem',
    color: '#94a3b8'
  }
};
