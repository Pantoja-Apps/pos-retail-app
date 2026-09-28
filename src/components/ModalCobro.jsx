import React, { useState } from 'react';
import { 
  DollarSign, Smartphone, CreditCard, Banknote, CheckCircle2, 
  X, User, ArrowRight, Calculator
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

  // Estado del Cliente en el cobro
  const [docCliente, setDocCliente] = useState(clienteActual?.doc === 'V-00000000' ? '' : (clienteActual?.doc || ''));
  const [nombreCliente, setNombreCliente] = useState(clienteActual?.nombre || 'Consumidor Final');
  const [telefonoCliente, setTelefonoCliente] = useState(clienteActual?.telefono || '');

  // Métodos de pago e importes recibidos
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('efectivo_usd');
  const [montoUSDRecibido, setMontoUSDRecibido] = useState('');
  const [montoBSRecibido, setMontoBSRecibido] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');

  // Búsqueda rápida de clientes al escribir cédula
  const manejarCambioDoc = (doc) => {
    setDocCliente(doc);
    const coincidencia = clientes.find(c => c.doc?.toLowerCase().replace(/[^a-z0-9]/g, '') === doc.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (coincidencia) {
      setNombreCliente(coincidencia.nombre);
      setTelefonoCliente(coincidencia.telefono || '');
      if (setClienteActual) setClienteActual(coincidencia);
    }
  };

  // Cálculo de vueltos
  const numUSDRecibido = parseFloat(montoUSDRecibido) || 0;
  const numBSRecibido = parseFloat(montoBSRecibido) || 0;

  let vueltoUSD = 0;
  let vueltoBS = 0;

  if (metodoSeleccionado === 'efectivo_usd' && numUSDRecibido > totalUSDNum) {
    vueltoUSD = numUSDRecibido - totalUSDNum;
    vueltoBS = vueltoUSD * tasaNum;
  } else if (metodoSeleccionado === 'efectivo_bs' && numBSRecibido > totalBSNum) {
    vueltoBS = numBSRecibido - totalBSNum;
    vueltoUSD = tasaNum > 0 ? (vueltoBS / tasaNum) : 0;
  }

  const procesarCobro = (e) => {
    if (e) e.preventDefault();

    const clienteFinal = {
      doc: docCliente.trim() || 'V-00000000',
      nombre: nombreCliente.trim() || 'Consumidor Final',
      telefono: telefonoCliente.trim() || ''
    };

    if (guardarClienteEnDB) {
      guardarClienteEnDB(clienteFinal);
    }

    if (setClienteActual) {
      setClienteActual(clienteFinal);
    }

    // Estructurar el objeto de venta completo
    const ventaFinal = {
      id: 'vta_' + Date.now(),
      fecha: new Date().toISOString(),
      cliente: clienteFinal,
      totalUSD: totalUSDNum,
      totalBS: totalBSNum,
      tasaCambio: tasaNum,
      metodoPago: metodoSeleccionado,
      pagos: [
        {
          metodo: metodoSeleccionado,
          montoUSD: numUSDRecibido > 0 ? numUSDRecibido : totalUSDNum,
          montoBS: numBSRecibido > 0 ? numBSRecibido : totalBSNum,
          referencia: referenciaPago.trim()
        }
      ],
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
              <DollarSign size={20} color="#00b050" />
            </div>
            <div>
              <h3 style={styles.titulo}>Finalizar Venta / Cobro</h3>
              <span style={styles.subtitulo}>Tasa oficial: Bs. {tasaNum.toFixed(2)}</span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Total a Pagar Destacado */}
        <div style={styles.tarjetaTotal}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>MONTO TOTAL A COBRAR</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
            <span style={styles.totalUSD}>${totalUSDNum.toFixed(2)}</span>
            <span style={styles.totalBS}>Bs. {totalBSNum.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={procesarCobro} style={styles.formulario}>
          {/* Datos del Cliente */}
          <div style={styles.seccionCliente}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <User size={15} color="#0f2a4a" />
              <strong style={{ fontSize: '0.76rem', color: '#0f2a4a' }}>Datos del Comprador</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '6px' }}>
              <input
                type="text"
                placeholder="Cédula (V-12345678)"
                value={docCliente}
                onChange={(e) => manejarCambioDoc(e.target.value)}
                style={styles.inputPequeno}
              />
              <input
                type="text"
                placeholder="Nombre del Cliente"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                style={styles.inputPequeno}
                required
              />
            </div>
          </div>

          {/* Métodos de Pago */}
          <div style={styles.gridMetodos}>
            <button
              type="button"
              onClick={() => setMetodoSeleccionado('efectivo_usd')}
              style={{
                ...styles.btnMetodo,
                borderColor: metodoSeleccionado === 'efectivo_usd' ? '#00b050' : '#e2e8f0',
                backgroundColor: metodoSeleccionado === 'efectivo_usd' ? '#f0fdf4' : '#fff'
              }}
            >
              <Banknote size={16} color={metodoSeleccionado === 'efectivo_usd' ? '#00b050' : '#64748b'} />
              <span>Efectivo ($)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoSeleccionado('pago_movil')}
              style={{
                ...styles.btnMetodo,
                borderColor: metodoSeleccionado === 'pago_movil' ? '#0052cc' : '#e2e8f0',
                backgroundColor: metodoSeleccionado === 'pago_movil' ? '#eff6ff' : '#fff'
              }}
            >
              <Smartphone size={16} color={metodoSeleccionado === 'pago_movil' ? '#0052cc' : '#64748b'} />
              <span>Pago Móvil</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoSeleccionado('punto_venta')}
              style={{
                ...styles.btnMetodo,
                borderColor: metodoSeleccionado === 'punto_venta' ? '#0f2a4a' : '#e2e8f0',
                backgroundColor: metodoSeleccionado === 'punto_venta' ? '#f8fafc' : '#fff'
              }}
            >
              <CreditCard size={16} color={metodoSeleccionado === 'punto_venta' ? '#0f2a4a' : '#64748b'} />
              <span>Punto de Venta</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoSeleccionado('efectivo_bs')}
              style={{
                ...styles.btnMetodo,
                borderColor: metodoSeleccionado === 'efectivo_bs' ? '#d97706' : '#e2e8f0',
                backgroundColor: metodoSeleccionado === 'efectivo_bs' ? '#fffbeb' : '#fff'
              }}
            >
              <Banknote size={16} color={metodoSeleccionado === 'efectivo_bs' ? '#d97706' : '#64748b'} />
              <span>Efectivo (Bs)</span>
            </button>
          </div>

          {/* Entradas de pago según método */}
          {metodoSeleccionado === 'efectivo_usd' && (
            <div style={styles.campoMonto}>
              <label style={styles.labelMonto}>¿Cuánto paga el cliente en $ Efectivo?</label>
              <input
                type="number"
                step="any"
                placeholder={`Monto exacto: $${totalUSDNum.toFixed(2)}`}
                value={montoUSDRecibido}
                onChange={(e) => setMontoUSDRecibido(e.target.value)}
                style={styles.inputMontoGrande}
              />
            </div>
          )}

          {metodoSeleccionado === 'efectivo_bs' && (
            <div style={styles.campoMonto}>
              <label style={styles.labelMonto}>¿Cuánto paga el cliente en Bs Efectivo?</label>
              <input
                type="number"
                step="any"
                placeholder={`Monto exacto: Bs. ${totalBSNum.toFixed(2)}`}
                value={montoBSRecibido}
                onChange={(e) => setMontoBSRecibido(e.target.value)}
                style={styles.inputMontoGrande}
              />
            </div>
          )}

          {(metodoSeleccionado === 'pago_movil' || metodoSeleccionado === 'punto_venta') && (
            <div style={styles.campoMonto}>
              <label style={styles.labelMonto}>Referencia o Aprobación (Opcional):</label>
              <input
                type="text"
                placeholder="Últimos 4 dígitos..."
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                style={styles.inputPequeno}
              />
            </div>
          )}

          {/* Visor de Vuelto si sobra dinero */}
          {(vueltoUSD > 0 || vueltoBS > 0) && (
            <div style={styles.cajaVuelto}>
              <span style={{ fontSize: '0.74rem', color: '#92400e', fontWeight: 'bold' }}>CAMBIO / VUELTO A ENTREGAR:</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <strong style={{ fontSize: '1rem', color: '#b45309' }}>${vueltoUSD.toFixed(2)}</strong>
                <strong style={{ fontSize: '1rem', color: '#b45309' }}>Bs. {vueltoBS.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Botón Principal para completar venta */}
          <button type="submit" style={styles.btnCompletar}>
            <CheckCircle2 size={18} />
            <span>Completar Cobro e Imprimir Ticket</span>
          </button>
        </form>
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
    maxWidth: '360px',
    width: '100%',
    padding: '18px',
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
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titulo: {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#0f2a4a'
  },
  subtitulo: {
    fontSize: '0.68rem',
    color: '#64748b',
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
  tarjetaTotal: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '10px 14px',
    border: '1px solid #e2e8f0'
  },
  totalUSD: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#00b050'
  },
  totalBS: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#0052cc'
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  seccionCliente: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '8px 10px',
    border: '1px solid #e2e8f0'
  },
  inputPequeno: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.78rem',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  gridMetodos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  btnMetodo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 10px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.74rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  campoMonto: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  labelMonto: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#475569'
  },
  inputMontoGrande: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    borderRadius: '10px',
    border: '2px solid #cbd5e1',
    outline: 'none',
    color: '#0f2a4a',
    backgroundColor: '#ffffff'
  },
  cajaVuelto: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    padding: '8px 12px'
  },
  btnCompletar: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00b050',
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
    boxShadow: '0 4px 14px rgba(0, 176, 80, 0.35)',
    marginTop: '4px'
  }
};
