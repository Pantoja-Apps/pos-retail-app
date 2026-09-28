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

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    let texto = `*🧾 COMPROBANTE DE PAGO*\n`;
    texto += `*${(config?.nombre || 'FACILITO POS').toUpperCase()}*\n`;
    if (config?.rif) texto += `RIF: ${config.rif}\n`;
    if (config?.telefono) texto += `TEL: ${config.telefono}\n`;
    texto += `--------------------------------\n`;
    texto += `CONTROL: #${datos.correlativo || datos.id}\n`;
    texto += `FECHA: ${datos.fechaFormateada || new Date().toLocaleString()}\n`;
    texto += `CLIENTE: ${cliente.nombre}\n`;
    texto += `DOC: ${cliente.doc}\n`;
    texto += `PAGO: ${datos.esCredito ? 'A CRÉDITO (FIADO)' : (datos.metodoPago || 'EFECTIVO')}\n`;
    texto += `--------------------------------\n`;

    items.forEach(it => {
      const sub = (it.precioUSD * it.cantidad).toFixed(2);
      texto += `${it.nombre}\n`;
      texto += `  ${it.cantidad} ${it.esPesado ? 'KG' : 'UNID'} x $${Number(it.precioUSD).toFixed(2)} = $${sub}\n`;
    });

    texto += `--------------------------------\n`;
    texto += `*TOTAL FACTURA: $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL BOLÍVARES: Bs. ${totalBS.toFixed(2)}*\n`;
    texto += `Tasa Oficial BCV: Bs. ${tasa.toFixed(2)}\n`;
    if (datos.vueltoUSD > 0) {
      texto += `Vuelto Entregado: $${datos.vueltoUSD.toFixed(2)} (Bs. ${datos.vueltoBS.toFixed(2)})\n`;
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
      <div style={styles.modalContenedor}>
        {/* Barra superior de control */}
        <div style={styles.barraControl}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 color="#00b050" size={17} />
            <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#0f2a4a' }}>
              Venta Procesada con Éxito
            </span>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrarModal}>
            <X size={16} />
          </button>
        </div>

        {/* TICKET TÉRMICO REAL (Estilo Rollo Continuo 80mm) */}
        <div id="area-ticket-impresion" style={styles.rolloTicket}>
          {/* Cabecera / Logo */}
          <div style={styles.cabeceraCentro}>
            {config?.logo && (
              <img src={config.logo} alt="Logo" style={styles.logoTicket} />
            )}
            <h2 style={styles.nombreEmpresa}>{(config?.nombre || 'FACILITO POS').toUpperCase()}</h2>
            <div style={styles.datosFiscales}>{config?.rif || 'RIF: J-50000000-0'}</div>
            {config?.direccion && <div style={styles.datosFiscales}>{config.direccion}</div>}
            {config?.telefono && <div style={styles.datosFiscales}>TEL: {config.telefono}</div>}
          </div>

          <div style={styles.lineaCorteDoble} />

          {/* Información de la Transacción */}
          <div style={styles.gridMetadata}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>COMPROBANTE: <strong>#{datos.correlativo || datos.id}</strong></span>
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

          <div style={styles.lineaCorteDoble} />

          {/* Tabla de Artículos */}
          <div style={styles.tablaHeader}>
            <span style={{ flex: 1.8 }}>DESCRIPCIÓN</span>
            <span style={{ width: '38px', textAlign: 'center' }}>CANT</span>
            <span style={{ width: '48px', textAlign: 'right' }}>P.U</span>
            <span style={{ width: '56px', textAlign: 'right' }}>TOTAL</span>
          </div>

          <div style={styles.lineaFina} />

          <div style={styles.listaProductos}>
            {items.map((it, idx) => (
              <div key={idx} style={styles.filaProducto}>
                <div style={styles.colNombre}>{it.nombre}</div>
                <div style={styles.colCant}>{it.cantidad}{it.esPesado ? 'kg' : ''}</div>
                <div style={styles.colPu}>${Number(it.precioUSD).toFixed(2)}</div>
                <div style={styles.colTotal}>${(it.precioUSD * it.cantidad).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={styles.lineaCorteDoble} />

          {/* Totales */}
          <div style={styles.seccionTotales}>
            <div style={styles.filaTotalGrandeUSD}>
              <span>TOTAL FACTURA:</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>
            <div style={styles.filaTotalGrandeBS}>
              <span>TOTAL BS:</span>
              <span>Bs. {totalBS.toFixed(2)}</span>
            </div>
            <div style={styles.tasaOficialTag}>
              TASA OFICIAL BCV: Bs. {tasa.toFixed(2)} / USD
            </div>

            {datos.vueltoUSD > 0.005 && (
              <div style={styles.filaVueltoTag}>
                <span>VUELTO ENTREGADO:</span>
                <span>${datos.vueltoUSD.toFixed(2)} (Bs. {datos.vueltoBS.toFixed(2)})</span>
              </div>
            )}
          </div>

          <div style={styles.lineaCorteDoble} />

          {/* Pie de Página y Código de Barras Decorativo */}
          <div style={styles.pieCentro}>
            <p style={styles.mensajePie}>{config?.mensajePie || '¡Gracias por su compra!'}</p>
            
            {/* Código de barras decorativo tipo ticket supermercado */}
            <div style={styles.codigoBarrasBox}>
              <div style={styles.barrasLineas} />
              <span style={styles.textoControl}>* {datos.correlativo || datos.id} *</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '0.62rem', marginTop: '6px' }}>
              <ShieldCheck size={12} color="#00b050" />
              <span>Documento digital emitido por Facilito POS</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={styles.filaBotonesAccion}>
          <button type="button" onClick={imprimir} style={styles.btnAccionImprimir}>
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
          <button type="button" onClick={compartirWhatsApp} style={styles.btnAccionWhatsApp}>
            <Share2 size={15} />
            <span>{cliente.telefono ? 'Enviar al WhatsApp' : 'WhatsApp'}</span>
          </button>
          <button type="button" onClick={alCerrar} style={styles.btnAccionListo}>
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
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    zIndex: 999999999
  },
  modalContenedor: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '360px',
    width: '100%',
    maxHeight: '94vh',
    overflowY: 'auto',
    padding: '16px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column'
  },
  barraControl: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  btnCerrarModal: {
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
  rolloTicket: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px 14px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.74rem',
    color: '#0f172a'
  },
  cabeceraCentro: {
    textAlign: 'center',
    lineHeight: 1.35
  },
  logoTicket: {
    maxHeight: '50px',
    maxWidth: '130px',
    objectFit: 'contain',
    marginBottom: '6px'
  },
  nombreEmpresa: {
    margin: '0 0 2px 0',
    fontSize: '0.96rem',
    fontWeight: '900',
    color: '#0f2a4a',
    letterSpacing: '0.5px'
  },
  datosFiscales: {
    fontSize: '0.66rem',
    color: '#475569'
  },
  lineaCorteDoble: {
    borderTop: '2px dashed #94a3b8',
    margin: '8px 0'
  },
  lineaFina: {
    borderTop: '1px solid #cbd5e1',
    margin: '4px 0'
  },
  gridMetadata: {
    fontSize: '0.68rem',
    lineHeight: 1.5,
    color: '#1e293b'
  },
  tablaHeader: {
    display: 'flex',
    fontWeight: '900',
    fontSize: '0.66rem',
    color: '#0f2a4a',
    padding: '2px 0'
  },
  listaProductos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  filaProducto: {
    display: 'flex',
    alignItems: 'baseline',
    fontSize: '0.7rem'
  },
  colNombre: {
    flex: 1.8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: 'bold',
    color: '#0f2a4a'
  },
  colCant: {
    width: '38px',
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
    fontWeight: '900',
    color: '#0f2a4a'
  },
  seccionTotales: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  filaTotalGrandeUSD: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#00b050'
  },
  filaTotalGrandeBS: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.94rem',
    fontWeight: '900',
    color: '#0052cc'
  },
  tasaOficialTag: {
    fontSize: '0.64rem',
    color: '#64748b',
    textAlign: 'right',
    marginTop: '2px'
  },
  filaVueltoTag: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: '#b45309',
    fontWeight: 'bold',
    marginTop: '4px'
  },
  pieCentro: {
    textAlign: 'center',
    lineHeight: 1.35
  },
  mensajePie: {
    margin: '0 0 6px 0',
    fontWeight: 'bold',
    fontSize: '0.72rem',
    color: '#0f2a4a'
  },
  codigoBarrasBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '4px'
  },
  barrasLineas: {
    width: '140px',
    height: '24px',
    background: 'repeating-linear-gradient(90deg, #0f2a4a, #0f2a4a 2px, transparent 2px, transparent 4px, #0f2a4a 4px, #0f2a4a 7px, transparent 7px, transparent 9px)'
  },
  textoControl: {
    fontSize: '0.62rem',
    color: '#64748b',
    letterSpacing: '2px',
    marginTop: '2px'
  },
  filaBotonesAccion: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px'
  },
  btnAccionImprimir: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  btnAccionWhatsApp: {
    flex: 1.3,
    padding: '10px',
    backgroundColor: '#00b050',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  btnAccionListo: {
    padding: '10px 14px',
    backgroundColor: '#f1f5f9',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
