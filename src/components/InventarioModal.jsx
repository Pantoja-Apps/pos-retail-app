import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Package, Camera, Image as ImageIcon } from 'lucide-react';

export default function InventarioModal({ productos, alGuardarProducto, alEliminarProducto, alVolver, alAbrirCamara }) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [prodEditandoId, setProdEditandoId] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [precioUSD, setPrecioUSD] = useState('');
  const [stock, setStock] = useState('');
  const [imagen, setImagen] = useState('');
  const fileInputRef = useRef(null);

  const iniciarNuevo = () => {
    setModoEdicion(true);
    setProdEditandoId(null);
    setCodigo('');
    setNombre('');
    setPrecioUSD('');
    setStock('');
    setImagen('');
  };

  const iniciarEditar = (prod) => {
    setModoEdicion(true);
    setProdEditandoId(prod.id);
    setCodigo(prod.codigo);
    setNombre(prod.nombre);
    setPrecioUSD(prod.precioUSD);
    setStock(prod.stock || 0);
    setImagen(prod.imagen || '');
  };

  const cancelar = () => {
    setModoEdicion(false);
    setProdEditandoId(null);
  };

  const manejarSeleccionImagen = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImagen(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.readAsDataURL(file);
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim() || !precioUSD) {
      alert('Completa Código, Nombre y Precio');
      return;
    }

    alGuardarProducto({
      id: prodEditandoId || Date.now(),
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      precioUSD: parseFloat(precioUSD) || 0,
      stock: parseInt(stock) || 0,
      imagen: imagen || '',
    });

    cancelar();
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Inventario de Productos</h2>
        </div>
        {!modoEdicion && (
          <button type="button" onClick={iniciarNuevo} style={styles.btnNuevo}>
            <Plus size={16} /> Nuevo
          </button>
        )}
      </header>

      {modoEdicion ? (
        <form onSubmit={guardar} style={styles.formulario}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#0052cc' }}>
            {prodEditandoId ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </h3>

          <div style={styles.seccionImagen}>
            <div style={styles.cajaPreview} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              {imagen ? (
                <img src={imagen} alt="Preview" style={styles.previewImg} />
              ) : (
                <div style={styles.placeholderImg}>
                  <ImageIcon color="#888" size={26} />
                  <span style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px' }}>Foto</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={manejarSeleccionImagen} style={{ display: 'none' }} />
            {imagen && (
              <button type="button" onClick={() => setImagen('')} style={styles.btnQuitarFoto}>Quitar foto</button>
            )}
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Código de Barras:</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código EAN..." style={styles.input} required />
              <button type="button" onClick={() => alAbrirCamara((cod) => setCodigo(cod))} style={styles.btnEscanear} title="Escanear con cámara">
                <Camera size={18} />
              </button>
            </div>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Nombre del Producto:</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Harina PAN" style={styles.input} required />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ ...styles.campo, flex: 1 }}>
              <label style={styles.label}>Precio ($):</label>
              <input type="number" step="any" value={precioUSD} onChange={(e) => setPrecioUSD(e.target.value)} placeholder="0.00" style={styles.input} required />
            </div>
            <div style={{ ...styles.campo, flex: 1 }}>
              <label style={styles.label}>Stock:</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" style={styles.input} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={cancelar} style={styles.btnCancelar}>Cancelar</button>
            <button type="submit" style={styles.btnGuardar}>Guardar</button>
          </div>
        </form>
      ) : (
        <div style={styles.lista}>
          {productos.map((p) => (
            <div key={p.id} style={styles.itemCard}>
              {p.imagen ? (
                <img src={p.imagen} alt={p.nombre} style={styles.thumbMini} />
              ) : (
                <div style={styles.thumbVacio}><Package color="#aaa" size={18} /></div>
              )}
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#111' }}>{p.nombre}</strong>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Cód: <span style={{ fontFamily: 'monospace', color: '#0052cc', fontWeight: 'bold' }}>{p.codigo}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#28a745', fontWeight: 'bold' }}>${p.precioUSD.toFixed(2)} | Stock: {p.stock || 0}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => iniciarEditar(p)} style={styles.btnAccionEdit}><Edit color="#0052cc" size={16} /></button>
                <button type="button" onClick={() => alEliminarProducto(p.id)} style={styles.btnAccionDelete}><Trash2 color="#de350b" size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e4e8' },
  btnBack: { background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnNuevo: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' },
  lista: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  itemCard: { backgroundColor: '#fff', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  thumbMini: { width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' },
  thumbVacio: { width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnAccionEdit: { background: '#e6f0ff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnAccionDelete: { background: '#ffebe6', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formulario: { padding: '16px', backgroundColor: '#fff', margin: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' },
  seccionImagen: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' },
  cajaPreview: { width: '74px', height: '74px', borderRadius: '10px', border: '2px dashed #ccd0d5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#fafbfc' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholderImg: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  btnQuitarFoto: { background: 'none', border: 'none', color: '#de350b', fontSize: '0.72rem', fontWeight: 'bold', marginTop: '4px', cursor: 'pointer' },
  campo: { display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' },
  label: { fontSize: '0.78rem', fontWeight: 'bold', color: '#444' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', outline: 'none' },
  btnEscanear: { backgroundColor: '#20c997', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer' },
  btnCancelar: { flex: 1, padding: '10px', border: '1px solid #ccc', background: '#f8f9fa', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnGuardar: { flex: 2, padding: '10px', border: 'none', background: '#28a745', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};
