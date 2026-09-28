import React, { useState } from 'react';
import { 
  DollarSign, Smartphone, CreditCard, Banknote, CheckCircle2, 
  X, User, Phone, BookOpen, AlertCircle
} from 'lucide-react';

export default function ModalCobro({
  abierto,
  alCerrar,
  totalUSD = 0,
  totalBS = 0,
  tasaCambio = 855.66,
  clienteActual,
  setClienteActual,
  clientes = [],
  guardarClienteEnDB,
  alFinalizarVenta
}) {
  if (!abierto) return null;

  const totalUSDNum = parseFloat(totalUSD) || 0;
  const tasaNum = parseFloat(tasaCambio) || 1;
  const totalBSNum = totalUSDNum * tasaNum;

  const [docCliente, setDocCliente] = useState(clienteActual?.doc === 'V-00000000' ? '' : (clienteActual?.doc || ''));
  const [nombreCliente, setNombreCliente] = useState(clienteActual?.nombre || 'Consumidor Final');
  const [telefonoCliente, setTelefonoCliente] = useState(clienteActual?.telefono || '');
  const [sugerencias, setSugerencias] = useState([]);

  const [montoUSD, setMontoUSD] = useState('');
  const [montoEfectivoBS, setMontoEfectivoBS] = useState('');
  const [montoPagoMovilBS, setMontoPagoMovilBS] = useState('');
  const [montoPuntoBS, setMontoPuntoBS] = useState('');
  const [esCredito, setEsCredito] = useState(false);

  const manejarCambioDoc = (doc) => {
    setDocCliente(doc);
    const docLimpio = doc.replace(/[^0-9]/g, '');
    if (docLimpio.length >= 3) {
      const match = clientes.filter(c => 
        (c.doc || '').replace(/[^0-9]/g, '').includes(docLimpio) ||
        (c.nombre || '').toLowerCase().includes(doc.toLowerCase())
      ).slice(0, 4);
      setSugerencias(match);

      const exacto = clientes.find(c => (c.doc || '').replace(/[^0-9]/g, '') === docLimpio);
      if (exacto) {
        setNombreCliente(exacto.nombre || '');
        setTelefonoCliente(exacto.telefono || '');
        if (setClienteActual) setClienteActual(exacto);
      }
    } else {
      setSugerencias([]);
    }
  };

  const seleccionarSugerido = (c) => {
    setDocCliente(c.doc || '');
    setNombreCliente(c.nombre || '');
    setTelefonoCliente(c.telefono || '');
    if (setClienteActual) setClienteActual(c);
    setSugerencias([]);
  };

  const numUSD = parseFloat(montoUSD) || 0;
  const numEfBS = parseFloat(montoEfectivoBS) || 0;
  const numPMBS = parseFloat(montoPagoMovilBS) || 0;
  const numPTBS = parseFloat(montoPuntoBS) || 0;

  const totalAbonadoUSD = numUSD + (numEfBS / tasaNum) + (numPMBS / tasaNum) + (numPTBS / tasaNum);
  const totalAbonadoBS = totalAbonadoUSD * tasaNum;

  const diferenciaUSD = totalAbonadoUSD - totalUSDNum;
  const vueltoUSD = diferenciaUSD > 0.005 ? diferenciaUSD : 0;
  const vueltoBS = vueltoUSD * tasaNum;

  const saldoRestanteUSD = Math.max(0, totalUSDNum - totalAbonadoUSD);
  const saldoRestanteBS = saldoRestanteUSD * tasaNum;

  const pagarTodoEn = (metodo) => {
    setEsCredito(false);
    setMontoUSD('');
    setMontoEfectivoBS('');
    setMontoPagoMovilBS('');
    setMontoPuntoBS('');

    if (metodo === 'usd') setMontoUSD(totalUSDNum.toFixed(2));
    else if (metodo === 'efectivo_bs') setMontoEfectivoBS(totalBSNum.toFixed(2));
    else if (metodo === 'pago_movil') setMontoPagoMovilBS(totalBSNum.toFixed(2));
    else if (metodo === 'punto') setMontoPuntoBS(totalBSNum.toFixed(2));
  };

  const procesarVenta = (e) => {
    if (e) e.preventDefault();

    if (esCredito) {
      if (!docCliente.trim() || docCliente === 'V-00000000' || nombreCliente === 'Consumidor Final') {
        return alert('Para fiar o vender a crédito debes registrar la Cédula y Nombre del cliente.');
      }
    } else {
      if (totalAbonadoUSD < (totalUSDNum - 0.01)) {
        return alert(`Faltan $${saldoRestanteUSD.toFixed(2)} (Bs. ${saldoRestanteBS.toFixed(2)}) para completar el monto.`);
      }
    }

    const clienteFinal = {
      doc: docCliente.trim() ? (docCliente.includes('-') ? docCliente : `V-${docCliente.trim()}`) : 'V-00000000',
      nombre: nombreCliente.trim() || 'Consumidor Final',
      telefono: telefonoCliente.trim() || ''
    };

    if (guardarClienteEnDB) guardarClienteEnDB(clienteFinal);
    if (setClienteActual) setClienteActual(clienteFinal);

    const pagosDesglose = [];
    if (numUSD > 0) pagosDesglose.push({ metodo: 'Efectivo ($)', montoUSD: numUSD, montoBS: numUSD * tasaNum });
    if (numEfBS > 0) pagosDesglose.push({ metodo: 'Efectivo (Bs)', montoUSD: numEfBS / tasaNum, montoBS: numEfBS });
    if (numPMBS > 0) pagosDesglose.push({ metodo: 'Pago Móvil', montoUSD: numPMBS / tasaNum, montoBS: numPMBS });
    if (numPTBS > 0) pagosDesglose.push({ metodo: 'Punto Débito', montoUSD: numPTBS / tasaNum, montoBS: numPTBS });

    const metodoPrincipal = esCredito ? 'credito' : (
      pagosDesglose.length > 1 ? 'Mixto' : (pagosDesglose[0]?.metodo || 'Efectivo ($)')
    );

    const ventaFinal = {
      id: 'vta_' + Date.now(),
      fecha: new Date().toISOString(),
      cliente: clienteFinal,
      totalUSD: totalUSDNum,
      totalBS: totalBSNum,
      tasaCambio: tasaNum,
      metodoPago: metodoPrincipal,
      pagos: pagosDesglose,
      esCredito: esCredito,
      montoRecibido: totalAbonadoUSD,
      vueltoUSD: parseFloat(vueltoUSD.toFixed(2)),
      vueltoBS: parseFloat(vueltoBS.toFixed(2))
    };

    if (alFinalizarVenta) {
      alFinalizarVenta(ventaFinal);
    }
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modalBox}>
        {/* Cabecera Corporativa */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.iconoBox}>
              <DollarSign size={18} color="#00b050" />
            </div>
            <div>
              <h3 style={styles.titulo}>Módulo de Cobro</h3>
              <span style={styles.subtitulo}>Tasa BCV: <strong>Bs. {tasaNum.toFixed(2)}</strong></span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={16} />
          </button>
        </div>

        {/* Tarjeta de Total con Colores Corporativos */}
        <div style={styles.tarjetaTotal}>
          <span style={styles.etiquetaTotal}>TOTAL A COBRAR</span>
          <div style={styles.cifraUSD}>${totalUSDNum.toFixed(2)}</div>
          <div style={styles.cifraBS}>Bs. {totalBSNum.toFixed(2)}</div>
        </div>

        {/* Datos del Cliente */}
        <div style={styles.seccionCliente}>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: '6px' }}>
            <input
              type="text"
              placeholder="Cédula cliente..."
              value={docCliente}
              onChange={(e) => manejarCambioDoc(e.target.value)}
              style={styles.inputCliente}
            />
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              style={styles.inputCliente}
              required
            />

            {sugerencias.length > 0 && (
              <div style={styles.desplegableSugerencias}>
                {sugerencias.map(c => (
                  <div key={c.id || c.doc} onClick={() => seleccionarSugerido(c)} style={styles.itemSugerencia}>
                    <strong style={{ color: '#0f2a4a' }}>{c.nombre}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}> · {c.doc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={styles.iconoInputBox}><Phone size={13} color="#64748b" /></div>
            <input
              type="text"
              placeholder="Teléfono (WhatsApp para enviar ticket)..."
              value={telefonoCliente}
              onChange={(e) => setTelefonoCliente(e.target.value)}
              style={styles.inputCliente}
            />
          </div>
        </div>

        {/* Botón Fiar / A Crédito */}
        <div 
          onClick={() => {
            setEsCredito(!esCredito);
            if (!esCredito) {
              setMontoUSD('');
              setMontoEfectivoBS('');
              setMontoPagoMovilBS('');
              setMontoPuntoBS('');
            }
          }}
          style={{
            ...styles.cardFiar,
            backgroundColor: esCredito ? '#fef2f2' : '#ffffff',
            borderColor: esCredito ? '#ef4444' : '#e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color={esCredito ? '#dc2626' : '#64748b'} />
            <div>
              <strong style={{ fontSize: '0.8rem', color: esCredito ? '#dc2626' : '#0f2a4a', display: 'block' }}>
                Vender a Crédito / Fiar Pedido
              </strong>
              <small style={{ fontSize: '0.66rem', color: '#64748b' }}>
                Se sumará a la cuenta pendiente del cliente en Créditos
              </small>
            </div>
          </div>
          <input
            type="checkbox"
            checked={esCredito}
            onChange={() => {}}
            style={{ width: '16px', height: '16px', accentColor: '#dc2626', cursor: 'pointer' }}
          />
        </div>

        {/* Métodos de Pago con Pagar Todo */}
        {!esCredito && (
          <div style={styles.gridPagos}>
            {/* Divisas $ */}
            <div style={styles.cajaPagoMetodo}>
              <div style={styles.filaMetodoTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <DollarSign size={14} color="#00b050" />
                  <strong style={styles.labelMetodo}>Divisas ($):</strong>
                </div>
                <button type="button" onClick={() => pagarTodoEn('usd')} style={styles.btnPagarTodoPill}>
                  Pagar Todo
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={montoUSD}
                onChange={(e) => setMontoUSD(e.target.value)}
                style={styles.inputMetodo}
              />
            </div>

            {/* Efectivo Bs */}
            <div style={styles.cajaPagoMetodo}>
              <div style={styles.filaMetodoTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Banknote size={14} color="#00b050" />
                  <strong style={styles.labelMetodo}>Efectivo (Bs):</strong>
                </div>
                <button type="button" onClick={() => pagarTodoEn('efectivo_bs')} style={styles.btnPagarTodoPill}>
                  Pagar Todo
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={montoEfectivoBS}
                onChange={(e) => setMontoEfectivoBS(e.target.value)}
                style={styles.inputMetodo}
              />
            </div>

            {/* Pago Móvil */}
            <div style={styles.cajaPagoMetodo}>
              <div style={styles.filaMetodoTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Smartphone size={14} color="#0052cc" />
                  <strong style={styles.labelMetodo}>Pago Móvil (Bs):</strong>
                </div>
                <button type="button" onClick={() => pagarTodoEn('pago_movil')} style={styles.btnPagarTodoPill}>
                  Pagar Todo
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={montoPagoMovilBS}
                onChange={(e) => setMontoPagoMovilBS(e.target.value)}
                style={styles.inputMetodo}
              />
            </div>

            {/* Punto Débito */}
            <div style={styles.cajaPagoMetodo}>
              <div style={styles.filaMetodoTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CreditCard size={14} color="#7c3aed" />
                  <strong style={styles.labelMetodo}>Punto Débito (Bs):</strong>
                </div>
                <button type="button" onClick={() => pagarTodoEn('punto')} style={styles.btnPagarTodoPill}>
                  Pagar Todo
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={montoPuntoBS}
                onChange={(e) => setMontoPuntoBS(e.target.value)}
                style={styles.inputMetodo}
              />
            </div>
          </div>
        )}

        {/* Resumen de Cobro */}
        <div style={styles.tarjetaResumen}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#0f2a4a', fontWeight: '800' }}>TOTAL ABONADO:</span>
            <strong style={{ fontSize: '1.05rem', color: '#00b050' }}>+${totalAbonadoUSD.toFixed(2)}</strong>
          </div>

          {vueltoUSD > 0.005 ? (
            <div style={styles.alertaVueltoBox}>
              <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: '800' }}>CAMBIO / VUELTO:</span>
              <strong style={{ fontSize: '1rem', color: '#b45309' }}>
                ${vueltoUSD.toFixed(2)} <small style={{ fontSize: '0.74rem' }}>(Bs. {vueltoBS.toFixed(2)})</small>
              </strong>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>FALTANTE:</span>
              <strong style={{ fontSize: '0.84rem', color: saldoRestanteUSD > 0.01 ? '#ea580c' : '#00b050' }}>
                ${saldoRestanteUSD.toFixed(2)} (Bs. {saldoRestanteBS.toFixed(2)})
              </strong>
            </div>
          )}
        </div>

        {/* Botón Principal */}
        <button
          type="button"
          onClick={procesarVenta}
          style={{
            ...styles.btnCompletarPrincipal,
            backgroundColor: esCredito ? '#dc2626' : '#00b050'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{esCredito ? 'Fiar y Guardar en Créditos' : 'Procesar Pago y Emitir Ticket'}</span>
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
    padding: '8px',
    zIndex: 99999999
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '430px',
    maxHeight: '96vh',
    overflowY: 'auto',
    padding: '14px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconoBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titulo: {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: '900',
    color: '#0f2a4a'
  },
  subtitulo: {
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
  tarjetaTotal: {
    backgroundColor: '#0f2a4a',
    borderRadius: '14px',
    padding: '10px 14px',
    textAlign: 'center',
    color: '#ffffff'
  },
  etiquetaTotal: {
    fontSize: '0.66rem',
    fontWeight: '800',
    letterSpacing: '0.8px',
    color: '#94a3b8'
  },
  cifraUSD: {
    fontSize: '1.75rem',
    fontWeight: '900',
    color: '#00b050',
    lineHeight: 1.1,
    margin: '2px 0'
  },
  cifraBS: {
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#bfdbfe'
  },
  seccionCliente: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '8px',
    border: '1px solid #e2e8f0'
  },
  inputCliente: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  iconoInputBox: {
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  desplegableSugerencias: {
    position: 'absolute',
    top: '38px',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    zIndex: 99999,
    maxHeight: '140px',
    overflowY: 'auto'
  },
  itemSugerencia: {
    padding: '8px 10px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer'
  },
  cardFiar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer'
  },
  gridPagos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  cajaPagoMetodo: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '6px 10px'
  },
  filaMetodoTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px'
  },
  labelMetodo: {
    fontSize: '0.74rem',
    color: '#0f2a4a'
  },
  btnPagarTodoPill: {
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '0.66rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  inputMetodo: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.84rem',
    fontWeight: 'bold',
    outline: 'none',
    backgroundColor: '#f8fafc',
    color: '#0f2a4a'
  },
  tarjetaResumen: {
    backgroundColor: '#f0fdf4',
    borderRadius: '10px',
    border: '1px solid #bbf7d0',
    padding: '8px 12px'
  },
  alertaVueltoBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
    paddingTop: '4px',
    borderTop: '1px dashed #bbf7d0'
  },
  btnCompletarPrincipal: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)'
  }
};
