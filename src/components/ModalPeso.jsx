import React, { useState } from 'react';
import { Scale, Check, X } from 'lucide-react';

export default function ModalPeso({
  producto,
  tasaCambio = 855.66,
  alConfirmar,
  alCerrar
}) {
  const [pesoInput, setPesoInput] = useState('');
  const [unidad, setUnidad] = useState('kg'); // 'kg' | 'g'

  if (!producto) return null;

  const precioKiloUSD = Number(producto.precioUSD || 0);

  const calcularKilosReales = () => {
    const val = parseFloat(pesoInput) || 0;
    if (unidad === 'g') {
      return val / 1000;
    }
    return val;
  };

  const kilosReales = calcularKilosReales();
  const subtotalUSD = kilosReales * precioKiloUSD;
  const subtotalBS = subtotalUSD * Number(tasaCambio || 1);

  const pulsarNumero = (num) => {
    if (num === '.' && pesoInput.includes('.')) return;
    if (pesoInput.length < 7) {
      setPesoInput(prev => prev + num);
    }
  };

  const borrar = () => {
    setPesoInput(prev => prev.slice(0, -1));
  };

  const aplicarAtajo = (cantKg) => {
    setUnidad('kg');
    setPesoInput(String(cantKg));
  };

  const manejarConfirmar = (e) => {
    if (e) e.preventDefault();
    if (kilosReales <= 0) return alert('Por favor ingresa un peso válido mayor a 0');
    alConfirmar(parseFloat(kilosReales.toFixed(3)));
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modalBox}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.iconoBox}>
              <Scale size={20} color="#0052cc" />
            </div>
            <div>
              <h3 style={styles.titulo}>{producto.nombre}</h3>
              <span style={styles.subtitulo}>Precio por Kilo: ${precioKiloUSD.toFixed(2)}</span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Pantalla Digital de la Balanza */}
        <div style={styles.visorBalanza}>
          <div style={styles.filaVisor}>
            <span style={styles.textoPesoVal}>
              {pesoInput || '0.000'}
            </span>
            <div style={styles.toggleUnidad}>
              <button
                type="button"
                onClick={() => setUnidad('kg')}
                style={{
                  ...styles.btnUnidad,
                  backgroundColor: unidad === 'kg' ? '#0f2a4a' : 'transparent',
                  color: unidad === 'kg' ? '#fff' : '#64748b'
                }}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setUnidad('g')}
                style={{
                  ...styles.btnUnidad,
                  backgroundColor: unidad === 'g' ? '#0f2a4a' : 'transparent',
                  color: unidad === 'g' ? '#fff' : '#64748b'
                }}
              >
                Gramos
              </button>
            </div>
          </div>

          <div style={styles.resumenTotalesFila}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Equivale a: <strong>{kilosReales.toFixed(3)} KG</strong>
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.totalUSDVal}>${subtotalUSD.toFixed(2)}</div>
              <div style={styles.totalBSVal}>Bs. {subtotalBS.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Botones de Peso Rápido */}
        <div style={styles.filaAtajos}>
          <button type="button" onClick={() => aplicarAtajo(0.25)} style={styles.btnAtajo}>250g (1/4)</button>
          <button type="button" onClick={() => aplicarAtajo(0.5)} style={styles.btnAtajo}>500g (1/2)</button>
          <button type="button" onClick={() => aplicarAtajo(1.0)} style={styles.btnAtajo}>1.00 KG</button>
          <button type="button" onClick={() => aplicarAtajo(2.0)} style={styles.btnAtajo}>2.00 KG</button>
        </div>

        {/* Teclado Numérico Táctil */}
        <div style={styles.tecladoGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} type="button" onClick={() => pulsarNumero(String(n))} style={styles.btnNum}>
              {n}
            </button>
          ))}
          <button type="button" onClick={() => pulsarNumero('.')} style={styles.btnNum}>.</button>
          <button type="button" onClick={() => pulsarNumero('0')} style={styles.btnNum}>0</button>
          <button type="button" onClick={borrar} style={styles.btnBorrar}>⌫</button>
        </div>

        {/* Confirmar */}
        <button type="button" onClick={manejarConfirmar} style={styles.btnConfirmar}>
          <Check size={18} />
          <span>Agregar a la Cuenta (${subtotalUSD.toFixed(2)})</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 99999999
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '350px',
    width: '100%',
    padding: '20px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconoBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titulo: {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#0f2a4a',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  subtitulo: {
    fontSize: '0.72rem',
    color: '#00b050',
    fontWeight: 'bold'
  },
  btnCerrar: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  visorBalanza: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '2px solid #e2e8f0',
    padding: '12px 14px'
  },
  filaVisor: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px dashed #cbd5e1',
    paddingBottom: '8px',
    marginBottom: '8px'
  },
  textoPesoVal: {
    fontSize: '1.7rem',
    fontWeight: '900',
    color: '#0f2a4a',
    letterSpacing: '1px'
  },
  toggleUnidad: {
    display: 'flex',
    backgroundColor: '#e2e8f0',
    borderRadius: '8px',
    padding: '2px'
  },
  btnUnidad: {
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  resumenTotalesFila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalUSDVal: {
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#00b050'
  },
  totalBSVal: {
    fontSize: '0.72rem',
    fontWeight: 'bold',
    color: '#64748b'
  },
  filaAtajos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px'
  },
  btnAtajo: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '6px 2px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    color: '#0052cc',
    cursor: 'pointer'
  },
  tecladoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  btnNum: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '11px',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#0f2a4a',
    cursor: 'pointer'
  },
  btnBorrar: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '11px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#dc2626',
    cursor: 'pointer'
  },
  btnConfirmar: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)'
  }
};
