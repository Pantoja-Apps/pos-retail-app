import React, { useState } from 'react';
import { Scale, Check, X } from 'lucide-react';

export default function ModalPeso({
  producto,
  tasaCambio = 855.66,
  alConfirmar,
  alCerrar
}) {
  const [valorInput, setValorInput] = useState('');
  // Modos disponibles: 'kg' | 'g' | 'usd' | 'bs'
  const [modo, setModo] = useState('kg');

  if (!producto) return null;

  const precioKiloUSD = Number(producto.precioUSD || 0);
  const tasa = Number(tasaCambio) || 1;
  const precioKiloBS = precioKiloUSD * tasa;

  // Cálculo en función del modo seleccionado
  const numInput = parseFloat(valorInput) || 0;

  let kilosReales = 0;
  let subtotalUSD = 0;
  let subtotalBS = 0;

  if (modo === 'kg') {
    kilosReales = numInput;
    subtotalUSD = kilosReales * precioKiloUSD;
    subtotalBS = subtotalUSD * tasa;
  } else if (modo === 'g') {
    kilosReales = numInput / 1000;
    subtotalUSD = kilosReales * precioKiloUSD;
    subtotalBS = subtotalUSD * tasa;
  } else if (modo === 'usd') {
    subtotalUSD = numInput;
    subtotalBS = subtotalUSD * tasa;
    kilosReales = precioKiloUSD > 0 ? (subtotalUSD / precioKiloUSD) : 0;
  } else if (modo === 'bs') {
    subtotalBS = numInput;
    subtotalUSD = tasa > 0 ? (subtotalBS / tasa) : 0;
    kilosReales = precioKiloUSD > 0 ? (subtotalUSD / precioKiloUSD) : 0;
  }

  const gramosEquivalentes = Math.round(kilosReales * 1000);

  const pulsarNumero = (num) => {
    if (num === '.' && valorInput.includes('.')) return;
    if (valorInput.length < 8) {
      setValorInput(prev => prev + num);
    }
  };

  const borrar = () => {
    setValorInput(prev => prev.slice(0, -1));
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setValorInput('');
  };

  const aplicarAtajo = (val) => {
    setValorInput(String(val));
  };

  const manejarConfirmar = (e) => {
    if (e) e.preventDefault();
    if (kilosReales <= 0) return alert('Por favor ingresa un monto o peso válido mayor a 0');
    // Enviamos los kilos reales calculados al carrito
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
              <span style={styles.subtitulo}>
                ${precioKiloUSD.toFixed(2)}/kg · Bs. {precioKiloBS.toFixed(2)}/kg
              </span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Selector de Modalidad: KG, Gramos, Dólares ($), Bolívares (Bs) */}
        <div style={styles.pestanasModo}>
          <button
            type="button"
            onClick={() => cambiarModo('kg')}
            style={{
              ...styles.btnPestana,
              backgroundColor: modo === 'kg' ? '#0f2a4a' : '#f1f5f9',
              color: modo === 'kg' ? '#fff' : '#64748b'
            }}
          >
            KG
          </button>
          <button
            type="button"
            onClick={() => cambiarModo('g')}
            style={{
              ...styles.btnPestana,
              backgroundColor: modo === 'g' ? '#0f2a4a' : '#f1f5f9',
              color: modo === 'g' ? '#fff' : '#64748b'
            }}
          >
            Gramos
          </button>
          <button
            type="button"
            onClick={() => cambiarModo('usd')}
            style={{
              ...styles.btnPestana,
              backgroundColor: modo === 'usd' ? '#00b050' : '#f1f5f9',
              color: modo === 'usd' ? '#fff' : '#64748b'
            }}
          >
            $ Dólares
          </button>
          <button
            type="button"
            onClick={() => cambiarModo('bs')}
            style={{
              ...styles.btnPestana,
              backgroundColor: modo === 'bs' ? '#0052cc' : '#f1f5f9',
              color: modo === 'bs' ? '#fff' : '#64748b'
            }}
          >
            Bs Bolívares
          </button>
        </div>

        {/* Visor Digital Principal */}
        <div style={styles.visorBalanza}>
          <div style={styles.filaVisor}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#64748b' }}>
                {modo === 'usd' ? '$' : modo === 'bs' ? 'Bs.' : ''}
              </span>
              <span style={styles.textoPesoVal}>
                {valorInput || '0'}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>
                {modo === 'kg' ? 'KG' : modo === 'g' ? 'g' : ''}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={styles.etiquetaEquivalente}>Peso Resultante:</div>
              <strong style={{ fontSize: '1rem', color: '#0f2a4a' }}>
                {kilosReales.toFixed(3)} KG
              </strong>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                ({gramosEquivalentes} gramos)
              </div>
            </div>
          </div>

          <div style={styles.resumenTotalesFila}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
              Total a Pagar:
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.totalUSDVal}>${subtotalUSD.toFixed(2)}</div>
              <div style={styles.totalBSVal}>Bs. {subtotalBS.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Atajos Rápidos Inteligentes según la modalidad */}
        <div style={styles.filaAtajos}>
          {modo === 'kg' && (
            <>
              <button type="button" onClick={() => aplicarAtajo(0.25)} style={styles.btnAtajo}>0.25 KG</button>
              <button type="button" onClick={() => aplicarAtajo(0.5)} style={styles.btnAtajo}>0.50 KG</button>
              <button type="button" onClick={() => aplicarAtajo(1)} style={styles.btnAtajo}>1.00 KG</button>
              <button type="button" onClick={() => aplicarAtajo(2)} style={styles.btnAtajo}>2.00 KG</button>
            </>
          )}

          {modo === 'g' && (
            <>
              <button type="button" onClick={() => aplicarAtajo(250)} style={styles.btnAtajo}>250g</button>
              <button type="button" onClick={() => aplicarAtajo(500)} style={styles.btnAtajo}>500g</button>
              <button type="button" onClick={() => aplicarAtajo(750)} style={styles.btnAtajo}>750g</button>
              <button type="button" onClick={() => aplicarAtajo(1000)} style={styles.btnAtajo}>1000g</button>
            </>
          )}

          {modo === 'usd' && (
            <>
              <button type="button" onClick={() => aplicarAtajo(1)} style={styles.btnAtajo}>$1</button>
              <button type="button" onClick={() => aplicarAtajo(2)} style={styles.btnAtajo}>$2</button>
              <button type="button" onClick={() => aplicarAtajo(5)} style={styles.btnAtajo}>$5</button>
              <button type="button" onClick={() => aplicarAtajo(10)} style={styles.btnAtajo}>$10</button>
            </>
          )}

          {modo === 'bs' && (
            <>
              <button type="button" onClick={() => aplicarAtajo(500)} style={styles.btnAtajo}>500 Bs</button>
              <button type="button" onClick={() => aplicarAtajo(1000)} style={styles.btnAtajo}>1.000 Bs</button>
              <button type="button" onClick={() => aplicarAtajo(2000)} style={styles.btnAtajo}>2.000 Bs</button>
              <button type="button" onClick={() => aplicarAtajo(5000)} style={styles.btnAtajo}>5.000 Bs</button>
            </>
          )}
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

        {/* Botón de Confirmación */}
        <button type="button" onClick={manejarConfirmar} style={styles.btnConfirmar}>
          <Check size={18} />
          <span>Agregar ({kilosReales.toFixed(3)} kg = ${subtotalUSD.toFixed(2)})</span>
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
    padding: '18px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
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
    fontSize: '0.68rem',
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
  pestanasModo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '4px',
    backgroundColor: '#e2e8f0',
    padding: '3px',
    borderRadius: '10px'
  },
  btnPestana: {
    border: 'none',
    borderRadius: '8px',
    padding: '6px 2px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease'
  },
  visorBalanza: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    border: '2px solid #e2e8f0',
    padding: '10px 12px'
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
    fontSize: '1.6rem',
    fontWeight: '900',
    color: '#0f2a4a',
    letterSpacing: '0.5px'
  },
  etiquetaEquivalente: {
    fontSize: '0.64rem',
    color: '#64748b',
    fontWeight: 'bold'
  },
  resumenTotalesFila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalUSDVal: {
    fontSize: '1.15rem',
    fontWeight: '900',
    color: '#00b050'
  },
  totalBSVal: {
    fontSize: '0.74rem',
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
    fontSize: '0.72rem',
    fontWeight: 'bold',
    color: '#0052cc',
    cursor: 'pointer'
  },
  tecladoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '7px'
  },
  btnNum: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#0f2a4a',
    cursor: 'pointer'
  },
  btnBorrar: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '10px',
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
    fontSize: '0.86rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)'
  }
};
