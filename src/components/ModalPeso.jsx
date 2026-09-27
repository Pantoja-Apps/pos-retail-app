import React, { useState, useEffect } from 'react';
import { X, Scale, DollarSign, Check, Sparkles } from 'lucide-react';

export default function ModalPeso({ abierto, producto, tasaCambio, alConfirmar, alCerrar }) {
  if (!abierto || !producto) return null;

  const [modo, setModo] = useState('kilos'); // 'kilos' | 'montoUSD' | 'montoBS'
  const [valorInput, setValorInput] = useState('');

  const tasaNum = parseFloat(tasaCambio) || 1;
  const precioKiloUSD = parseFloat(producto.precioUSD) || 0;
  const precioKiloBS = precioKiloUSD * tasaNum;

  // Cálculos automáticos
  let kilosFinal = 0;
  const valNum = parseFloat(valorInput) || 0;

  if (modo === 'kilos') {
    kilosFinal = valNum;
  } else if (modo === 'montoUSD') {
    kilosFinal = precioKiloUSD > 0 ? valNum / precioKiloUSD : 0;
  } else if (modo === 'montoBS') {
    kilosFinal = precioKiloBS > 0 ? valNum / precioKiloBS : 0;
  }

  const totalUSD = kilosFinal * precioKiloUSD;
  const totalBS = totalUSD * tasaNum;

  const confirmar = (e) => {
    if (e) e.preventDefault();
    if (kilosFinal <= 0) return alert('Por favor ingresa una cantidad o monto válido.');
    alConfirmar(producto, kilosFinal);
    alCerrar();
  };

  const setKilosDirectos = (k) => {
    setModo('kilos');
    setValorInput(k.toString());
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{producto.nombre}</h3>
            <small style={{ color: '#059669', fontWeight: 'bold' }}>
              ${precioKiloUSD.toFixed(2)}/Kg · Bs. {precioKiloBS.toFixed(2)}/Kg
            </small>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}><X size={18} /></button>
        </div>

        {/* MODOS DE ENTRADA */}
        <div style={styles.tabsModo}>
          <button
            type="button"
            onClick={() => { setModo('kilos'); setValorInput(''); }}
            style={{ ...styles.btnTab, backgroundColor: modo === 'kilos' ? '#059669' : 'transparent', color: modo === 'kilos' ? '#fff' : '#64748b' }}
          >
            <Scale size={13} /> Por Peso (Kg)
          </button>
          <button
            type="button"
            onClick={() => { setModo('montoUSD'); setValorInput(''); }}
            style={{ ...styles.btnTab, backgroundColor: modo === 'montoUSD' ? '#0052cc' : 'transparent', color: modo === 'montoUSD' ? '#fff' : '#64748b' }}
          >
            <DollarSign size={13} /> Por Dólares ($)
          </button>
          <button
            type="button"
            onClick={() => { setModo('montoBS'); setValorInput(''); }}
            style={{ ...styles.btnTab, backgroundColor: modo === 'montoBS' ? '#0052cc' : 'transparent', color: modo === 'montoBS' ? '#fff' : '#64748b' }}
          >
            Bs Por Bolívares
          </button>
        </div>

        {/* BOTONES RÁPIDOS DE PESO */}
        {modo === 'kilos' && (
          <div style={styles.filaChips}>
            <button type="button" onClick={() => setKilosDirectos(0.250)} style={styles.chipPeso}>250g (1/4)</button>
            <button type="button" onClick={() => setKilosDirectos(0.500)} style={styles.chipPeso}>500g (1/2)</button>
            <button type="button" onClick={() => setKilosDirectos(0.750)} style={styles.chipPeso}>750g (3/4)</button>
            <button type="button" onClick={() => setKilosDirectos(1.000)} style={styles.chipPeso}>1 Kg</button>
          </div>
        )}

        <form onSubmit={confirmar} style={{ margin: '12px 0' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
            {modo === 'kilos' && 'Introduce el peso en Kilos (Ej: 0.350):'}
            {modo === 'montoUSD' && '¿Cuánto dinero va a llevar en Dólares ($)?:'}
            {modo === 'montoBS' && '¿Cuánto dinero va a llevar en Bolívares (Bs)?:'}
          </label>
          <input
            type="number"
            step="any"
            placeholder={modo === 'kilos' ? '0.000' : '0.00'}
            value={valorInput}
            onChange={(e) => setValorInput(e.target.value)}
            style={styles.inputGrande}
            autoFocus
          />
        </form>

        {/* RESUMEN RESULTANTE */}
        <div style={styles.cajaResumen}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Peso Calculado:</span>
            <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{kilosFinal.toFixed(3)} Kg ({Math.round(kilosFinal * 1000)}g)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Total a Cobrar:</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#16a34a' }}>${totalUSD.toFixed(2)}</div>
              <small style={{ fontSize: '0.7rem', color: '#0052cc', fontWeight: 'bold' }}>Bs. {totalBS.toFixed(2)}</small>
            </div>
          </div>
        </div>

        <button type="button" onClick={confirmar} style={styles.btnAgregarOrden}>
          <Check size={16} /> Agregar al Carrito
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBox: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  tabsModo: { display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '10px', marginTop: '6px' },
  btnTab: { flex: 1, border: 'none', borderRadius: '8px', padding: '7px 4px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  filaChips: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '10px' },
  chipPeso: { backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 2px', fontSize: '0.72rem', fontWeight: 'bold', color: '#334155', cursor: 'pointer' },
  inputGrande: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', textAlign: 'center', outline: 'none' },
  cajaResumen: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', margin: '10px 0' },
  btnAgregarOrden: { width: '100%', padding: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
};
