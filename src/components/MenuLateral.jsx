import React from 'react';
import { 
  Store, ShoppingCart, Package, CreditCard, Receipt, 
  TrendingUp, Settings, HelpCircle, LogOut, X, Wifi, WifiOff, ChevronRight
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

  const items = [
    { id: 'pos', nombre: 'Punto de Venta (Caja)', icono: ShoppingCart, color: '#0052cc', visible: true },
    { id: 'inventario', nombre: 'Inventario de Productos', icono: Package, color: '#0284c7', visible: true },
    { id: 'creditos', nombre: 'Créditos y Deudores', icono: CreditCard, color: '#d97706', badge: clientesMorosos > 0 ? `${clientesMorosos} pendientes` : null, visible: true },
    { id: 'caja', nombre: 'Cierre de Caja (Z)', icono: Receipt, color: '#00b050', visible: true },
    { id: 'historial', nombre: 'Historial de Ventas', icono: Receipt, color: '#8b5cf6', visible: true },
    { id: 'metricas', nombre: 'Ganancias y Rendimiento', icono: TrendingUp, color: '#10b981', visible: esDueno },
    { id: 'configuracion', nombre: 'Ajustes y Configuración', icono: Settings, color: '#475569', visible: esDueno },
    { id: 'soporte', nombre: 'Centro de Ayuda y Soporte', icono: HelpCircle, color: '#059669', visible: true }
  ];

  return (
    <div style={styles.overlay} onClick={alCerrar} translate="no">
      <div style={styles.menuBox} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Menú con Diseño Corporativo */}
        <div style={styles.headerMenu}>
          <div style={styles.brandRow}>
            <div style={styles.logoContainer}>
              {configEmpresa?.logo ? (
                <img src={configEmpresa.logo} alt="Logo" style={styles.logoComercio} />
              ) : (
                <img src="/isotipo_login.png" alt="Facilito" style={styles.logoComercio} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={styles.tituloComercio}>{configEmpresa?.nombre || 'Facilito POS'}</h3>
              <div style={styles.subInfoRow}>
                <span style={styles.badgeRol}>
                  {esDueno ? '✓ Dueño' : 'Cajero'} · {usuarioActivo?.nombre || 'Usuario'}
                </span>
                <span style={styles.badgeCaja}>{cajaActiva?.nombre || 'Caja 01'}</span>
              </div>
            </div>

            <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Lista de Navegación */}
        <div style={styles.cuerpoNav}>
          {items.filter(it => it.visible).map((it) => {
            const Icono = it.icono;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => { alNavegar(it.id); alCerrar(); }}
                style={styles.itemBtn}
              >
                <div style={{ ...styles.iconoWrapper, backgroundColor: `${it.color}15` }}>
                  <Icono size={17} color={it.color} />
                </div>
                <span style={styles.textoItem}>{it.nombre}</span>

                {it.badge && <span style={styles.badgeAlerta}>{it.badge}</span>}
                <ChevronRight size={15} color="#cbd5e1" />
              </button>
            );
          })}
        </div>

        {/* Pie con Estado del Servidor y Salir */}
        <div style={styles.footerMenu}>
          <button type="button" onClick={alCerrarSesion} style={styles.btnSalir}>
            <LogOut size={16} />
            <span>Cerrar Turno / Salir</span>
          </button>

          <div style={styles.servidorFila}>
            <div style={styles.indicadorOnline}>
              <div style={{ ...styles.puntoOnline, backgroundColor: onlineBackend ? '#00b050' : '#d97706' }} />
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 'bold' }}>
                {onlineBackend ? 'Servidor Online (Supabase)' : 'Modo Offline (Copia Local)'}
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Facilito POS Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    zIndex: 99999999,
    display: 'flex'
  },
  menuBox: {
    width: '84%',
    maxWidth: '320px',
    height: '100%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '10px 0 30px rgba(0,0,0,0.2)'
  },
  headerMenu: {
    padding: '16px 14px 14px 14px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },
  logoComercio: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  tituloComercio: {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: '900',
    color: '#0f2a4a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  subInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '3px'
  },
  badgeRol: {
    fontSize: '0.66rem',
    fontWeight: 'bold',
    color: '#00b050'
  },
  badgeCaja: {
    fontSize: '0.62rem',
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    padding: '1px 5px',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  btnCerrar: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  cuerpoNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 10px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease'
  },
  iconoWrapper: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  textoItem: {
    flex: 1,
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  badgeAlerta: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '6px',
    marginRight: '4px'
  },
  footerMenu: {
    padding: '12px 14px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  btnSalir: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  servidorFila: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '4px'
  },
  indicadorOnline: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  puntoOnline: {
    width: '7px',
    height: '7px',
    borderRadius: '50%'
  }
};
