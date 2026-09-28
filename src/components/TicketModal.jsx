import React from 'react';
import { Printer, Share2, X, CheckCircle2, ShieldCheck, MessageCircle } from 'lucide-react';

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
    let texto = `*🧾 COMPROBANTE DE COMPRA*\n`;
    texto += `*${(config?.nombre || 'FACILITO POS').toUpperCase()}*\n`;
    if (config?.rif) texto += `RIF: ${config.rif}\n`;
    if (config?.telefono) texto += `TELÉFONO: ${config.telefono}\n`;
    texto += `================================\n`;
    texto += `TICKET #: ${datos.correlativo || datos.id}\n`;
    texto += `FECHA: ${datos.fechaFormateada || new Date().toLocaleString()}\n`;
    texto += `CLIENTE: ${cliente.nombre}\n`;
    texto += `CÉDULA / RIF: ${cliente.doc}\n`;
    if (cliente.telefono) texto += `TELF: ${cliente.telefono}\n`;
    texto += `FORMA DE PAGO: ${datos.esCredito ? 'CUENTA POR COBRAR (A CRÉDITO)' : (datos.metodoPago || 'EFECTIVO')}\n`;
    texto += `================================\n`;

    items.forEach(it => {
      const sub = (it.precioUSD * it.cantidad).toFixed(2);
      texto += `• ${it.nombre}\n`;
      texto += `  ${it.cantidad} ${it.esPesado ? 'KG' : 'UNID'} x $${Number(it.precioUSD).toFixed(2)} = $${sub}\n`;
    });

    texto += `--------------------------------\n`;
    texto += `*TOTAL FACTURA ($): $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL FACTURA (BS): Bs. ${totalBS.toFixed(2)}*\n`;
    texto += `TASA OFICIAL BCV: Bs. ${tasa.toFixed(2)}\n`;
    if (datos.vueltoUSD > 0) texto += `Vuelto Entregado: $${datos.vueltoUSD.toFixed(2)} (Bs. ${datos.vueltoBS.toFixed(2)})\n`;
    texto += `================================\n`;
    if (config?.mensajePie) texto += `${config.mensajePie}\n`;

    // Si tiene teléfono registrado, enviar directamente al chat del cliente
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
      <div style={styles.cajaModal}>
        <div style={styles.headerBarra}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 color="#00b050" size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#0f2a4a' }}>Comprobante Emitido</span>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* RECIBO COMERCIAL TÉRMICO PROFESIONAL */}
        <div id="area-ticket-impresion" style={styles.papelTicket}>
          {config?.logo && (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <img src={config.logo} alt="Logo" style={styles.logoTicket} />
            </div>
          )}

          <div style={styles.encabezadoTicket}>
            <h3 style={styles.nombreComercio}>{(config?.nombre || 'MI NEGOCIO').toUpperCase()}</h3>
            <div style={styles.subInfo}>{config?.rif || 'RIF: J-50000000-0'}</div>
            {config?.direccion && <div style={styles.subInfo}>{config.direccion}</div>}
            {config?.telefono && <div style={styles.subInfo}>TELÉFONO: {config.telefono}</div>}
          </div>

          <div style={styles.separadorLineas} />

          <div style={styles.bloqueMetadata}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TICKET #: <strong>{datos.correlativo || datos.id}</strong></span>
              <span>{datos.fechaFormateada || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>CAJERO: {datos.cajero || 'Angel Pantoja'} · CAJA: {datos.caja || 'Caja 01'}</div>
            <div>CLIENTE: <strong>{cliente.nombre}</strong></div>
            <div>CÉDULA / RIF: <strong>{cliente.doc}</strong></div>
            {cliente.telefono && <div>TELÉFONO: {cliente.telefono}</div>}
            <div>
              ESTADO DE PAGO: <strong>{datos.esCredito ? 'CUENTA POR COBRAR (CRÉDITO)' : (datos.metodoPago || 'PAGADO')}</strong>
            </div>
          </div>

          <div style={styles.separadorLineas} />

          {/* Tabla de Artículos con Cabecera */}
          <div style={styles.cabeceraTabla}>
            <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
            <span style={{ width: '42px', textAlign: 'center' }}>CANT</span>
            <span style={{ width: '50px', textAlign: 'right' }}>P.U ($)</span>
            <span style={{ width: '55px', textAlign: 'right' }}>TOTAL</span>
          </div>
          <div style={styles.lineaFina} />

          {/* Renglones */}
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

          <div style={styles.separadorLineas} />

          {/* Cuadro de Totales */}
          <div style={styles.bloqueTotales}>
            <div style={styles.filaTotalUSD}>
              <span>TOTAL FACTURA:</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>
            <div style={styles.filaTotalBS}>
              <span>TOTAL BOLÍVARES:</span>
              <span>Bs. {totalBS.toFixed(2)}</span>
            </div>
            <div style={styles.tasaTicket}>
              TASA BCV: Bs. {tasa.toFixed(2)} / USD
            </div>

            {datos.vueltoUSD > 0 && (
              <div style={styles.filaVuelto}>
                <span>VUELTO ENTREGADO:</span>
                <span>${datos.vueltoUSD.toFixed(2)} (Bs. {datos.vueltoBS.toFixed(2)})</span>
              </div>
            )}
          </div>

          <div style={styles.separadorLineas} />

          <div style={styles.pieTicket}>
            <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>{config?.mensajePie || '¡Gracias por su compra!'}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '0.64rem' }}>
              <ShieldCheck size={12} color="#00b050" />
              <span>Comprobante digital válido para reclamos</span>
            </div>
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
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', zIndex: 999999999 },
  cajaModal: { backgroundColor: '#ffffff', borderRadius: '24px', maxWidth: '350px', width: '100%', padding: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '94vh', overflowY: 'auto' },
  headerBarra: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  papelTicket: { backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px 14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.72rem', color: '#0f172a' },
  logoTicket: { maxHeight: '52px', maxWidth: '140px', objectFit: 'contain' },
  encabezadoTicket: { textAlign: 'center', lineHeight: 1.35 },
  nombreComercio: { margin: '0 0 2px 0', fontSize: '0.94rem', fontWeight: '900', color: '#0f2a4a' },
  subInfo: { fontSize: '0.66rem', color: '#475569' },
  separadorLineas: { borderTop: '2px dashed #cbd5e1', margin: '8px 0' },
  lineaFina: { borderTop: '1px solid #e2e8f0', margin: '4px 0' },
  bloqueMetadata: { fontSize: '0.68rem', lineHeight: 1.45, color: '#1e293b' },
  cabeceraTabla: { display: 'flex', fontWeight: '900', fontSize: '0.66rem', color: '#0f2a4a', padding: '2px 0' },
  listaProductos: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filaProducto: { display: 'flex', alignItems: 'baseline', fontSize: '0.7rem' },
  colNombre: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600' },
  colCant: { width: '42px', textAlign: 'center', color: '#475569' },
  colPu: { width: '50px', textAlign: 'right', color: '#475569' },
  colTotal: { width: '55px', textAlign: 'right', fontWeight: 'bold', color: '#0f2a4a' },
  bloqueTotales: { display: 'flex', flexDirection: 'column', gap: '3px' },
  filaTotalUSD: { display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900', color: '#00b050' },
  filaTotalBS: { display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: '900', color: '#0052cc' },
  tasaTicket: { fontSize: '0.64rem', color: '#64748b', textAlign: 'right', marginTop: '2px' },
  filaVuelto: { display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#b45309', marginTop: '4px', fontWeight: 'bold' },
  pieTicket: { textAlign: 'center', fontSize: '0.68rem', color: '#64748b', lineHeight: 1.35 },
  botonesAccion: { display: 'flex', gap: '6px', marginTop: '12px' },
  btnImprimir: { flex: 1, padding: '10px', backgroundColor: '#0f2a4a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnWhatsApp: { flex: 1.3, padding: '10px', backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnListo: { padding: '10px 14px', backgroundColor: '#f1f5f9', color: '#0f2a4a', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer' }
};
