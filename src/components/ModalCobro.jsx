import React, { useState } from 'react';
import { 
  DollarSign, Smartphone, CreditCard, Banknote, CheckCircle2, 
  X, User, Phone, BookOpen, ArrowRight, Zap
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

  // Cliente
  const [docCliente, setDocCliente] = useState(clienteActual?.doc === 'V-00000000' ? '' : (clienteActual?.doc || ''));
  const [nombreCliente, setNombreCliente] = useState(clienteActual?.nombre || 'Consumidor Final');
  const [telefonoCliente, setTelefonoCliente] = useState(clienteActual?.telefono || '');
  const [sugerencias, setSugerencias] = useState([]);

  // Método y Monto ingresado
  const [metodo, setMetodo] = useState('efectivo_usd');
  const [montoIngresado, setMontoIngresado] = useState('');
  const [referencia, setReferencia] = useState('');

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

  // Teclado táctil
  const pulsarTecla = (t) => {
    if (t === '.' && montoIngresado.includes('.')) return;
    if (montoIngresado.length < 9) {
      setMontoIngresado(prev => prev + t);
    }
  };

  const borrarTecla = () => {
    setMontoIngresado(prev => prev.slice(0, -1));
  };

  const pagarTodo = () => {
    if (metodo === 'efectivo_usd') {
      setMontoIngresado(totalUSDNum.toFixed(2));
    } else {
      setMontoIngresado(totalBSNum.toFixed(2));
    }
  };

  const montoNum = parseFloat(montoIngresado) || 0;

  // Cálculos de Vuelto / Faltante
  let vueltoUSD = 0;
  let vueltoBS = 0;
  let saldoFaltanteUSD = 0;

  if (metodo === 'efectivo_usd') {
    if (montoNum > totalUSDNum) {
      vueltoUSD = montoNum - totalUSDNum;
      vueltoBS = vueltoUSD * tasaNum;
    } else if (montoNum > 0 && montoNum < totalUSDNum) {
      saldoFaltanteUSD = totalUSDNum - montoNum;
    }
  } else if (metodo !== 'credito') {
    // Pagos en Bolívares
    const montoEquivUSD = tasaNum > 0 ? (montoNum / tasaNum) : 0;
    if (montoNum > totalBSNum) {
      vueltoBS = montoNum - totalBSNum;
      vueltoUSD = tasaNum > 0 ? (vueltoBS / tasaNum) : 0;
    } else if (montoEquivUSD > 0 && montoEquivUSD < totalUSDNum) {
      saldoFaltanteUSD = totalUSDNum - montoEquivUSD;
    }
  }

  const procesarCobro = (e) => {
    if (e) e.preventDefault();

    if (metodo === 'credito') {
      if (!docCliente.trim() || docCliente === 'V-00000000' || nombreCliente === 'Consumidor Final') {
        return alert('Para fiar o vender a crédito debes registrar la Cédula y Nombre del cliente.');
      }
    } else {
      const pagadoRealUSD = metodo === 'efectivo_usd' ? montoNum : (montoNum / tasaNum);
      if (montoNum <= 0 && !montoIngresado) {
        // Si no tocó la calculadora, asume pago exacto
      } else if (pagadoRealUSD < (totalUSDNum - 0.01)) {
        return alert(`Monto incompleto. Faltan $${saldoFaltanteUSD.toFixed(2)}.`);
      }
    }

    const clienteFinal = {
      doc: docCliente.trim() ? (docCliente.includes('-') ? docCliente : `V-${docCliente.trim()}`) : 'V-00000000',
      nombre: nombreCliente.trim() || 'Consumidor Final',
      telefono: telefonoCliente.trim() || ''
    };

    if (guardarClienteEnDB) guardarClienteEnDB(clienteFinal);
    if (setClienteActual) setClienteActual(clienteFinal);

    const valorCobrado = montoNum > 0 ? montoNum : (metodo === 'efectivo_usd' ? totalUSDNum : totalBSNum);

    const ventaFinal = {
      id: 'vta_' + Date.now(),
      fecha: new Date().toISOString(),
      cliente: clienteFinal,
      totalUSD: totalUSDNum,
      totalBS: totalBSNum,
      tasaCambio: tasaNum,
      metodoPago: metodo === 'credito' ? 'credito' : (
        metodo === 'efectivo_usd' ? 'Efectivo ($)' : 
        metodo === 'pago_movil' ? 'Pago Móvil' :
        metodo === 'punto_venta' ? 'Punto Débito' : 'Efectivo (Bs)'
      ),
      esCredito: metodo === 'credito',
      montoRecibido: valorCobrado,
      vueltoUSD: parseFloat(vueltoUSD.toFixed(2)),
      vueltoBS: parseFloat(vueltoBS.toFixed(2)),
      referencia: referencia.trim()
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

        {/* Tarjeta de Total Principal */}
        <div style={styles.tarjetaTotal}>
          <span style={styles.etiquetaTotal}>TOTAL A COBRAR</span>
          <div style={styles.cifraUSD}>${totalUSDNum.toFixed(2)}</div>
          <div style={styles.cifraBS}>Bs. {totalBSNum.toFixed(2)}</div>
        </div>

        {/* Datos Cliente */}
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

        {/* Selector de Métodos de Pago */}
        <div style={styles.gridMetodos}>
          {[
            { id: 'efectivo_usd', label: 'Efectivo ($)', icon: Banknote, color: '#00b050' },
            { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: '#0052cc' },
            { id: 'punto_venta', label: 'Punto Débito', icon: CreditCard, color: '#7c3aed' },
            { id: 'efectivo_bs', label: 'Efectivo (Bs)', icon: Banknote, color: '#d97706' },
            { id: 'credito', label: 'Fiar / A Crédito', icon: BookOpen, color: '#dc2626' }
          ].map(m => {
            const Icon = m.icon;
            const activo = metodo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMetodo(m.id); setMontoIngresado(''); }}
                style={{
                  ...styles.btnMetodo,
                  gridColumn: m.id === 'credito' ? 'span 2' : 'span 1',
                  backgroundColor: activo ? '#0f2a4a' : '#f8fafc',
                  color: activo ? '#ffffff' : '#334155',
                  borderColor: activo ? '#0f2a4a' : '#e2e8f0'
                }}
              >
                <Icon size={14} color={activo ? '#00b050' : m.color} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Área de Cobro o Fiar */}
        {metodo === 'credito' ? (
          <div style={styles.alertaCredito}>
            <BookOpen size={18} color="#dc2626" />
            <div style={{ fontSize: '0.74rem', color: '#991b1b', lineHeight: 1.35 }}>
              Esta cuenta por <strong>${totalUSDNum.toFixed(2)}</strong> se cargará al saldo pendiente de <strong>{nombreCliente}</strong> en la libreta de Créditos.
            </div>
          </div>
        ) : (
          <>
            {/* Pantalla del Monto Pagado con Botón Pagar Todo */}
            <div style={styles.tarjetaVisorPago}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>
                  MONTO PAGADO ({metodo === 'efectivo_usd' ? 'USD $' : 'BS.'}):
                </span>
                <button type="button" onClick={pagarTodo} style={styles.btnPagarTodoDirecto}>
                  <Zap size={12} />
                  <span>Pagar Todo</span>
                </button>
              </div>

              <div style={styles.cifraMontoIngresado}>
                {montoIngresado ? (
                  <span>{metodo === 'efectivo_usd' ? '$' : 'Bs. '}{montoIngresado}</span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>
                    {metodo === 'efectivo_usd' ? `$${totalUSDNum.toFixed(2)} (Exacto)` : `Bs. ${totalBSNum.toFixed(2)} (Exacto)`}
                  </span>
                )}
              </div>

              {/* Vuelto o Faltante */}
              {vueltoUSD > 0.005 ? (
                <div style={styles.filaVueltoTag}>
                  <span>Cambio / Vuelto:</span>
                  <strong>${vueltoUSD.toFixed(2)} (Bs. {vueltoBS.toFixed(2)})</strong>
                </div>
              ) : saldoFaltanteUSD > 0.01 && (
                <div style={styles.filaFaltanteTag}>
                  <span>Faltan:</span>
                  <strong>${saldoFaltanteUSD.toFixed(2)}</strong>
                </div>
              )}
            </div>

            {/* Billetes rápidos en $ */}
            {metodo === 'efectivo_usd' && (
              <div style={styles.filaBilletes}>
                {BILLETES_USD.map(b => (
                  <button key={b} type="button" onClick={() => setMontoIngresado(String(b))} style={styles.btnBillete}>
                    ${b}
                  </button>
                ))}
              </div>
            )}

            {/* Calculadora Táctil Integrada */}
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
          </>
        )}

        {/* Botón de Confirmación con margen inferior limpio */}
        <button
          type="button"
          onClick={procesarCobro}
          style={{
            ...styles.btnCompletarPrincipal,
            backgroundColor: metodo === 'credito' ? '#dc2626' : '#00b050'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{metodo === 'credito' ? 'Fiar y Guardar en Créditos' : 'Completar Cobro e Imprimir'}</span>
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
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    boxSizing: 'border-box',
    zIndex: 99999999
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '16px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '2px'
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
    borderRadius: '14px',
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
  gridMetodos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
  },
  btnMetodo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    justifyContent: 'center'
  },
  alertaCredito: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '10px 12px'
  },
  tarjetaVisorPago: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '10px 12px'
  },
  btnPagarTodoDirecto: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#eff6ff',
    color: '#0052cc',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '0.68rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  cifraMontoIngresado: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#0f2a4a',
    margin: '4px 0 2px 0'
  },
  filaVueltoTag: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.72rem',
    color: '#b45309',
    fontWeight: 'bold',
    paddingTop: '4px',
    borderTop: '1px dashed #cbd5e1'
  },
  filaFaltanteTag: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.72rem',
    color: '#ea580c',
    fontWeight: 'bold',
    paddingTop: '4px',
    borderTop: '1px dashed #cbd5e1'
  },
  filaBilletes: {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    padding: '2px 0'
  },
  btnBillete: {
    flex: 1,
    padding: '6px 0',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    color: '#0052cc',
    cursor: 'pointer'
  },
  tecladoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px'
  },
  btnTecla: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#0f2a4a',
    cursor: 'pointer'
  },
  btnTeclaBorrar: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#dc2626',
    cursor: 'pointer'
  },
  btnCompletarPrincipal: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 14px rgba(0, 176, 80, 0.3)',
    marginTop: '2px'
  }
};
