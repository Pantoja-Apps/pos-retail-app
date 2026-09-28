import React from 'react';
import { 
  Store, ShoppingCart, Package, Users, Receipt, Clock, 
  BarChart3, Settings, HelpCircle, LogOut, X, Wifi, WifiOff,
  Truck
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
    { id: 'pos', label: 'Caja Mostrador (Ventas)', icon: ShoppingCart },
    { id: 'caja', label: 'Arqueo y Cierre de Caja (Z)', icon: Clock },
    { id: 'inventario', label: 'Inventario y Catálogo', icon: Package },
    { id: 'creditos', label: `Créditos y Clientes ${clientesMorosos > 0 ? `(${clientesMorosos})` : ''}`, icon: Users, badge: clientesMorosos > 0 },
    { id: 'proveedores', label: 'Proveedores y Compras', icon: Truck, soloDueno: true },
    { id: 'historial', label: 'Historial de Ventas', icon: Receipt },
    { id: 'metricas', label: 'Rendimiento y Finanzas', icon: BarChart3, soloDueno: true },
    { id: 'configuracion', label: 'Configuración del Negocio', icon: Settings, soloDueno: true },
    { id: 'soporte', label: 'Soporte y Asistencia', icon: HelpCircle }
  ];

  return (
    <div style={styles.overlay} onClick={alCerrar} translate="no">
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {configEmpresa?.logo ? (
              <img src={configEmpresa.logo} alt="Logo" style={styles.logoImg} />
            ) : (
              <div style={styles.avatarBox}><Store size={20} color="#0f2a4a" /></div>
            )}
            <div style={{ minWidth: 0 }}>
              <h3 style={styles.nombreNegocio}>{configEmpresa?.nombre || 'Mi Bodega POS'}</h3>
              <span style={styles.usuarioTag}>
                {usuarioActivo?.nombre} ({esDueno ? 'Dueño' : cajaActiva?.nombre || 'Cajero'})
              </span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Estado de Red */}
        <div style={styles.badgeConexion}>
          {onlineBackend ? (
            <>
              <Wifi size={13} color="#00b050" />
              <span style={{ color: '#00b050', fontWeight: 'bold' }}>Sincronizado en la Nube</span>
            </>
          ) : (
            <>
              <WifiOff size={13} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Modo Local (Offline)</span>
            </>
          )}
        </div>

        {/* Lista de Opciones */}
        <nav style={styles.listaNav}>
          {items.map(it => {
            if (it.soloDueno && !esDueno) return null;
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  alNavegar(it.id);
                  alCerrar();
                }}
                style={styles.itemBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color="#0f2a4a" />
                  <span style={styles.itemTexto}>{it.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Pie: Cerrar Sesión */}
        <div style={styles.footer}>
          <button type="button" onClick={() => { alCerrarSesion(); alCerrar(); }} style={styles.btnSalir}>
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    zIndex: 999999999,
    display: 'flex'
  },
  drawer: {
    width: '280px',
    height: '100%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 25px rgba(0,0,0,0.15)'
  },
  header: {
    padding: '14px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoImg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    objectFit: 'contain',
    border: '1px solid #cbd5e1'
  },
  avatarBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bfdbfe'
  },
  nombreNegocio: {
    margin: 0,
    fontSize: '0.88rem',
    fontWeight: '800',
    color: '#0f2a4a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  usuarioTag: {
    fontSize: '0.68rem',
    color: '#64748b'
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
  badgeConexion: {
    padding: '6px 14px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.66rem'
  },
  listaNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s'
  },
  itemTexto: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#334155'
  },
  footer: {
    padding: '12px 14px',
    borderTop: '1px solid #f1f5f9'
  },
  btnSalir: {
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
