import React, { useState } from 'react';
import { 
  DollarSign, Smartphone, CreditCard, Banknote, CheckCircle2, 
  X, User, BookOpen, AlertTriangle
} from 'lucide-react';

const BILLETES_RAPIDOS_USD = [1, 2, 5, 10, 20, 50, 100];

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
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);

  const [metodoSeleccionado, setMetodoSeleccionado] = useState('efectivo_usd');
  const [montoIngresado, setMontoIngresado] = useState('');
  const [referencia, setReferencia] = useState('');

  // Autocompletado de cliente en vivo
  const manejarCambioDoc = (doc) => {
    setDocCliente(doc);
    const docLimpio = doc.replace(/[^0-9]/g, '');
    if (docLimpio.length >= 3) {
      const coincidencias = clientes.filter(c => 
        (c.doc || '').replace(/[^0-9]/g, '').includes(docLimpio) ||
        (c.nombre || '').toLowerCase().includes(doc.toLowerCase())
      ).slice(0, 4);
      setSugerenciasClientes(coincidencias);

      const exacto = clientes.find(c => (c.doc || '').replace(/[^0-9]/g, '') === docLimpio);
      if (exacto) {
        setNombreCliente(exacto.nombre);
        setTelefonoCliente(exacto.telefono || '');
        if (setClienteActual) setClienteActual(exacto);
      }
    } else {
      setSugerenciasClientes([]);
    }
  };

  const seleccionarClienteSugerido = (cli) => {
    setDocCliente(cli.doc || '');
    setNombreCliente(cli.nombre || '');
    setTelefonoCliente(cli.telefono || '');
    if (setClienteActual) setClienteActual(cli);
    setSugerenciasClientes([]);
  };

  const pulsarNumero = (n) => {
    if (n === '.' && montoIngresado.includes('.')) return;
    if (montoIngresado.length < 9) {
      setMontoIngresado(prev => prev + n);
    }
  };

  const borrarNumero = () => {
    setMontoIngresado(prev => prev.slice(0, -1));
  };

  const montoNum = parseFloat(montoIngresado) || 0;

  // Cálculo de Vuelto
  let vueltoUSD = 0;
  let vueltoBS = 0;

  if (metodoSeleccionado === 'efectivo_usd' && montoNum > totalUSDNum) {
    vueltoUSD = montoNum - totalUSDNum;
    vueltoBS = vueltoUSD * tasaNum;
  } else if (metodoSeleccionado === 'efectivo_bs' && montoNum > totalBSNum) {
    vueltoBS = montoNum - totalBSNum;
    vueltoUSD = tasaNum > 0 ? (vueltoBS / tasaNum) : 0;
  }

  const procesarCobro = (e) => {
    if (e) e.preventDefault();

    if (metodoSeleccionado === 'credito') {
      if (!docCliente.trim() || docCliente === 'V-00000000' || nombreCliente === 'Consumidor Final') {
        return alert('Para fiar o vender a crédito debes colocar la Cédula y Nombre real del cliente.');
      }
    }

    const clienteFinal = {
      doc: docCliente.trim() ? (docCliente.includes('-') ? docCliente : `V-${docCliente.trim()}`) : 'V-00000000',
      nombre: nombreCliente.trim() || 'Consumidor Final',
      telefono: telefonoCliente.trim() || ''
    };

    if (guardarClienteEnDB) guardarClienteEnDB(clienteFinal);
    if (setClienteActual) setClienteActual(clienteFinal);

    const ventaFinal = {
      id: 'vta_' + Date.now(),
      fecha: new Date().toISOString(),
      cliente: clienteFinal,
      totalUSD: totalUSDNum,
      totalBS: totalBSNum,
      tasaCambio: tasaNum,
      metodoPago: metodoSeleccionado,
      esCredito: metodoSeleccionado === 'credito',
      montoRecibido: metodoSeleccionado === 'credito' ? 0 : (montoNum > 0 ? montoNum : (metodoSeleccionado === 'efectivo_usd' ? totalUSDNum : totalBSNum)),
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
              <DollarSign size={20} color="#00b050" />
            </div>
            <div>
              <h3 style={styles.titulo}>Facturación y Formas de Pago</h3>
              <span style={styles.subtitulo}>Tasa Oficial BCV: Bs. {tasaNum.toFixed(2)}</span>
            </div>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Visor de Totales */}
        <div style={styles.visorTotal}>
          <div>
            <small style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL A COBRAR (DIVISA)</small>
            <div style={styles.totalUSD}>${totalUSDNum.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL EN BOLÍVARES</small>
            <div style={styles.totalBS}>Bs. {totalBSNum.toFixed(2)}</div>
          </div>
        </div>

        {/* Identificación de Cliente con Autocompletado */}
        <div style={styles.seccionCliente}>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: '6px' }}>
            <input
              type="text"
              placeholder="Cédula (Ej: 22033378)"
              value={docCliente}
              onChange={(e) => manejarCambioDoc(e.target.value)}
              style={styles.inputForm}
            />
            <input
              type="text"
              placeholder="Nombre del Cliente"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              style={styles.inputForm}
              required
            />

            {/* Desplegable sugerencias */}
            {sugerenciasClientes.length > 0 && (
              <div style={styles.desplegableClientes}>
                {sugerenciasClientes.map(c => (
                  <div
                    key={c.id || c.doc}
                    onClick={() => seleccionarClienteSugerido(c)}
                    style={styles.itemSugeridoCliente}
                  >
                    <strong>{c.nombre}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}> · {c.doc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Formas de Pago: Incluye Botón Fiar / Crédito */}
        <div style={styles.gridMetodos}>
          {[
            { id: 'efectivo_usd', label: 'Efectivo ($)', icon: Banknote, color: '#00b050' },
            { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: '#0052cc' },
            { id: 'punto_venta', label: 'Punto de Venta', icon: CreditCard, color: '#0f2a4a' },
            { id: 'efectivo_bs', label: 'Efectivo (Bs)', icon: Banknote, color: '#d97706' },
            { id: 'credito', label: 'Fiar / A Crédito', icon: BookOpen, color: '#dc2626' }
          ].map(m => {
            const Icon = m.icon;
            const activo = metodoSeleccionado === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMetodoSeleccionado(m.id); setMontoIngresado(''); }}
                style={{
                  ...styles.btnMetodo,
                  gridColumn: m.id === 'credito' ? 'span 2' : 'span 1',
                  backgroundColor: activo ? (m.id === 'credito' ? '#dc2626' : '#0f2a4a') : '#f8fafc',
                  color: activo ? '#fff' : '#334155',
                  borderColor: activo ? (m.id === 'credito' ? '#b91c1c' : '#0f2a4a') : '#e2e8f0'
                }}
              >
                <Icon size={16} color={activo ? '#fff' : m.color} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modalidad Fiar / Crédito Info */}
        {metodoSeleccionado === 'credito' ? (
          <div style={styles.alertaCredito}>
            <AlertTriangle size={18} color="#b45309" />
            <div style={{ fontSize: '0.74rem', color: '#92400e', lineHeight: 1.3 }}>
              Esta venta se registrará en la libreta de <strong>Créditos y Deudores</strong> a nombre de <strong>{nombreCliente}</strong> con saldo deudor de <strong>${totalUSDNum.toFixed(2)}</strong>.
            </div>
          </div>
        ) : (
          <>
            {/* Billetes Rápidos para Efectivo $ */}
            {metodoSeleccionado === 'efectivo_usd' && (
              <div style={styles.filaBilletes}>
                {BILLETES_RAPIDOS_USD.map(b => (
                  <button key={b} type="button" onClick={() => setMontoIngresado(String(b))} style={styles.btnBillete}>
                    ${b}
                  </button>
                ))}
              </div>
            )}

            {/* Visor de Monto Pagado y Vuelto */}
            <div style={styles.visorPago}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>
                  Recibido ({metodoSeleccionado === 'efectivo_usd' ? '$' : 'Bs'}):
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#0f2a4a' }}>
                  {montoIngresado || (metodoSeleccionado === 'efectivo_usd' ? totalUSDNum.toFixed(2) : totalBSNum.toFixed(2))}
                </strong>
              </div>

              {(vueltoUSD > 0 || vueltoBS > 0) && (
                <div style={styles.alertaVuelto}>
                  <span>Cambio / Vuelto:</span>
                  <strong>${vueltoUSD.toFixed(2)} (Bs. {vueltoBS.toFixed(2)})</strong>
                </div>
              )}
            </div>

            {/* Teclado Táctil */}
            <div style={styles.tecladoNumerico}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} type="button" onClick={() => pulsarNumero(String(n))} style={styles.btnTecla}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => pulsarNumero('.')} style={styles.btnTecla}>.</button>
              <button type="button" onClick={() => pulsarNumero('0')} style={styles.btnTecla}>0</button>
              <button type="button" onClick={borrarNumero} style={styles.btnTeclaBorrar}>⌫</button>
            </div>
          </>
        )}

        {/* Botón de Confirmación */}
        <button 
          type="button" 
          onClick={procesarCobro} 
          style={{
            ...styles.btnCompletar,
            backgroundColor: metodoSeleccionado === 'credito' ? '#dc2626' : '#00b050'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{metodoSeleccionado === 'credito' ? 'Registrar como Cuenta por Cobrar' : 'Completar Cobro e Imprimir'}</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', zIndex: 99999999 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '24px', maxWidth: '360px', width: '100%', padding: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '9px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  iconoBox: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titulo: { margin: 0, fontSize: '0.94rem', fontWeight: '800', color: '#0f2a4a' },
  subtitulo: { fontSize: '0.68rem', color: '#64748b', fontWeight: 'bold' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  visorTotal: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '14px', padding: '8px 12px' },
  totalUSD: { fontSize: '1.45rem', fontWeight: '900', color: '#00b050' },
  totalBS: { fontSize: '1.15rem', fontWeight: '800', color: '#0052cc' },
  seccionCliente: { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '6px', border: '1px solid #e2e8f0', position: 'relative' },
  inputForm: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', backgroundColor: '#fff' },
  desplegableClientes: { position: 'absolute', top: '38px', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', zIndex: 99999, maxHeight: '160px', overflowY: 'auto' },
  itemSugeridoCliente: { padding: '8px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.78rem' },
  gridMetodos: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' },
  btnMetodo: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '10px', border: '1px solid', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer' },
  alertaCredito: { display: 'flex', gap: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 12px', alignItems: 'center' },
  filaBilletes: { display: 'flex', gap: '4px', overflowX: 'auto', padding: '2px 0' },
  btnBillete: { flex: 1, padding: '5px 0', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', color: '#0052cc', cursor: 'pointer' },
  visorPago: { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '8px 12px', border: '1px solid #e2e8f0' },
  alertaVuelto: { display: 'flex', justifyContent: 'space-between', color: '#b45309', fontSize: '0.76rem', fontWeight: 'bold', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' },
  tecladoNumerico: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' },
  btnTecla: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px', fontSize: '1.15rem', fontWeight: 'bold', color: '#0f2a4a', cursor: 'pointer' },
  btnTeclaBorrar: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '9px', fontSize: '1.05rem', fontWeight: 'bold', color: '#dc2626', cursor: 'pointer' },
  btnCompletar: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)' }
};
