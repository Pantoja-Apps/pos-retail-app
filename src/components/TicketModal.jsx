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
  const cliente = datos.cliente || { nombre: 'Consumidor Final', doc: 'V-00000000' };

  const nombreMetodo = {
    efectivo_usd: 'EFECTIVO ($ DIVISAS)',
    pago_movil: 'PAGO MÓVIL',
    punto_venta: 'PUNTO DE VENTA (TARJETA)',
    efectivo_bs: 'EFECTIVO (BOLÍVARES)',
    credito: 'CUENTA POR COBRAR (A CRÉDITO)'
  }[datos.metodoPago] || (datos.metodoPago || 'EFECTIVO');

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    let texto = `*🧾 COMPROBANTE DE PAGO ELECTRÓNICO*\n`;
    texto += `*${(config?.nombre || 'Mi Negocio').toUpperCase()}*\n`;
    if (config?.rif) texto += `RIF: ${config.rif}\n`;
    if (config?.telefono) texto += `TELF: ${config.telefono}\n`;
    texto += `================================\n`;
    texto += `Control #: ${datos.correlativo || datos.id}\n`;
    texto += `Fecha: ${datos.fechaFormateada || new Date().toLocaleString()}\n`;
    texto += `Cliente: ${cliente.nombre}\n`;
    texto += `Doc: ${cliente.doc}\n`;
    texto += `Forma de Pago: ${nombreMetodo}\n`;
    texto += `================================\n`;

    items.forEach(it => {
      const sub = (it.precioUSD * it.cantidad).toFixed(2);
      texto += `${it.nombre}\n`;
      texto += `  ${it.cantidad} ${it.esPesado ? 'KG' : 'UNID'} x $${Number(it.precioUSD).toFixed(2)} = $${sub}\n`;
    });

    texto += `--------------------------------\n`;
    texto += `*TOTAL A PAGAR: $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL BOLÍVARES: Bs. ${totalBS.toFixed(2)}*\n`;
    texto += `Tasa Oficial BCV: Bs. ${tasa.toFixed(2)}\n`;
    if (datos.vueltoUSD > 0) texto += `Vuelto: $${datos.vueltoUSD.toFixed(2)} (Bs. ${datos.vueltoBS.toFixed(2)})\n`;
    texto += `================================\n`;
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
            <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#0f2a4a' }}>Comprobante Emitido</span>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* FACTURA PROFESIONAL TÉRMICA */}
        <div id="area-ticket-impresion" style={styles.papelTicket}>
          {config?.logo && (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <img src={config.logo} alt="Logo" style={styles.logoTicket} />
            </div>
          )}

          <div style={styles.encabezadoTicket}>
            <h3 style={styles.nombreComercio}>{(config?.nombre || 'FACILITO POS').toUpperCase()}</h3>
            <div style={styles.subInfo}>{config?.rif || 'RIF: J-50000000-0'}</div>
            {config?.direccion && <div style={styles.subInfo}>{config.direccion}</div>}
            {config?.telefono && <div style={styles.subInfo}>TEL: {config.telefono}</div>}
          </div>

          <div style={styles.lineaDoble} />

          <div style={styles.datosFacturaGrid}>
            <div>COMPROBANTE: <strong>#{datos.correlativo || datos.id}</strong></div>
            <div>FECHA: {datos.fechaFormateada || new Date().toLocaleString()}</div>
            <div>CAJERO: {datos.cajero || 'Angel Pantoja'} · {datos.caja || 'Caja 01'}</div>
            <div>CLIENTE: <strong>{cliente.nombre}</strong></div>
            <div>CÉDULA / RIF: <strong>{cliente.doc}</strong></div>
            <div>PAGO: <strong>{nombreMetodo}</strong></div>
          </div>

          <div style={styles.lineaDoble} />

          {/* Encabezado de Columnas */}
          <div style={styles.tablaHeader}>
            <span style={{ flex: 1.8 }}>DESCRIPCIÓN</span>
            <span style={{ width: '40px', textAlign: 'center' }}>CANT</span>
            <span style={{ width: '50px', textAlign: 'right' }}>P.U($)</span>
            <span style={{ width: '55px', textAlign: 'right' }}>TOTAL</span>
          </div>

          <div style={styles.lineaPunteada} />

          {/* Renglones */}
          <div style={styles.listaProductos}>
            {items.map((it, idx) => (
              <div key={idx} style={styles.itemFila}>
                <span style={styles.colDesc}>{it.nombre}</span>
                <span style={styles.colCant}>{it.cantidad}{it.esPesado ? 'kg' : ''}</span>
                <span style={styles.colPu}>${Number(it.precioUSD).toFixed(2)}</span>
                <strong style={styles.colTotal}>${(it.precioUSD * it.cantidad).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div style={styles.lineaDoble} />

          {/* Cuadro de Totales */}
          <div style={styles.totalesTicket}>
            <div style={styles.filaTotalMayor}>
              <span>TOTAL USD:</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>
            <div style={styles.filaTotalBs}>
              <span>TOTAL BS:</span>
              <span>Bs. {totalBS.toFixed(2)}</span>
            </div>
            <div style={styles.tasaTicket}>
              TASA BCV OFICIAL: Bs. {tasa.toFixed(2)} / USD
            </div>

            {datos.vueltoUSD > 0 && (
              <div style={styles.filaVuelto}>
                <span>VUELTO / CAMBIO:</span>
                <span>${datos.vueltoUSD.toFixed(2)} (Bs. {datos.vueltoBS.toFixed(2)})</span>
              </div>
            )}
          </div>

          <div style={styles.lineaPunteada} />

          <div style={styles.pieTicket}>
            <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>{config?.mensajePie || '¡Gracias por su compra!'}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '0.64rem' }}>
              <ShieldCheck size={12} color="#00b050" />
              <span>Documento emitido electrónicamente</span>
            </div>
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
  papelTicket: { backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px 14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', fontFamily: 'Courier New, Courier, monospace', fontSize: '0.72rem', color: '#0f172a' },
  logoTicket: { maxHeight: '52px', maxWidth: '140px', objectFit: 'contain' },
  encabezadoTicket: { textAlign: 'center', lineHeight: 1.35 },
  nombreComercio: { margin: '0 0 2px 0', fontSize: '0.94rem', fontWeight: '900', color: '#0f2a4a' },
  subInfo: { fontSize: '0.66rem', color: '#475569' },
  lineaDoble: { borderTop: '2px dashed #94a3b8', margin: '7px 0' },
  lineaPunteada: { borderTop: '1px dashed #cbd5e1', margin: '6px 0' },
  datosFacturaGrid: { fontSize: '0.68rem', lineHeight: 1.45, color: '#1e293b' },
  tablaHeader: { display: 'flex', fontWeight: '900', fontSize: '0.68rem', color: '#0f2a4a', padding: '2px 0' },
  listaProductos: { display: 'flex', flexDirection: 'column', gap: '5px' },
  itemFila: { display: 'flex', alignItems: 'baseline', fontSize: '0.7rem' },
  colDesc: { flex: 1.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  colCant: { width: '40px', textAlign: 'center' },
  colPu: { width: '50px', textAlign: 'right' },
  colTotal: { width: '55px', textAlign: 'right', color: '#0f2a4a' },
  totalesTicket: { display: 'flex', flexDirection: 'column', gap: '3px' },
  filaTotalMayor: { display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900', color: '#00b050' },
  filaTotalBs: { display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: '900', color: '#0052cc' },
  tasaTicket: { fontSize: '0.64rem', color: '#64748b', textAlign: 'right', marginTop: '2px' },
  filaVuelto: { display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#b45309', marginTop: '4px', fontWeight: 'bold' },
  pieTicket: { textAlign: 'center', fontSize: '0.66rem', color: '#64748b', lineHeight: 1.35 },
  botonesAccion: { display: 'flex', gap: '6px', marginTop: '12px' },
  btnImprimir: { flex: 1, padding: '10px', backgroundColor: '#0f2a4a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnWhatsApp: { flex: 1, padding: '10px', backgroundColor: '#00b050', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  btnListo: { padding: '10px 14px', backgroundColor: '#f1f5f9', color: '#0f2a4a', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer' }
};
