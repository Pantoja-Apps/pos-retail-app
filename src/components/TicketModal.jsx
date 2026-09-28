import React from 'react';
import { Printer, Share2, X, CheckCircle2 } from 'lucide-react';

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
  const cliente = datos.cliente || { nombre: 'Consumidor Final', doc: 'V-00000000' };

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    let texto = `*🧾 FACTURA / TICKET DE COMPRA*\n`;
    texto += `*${config?.nombre || 'Facilito POS'}*\n`;
    if (config?.rif) texto += `RIF: ${config.rif}\n`;
    texto += `Fecha: ${datos.fechaFormateada || new Date().toLocaleString()}\n`;
    texto += `Ticket #: ${datos.correlativo || datos.id}\n`;
    texto += `Cliente: ${cliente.nombre} (${cliente.doc})\n`;
    texto += `--------------------------------\n`;

    items.forEach(it => {
      texto += `• ${it.nombre} x${it.cantidad} = $${(it.precioUSD * it.cantidad).toFixed(2)}\n`;
    });

    texto += `--------------------------------\n`;
    texto += `*TOTAL USD: $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL BS: Bs. ${totalBS.toFixed(2)}*\n`;
    texto += `(Tasa oficial: Bs. ${tasa.toFixed(2)})\n\n`;
    if (config?.mensajePie) texto += `${config.mensajePie}\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.cajaModal}>
        <div style={styles.headerBarra}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 color="#00b050" size={18} />
            <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#0f2a4a' }}>¡Venta Exitosa!</span>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Papel del Ticket Térmico */}
        <div id="area-ticket-impresion" style={styles.papelTicket}>
          {config?.logo && (
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <img src={config.logo} alt="Logo" style={styles.logoTicket} />
            </div>
          )}

          <div style={styles.encabezadoTicket}>
            <h4 style={styles.nombreComercio}>{config?.nombre || 'Facilito POS'}</h4>
            {config?.rif && <div style={styles.subInfo}>{config.rif}</div>}
            {config?.direccion && <div style={styles.subInfo}>{config.direccion}</div>}
            {config?.telefono && <div style={styles.subInfo}>Tel: {config.telefono}</div>}
          </div>

          <div style={styles.lineaDivisoria} />

          <div style={styles.datosVenta}>
            <div>Fecha: {datos.fechaFormateada || new Date().toLocaleString()}</div>
            <div>Ticket #: <strong>{datos.correlativo || datos.id}</strong></div>
            <div>Cajero: {datos.cajero || 'Cajero 01'} · Caja: {datos.caja || 'Caja 01'}</div>
            <div>Cliente: <strong>{cliente.nombre}</strong></div>
            <div>Cédula/RIF: {cliente.doc}</div>
          </div>

          <div style={styles.lineaDivisoria} />

          {/* Lista de Artículos */}
          <div style={styles.listaProductos}>
            {items.map((it, idx) => (
              <div key={idx} style={styles.itemFila}>
                <div style={{ flex: 1 }}>
                  <div style={styles.nombreItem}>{it.nombre}</div>
                  <div style={styles.cantItem}>{it.cantidad} x ${Number(it.precioUSD).toFixed(2)}</div>
                </div>
                <strong style={styles.precioItem}>
                  ${(it.precioUSD * it.cantidad).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>

          <div style={styles.lineaDivisoria} />

          {/* Totales */}
          <div style={styles.totalesTicket}>
            <div style={styles.filaTotal}>
              <span>TOTAL USD:</span>
              <strong>${totalUSD.toFixed(2)}</strong>
            </div>
            <div style={styles.filaTotal}>
              <span>TOTAL BS:</span>
              <strong>Bs. {totalBS.toFixed(2)}</strong>
            </div>
            <div style={styles.tasaTicket}>
              Tasa del día: Bs. {tasa.toFixed(2)}
            </div>

            {datos.vueltoUSD > 0 && (
              <div style={styles.filaVuelto}>
                <span>Vuelto entregado:</span>
                <span>${datos.vueltoUSD.toFixed(2)} (Bs. {datos.vueltoBS.toFixed(2)})</span>
              </div>
            )}
          </div>

          <div style={styles.lineaDivisoria} />

          <div style={styles.pieTicket}>
            {config?.mensajePie || '¡Gracias por su compra!'}
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={styles.botonesAccion}>
          <button type="button" onClick={imprimir} style={styles.btnImprimir}>
            <Printer size={16} />
            <span>Imprimir</span>
          </button>
          <button type="button" onClick={compartirWhatsApp} style={styles.btnWhatsApp}>
            <Share2 size={16} />
            <span>WhatsApp</span>
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
    padding: '16px',
    zIndex: 999999999
  },
  cajaModal: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '340px',
    width: '100%',
    padding: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '94vh',
    overflowY: 'auto'
  },
  headerBarra: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
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
  papelTicket: {
    backgroundColor: '#fffdfa',
    borderRadius: '12px',
    padding: '14px 12px',
    border: '1px solid #f1ece1',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)',
    fontFamily: 'Courier New, monospace',
    fontSize: '0.74rem',
    color: '#1e293b'
  },
  logoTicket: {
    maxHeight: '44px',
    maxWidth: '120px',
    objectFit: 'contain'
  },
  encabezadoTicket: {
    textAlign: 'center',
    lineHeight: 1.3
  },
  nombreComercio: {
    margin: '0 0 2px 0',
    fontSize: '0.92rem',
    fontWeight: '900',
    color: '#0f2a4a'
  },
  subInfo: {
    fontSize: '0.68rem',
    color: '#475569'
  },
  lineaDivisoria: {
    borderTop: '1px dashed #cbd5e1',
    margin: '8px 0'
  },
  datosVenta: {
    fontSize: '0.68rem',
    lineHeight: 1.4,
    color: '#334155'
  },
  listaProductos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemFila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  nombreItem: {
    fontWeight: 'bold',
    fontSize: '0.72rem'
  },
  cantItem: {
    fontSize: '0.64rem',
    color: '#64748b'
  },
  precioItem: {
    fontSize: '0.74rem'
  },
  totalesTicket: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  filaTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.86rem',
    fontWeight: '900',
    color: '#0f2a4a'
  },
  tasaTicket: {
    fontSize: '0.64rem',
    color: '#64748b',
    textAlign: 'right',
    marginTop: '2px'
  },
  filaVuelto: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.66rem',
    color: '#b45309',
    marginTop: '4px'
  },
  pieTicket: {
    textAlign: 'center',
    fontSize: '0.66rem',
    color: '#64748b',
    lineHeight: 1.3
  },
  botonesAccion: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px'
  },
  btnImprimir: {
    flex: 1,
    padding: '9px',
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
    flex: 1,
    padding: '9px',
    backgroundColor: '#25d366',
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
    padding: '9px 14px',
    backgroundColor: '#f1f5f9',
    color: '#0f2a4a',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
