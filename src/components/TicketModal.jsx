import React from 'react';
import { Printer, Share2, X, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function TicketModal({
  datos,
  config,
  tasaCambio = 855.66,
  alCerrar
}) {
  if (!datos) return null;

  const tasa = Number(datos.tasaCambio || tasaCambio || 1);
  const totalUSD = Number(datos.totalUSD || 0);
  const totalBS = Number(datos.totalBS || (totalUSD * tasa));
  const items = datos.items || [];
  const cliente = datos.cliente || { nombre: 'Consumidor Final', doc: 'V-00000000', telefono: '' };
  const cantidadTotalPiezas = items.reduce((acc, it) => acc + Number(it.cantidad || 0), 0);

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    let texto = `*🧾 FACTURA / TICKET DE VENTA*\n`;
    texto += `*${(config?.nombre || 'FACILITO POS').toUpperCase()}*\n`;
    if (config?.rif) texto += `RIF: ${config.rif}\n`;
    if (config?.telefono) texto += `TEL: ${config.telefono}\n`;
    texto += `--------------------------------\n`;
    texto += `TICKET #: ${datos.correlativo || datos.id}\n`;
    texto += `FECHA: ${datos.fechaFormateada || new Date().toLocaleString()}\n`;
    texto += `CLIENTE: ${cliente.nombre}\n`;
    texto += `CÉDULA / RIF: ${cliente.doc}\n`;
    if (cliente.telefono) texto += `TELÉFONO: ${cliente.telefono}\n`;
    texto += `PAGO: ${datos.esCredito ? 'A CRÉDITO (FIADO)' : (datos.metodoPago || 'EFECTIVO')}\n`;
    texto += `--------------------------------\n`;

    items.forEach(it => {
      const sub = (it.precioUSD * it.cantidad).toFixed(2);
      texto += `${it.nombre}\n`;
      texto += `  ${it.cantidad} ${it.esPesado ? 'KG' : 'UNID'} x $${Number(it.precioUSD).toFixed(2)} = $${sub}\n`;
    });

    texto += `--------------------------------\n`;
    texto += `*TOTAL FACTURA: $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL EN BS: Bs. ${totalBS.toFixed(2)}*\n`;
    texto += `Tasa Oficial BCV: Bs. ${tasa.toFixed(2)}\n`;
    if (datos.vueltoUSD > 0) {
      texto += `Vuelto: $${datos.vueltoUSD.toFixed(2)} (Bs. ${datos.vueltoBS.toFixed(2)})\n`;
    }
    texto += `--------------------------------\n`;
    if (config?.mensajePie) texto += `${config.mensajePie}\n`;

    let url = '';
    const telLimpio = (cliente.telefono || '').replace(/[^0-9]/g, '');
    if (telLimpio.length >= 10) {
      const codigoPais = telLimpio.startsWith('58') ? telLimpio : `58${telLimpio.replace(/^0/, '')}`;
      url = `https://wa.me/${codigoPais}?text=${encodeURIComponent(texto)}`;
    } else {
      url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modalBox}>
        {/* Barra superior de control */}
        <div style={styles.barraHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 color="#00b050" size={17} />
            <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#0f2a4a' }}>
              Comprobante Generado
            </span>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={16} />
          </button>
        </div>

        {/* CUERPO DEL TICKET */}
        <div id="area-ticket-impresion" style={styles.ticketCuerpo}>
          {/* Logo y Encabezado */}
          <div style={styles.encabezadoFiscal}>
            {config?.logo && (
              <img src={config.logo} alt="Logo" style={styles.logoTicket} />
            )}
            <h2 style={styles.nombreNegocio}>{(config?.nombre || 'FACILITO POS').toUpperCase()}</h2>
            <div style={styles.textoSub}>{config?.rif || 'RIF: J-50000000-0'}</div>
            {config?.direccion && <div style={styles.textoSub}>{config.direccion}</div>}
            {config?.telefono && <div style={styles.textoSub}>TEL: {config.telefono}</div>}
          </div>

          <div style={styles.separadorLineas} />

          {/* Datos del Comprobante */}
          <div style={styles.gridInfo}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CONTROL: <strong>#{datos.correlativo || datos.id}</strong></span>
              <span>{datos.fechaFormateada || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>CAJERO: {datos.cajero || 'Angel Pantoja'} · CAJA: {datos.caja || 'Caja 01'}</div>
            <div>CLIENTE: <strong>{cliente.nombre}</strong></div>
            <div>CÉDULA / RIF: <strong>{cliente.doc}</strong></div>
            {cliente.telefono && <div>TELÉFONO: {cliente.telefono}</div>}
            <div>
              FORMA DE PAGO: <strong>{datos.esCredito ? 'CUENTA POR COBRAR (CRÉDITO)' : (datos.metodoPago || 'EFECTIVO')}</strong>
            </div>
          </div>

          <div style={styles.separadorLineas} />

          {/* Tabla de Artículos */}
          <div style={styles.tablaHeader}>
            <span style={{ flex: 1.8 }}>DESCRIPCIÓN</span>
            <span style={{ width: '42px', textAlign: 'center' }}>CANT</span>
            <span style={{ width: '48px', textAlign: 'right' }}>P.U</span>
            <span style={{ width: '56px', textAlign: 'right' }}>TOTAL</span>
          </div>

          <div style={styles.lineaFina} />

          {/* Renglones */}
          <div style={styles.listaProductos}>
            {items.map((it, idx) => (
              <div key={idx} style={styles.itemFila}>
                <div style={styles.colNombre}>{it.nombre}</div>
                <div style={styles.colCant}>{it.cantidad}{it.esPesado ? 'kg' : ''}</div>
                <div style={styles.colPu}>${Number(it.precioUSD).toFixed(2)}</div>
                <div style={styles.colTotal}>${(it.precioUSD * it.cantidad).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={styles.separadorLineas} />

          {/* Desglose de Totales */}
          <div style={styles.seccionDesglose}>
            <div style={styles.filaSub}>
              <span>TOTAL ARTÍCULOS:</span>
              <strong>{cantidadTotalPiezas.toFixed(cantidadTotalPiezas % 1 === 0 ? 0 : 3)} unids</strong>
            </div>

            <div style={styles.filaSub}>
              <span>BASE IMPONIBLE (EXENTO):</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>

            <div style={styles.filaTotalUSD}>
              <span>TOTAL A PAGAR:</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>

            <div style={styles.filaTotalBS}>
              <span>TOTAL BOLÍVARES:</span>
              <span>Bs. {totalBS.toFixed(2)}</span>
            </div>

            <div style={styles.tasaTag}>
              TASA OFICIAL BCV: Bs. {tasa.toFixed(2)} / USD
            </div>

            {datos.vueltoUSD > 0.005 && (
              <div style={styles.filaVueltoTag}>
                <span>VUELTO ENTREGADO:</span>
                <span>${datos.vueltoUSD.toFixed(2)} (Bs. {datos.vueltoBS.toFixed(2)})</span>
              </div>
            )}
          </div>

          <div style={styles.separadorLineas} />

          {/* Pie de Ticket */}
          <div style={styles.pieFiscal}>
            <p style={styles.mensajePie}>{config?.mensajePie || '¡Gracias por su compra!'}</p>
            
            <div style={styles.contenedorBarras}>
              <div style={styles.barrasGraficas} />
              <span style={styles.codigoControl}>* {datos.correlativo || datos.id} *</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '0.62rem', marginTop: '6px' }}>
              <ShieldCheck size={12} color="#00b050" />
              <span>Documento digital emitido por Facilito POS</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={styles.filaBotones}>
          <button type="button" onClick={imprimir} style={styles.btnImprimir}>
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
          <button type="button" onClick={compartirWhatsApp} style={styles.btnWhatsApp}>
            <Share2 size={15} />
            <span>{cliente.telefono ? 'Enviar WhatsApp' : 'WhatsApp'}</span>
          </button>
          <button type="button" onClick={alCerrar} style={styles.btnListo}>
            <span>Listo</span>
          </button>
        </div>
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
    padding: '16px 12px',
    boxSizing: 'border-box',
    zIndex: 999999999
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
    flexDirection: 'column'
  },
  barraHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
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
  ticketCuerpo: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '14px 12px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '0.72rem',
    color: '#0f172a'
  },
  encabezadoFiscal: {
    textAlign: 'center',
    lineHeight: 1.35
  },
  logoTicket: {
    maxHeight: '48px',
    maxWidth: '120px',
    objectFit: 'contain',
    marginBottom: '4px'
  },
  nombreNegocio: {
    margin: '0 0 2px 0',
    fontSize: '0.94rem',
    fontWeight: '900',
    color: '#0f2a4a'
  },
  textoSub: {
    fontSize: '0.66rem',
    color: '#475569'
  },
  separadorLineas: {
    borderTop: '1px dashed #cbd5e1',
    margin: '7px 0'
  },
  gridInfo: {
    fontSize: '0.68rem',
    lineHeight: 1.45,
    color: '#1e293b'
  },
  tablaHeader: {
    display: 'flex',
    fontWeight: '800',
    fontSize: '0.66rem',
    color: '#0f2a4a',
    padding: '2px 0'
  },
  lineaFina: {
    borderTop: '1px solid #e2e8f0',
    margin: '3px 0'
  },
  listaProductos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemFila: {
    display: 'flex',
    alignItems: 'baseline',
    fontSize: '0.7rem'
  },
  colNombre: {
    flex: 1.8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '600',
    color: '#0f2a4a'
  },
  colCant: {
    width: '42px',
    textAlign: 'center',
    color: '#475569'
  },
  colPu: {
    width: '48px',
    textAlign: 'right',
    color: '#475569'
  },
  colTotal: {
    width: '56px',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#0f2a4a'
  },
  seccionDesglose: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  filaSub: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.66rem',
    color: '#64748b'
  },
  filaTotalUSD: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.05rem',
    fontWeight: '900',
    color: '#00b050',
    marginTop: '3px'
  },
  filaTotalBS: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.92rem',
    fontWeight: '900',
    color: '#0052cc'
  },
  tasaTag: {
    fontSize: '0.64rem',
    color: '#64748b',
    textAlign: 'right',
    marginTop: '2px'
  },
  filaVueltoTag: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: '#b45309',
    fontWeight: 'bold',
    marginTop: '3px'
  },
  pieFiscal: {
    textAlign: 'center',
    lineHeight: 1.35
  },
  mensajePie: {
    margin: '0 0 4px 0',
    fontWeight: 'bold',
    fontSize: '0.72rem',
    color: '#0f2a4a'
  },
  contenedorBarras: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '4px'
  },
  barrasGraficas: {
    width: '130px',
    height: '22px',
    background: 'repeating-linear-gradient(90deg, #0f2a4a, #0f2a4a 2px, transparent 2px, transparent 4px, #0f2a4a 4px, #0f2a4a 7px, transparent 7px, transparent 9px)'
  },
  codigoControl: {
    fontSize: '0.62rem',
    color: '#64748b',
    letterSpacing: '2px',
    marginTop: '2px'
  },
  filaBotones: {
    display: 'flex',
    gap: '6px',
    marginTop: '10px'
  },
  btnImprimir: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnWhatsApp: {
    flex: 1.3,
    padding: '10px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnListo: {
    padding: '10px 14px',
    backgroundColor: '#f1f5f9',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
