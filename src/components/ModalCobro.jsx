import React, { useState } from 'react';
import { 
  DollarSign, Smartphone, CreditCard, Banknote, CheckCircle2, 
  X, User, Phone, BookOpen, Zap
} from 'lucide-react';

const BILLETES_USD = [1, 2, 5, 10, 20, 50, 100];

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

  // Datos Cliente
  const [docCliente, setDocCliente] = useState(clienteActual?.doc === 'V-00000000' ? '' : (clienteActual?.doc || ''));
  const [nombreCliente, setNombreCliente] = useState(clienteActual?.nombre || 'Consumidor Final');
  const [telefonoCliente, setTelefonoCliente] = useState(clienteActual?.telefono || '');
  const [sugerencias, setSugerencias] = useState([]);

  // Montos por Método
  const [metodoActivo, setMetodoActivo] = useState('usd');
  const [montoUSD, setMontoUSD] = useState('');
  const [montoPagoMovilBS, setMontoPagoMovilBS] = useState('');
  const [montoPuntoBS, setMontoPuntoBS] = useState('');
  const [montoEfectivoBS, setMontoEfectivoBS] = useState('');
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

  const valUSD = parseFloat(montoUSD) || 0;
  const valPM = parseFloat(montoPagoMovilBS) || 0;
  const valPunto = parseFloat(montoPuntoBS) || 0;
  const valEfBS = parseFloat(montoEfectivoBS) || 0;

  const totalAbonadoUSD = valUSD + (valPM / tasaNum) + (valPunto / tasaNum) + (valEfBS / tasaNum);
  const totalAbonadoBS = totalAbonadoUSD * tasaNum;

  const diferenciaUSD = totalAbonadoUSD - totalUSDNum;
  const vueltoUSD = diferenciaUSD > 0.005 ? diferenciaUSD : 0;
  const vueltoBS = vueltoUSD * tasaNum;

  const saldoFaltanteUSD = Math.max(0, totalUSDNum - totalAbonadoUSD);
  const saldoFaltanteBS = saldoFaltanteUSD * tasaNum;

  const pulsarTecla = (t) => {
    if (esCredito) return;
    const actualizarValor = (prev) => {
      if (t === '.' && prev.includes('.')) return prev;
      if (prev.length >= 9) return prev;
      return prev + t;
    };

    if (metodoActivo === 'usd') setMontoUSD(prev => actualizarValor(prev));
    else if (metodoActivo === 'pago_movil') setMontoPagoMovilBS(prev => actualizarValor(prev));
    else if (metodoActivo === 'punto') setMontoPuntoBS(prev => actualizarValor(prev));
    else if (metodoActivo === 'efectivo_bs') setMontoEfectivoBS(prev => actualizarValor(prev));
  };

  const borrarTecla = () => {
    if (esCredito) return;
    if (metodoActivo === 'usd') setMontoUSD(prev => prev.slice(0, -1));
    else if (metodoActivo === 'pago_movil') setMontoPagoMovilBS(prev => prev.slice(0, -1));
    else if (metodoActivo === 'punto') setMontoPuntoBS(prev => prev.slice(0, -1));
    else if (metodoActivo === 'efectivo_bs') setMontoEfectivoBS(prev => prev.slice(0, -1));
  };

  const liquidarRestanteEnMetodoActivo = () => {
    if (esCredito) return;

    if (metodoActivo === 'usd') {
      const restoUSD = Math.max(0, totalUSDNum - (valPM / tasaNum) - (valPunto / tasaNum) - (valEfBS / tasaNum));
      setMontoUSD(restoUSD.toFixed(2));
    } else if (metodoActivo === 'pago_movil') {
      const cubiertoUSD = valUSD + (valPunto / tasaNum) + (valEfBS / tasaNum);
      const restoBS = Math.max(0, (totalUSDNum - cubiertoUSD) * tasaNum);
      setMontoPagoMovilBS(restoBS.toFixed(2));
    } else if (metodoActivo === 'punto') {
      const cubiertoUSD = valUSD + (valPM / tasaNum) + (valEfBS / tasaNum);
      const restoBS = Math.max(0, (totalUSDNum - cubiertoUSD) * tasaNum);
      setMontoPuntoBS(restoBS.toFixed(2));
    } else if (metodoActivo === 'efectivo_bs') {
      const cubiertoUSD = valUSD + (valPM / tasaNum) + (valPunto / tasaNum);
      const restoBS = Math.max(0, (totalUSDNum - cubiertoUSD) * tasaNum);
      setMontoEfectivoBS(restoBS.toFixed(2));
    }
  };

  const procesarCobro = (e) => {
    if (e) e.preventDefault();

    if (esCredito) {
      if (!docCliente.trim() || docCliente === 'V-00000000' || nombreCliente === 'Consumidor Final') {
        return alert('Para fiar o vender a crédito debes registrar la Cédula y Nombre del cliente.');
      }
    } else {
      if (totalAbonadoUSD <= 0) {
        if (metodoActivo === 'usd') setMontoUSD(totalUSDNum.toFixed(2));
        else if (metodoActivo === 'pago_movil') setMontoPagoMovilBS(totalBSNum.toFixed(2));
        else if (metodoActivo === 'punto') setMontoPuntoBS(totalBSNum.toFixed(2));
        else setMontoEfectivoBS(totalBSNum.toFixed(2));
      } else if (totalAbonadoUSD < (totalUSDNum - 0.01)) {
        return alert(`Monto incompleto. Faltan $${saldoFaltanteUSD.toFixed(2)} (Bs. ${saldoFaltanteBS.toFixed(2)}).`);
      }
    }

    const clienteFinal = {
      id: (clienteActual?.id && String(clienteActual.id).startsWith('cli_')) ? clienteActual.id : ('cli_' + Date.now()),
      doc: docCliente.trim() ? (docCliente.includes('-') ? docCliente : `V-${docCliente.trim()}`) : 'V-00000000',
      nombre: nombreCliente.trim() || 'Consumidor Final',
      telefono: telefonoCliente.trim() || '',
      limiteCredito: clienteActual?.limiteCredito || 0,
      saldoDeudorUSD: clienteActual?.saldoDeudorUSD || 0
    };

    if (guardarClienteEnDB) guardarClienteEnDB(clienteFinal);
    if (setClienteActual) setClienteActual(clienteFinal);

    // Desglose de pagos respetando su moneda real
    const pagosDesglose = [];
    if (valUSD > 0 || (totalAbonadoUSD === 0 && metodoActivo === 'usd')) {
      const mUSD = valUSD > 0 ? valUSD : totalUSDNum;
      pagosDesglose.push({ 
        metodo: 'Efectivo ($)', 
        moneda: 'USD',
        monto: mUSD, 
        montoUSD: mUSD, 
        montoBS: mUSD * tasaNum 
      });
    }
    if (valPM > 0 || (totalAbonadoUSD === 0 && metodoActivo === 'pago_movil')) {
      const mPM = valPM > 0 ? valPM : totalBSNum;
      pagosDesglose.push({ 
        metodo: 'Pago Móvil', 
        moneda: 'BS',
        monto: mPM, 
        montoUSD: mPM / tasaNum, 
        montoBS: mPM 
      });
    }
    if (valPunto > 0 || (totalAbonadoUSD === 0 && metodoActivo === 'punto')) {
      const mPto = valPunto > 0 ? valPunto : totalBSNum;
      pagosDesglose.push({ 
        metodo: 'Punto Débito', 
        moneda: 'BS',
        monto: mPto, 
        montoUSD: mPto / tasaNum, 
        montoBS: mPto 
      });
    }
    if (valEfBS > 0 || (totalAbonadoUSD === 0 && metodoActivo === 'efectivo_bs')) {
      const mEf = valEfBS > 0 ? valEfBS : totalBSNum;
      pagosDesglose.push({ 
        metodo: 'Efectivo (Bs)', 
        moneda: 'BS',
        monto: mEf, 
        montoUSD: mEf / tasaNum, 
        montoBS: mEf 
      });
    }

    let textoMetodoPrincipal = 'Efectivo ($)';
    if (esCredito) {
      textoMetodoPrincipal = 'credito';
    } else if (pagosDesglose.length > 1) {
      textoMetodoPrincipal = 'Pago Mixto';
    } else if (pagosDesglose.length === 1) {
      textoMetodoPrincipal = pagosDesglose[0].metodo;
    }

    const ventaFinal = {
      id: 'vta_' + Date.now(),
      fecha: new Date().toISOString(),
      cliente: clienteFinal,
      totalUSD: totalUSDNum,
      totalBS: totalBSNum,
      tasaCambio: tasaNum,
      metodoPago: textoMetodoPrincipal,
      pagos: pagosDesglose,
      esCredito: esCredito,
      montoRecibido: esCredito ? 0 : (totalAbonadoUSD > 0 ? totalAbonadoUSD : totalUSDNum),
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
        {/* Cabecera */}
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

        {/* Tarjeta de Total */}
        <div style={styles.tarjetaTotal}>
          <span style={styles.etiquetaTotal}>TOTAL A COBRAR</span>
          <div style={styles.cifraUSD}>${totalUSDNum.toFixed(2)}</div>
          <div style={styles.cifraBS}>Bs. {totalBSNum.toFixed(2)}</div>
        </div>

        {/* Datos del Cliente */}
        <div style={styles.seccionCliente}>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '6px' }}>
            <input
              type="text"
              placeholder="Cédula (Ej: 22033378)"
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
            <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={13} color="#64748b" />
            </div>
            <input
              type="text"
              placeholder="Teléfono móvil (WhatsApp)..."
              value={telefonoCliente}
              onChange={(e) => setTelefonoCliente(e.target.value)}
              style={styles.inputCliente}
            />
          </div>
        </div>

        {/* Fiar a Crédito */}
        <div
          onClick={() => {
            setEsCredito(!esCredito);
            if (!esCredito) {
              setMontoUSD('');
              setMontoPagoMovilBS('');
              setMontoPuntoBS('');
              setMontoEfectivoBS('');
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
              <strong style={{ fontSize: '0.78rem', color: esCredito ? '#dc2626' : '#0f2a4a', display: 'block' }}>
                Vender a Crédito / Fiar Pedido
              </strong>
              <small style={{ fontSize: '0.64rem', color: '#64748b' }}>
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

        {/* Métodos de Pago con Calculadora Táctil */}
        {!esCredito && (
          <>
            <div style={styles.gridMetodosPastillas}>
              {[
                { id: 'usd', label: 'Efectivo ($)', icon: DollarSign, color: '#00b050', val: montoUSD ? `$${montoUSD}` : null },
                { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: '#0052cc', val: montoPagoMovilBS ? `Bs.${montoPagoMovilBS}` : null },
                { id: 'punto', label: 'Punto Débito', icon: CreditCard, color: '#7c3aed', val: montoPuntoBS ? `Bs.${montoPuntoBS}` : null },
                { id: 'efectivo_bs', label: 'Efectivo (Bs)', icon: Banknote, color: '#d97706', val: montoEfectivoBS ? `Bs.${montoEfectivoBS}` : null }
              ].map(m => {
                const Icon = m.icon;
                const activo = metodoActivo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodoActivo(m.id)}
                    style={{
                      ...styles.btnMetodoPastilla,
                      borderColor: activo ? '#0f2a4a' : '#e2e8f0',
                      backgroundColor: activo ? '#0f2a4a' : '#ffffff',
                      color: activo ? '#ffffff' : '#334155'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon size={13} color={activo ? '#00b050' : m.color} />
                      <span>{m.label}</span>
                    </div>
                    {m.val && (
                      <span style={{ fontSize: '0.66rem', fontWeight: 'bold', color: activo ? '#bfdbfe' : '#00b050' }}>
                        {m.val}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pantalla del Método Seleccionado */}
            <div style={styles.pantallaMetodoActivo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>
                  EDITANDO: {metodoActivo === 'usd' ? 'DÓLARES ($)' : metodoActivo === 'pago_movil' ? 'PAGO MÓVIL (BS)' : metodoActivo === 'punto' ? 'PUNTO (BS)' : 'EFECTIVO (BS)'}
                </span>
                <button type="button" onClick={liquidarRestanteEnMetodoActivo} style={styles.btnLiquidarRestante}>
                  <Zap size={11} />
                  <span>Completar Restante</span>
                </button>
              </div>

              <div style={styles.visorCifraActiva}>
                {metodoActivo === 'usd' ? (
                  montoUSD ? `$${montoUSD}` : <span style={{ color: '#94a3b8' }}>$0.00</span>
                ) : metodoActivo === 'pago_movil' ? (
                  montoPagoMovilBS ? `Bs. ${montoPagoMovilBS}` : <span style={{ color: '#94a3b8' }}>Bs. 0.00</span>
                ) : metodoActivo === 'punto' ? (
                  montoPuntoBS ? `Bs. ${montoPuntoBS}` : <span style={{ color: '#94a3b8' }}>Bs. 0.00</span>
                ) : (
                  montoEfectivoBS ? `Bs. ${montoEfectivoBS}` : <span style={{ color: '#94a3b8' }}>Bs. 0.00</span>
                )}
              </div>

              {metodoActivo === 'usd' && (
                <div style={styles.filaBilletes}>
                  {BILLETES_USD.map(b => (
                    <button key={b} type="button" onClick={() => setMontoUSD(String(b))} style={styles.btnBilleteMini}>
                      ${b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calculadora Táctil */}
            <div style={styles.tecladoGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} type="button" onClick={() => pulsarTecla(String(n))} style={styles.btnTecla}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => pulsarTecla('.')} style={styles.btnTecla}>.</button>
              <button type="button" onClick={() => pulsarTecla('0')} style={styles.btnTecla}>0</button>
              <button type="button" onClick={borrarTecla} style={styles.btnTeclaBorrar}>⌫</button>
            </div>

            {/* Resumen Consolidado */}
            <div style={styles.tarjetaResumenConsolidado}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: '#0f2a4a', fontWeight: '800' }}>TOTAL ABONADO:</span>
                <strong style={{ fontSize: '1rem', color: '#00b050' }}>+${totalAbonadoUSD.toFixed(2)}</strong>
              </div>

              {vueltoUSD > 0.005 ? (
                <div style={styles.alertaVueltoBox}>
                  <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: '800' }}>CAMBIO / VUELTO:</span>
                  <strong style={{ fontSize: '0.94rem', color: '#b45309' }}>
                    ${vueltoUSD.toFixed(2)} (Bs. {vueltoBS.toFixed(2)})
                  </strong>
                </div>
              ) : saldoFaltanteUSD > 0.01 && totalAbonadoUSD > 0 && (
                <div style={styles.alertaFaltanteBox}>
                  <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: '800' }}>FALTA POR CUBRIR:</span>
                  <strong style={{ fontSize: '0.88rem', color: '#ea580c' }}>
                    ${saldoFaltanteUSD.toFixed(2)} (Bs. {saldoFaltanteBS.toFixed(2)})
                  </strong>
                </div>
              )}
            </div>
          </>
        )}

        {/* Botón de Confirmación */}
        <button
          type="button"
          onClick={procesarCobro}
          style={{
            ...styles.btnCompletarPrincipal,
            backgroundColor: esCredito ? '#dc2626' : '#00b050'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{esCredito ? 'Fiar y Guardar en Créditos' : 'Completar Cobro e Imprimir'}</span>
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
    padding: '12px 10px',
    boxSizing: 'border-box',
    zIndex: 99999999
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '94vh',
    overflowY: 'auto',
    padding: '14px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
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
    borderRadius: '16px',
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
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.78rem',
    outline: 'none',
    backgroundColor: '#ffffff'
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
  gridMetodosPastillas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px'
  },
  btnMetodoPastilla: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    padding: '7px 10px',
    borderRadius: '10px',
    border: '1.5px solid',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  pantallaMetodoActivo: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1.5px solid #0f2a4a',
    padding: '8px 10px'
  },
  btnLiquidarRestante: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '2px 7px',
    fontSize: '0.64rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  visorCifraActiva: {
    fontSize: '1.35rem',
    fontWeight: '900',
    color: '#0f2a4a',
    margin: '3px 0'
  },
  filaBilletes: {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    paddingTop: '2px'
  },
  btnBilleteMini: {
    flex: 1,
    padding: '4px 0',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#0052cc',
    cursor: 'pointer'
  },
  tecladoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '5px'
  },
  btnTecla: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '8px',
    fontSize: '1.15rem',
    fontWeight: 'bold',
    color: '#0f2a4a',
    cursor: 'pointer'
  },
  btnTeclaBorrar: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '8px',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    color: '#dc2626',
    cursor: 'pointer'
  },
  tarjetaResumenConsolidado: {
    backgroundColor: '#f0fdf4',
    borderRadius: '10px',
    border: '1px solid #bbf7d0',
    padding: '8px 10px'
  },
  alertaVueltoBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '3px',
    paddingTop: '3px',
    borderTop: '1px dashed #bbf7d0'
  },
  alertaFaltanteBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '3px',
    paddingTop: '3px',
    borderTop: '1px dashed #fed7aa'
  },
  btnCompletarPrincipal: {
    width: '100%',
    padding: '11px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.86rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(0, 176, 80, 0.3)'
  }
};
