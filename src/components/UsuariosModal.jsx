import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Trash2, Edit3, KeyRound, Shield, Users, X } from 'lucide-react';

export default function UsuariosModal({ cajeros = [], alGuardarCajero, alEliminarCajero, alVolver }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cajeroEditando, setCajeroEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');

  const abrirFormulario = (cajero = null) => {
    if (cajero) {
      setCajeroEditando(cajero);
      setNombre(cajero.nombre || '');
      setPin(cajero.pin || '');
    } else {
      setCajeroEditando(null);
      setNombre('');
      setPin('');
    }
    setModalAbierto(true);
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('El nombre del cajero es requerido.');
    if (pin.length !== 6) return alert('El PIN de seguridad debe contener exactamente 6 dígitos numéricos.');

    alGuardarCajero({
      id: cajeroEditando ? cajeroEditando.id : Date.now().toString().slice(-6),
      nombre: nombre.trim(),
      pin: pin.trim(),
      rol: 'cajero',
      fechaCreacion: cajeroEditando ? cajeroEditando.fechaCreacion : new Date().toLocaleDateString('es-VE')
    });

    setModalAbierto(false);
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Personal y Cajeros</h2>
            <small style={{ color: '#666', fontSize: '0.72rem' }}>Control y permisos de empleados</small>
          </div>
        </div>

        <button type="button" onClick={() => abrirFormulario(null)} style={styles.btnNuevo}>
          <UserPlus size={15} /> Nuevo Cajero
        </button>
      </header>

      <div style={styles.scrollArea}>
        
        {/* TARJETA DEL DUEÑO */}
        <div style={styles.cardDueno}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.avatarDueno}><Shield size={20} color="#0052cc" /></div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Administrador General</strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Acceso total a ganancias, costos y configuración</div>
            </div>
          </div>
          <span style={styles.badgeDueno}>Dueño</span>
        </div>

        {/* LISTA DE CAJEROS */}
        <div style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', margin: '14px 0 8px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={15} /> CAJEROS ACTIVOS ({cajeros.length})
        </div>

        {cajeros.length === 0 ? (
          <div style={styles.vacio}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>No has registrado ningún cajero aún.</p>
            <small style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>Crea uno para que tus empleados cobren con su propio PIN de 6 dígitos.</small>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cajeros.map(c => (
              <div key={c.id} style={styles.cardCajero}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{c.nombre}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <KeyRound size={12} color="#94a3b8" /> PIN: •••••• ({c.pin}) · Desde: {c.fechaCreacion}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => abrirFormulario(c)}
                    style={styles.btnEditar}
                    title="Editar datos o cambiar PIN"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (confirm(`¿Eliminar al cajero ${c.nombre}?`)) alEliminarCajero(c.id);
                    }}
                    style={styles.btnEliminar}
                    title="Eliminar Cajero"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL CREAR / EDITAR */}
      {modalAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                {cajeroEditando ? 'Modificar Cajero' : 'Registrar Nuevo Cajero'}
              </strong>
              <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCerrar}><X size={18} /></button>
            </div>

            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre del Cajero / Empleado:</label>
                <input
                  type="text"
                  placeholder="Ej: Juana D Arco"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.input}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.campo}>
                <label style={styles.label}>PIN de Acceso (Exactamente 6 Números):</label>
                <input
                  type="password"
                  maxLength="6"
                  placeholder="Ej: 123456"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ ...styles.input, textAlign: 'center', letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  required
                />
                <span style={{ fontSize: '0.66rem', color: pin.length === 6 ? '#16a34a' : '#ea580c', fontWeight: 'bold', textAlign: 'right' }}>
                  {pin.length} / 6 dígitos
                </span>
              </div>

              <div style={{ fontSize: '0.68rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                ℹ️ Con este PIN de 6 dígitos el cajero operará la caja. No tendrá visibilidad sobre costos de compra ni ganancias netas del negocio.
              </div>

              <button type="submit" style={styles.btnGuardarForm}>
                {cajeroEditando ? 'Guardar Cambios' : 'Activar Cajero'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnNuevo: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 11px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '14px 16px' },
  cardDueno: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  avatarDueno: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeDueno: { backgroundColor: '#0052cc', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold' },
  cardCajero: { backgroundColor: '#fff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
  btnEditar: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#0052cc', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  btnEliminar: { backgroundColor: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  vacio: { textAlign: 'center', padding: '20px 0', backgroundColor: '#fff', borderRadius: '10px', border: '1px dashed #cbd5e1' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBox: { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '350px', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  campo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  label: { fontSize: '0.72rem', fontWeight: 'bold', color: '#475569' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' },
  btnGuardarForm: { marginTop: '4px', width: '100%', padding: '11px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' }
};
