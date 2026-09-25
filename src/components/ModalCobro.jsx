import React, { useState } from 'react';
import { X, DollarSign, Smartphone, CreditCard, Banknote, Check, BookOpen, User } from 'lucide-react';

export default function ModalCobro({
  abierto,
  alCerrar,
  totalUSD,
  totalBS,
  tasaCambio,
  clienteActual,
  setClienteActual,
  clientes,
  guardarClienteEnDB,
  alFinalizarVenta
}) {
  if (!abierto) return null;

  const totalNumUSD = parseFloat(totalUSD) || 0;
  const tasaNum = parseFloat(tasaCambio) || 1;

  const [pagoUSD, setPagoUSD] = useState('');
  const [pagoBsEfectivo, setPagoBsEfectivo] = useState('');
  const [pagoPM, setPagoPM] = useState('');
  const [pagoPunto, setPagoPunto] = useState('');
  const [esCredito, setEsCredito] = useState(false);

  const [docCliente, setDocCliente] = useState(clienteActual.doc === 'V-00000000' ? '' : clienteActual.doc);
  const [nombreCliente, setNombreCliente] = useState(clienteActual.nombre || 'Consumidor Final');
  const [tlfCliente, setTlfCliente] = useState(clienteActual.telefono || '');

  const usdIngresado = parseFloat(pagoUSD) || 0;
  const bsEfectivoIngresado = parseFloat(pagoBsEfectivo) || 0;
  const pmIngresado = parseFloat(pagoPM) || 0;
  const puntoIngresado = parseFloat(pagoPunto) || 0;

  const totalBsIngresado = bsEfectivoIngresado + pmIngresado + puntoIngresado;
  const totalCubiertoUSD = usdIngresado + (totalBsIngresado / tasaNum);

  const diferenciaUSD = totalCubiertoUSD - totalNumUSD;
  const vueltoUSD = diferenciaUSD > 0.009 ? diferenciaUSD : 0;
  const vueltoBS = vueltoUSD * tasaNum;

  const restaPorPagarUSD = diferenciaUSD < -0.009 ? Math.abs(diferenciaUSD) : 0;
  const restaPorPagarBS = restaPorPagarUSD * tasaNum;

  const manejarCambioDoc = (val) => {
    setDocCliente(val);
    const limpio = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const encontrado = clientes.find(c => {
      const cLimpio = (c.doc || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return cLimpio === limpio || (limpio.length >= 6 && cLimpio.endsWith(limpio));
    });

    if (encontrado) {
      setNombreCliente(encontrado.nombre);
      setTlfCliente(encontrado.telefono || '');
      setClienteActual({ ...encontrado });
    }
  };

  const activarModoCredito = () => {
    setEsCredito(true);
    setPagoUSD('');
    setPagoBsEfectivo('');
    setPagoPM('');
    setPagoPunto('');
  };

  const confirmarCobro = (e) => {
    e.preventDefault();

    if (!esCredito && restaPorPagarUSD > 0.05) {
      return alert(`Falta por cubrir $${restaPorPagarUSD.toFixed(2)} (Bs. ${restaPorPagarBS.toFixed(2)}). Presiona "Venta a Crédito" si es fiado.`);
    }

    if (esCredito && (!docCliente.trim() || nombreCliente === 'Consumidor Final')) {
      return alert('Para otorgar crédito es obligatorio ingresar la cédula y nombre del cliente.');
    }

    const clienteFinal = {
      doc: docCliente.trim() || 'V-00000000',
      nombre: nombreCliente.trim() || 'Consumidor Final',
      telefono: tlfCliente.trim()
    };

    if (clienteFinal.doc !== 'V-00000000') {
      guardarClienteEnDB(clienteFinal);
    }

    const saldoDeuda = esCredito 
      ? (restaPorPagarUSD > 0.01 ? restaPorPagarUSD.toFixed(2) : totalNumUSD.toFixed(2)) 
      : '0.00';

    const saldoDeudaBS = (parseFloat(saldoDeuda) * tasaNum).toFixed(2);

    alFinalizarVenta({
      fecha: new Date().toLocaleString('es-VE'),
      cliente: clienteFinal,
      totalUSD: totalNumUSD.toFixed(2),
      totalBS: (totalNumUSD * tasaNum).toFixed(2),
      tasa: tasaNum.toFixed(2),
      pagoUSD: usdIngresado.toFixed(2),
      pagoBsEfectivo: bsEfectivoIngresado.toFixed(2),
      pagoPM: pmIngresado.toFixed(2),
      pagoPunto: puntoIngresado.toFixed(2),
      vueltoUSD: vueltoUSD.toFixed(2),
      vueltoBS: vueltoBS.toFixed(2),
      esCredito: esCredito,
      saldoDeudaUSD: saldoDeuda,
      saldoDeudaBS: saldoDeudaBS
    });
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modalBox}>
        <div style={styles.modalHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 'bold' }}>Cobrar Orden</h3>
            <div style={{ color: '#0052cc', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>
              Total: ${totalNumUSD.toFixed(2)} <span style={{ color: '#64748b', fontWeight: 'normal' }}>· Bs. {(totalNumUSD * tasaNum).toFixed(2)}</span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrarModal}><X size={18} /></button>
        </div>

        <form onSubmit={confirmarCobro} style={styles.formScroll}>
          {/* DATOS DE CLIENTE COMPLETOS: CÉDULA, NOMBRE Y TELÉFONO */}
          <div style={styles.boxCliente}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <User size={14} color="#0052cc" />
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#1e293b' }}>Datos del Cliente:</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.labelMini}>Cédula / RIF:</label>
                <input
                  type="text"
                  placeholder="V-00000000"
                  value={docCliente}
                  onChange={(e) => manejarCambioDoc(e.target.value)}
                  style={styles.inputCliente}
                />
              </div>
              <div style={{ flex: 1.4 }}>
                <label style={styles.labelMini}>Nombre Cliente:</label>
                <input
                  type="text"
                  placeholder="Consumidor Final"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  style={styles.inputCliente}
                />
              </div>
            </div>

            <div>
              <label style={styles.labelMini}>Teléfono / WhatsApp:</label>
              <input
                type="text"
                placeholder="Ej: 04121234567"
                value={tlfCliente}
                onChange={(e) => setTlfCliente(e.target.value)}
                style={styles.inputCliente}
              />
            </div>
          </div>

          {/* BOTÓN RÁPIDO PARA FIAR / CRÉDITO COMPLETO */}
          <div style={{ marginBottom: '10px' }}>
            <button
              type="button"
              onClick={activarModoCredito}
              style={{
                ...styles.btnModoCredito,
                backgroundColor: esCredito ? '#ffedd5' : '#f8fafc',
                borderColor: esCredito ? '#ea580c' : '#cbd5e1',
                color: esCredito ? '#c2410c' : '#475569'
              }}
            >
              <BookOpen size={16} color={esCredito ? '#ea580c' : '#64748b'} />
              <span>{esCredito ? 'Venta Marcada a Crédito (Fiado Total)' : 'Fiar Totalidad de la Cuenta'}</span>
            </button>
          </div>

          {/* MÉTODOS DE PAGO */}
          <div style={styles.seccionCampos}>
            {/* DIVISAS $ */}
            <div style={styles.cardMetodo}>
              <div style={styles.metaRowMetodo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <DollarSign size={16} color="#16a34a" />
                  <span style={styles.nombreMetodo}>Divisas ($):</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setEsCredito(false); setPagoUSD(totalNumUSD.toFixed(2)); }}
                  style={styles.btnExacto}
                >
                  Monto Exacto
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={pagoUSD}
                onChange={(e) => { setEsCredito(false); setPagoUSD(e.target.value); }}
                style={styles.inputMonto}
              />
            </div>

            {/* EFECTIVO BS */}
            <div style={styles.cardMetodo}>
              <div style={styles.metaRowMetodo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Banknote size={16} color="#059669" />
                  <span style={styles.nombreMetodo}>Efectivo Bolívares (Bs):</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setEsCredito(false); setPagoBsEfectivo((totalNumUSD * tasaNum).toFixed(2)); }}
                  style={styles.btnExacto}
                >
                  Monto Exacto
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={pagoBsEfectivo}
                onChange={(e) => { setEsCredito(false); setPagoBsEfectivo(e.target.value); }}
                style={styles.inputMonto}
              />
            </div>

            {/* PAGO MÓVIL */}
            <div style={styles.cardMetodo}>
              <div style={styles.metaRowMetodo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Smartphone size={16} color="#0284c7" />
                  <span style={styles.nombreMetodo}>Pago Móvil (Bs):</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEsCredito(false);
                    const restanteBs = Math.max(0, (totalNumUSD - usdIngresado) * tasaNum - bsEfectivoIngresado - puntoIngresado);
                    setPagoPM(restanteBs.toFixed(2));
                  }}
                  style={styles.btnExacto}
                >
                  Completar Resto
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={pagoPM}
                onChange={(e) => { setEsCredito(false); setPagoPM(e.target.value); }}
                style={styles.inputMonto}
              />
            </div>

            {/* PUNTO DE VENTA */}
            <div style={styles.cardMetodo}>
              <div style={styles.metaRowMetodo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CreditCard size={16} color="#9333ea" />
                  <span style={styles.nombreMetodo}>Punto Débito (Bs):</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEsCredito(false);
                    const restanteBs = Math.max(0, (totalNumUSD - usdIngresado) * tasaNum - bsEfectivoIngresado - pmIngresado);
                    setPagoPunto(restanteBs.toFixed(2));
                  }}
                  style={styles.btnExacto}
                >
                  Completar Resto
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={pagoPunto}
                onChange={(e) => { setEsCredito(false); setPagoPunto(e.target.value); }}
                style={styles.inputMonto}
              />
            </div>
          </div>

          {/* VUELTO */}
          {vueltoUSD > 0.01 && (
            <div style={styles.bannerVuelto}>
              <span style={{ fontSize: '0.74rem' }}>Vuelto a entregar:</span>
              <strong style={{ fontSize: '1rem' }}>Bs. {vueltoBS.toFixed(2)} (${vueltoUSD.toFixed(2)})</strong>
            </div>
          )}

          {/* FALTANTE O CRÉDITO PARCIAL */}
          {restaPorPagarUSD > 0.01 && (
            <div style={styles.bannerResta}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem' }}>Falta por cubrir:</span>
                <strong style={{ fontSize: '0.92rem' }}>${restaPorPagarUSD.toFixed(2)} (Bs. {restaPorPagarBS.toFixed(2)})</strong>
              </div>
              <label style={styles.checkCreditoLabel}>
                <input
                  type="checkbox"
                  checked={esCredito}
                  onChange={(e) => setEsCredito(e.target.checked)}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>¿Anotar resto como Crédito (Fiado)?</span>
              </label>
            </div>
          )}

          <div style={{ marginTop: '16px', paddingBottom: '30px' }}>
            <button type="submit" style={styles.btnConfirmar}>
              <Check size={18} /> Confirmar y Emitir Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '12px' },
  modalBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '375px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' },
  btnCerrarModal: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  formScroll: { flex: 1, overflowY: 'auto', padding: '14px 16px' },
  boxCliente: { backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' },
  labelMini: { fontSize: '0.68rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '3px' },
  inputCliente: { width: '100%', boxSizing: 'border-box', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' },
  btnModoCredito: { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },
  seccionCampos: { display: 'flex', flexDirection: 'column', gap: '10px' },
  cardMetodo: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px' },
  metaRowMetodo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  nombreMetodo: { fontSize: '0.74rem', fontWeight: 'bold', color: '#334155' },
  btnExacto: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 'bold', color: '#0052cc', cursor: 'pointer' },
  inputMonto: { width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 'bold', outline: 'none' },
  bannerVuelto: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' },
  bannerResta: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', padding: '10px 12px', borderRadius: '10px', marginTop: '12px' },
  checkCreditoLabel: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer' },
  btnConfirmar: { width: '100%', padding: '13px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.92rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
};
