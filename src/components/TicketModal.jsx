import React from 'react';
import { Printer, Share2, X, CheckCircle2, Download } from 'lucide-react';

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
            <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#0f2a4a' }}>Venta Procesada con Éxito</span>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* Papel Térmico con Estilo Comercial */}
        <div id="area-ticket-impresion" style={styles.papelTicket}>
          {config?.logo && (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <img src={config.logo} alt="Logo" style={styles.logoTicket} />
            </div>
          )}

          <div style={styles.encabezadoTicket}>
            <h4 style={styles.nombreComercio}>{config?.nombre || 'Facilito POS'}</h4>
            {config?.rif && <div style={styles.subInfo}>RIF: {config.rif}</div>}
            {config?.direccion && <div style={styles.subInfo}>{config.direccion}</div>}
            {config?.telefono && <div style={styles.subInfo}>TEL: {config.telefono}</div>}
          </div>

          <div style={styles.lineaPunteada} />

          <div style={styles.datosVenta}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ticket #: <strong>{datos.correlativo || datos.id}</strong></span>
              <span>{datos.fechaFormateada || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>Cajero: {datos.cajero || 'Cajero 01'} · Caja: {datos.caja || 'Caja 01'}</div>
            <div>Cliente: <strong>{cliente.nombre}</strong></div>
            <div>Cédula / RIF: {cliente.doc}</div>
          </div>

          <div style={styles.lineaPunteada} />

          {/* Tabla de Artículos */}
          <div style={styles.listaProductos}>
            {items.map((it, idx) => (
              <div key={idx} style={styles.itemFila}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.nombreItem}>{it.nombre}</div>
                  <div style={styles.cantItem}>{it.cantidad} {it.esPesado ? 'KG' : 'UNID'} x ${Number(it.precioUSD).toFixed(2)}</div>
                </div>
                <strong style={styles.precioItem}>
                  ${(it.precioUSD * it.cantidad).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>

          <div style={styles.lineaPunteada} />

          {/* Totales */}
          <div style={styles.totalesTicket}>
            <div style={styles.filaTotal}>
              <span>TOTAL USD:</span>
              <span style={{ fontSize: '1rem', color: '#00b050' }}>${totalUSD.toFixed(2)}</span>
            </div>
            <div style={styles.filaTotal}>
              <span>TOTAL BS:</span>
              <span style={{ fontSize: '0.95rem', color: '#0052cc' }}>Bs. {totalBS.toFixed(2)}</span>
            </div>
            <div style={styles.tasaTicket}>
              Tasa del día: Bs. {tasa.toFixed(2)}
            </div>

            {datos.vueltoUSD > 0 && (
              <div style={styles.filaVuelto}>
                <span>Cambio / Vuelto:</span>
                <span>${datos.vueltoUSD.toFixed(2)} (Bs. {datos.vueltoBS.toFixed(2)})</span>
              </div>
            )}
          </div>

          <div style={styles.lineaPunteada} />

          <div style={styles.pieTicket}>
            <p style={{ margin: '0 0 3px 0' }}>{config?.mensajePie || '¡Gracias por su compra!'}</p>
            <small style={{ color: '#94a3b8', fontSize: '0.62rem' }}>Facilito POS · Software de Facturación</small>
          </div>
        </div>

        {/* Acciones */}
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
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 999999999 },
  cajaModal: { backgroundColor: '#ffffff', borderRadius: '24px', maxWidth: '340px', width: '100%', padding: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '94vh', overflowY: 'auto' },
  headerBarra: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  papelTicket: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', fontFamily: 'system-ui, -apple-system, monospace', fontSize: '0.74rem', color: '#1e293b' },
  logoTicket: { maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' },
  encabezadoTicket: { textAlign: 'center', lineHeight: 1.35 },
  nombreComercio: { margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: '900', color: '#0f2a4a' },
  subInfo: { fontSize: '0.68rem', color: '#64748b' },
  lineaPunteada: { borderTop: '1px dashed #cbd5e1', margin: '8px 0' },
  datosVenta: { fontSize: '0.68rem', lineHeight: 1.45, color: '#334155' },
  listaProductos: { display: 'flex', flexDirection: 'column', gap: '5px' },
  itemFila: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  nombreItem: { fontWeight: 'bold', fontSize: '0.74rem', color: '#0f2a4a' },
  cantItem: { fontSize: '0.66rem', color: '#64748b' },
  precioItem: { fontSize: '0.78rem', color: '#0f2a4a' },
  totalesTicket: { display: 'flex', flexDirection: 'column', gap: '3px' },
  filaTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: '900' },
  tasaTicket: { fontSize: '0.64rem', color: '#64748b', textAlign: 'right', marginTop: '2px' },
  filaVuelto: { display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#b45309', marginTop: '4px', fontWeight: 'bold' },
  pieTicket: { textAlign: 'center', fontSize: '0.68rem', color: '#64748b', lineHeight: 1.35 },
  botonesAccion: { display: 'flex', gap: '6px', marginTop: '12px' },
  btnImprimir: { flex: 1, padding: '10px', backgroundColor: '#0f2a4a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnWhatsApp: { flex: 1, padding: '10px', backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnListo: { padding: '10px 14px', backgroundColor: '#f1f5f9', color: '#0f2a4a', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer' }
};
