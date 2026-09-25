import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Barcode, Camera, Trash2, Plus, Minus, DollarSign, X, 
  CreditCard, Banknote, Smartphone, CheckCircle2, RefreshCw, 
  Package, Edit, ArrowLeft, Image as ImageIcon, Zap, Repeat, Printer, Share2, User, BookOpen, MessageCircle, Wallet, Lock, Search
} from 'lucide-react';

const PRODUCTOS_INICIALES = [
  { id: 1, codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', precioUSD: 1.10, stock: 50, imagen: '' },
  { id: 2, codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', precioUSD: 1.35, stock: 40, imagen: '' },
  { id: 3, codigo: '7591003000789', nombre: 'Pasta Corta Plumitas 500g', precioUSD: 0.95, stock: 60, imagen: '' },
  { id: 4, codigo: '7591004000321', nombre: 'Aceite Mazeite 1L', precioUSD: 3.20, stock: 25, imagen: '' },
  { id: 5, codigo: '7591005000654', nombre: 'Azúcar Montalbán 1kg', precioUSD: 1.25, stock: 30, imagen: '' },
  { id: 6, codigo: '7591472015188', nombre: 'Spray Aclarante Farmatodo', precioUSD: 4.50, stock: 15, imagen: '' },
];

const CLIENTES_INICIALES = [
  { id: 1, doc: 'V-00000000', nombre: 'Consumidor Final', telefono: '', saldoPendienteUSD: 0 },
  { id: 2, doc: 'V-22033378', nombre: 'Jetzabel Gonzalez', telefono: '584120000000', saldoPendienteUSD: 0 }
];

const FORMATOS_RETAIL = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A
];

function normalizarDoc(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function ScannerModal({ abierto, alDetectar, alCerrar }) {
  const scannerRef = useRef(null);
  const [camaras, setCamaras] = useState([]);
  const [indiceCamara, setIndiceCamara] = useState(0);
  const [soportaFlash, setSoportaFlash] = useState(false);
  const [flashEncendido, setFlashEncendido] = useState(false);

  const arrancarCamara = (cameraId) => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => iniciarInstancia(cameraId)).catch(() => iniciarInstancia(cameraId));
    } else {
      iniciarInstancia(cameraId);
    }
  };

  const iniciarInstancia = (cameraId) => {
    const html5QrCode = new Html5Qrcode('lector-camara-nativo', {
      formatsToSupport: FORMATOS_RETAIL,
      verbose: false
    });
    scannerRef.current = html5QrCode;
    const constraint = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

    html5QrCode.start(
      constraint,
      {
        fps: 20,
        aspectRatio: 1.0,
        videoConstraints: {
          ...constraint,
          width: { min: 1280, ideal: 1920 },
          height: { min: 720, ideal: 1080 },
          focusMode: 'continuous'
        }
      },
      (decodedText) => {
        const limpio = decodedText.trim();
        if (limpio.length >= 8 && limpio.length <= 13) {
          html5QrCode.stop().then(() => {
            alDetectar(limpio);
            alCerrar();
          }).catch(() => {
            alDetectar(limpio);
            alCerrar();
          });
        }
      },
      () => {}
    ).then(() => {
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) setSoportaFlash(true);
      } catch (e) {}
    }).catch(() => {
      html5QrCode.start(
        constraint,
        { fps: 15, aspectRatio: 1.0 },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            alDetectar(decodedText.trim());
            alCerrar();
          }).catch(() => {
            alDetectar(decodedText.trim());
            alCerrar();
          });
        },
        () => {}
      ).catch(() => {});
    });
  };

  useEffect(() => {
    if (!abierto) return;

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const traseras = devices.filter(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('trasera') || 
          d.label.toLowerCase().includes('0') || 
          d.label.toLowerCase().includes('2')
        );
        const listaFinal = traseras.length > 0 ? traseras : devices;
        setCamaras(listaFinal);
        arrancarCamara(listaFinal[0].id);
      } else {
        arrancarCamara(null);
      }
    }).catch(() => arrancarCamara(null));

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [abierto]);

  const cambiarLente = () => {
    if (camaras.length <= 1) return;
    const siguiente = (indiceCamara + 1) % camaras.length;
    setIndiceCamara(siguiente);
    arrancarCamara(camaras[siguiente].id);
  };

  const alternarFlash = () => {
    const nuevo = !flashEncendido;
    setFlashEncendido(nuevo);
    try {
      if (scannerRef.current) {
        scannerRef.current.applyVideoConstraints({ advanced: [{ torch: nuevo }] });
      }
    } catch (e) {}
  };

  if (!abierto) return null;

  return (
    <div style={stylesModal.overlay}>
      <div style={stylesModal.modal}>
        <div style={stylesModal.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#111' }}>Escanear Código EAN-13</h3>
            {soportaFlash && (
              <button 
                type="button"
                onClick={alternarFlash} 
                style={{
                  ...stylesModal.btnHerramienta,
                  backgroundColor: flashEncendido ? '#ffeb3b' : '#f1f3f5'
                }}
              >
                <Zap size={15} color={flashEncendido ? '#000' : '#444'} />
              </button>
            )}
            {camaras.length > 1 && (
              <button type="button" onClick={cambiarLente} style={stylesModal.btnCambiarCam}>
                <Repeat size={14} /> Lente {indiceCamara + 1}
              </button>
            )}
          </div>
          <button 
            type="button"
            onClick={() => {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(alCerrar).catch(alCerrar);
              } else {
                alCerrar();
              }
            }} 
            style={stylesModal.btnCerrar}
          >
            <X size={20} color="#333" />
          </button>
        </div>
        <div style={stylesModal.contenedorVisor}>
          <div id="lector-camara-nativo" style={{ width: '100%', height: '100%' }}></div>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#666', textAlign: 'center', margin: '10px 0 0 0' }}>
          Mantén 15-20 cm de distancia.
        </p>
      </div>
    </div>
  );
}

const stylesModal = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, padding: '16px',
  },
  modal: {
    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '16px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px',
  },
  btnHerramienta: {
    border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnCambiarCam: {
    display: 'flex', alignItems: 'center', gap: '4px', background: '#e6f0ff',
    color: '#0052cc', border: 'none', borderRadius: '6px', padding: '4px 8px',
    fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer',
  },
  btnCerrar: {
    background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  contenedorVisor: {
    width: '100%', height: '280px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden',
  }
};

function ModalCobro({
  abierto,
  alCerrar,
  totalUSD,
  totalBS,
  tasaCambio,
  clienteActual,
  setClienteActual,
  clientes,
  guardarClienteEnDB,
  alFinalizarVenta
}) {
  const [valUSD, setValUSD] = useState('');
  const [valPM, setValPM] = useState('');
  const [valPunto, setValPunto] = useState('');
  const [esCredito, setEsCredito] = useState(false);

  useEffect(() => {
    if (abierto) {
      setValUSD('');
      setValPM('');
      setValPunto('');
      setEsCredito(false);
    }
  }, [abierto]);

  if (!abierto) return null;

  const tBS = parseFloat(totalBS) || 0;
  const tUSD = parseFloat(totalUSD) || 0;
  const tasa = parseFloat(tasaCambio) || 1;

  const nUSD = parseFloat(valUSD) || 0;
  const nPM = parseFloat(valPM) || 0;
  const nPunto = parseFloat(valPunto) || 0;

  const totalAbonadoBS = (nUSD * tasa) + nPM + nPunto;
  const totalAbonadoUSD = (totalAbonadoBS / tasa);
  const balance = totalAbonadoBS - tBS;

  const faltaBS = balance < -0.01 ? Math.abs(balance) : 0;
  const faltaUSD = faltaBS > 0 ? (faltaBS / tasa) : 0;
  const vueltoBS = balance > 0.01 ? balance : 0;
  const vueltoUSD = vueltoBS > 0 ? (vueltoBS / tasa) : 0;

  const pagadoCompleto = totalAbonadoBS >= (tBS - 0.05);
  const puedeProcesar = esCredito ? (clienteActual.nombre && clienteActual.doc !== 'V-00000000') : pagadoCompleto;

  const clienteEnBase = clientes.find(c => {
    const cDoc = normalizarDoc(c.doc);
    const inDoc = normalizarDoc(clienteActual.doc);
    return cDoc === inDoc || (inDoc.length >= 6 && (cDoc.endsWith(inDoc) || inDoc.endsWith(cDoc)));
  });
  const saldoPrevio = clienteEnBase ? (clienteEnBase.saldoPendienteUSD || 0) : (clienteActual.saldoPendienteUSD || 0);

  const manejarCambioDoc = (docIngresado) => {
    const inLimpio = normalizarDoc(docIngresado);
    const encontrado = clientes.find(c => {
      const cLimpio = normalizarDoc(c.doc);
      return cLimpio === inLimpio || (inLimpio.length >= 6 && (cLimpio.endsWith(inLimpio) || inLimpio.endsWith(cLimpio)));
    });

    if (encontrado) {
      setClienteActual({ ...encontrado });
    } else {
      setClienteActual(prev => ({ ...prev, doc: docIngresado, saldoPendienteUSD: 0 }));
    }
  };

  const procesar = () => {
    if (!puedeProcesar) {
      if (esCredito && (!clienteActual.nombre || clienteActual.doc === 'V-00000000')) {
        alert('Para vender a crédito debes asignar una Cédula/RIF y Nombre al cliente.');
      }
      return;
    }
    
    if (clienteActual.doc && clienteActual.nombre && clienteActual.doc !== 'V-00000000') {
      guardarClienteEnDB(clienteActual);
    }

    const payload = {
      totalUSD: tUSD.toFixed(2),
      totalBS: tBS.toFixed(2),
      tasa: tasa.toFixed(4),
      pagoUSD: nUSD.toFixed(2),
      pagoPM: nPM.toFixed(2),
      pagoPunto: nPunto.toFixed(2),
      vueltoBS: vueltoBS.toFixed(2),
      vueltoUSD: vueltoUSD.toFixed(2),
      esCredito: esCredito,
      saldoDeudaUSD: esCredito ? faltaUSD.toFixed(2) : '0.00',
      saldoDeudaBS: esCredito ? faltaBS.toFixed(2) : '0.00',
      cliente: clienteActual,
      fecha: new Date().toLocaleString('es-VE')
    };

    setValUSD('');
    setValPM('');
    setValPunto('');

    alFinalizarVenta(payload);
  };

  return (
    <div style={stylesCobro.overlay} translate="no">
      <div style={stylesCobro.modal}>
        <div style={stylesCobro.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#111' }}>Procesar Venta</h2>
            <small style={{ color: '#666' }}>Tasa BCV: Bs. {tasa.toFixed(2)}</small>
          </div>
          <button type="button" onClick={alCerrar} style={stylesCobro.btnCerrar}>
            <X size={20} />
          </button>
        </div>

        <div style={stylesCobro.switchTipoVenta}>
          <button 
            type="button" 
            onClick={() => setEsCredito(false)} 
            style={{ ...stylesCobro.btnTab, backgroundColor: !esCredito ? '#0052cc' : '#f1f3f5', color: !esCredito ? '#fff' : '#444' }}
          >
            Venta de Contado
          </button>
          <button 
            type="button" 
            onClick={() => setEsCredito(true)} 
            style={{ ...stylesCobro.btnTab, backgroundColor: esCredito ? '#e65100' : '#f1f3f5', color: esCredito ? '#fff' : '#444' }}
          >
            A Crédito / Fiado
          </button>
        </div>

        <div style={stylesCobro.seccionCliente}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: esCredito ? '#e65100' : '#0052cc', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} /> {esCredito ? 'Cliente Obligatorio (Crédito):' : 'Datos del Cliente:'}
            </span>
            <small style={{ fontSize: '0.7rem', color: '#666' }}>Busca por cédula o nombre</small>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input
              type="text"
              placeholder="C.I. / RIF (ej: 24808845)"
              value={clienteActual.doc}
              onChange={(e) => manejarCambioDoc(e.target.value)}
              style={{ ...stylesCobro.inputCliente, width: '130px', fontWeight: 'bold' }}
            />
            <input
              type="text"
              placeholder="Nombre completo"
              value={clienteActual.nombre}
              onChange={(e) => setClienteActual(prev => ({ ...prev, nombre: e.target.value }))}
              style={{ ...stylesCobro.inputCliente, flex: 1 }}
            />
          </div>
          <input
            type="text"
            placeholder="Teléfono WhatsApp (ej: 58412...)"
            value={clienteActual.telefono || ''}
            onChange={(e) => setClienteActual(prev => ({ ...prev, telefono: e.target.value }))}
            style={stylesCobro.inputCliente}
          />
          {saldoPrevio > 0 && (
            <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#c62828', fontWeight: 'bold' }}>
              ⚠️ Deuda previa de este cliente: ${saldoPrevio.toFixed(2)} (Bs. {(saldoPrevio * tasa).toFixed(2)})
            </div>
          )}
        </div>

        <div style={stylesCobro.resumenTotal}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#555' }}>Total orden:</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#0052cc' }}>
              Bs. {tBS.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: '#555' }}>En Divisa:</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#28a745' }}>
              ${tUSD.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={stylesCobro.cuerpoPagos}>
          <small style={{ fontWeight: 'bold', color: '#444' }}>
            {esCredito ? 'Abono Inicial (opcional, deja en 0 si no paga nada hoy):' : 'Registro de Pagos:'}
          </small>
          <div style={stylesCobro.grupoInput}>
            <label style={stylesCobro.label}>
              <Banknote size={16} color="#28a745" /> Efectivo Divisa ($):
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={valUSD}
              onChange={(e) => setValUSD(e.target.value)}
              style={stylesCobro.input}
            />
          </div>

          <div style={stylesCobro.grupoInput}>
            <label style={stylesCobro.label}>
              <Smartphone size={16} color="#0052cc" /> Pago Móvil (Bs):
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={valPM}
              onChange={(e) => setValPM(e.target.value)}
              style={stylesCobro.input}
            />
          </div>

          <div style={stylesCobro.grupoInput}>
            <label style={stylesCobro.label}>
              <CreditCard size={16} color="#6f42c1" /> Punto / Débito (Bs):
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={valPunto}
              onChange={(e) => setValPunto(e.target.value)}
              style={stylesCobro.input}
            />
          </div>
        </div>

        {esCredito ? (
          <div style={{ ...stylesCobro.panelEstado, backgroundColor: '#fff3e0', borderColor: '#ffe0b2' }}>
            <span style={{ fontSize: '0.8rem', color: '#e65100', fontWeight: 'bold' }}>QUEDARÁ DEBIENDO (FIADO):</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#bf360c' }}>
              ${faltaUSD.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>(Bs. {faltaBS.toFixed(2)})</span>
            </div>
            {totalAbonadoUSD > 0 && (
              <small style={{ color: '#2e7d32', display: 'block', marginTop: '2px', fontWeight: 'bold' }}>
                Abona hoy: ${totalAbonadoUSD.toFixed(2)} (Bs. {totalAbonadoBS.toFixed(2)})
              </small>
            )}
          </div>
        ) : (
          <div style={{
            ...stylesCobro.panelEstado,
            backgroundColor: pagadoCompleto ? '#e8f5e9' : '#ffebee',
            borderColor: pagadoCompleto ? '#a5d6a7' : '#ffcdd2',
          }}>
            {pagadoCompleto ? (
              <div>
                <span style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 'bold' }}>
                  {vueltoBS > 0 ? "VUELTO A ENTREGAR:" : "PAGO COMPLETO Y EXACTO"}
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1b5e20' }}>
                  Bs. {vueltoBS.toFixed(2)} <span style={{ fontSize: '0.95rem' }}>(${vueltoUSD.toFixed(2)})</span>
                </div>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.8rem', color: '#c62828', fontWeight: 'bold' }}>FALTA POR PAGAR:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#b71c1c' }}>
                  Bs. {faltaBS.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={procesar}
          disabled={!puedeProcesar}
          style={{
            ...stylesCobro.btnFinalizar,
            backgroundColor: puedeProcesar ? (esCredito ? '#e65100' : '#28a745') : '#ccc',
            cursor: puedeProcesar ? 'pointer' : 'not-allowed',
          }}
        >
          <CheckCircle2 size={20} /> {esCredito ? 'Registrar Venta a Crédito' : 'Emitir Factura de Contado'}
        </button>
      </div>
    </div>
  );
}

const stylesCobro = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9998, padding: '16px',
  },
  modal: {
    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px', padding: '18px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)', maxHeight: '95vh', overflowY: 'auto'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',
  },
  switchTipoVenta: {
    display: 'flex', gap: '6px', marginBottom: '12px', background: '#f1f3f5', padding: '4px', borderRadius: '8px'
  },
  btnTab: {
    flex: 1, border: 'none', padding: '9px 6px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
  },
  btnCerrar: {
    background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  seccionCliente: {
    backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #e2e8f0',
  },
  inputCliente: {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.82rem', outline: 'none',
  },
  resumenTotal: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8f9fa',
    borderRadius: '10px', marginBottom: '12px', border: '1px solid #e9ecef',
  },
  cuerpoPagos: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  grupoInput: { display: 'flex', flexDirection: 'column', gap: '3px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#444', display: 'flex', alignItems: 'center', gap: '6px' },
  input: {
    padding: '9px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '0.95rem',
    fontWeight: 'bold', textAlign: 'right', outline: 'none',
  },
  panelEstado: {
    padding: '10px', borderRadius: '10px', border: '1px solid', textAlign: 'center', marginBottom: '12px',
  },
  btnFinalizar: {
    width: '100%', padding: '12px', border: 'none', borderRadius: '10px', color: '#fff',
    fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px',
  },
};

function ModuloCreditos({ clientes, tasaCambio, alRegistrarAbono, alVolver }) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [abonoUSD, setAbonoUSD] = useState('');
  const [abonoPM, setAbonoPM] = useState('');
  const [abonoPunto, setAbonoPunto] = useState('');

  const tasa = parseFloat(tasaCambio) || 1;
  const clientesConDeuda = clientes.filter(c => (c.saldoPendienteUSD || 0) > 0.01);
  const totalDeudaGlobalUSD = clientesConDeuda.reduce((acc, c) => acc + c.saldoPendienteUSD, 0);

  const enviarRecordatorioWhatsApp = (cli) => {
    if (!cli.telefono) {
      alert('Este cliente no tiene teléfono guardado para WhatsApp.');
      return;
    }
    const saldoUSD = (cli.saldoPendienteUSD || 0).toFixed(2);
    const saldoBS = ((cli.saldoPendienteUSD || 0) * tasa).toFixed(2);
    const tasaStr = tasa.toFixed(2);
    const fecha = new Date().toLocaleDateString('es-VE');

    let t = "*RECORDATORIO DE PAGO*\n";
    t += "COMERCIALIZADORA POS C.A.\n";
    t += "--------------------------------\n";
    t += "Estimado(a): " + cli.nombre + "\n";
    t += "C.I./RIF:    " + cli.doc + "\n";
    t += "Fecha:       " + fecha + "\n";
    t += "--------------------------------\n";
    t += "Le recordamos su saldo pendiente:\n\n";
    t += "• TOTAL DEUDA:  $" + saldoUSD + "\n";
    t += "• EN BOLÍVARES: Bs. " + saldoBS + "\n";
    t += "(Calculado a Tasa BCV: Bs. " + tasaStr + ")\n";
    t += "--------------------------------\n";
    t += "Por favor realice su abono o cancelación a la brevedad.\n";
    t += "¡Agradecemos su puntualidad!\n";

    const b = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
    const msg = b + "\n" + t + b;
    const telf = cli.telefono.replace(/\D/g, '');
    window.open("https://wa.me/" + telf + "?text=" + encodeURIComponent(msg), '_blank');
  };

  const abrirAbonoModal = (cli) => {
    setClienteSeleccionado(cli);
    setAbonoUSD('');
    setAbonoPM('');
    setAbonoPunto('');
  };

  const procesarAbono = () => {
    if (!clienteSeleccionado) return;
    const nUSD = parseFloat(abonoUSD) || 0;
    const nPM = parseFloat(abonoPM) || 0;
    const nPunto = parseFloat(abonoPunto) || 0;

    const totalAbonoUSD = nUSD + (nPM / tasa) + (nPunto / tasa);
    if (totalAbonoUSD <= 0) {
      alert('Ingresa un monto para abonar.');
      return;
    }

    if (totalAbonoUSD > (clienteSeleccionado.saldoPendienteUSD + 0.05)) {
      alert('El monto a abonar supera la deuda total del cliente.');
      return;
    }

    alRegistrarAbono(clienteSeleccionado, totalAbonoUSD, {
      pagoUSD: nUSD,
      pagoPM: nPM,
      pagoPunto: nPunto,
      totalAbonoUSD: totalAbonoUSD
    });

    setClienteSeleccionado(null);
    setAbonoUSD('');
    setAbonoPM('');
    setAbonoPunto('');
  };

  return (
    <div style={stylesInv.contenedor} translate="no">
      <header style={stylesInv.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={stylesInv.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Cuentas por Cobrar (Créditos)</h2>
            <small style={{ color: '#666', fontSize: '0.75rem' }}>Deuda Total: ${totalDeudaGlobalUSD.toFixed(2)} (Bs. {(totalDeudaGlobalUSD * tasa).toFixed(2)})</small>
          </div>
        </div>
      </header>

      <div style={stylesInv.lista}>
        {clientesConDeuda.length === 0 ? (
          <div style={styles.carritoVacio}>
            <CheckCircle2 color="#28a745" size={48} />
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#555' }}>No hay cuentas pendientes por cobrar.</p>
          </div>
        ) : (
          clientesConDeuda.map((cli) => {
            const deudaUSD = cli.saldoPendienteUSD || 0;
            const deudaBS = deudaUSD * tasa;

            return (
              <div key={cli.id} style={{ ...stylesInv.itemCard, flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#111' }}>{cli.nombre}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                      Documento: {cli.doc} | Teléfono: {cli.telefono || 'Sin registrar'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#bf360c' }}>${deudaUSD.toFixed(2)}</div>
                    <small style={{ fontSize: '0.75rem', color: '#666' }}>Bs. {deudaBS.toFixed(2)}</small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => abrirAbonoModal(cli)} 
                    style={{ ...stylesCobro.btnTab, backgroundColor: '#0052cc', color: '#fff' }}
                  >
                    <Plus size={14} /> Registrar Abono
                  </button>

                  <button 
                    type="button" 
                    onClick={() => enviarRecordatorioWhatsApp(cli)} 
                    style={{ ...stylesCobro.btnTab, backgroundColor: '#25d366', color: '#fff' }}
                    title="Enviar recordatorio de cobro por WhatsApp"
                  >
                    <MessageCircle size={15} /> Recordar por WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {clienteSeleccionado && (
        <div style={stylesCobro.overlay} translate="no">
          <div style={stylesCobro.modal}>
            <div style={stylesCobro.header}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Abonar a Deuda</h3>
                <small style={{ color: '#555' }}>Cliente: {clienteSeleccionado.nombre}</small>
              </div>
              <button type="button" onClick={() => setClienteSeleccionado(null)} style={stylesCobro.btnCerrar}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#c62828', fontWeight: 'bold' }}>DEUDA ACTUAL:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#b71c1c' }}>
                ${clienteSeleccionado.saldoPendienteUSD.toFixed(2)} (Bs. {(clienteSeleccionado.saldoPendienteUSD * tasa).toFixed(2)})
              </div>
            </div>

            <div style={stylesCobro.cuerpoPagos}>
              <div style={stylesCobro.grupoInput}>
                <label style={stylesCobro.label}><Banknote size={16} color="#28a745" /> Abono Divisa ($):</label>
                <input type="number" step="any" placeholder="0.00" value={abonoUSD} onChange={(e) => setAbonoUSD(e.target.value)} style={stylesCobro.input} />
              </div>
              <div style={stylesCobro.grupoInput}>
                <label style={stylesCobro.label}><Smartphone size={16} color="#0052cc" /> Abono Pago Móvil (Bs):</label>
                <input type="number" step="any" placeholder="0.00" value={abonoPM} onChange={(e) => setAbonoPM(e.target.value)} style={stylesCobro.input} />
              </div>
              <div style={stylesCobro.grupoInput}>
                <label style={stylesCobro.label}><CreditCard size={16} color="#6f42c1" /> Abono Punto (Bs):</label>
                <input type="number" step="any" placeholder="0.00" value={abonoPunto} onChange={(e) => setAbonoPunto(e.target.value)} style={stylesCobro.input} />
              </div>
            </div>

            <button type="button" onClick={procesarAbono} style={{ ...stylesCobro.btnFinalizar, backgroundColor: '#28a745' }}>
              Confirmar y Descontar Abono
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalTicketCierre({ datosCierre, alCerrar, alConfirmarCierreFinal }) {
  if (!datosCierre) return null;

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    let t = "*REPORTE DE ARQUEO Y CIERRE DE CAJA*\n";
    t += "COMERCIALIZADORA POS C.A.\n";
    t += "RIF: J-41235678-0\n";
    t += "Av. Principal El Hatillo, Caracas\n";
    t += "--------------------------------\n";
    t += "Fecha/Hora: " + datosCierre.fecha + "\n";
    t += "Tasa BCV:   Bs. " + datosCierre.tasa + "\n";
    t += "Movimientos: " + datosCierre.cantidadMovimientos + "\n";
    t += "--------------------------------\n";
    t += "*EFECTIVO DIVISAS ($):*   $" + datosCierre.totalEfectivoUSD + "\n";
    t += "*PAGO MÓVIL (Bs):*      Bs. " + datosCierre.totalPagoMovilBS + "\n";
    t += "*PUNTO DE VENTA (Bs):*  Bs. " + datosCierre.totalPuntoBS + "\n";
    t += "--------------------------------\n";
    t += "*TOTAL RECAUDADO (TURNO):*\n";
    t += "• EN DIVISA ($):        $" + datosCierre.totalEquivUSD + "\n";
    t += "• EN BOLÍVARES:     Bs. " + datosCierre.totalEquivBS + "\n";
    t += "--------------------------------\n";
    t += "*RESUMEN OPERATIVO:*\n";
    t += "• Ventas Brutas:        $" + datosCierre.totalVentasUSD + "\n";
    t += "• Créditos Otorgados:   $" + datosCierre.totalCreditosUSD + "\n";
    t += "• Abonos Cobrados:      $" + datosCierre.totalAbonosUSD + "\n";
    t += "--------------------------------\n";
    t += "Cierre de caja verificado.\n";

    const b = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
    const msg = b + "\n" + t + b;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), '_blank');
  };

  return (
    <div style={stylesTicket.overlay} translate="no">
      <div style={stylesTicket.modal}>
        <div style={stylesTicket.headerModal} className="no-print">
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#111' }}>
            Reporte de Cierre de Caja
          </span>
          <button type="button" onClick={alCerrar} style={stylesTicket.btnCerrar}>
            <X size={20} />
          </button>
        </div>

        <div style={stylesTicket.papelTermico} id="area-ticket-impresion" translate="no">
          <div style={stylesTicket.centro}>
            <h2 style={stylesTicket.nombreComercio}>COMERCIALIZADORA POS C.A.</h2>
            <p style={stylesTicket.textoEmpresa}>RIF: J-41235678-0</p>
            <p style={stylesTicket.textoEmpresa}>Av. Principal El Hatillo, Caracas</p>
            <p style={stylesTicket.tituloDoc}>REPORTE DE CIERRE DE CAJA (Z)</p>
            <div style={stylesTicket.lineaDoble}>================================</div>
          </div>

          <div style={stylesTicket.bloqueInfo}>
            <div style={stylesTicket.filaDato}>
              <span>FECHA / HORA:</span>
              <span>{datosCierre.fecha}</span>
            </div>
            <div style={stylesTicket.filaDato}>
              <span>TASA OFICIAL BCV:</span>
              <span>Bs. {datosCierre.tasa}</span>
            </div>
            <div style={stylesTicket.filaDato}>
              <span>TOTAL MOVIMIENTOS:</span>
              <strong>{datosCierre.cantidadMovimientos}</strong>
            </div>
          </div>

          <div style={stylesTicket.lineaDoble}>================================</div>
          <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '4px' }}>DINERO DISPONIBLE EN CAJA:</div>

          <div style={stylesTicket.filaDato}>
            <span>💵 Efectivo Divisas:</span>
            <strong>${datosCierre.totalEfectivoUSD}</strong>
          </div>
          <div style={stylesTicket.filaDato}>
            <span>📱 Pago Móvil (Bs):</span>
            <strong>Bs. {datosCierre.totalPagoMovilBS}</strong>
          </div>
          <div style={stylesTicket.filaDato}>
            <span>💳 Punto / Débito (Bs):</span>
            <strong>Bs. {datosCierre.totalPuntoBS}</strong>
          </div>

          <div style={stylesTicket.lineaSimple}>--------------------------------</div>

          <div style={stylesTicket.seccionTotales}>
            <div style={stylesTicket.filaGranTotal}>
              <span>TOTAL EN DIVISA ($):</span>
              <span>${datosCierre.totalEquivUSD}</span>
            </div>

            <div style={stylesTicket.filaGranTotalBs}>
              <span translate="no">TOTAL BOLÍVARES:</span>
              <span translate="no">Bs. {datosCierre.totalEquivBS}</span>
            </div>
          </div>

          <div style={stylesTicket.lineaDoble}>================================</div>
          <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '4px' }}>BALANCE OPERATIVO:</div>

          <div style={stylesTicket.filaDato}>
            <span>Ventas Brutas:</span>
            <strong>${datosCierre.totalVentasUSD}</strong>
          </div>
          <div style={stylesTicket.filaDato}>
            <span>Créditos Otorgados (Fiado):</span>
            <strong style={{ color: '#c62828' }}>${datosCierre.totalCreditosUSD}</strong>
          </div>
          <div style={stylesTicket.filaDato}>
            <span>Abonos Cobrados:</span>
            <strong style={{ color: '#2e7d32' }}>${datosCierre.totalAbonosUSD}</strong>
          </div>

          <div style={stylesTicket.centro}>
            <p style={{ margin: '14px 0 2px 0', fontSize: '0.68rem', fontWeight: 'bold' }}>CIERRE DE TURNO CONFORME</p>
            <p style={{ margin: '2px 0', fontSize: '0.62rem', color: '#444' }}>Firma del Cajero / Responsable</p>
            <div style={{ borderBottom: '1px dashed #000', width: '160px', margin: '24px auto 8px auto' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }} className="no-print">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={imprimir} style={stylesTicket.btnImprimir}>
              <Printer size={18} /> Imprimir / PDF
            </button>
            <button type="button" onClick={compartirWhatsApp} style={stylesTicket.btnWhatsapp}>
              <Share2 size={18} /> WhatsApp
            </button>
          </div>
          <button 
            type="button" 
            onClick={alConfirmarCierreFinal}
            style={{ 
              padding: '12px', backgroundColor: '#d32f2f', color: '#fff', 
              border: 'none', borderRadius: '8px', fontWeight: 'bold', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' 
            }}
          >
            <Lock size={18} /> Finalizar Cierre y Reiniciar Caja a 0
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuloCaja({ transacciones, tasaCambio, alCerrarTurno, alVolver }) {
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const tasa = parseFloat(tasaCambio) || 1;

  let totalEfectivoUSD = 0;
  let totalPagoMovilBS = 0;
  let totalPuntoBS = 0;
  let totalVentasUSD = 0;
  let totalCreditosUSD = 0;
  let totalAbonosUSD = 0;

  transacciones.forEach((t) => {
    if (t.tipo === 'venta') {
      totalVentasUSD += parseFloat(t.totalUSD) || 0;
      totalEfectivoUSD += (parseFloat(t.pagoUSD) || 0) - (parseFloat(t.vueltoUSD) || 0);
      totalPagoMovilBS += parseFloat(t.pagoPM) || 0;
      totalPuntoBS += parseFloat(t.pagoPunto) || 0;
      if (t.esCredito) {
        totalCreditosUSD += parseFloat(t.saldoDeudaUSD) || 0;
      }
    } else if (t.tipo === 'abono') {
      totalAbonosUSD += parseFloat(t.totalAbonoUSD) || 0;
      totalEfectivoUSD += parseFloat(t.pagoUSD) || 0;
      totalPagoMovilBS += parseFloat(t.pagoPM) || 0;
      totalPuntoBS += parseFloat(t.pagoPunto) || 0;
    }
  });

  const totalEnCajaEquivUSD = totalEfectivoUSD + (totalPagoMovilBS / tasa) + (totalPuntoBS / tasa);
  const totalEnCajaEquivBS = totalEnCajaEquivUSD * tasa;

  const datosResumenCierre = {
    fecha: new Date().toLocaleString('es-VE'),
    tasa: tasa.toFixed(2),
    cantidadMovimientos: transacciones.length,
    totalEfectivoUSD: totalEfectivoUSD.toFixed(2),
    totalPagoMovilBS: totalPagoMovilBS.toFixed(2),
    totalPuntoBS: totalPuntoBS.toFixed(2),
    totalEquivUSD: totalEnCajaEquivUSD.toFixed(2),
    totalEquivBS: totalEnCajaEquivBS.toFixed(2),
    totalVentasUSD: totalVentasUSD.toFixed(2),
    totalCreditosUSD: totalCreditosUSD.toFixed(2),
    totalAbonosUSD: totalAbonosUSD.toFixed(2)
  };

  const compartirCierreWhatsApp = () => {
    let t = "*REPORTE DE ARQUEO Y CIERRE DE CAJA*\n";
    t += "COMERCIALIZADORA POS C.A.\n";
    t += "RIF: J-41235678-0\n";
    t += "Av. Principal El Hatillo, Caracas\n";
    t += "--------------------------------\n";
    t += "Fecha/Hora: " + datosResumenCierre.fecha + "\n";
    t += "Tasa BCV:   Bs. " + datosResumenCierre.tasa + "\n";
    t += "Movimientos: " + transacciones.length + "\n";
    t += "--------------------------------\n";
    t += "*DINERO FÍSICO EN CAJA:*\n";
    t += "💵 Efectivo Divisas:  $" + totalEfectivoUSD.toFixed(2) + "\n";
    t += "--------------------------------\n";
    t += "*DINERO EN BANCO (BOLÍVARES):*\n";
    t += "📱 Pago Móvil:        Bs. " + totalPagoMovilBS.toFixed(2) + " ($" + (totalPagoMovilBS / tasa).toFixed(2) + ")\n";
    t += "💳 Punto / Débito:    Bs. " + totalPuntoBS.toFixed(2) + " ($" + (totalPuntoBS / tasa).toFixed(2) + ")\n";
    t += "--------------------------------\n";
    t += "*TOTAL RECAUDADO (TURNO):*\n";
    t += "• TOTAL EN DIVISAS:   $" + totalEnCajaEquivUSD.toFixed(2) + "\n";
    t += "• TOTAL EN BOLÍVARES: Bs. " + totalEnCajaEquivBS.toFixed(2) + "\n";
    t += "--------------------------------\n";
    t += "*BALANCE OPERATIVO:*\n";
    t += "• Ventas Totales:     $" + totalVentasUSD.toFixed(2) + "\n";
    t += "• Créditos Otorgados: $" + totalCreditosUSD.toFixed(2) + "\n";
    t += "• Abonos Cobrados:    $" + totalAbonosUSD.toFixed(2) + "\n";
    t += "--------------------------------\n";
    t += "Cierre de caja verificado.\n";

    const b = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
    const msg = b + "\n" + t + b;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), '_blank');
  };

  const ejecutarCierreFinal = () => {
    if (confirm('¿Estás 100% seguro de vaciar el turno actual y dejar los contadores en cero?')) {
      setModalCierreAbierto(false);
      alCerrarTurno();
    }
  };

  return (
    <div style={stylesInv.contenedor} translate="no">
      <header style={stylesInv.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={stylesInv.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Arqueo y Cierre de Caja</h2>
            <small style={{ color: '#666', fontSize: '0.75rem' }}>Turno Actual ({transacciones.length} movimientos)</small>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ backgroundColor: '#0052cc', color: '#fff', padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>TOTAL NETO EN CAJA (EQUIVALENTE)</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '4px 0' }}>
            ${totalEnCajaEquivUSD.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Bs. {totalEnCajaEquivBS.toFixed(2)}</span>
        </div>

        <div style={stylesInv.itemCard}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote color="#2e7d32" size={22} />
          </div>
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#666' }}>Efectivo en Divisas (En Mano)</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>${totalEfectivoUSD.toFixed(2)}</div>
          </div>
          <small style={{ fontSize: '0.75rem', color: '#666' }}>Bs. {(totalEfectivoUSD * tasa).toFixed(2)}</small>
        </div>

        <div style={stylesInv.itemCard}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone color="#0052cc" size={22} />
          </div>
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#666' }}>Pago Móvil (Banco)</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0052cc' }}>Bs. {totalPagoMovilBS.toFixed(2)}</div>
          </div>
          <small style={{ fontSize: '0.75rem', color: '#666' }}>${(totalPagoMovilBS / tasa).toFixed(2)}</small>
        </div>

        <div style={stylesInv.itemCard}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard color="#6f42c1" size={22} />
          </div>
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#666' }}>Punto de Venta / Débito (Banco)</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6f42c1' }}>Bs. {totalPuntoBS.toFixed(2)}</div>
          </div>
          <small style={{ fontSize: '0.75rem', color: '#666' }}>${(totalPuntoBS / tasa).toFixed(2)}</small>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e1e4e8', marginTop: '4px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#444' }}>Resumen Operativo del Turno:</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '8px' }}>
            <span style={{ color: '#555' }}>Ventas Brutas Totales:</span>
            <strong>${totalVentasUSD.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
            <span style={{ color: '#e65100' }}>Créditos Nuevos (Fiados):</span>
            <strong style={{ color: '#e65100' }}>${totalCreditosUSD.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
            <span style={{ color: '#28a745' }}>Abonos Cobrados a Deudas:</span>
            <strong style={{ color: '#28a745' }}>${totalAbonosUSD.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button 
            type="button" 
            onClick={compartirCierreWhatsApp}
            style={{ ...stylesCobro.btnTab, backgroundColor: '#25d366', color: '#fff', padding: '12px' }}
          >
            <Share2 size={16} /> Enviar Reporte a WhatsApp
          </button>
          <button 
            type="button" 
            onClick={() => {
              if (transacciones.length === 0) {
                alert('No hay movimientos en este turno para cerrar.');
                return;
              }
              setModalCierreAbierto(true);
            }}
            style={{ ...stylesCobro.btnTab, backgroundColor: '#d32f2f', color: '#fff', padding: '12px' }}
          >
            <Lock size={16} /> Cierre Z (Imprimir y Cerrar)
          </button>
        </div>
      </div>

      <ModalTicketCierre 
        datosCierre={modalCierreAbierto ? datosResumenCierre : null}
        alCerrar={() => setModalCierreAbierto(false)}
        alConfirmarCierreFinal={ejecutarCierreFinal}
      />
    </div>
  );
}

function ModalTicket({ ticket, alCerrar }) {
  if (!ticket) return null;

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    const esCred = ticket.esCredito;
    let t = "*COMERCIALIZADORA POS C.A.*\n";
    t += "RIF: J-41235678-0\n";
    t += "Av. Principal El Hatillo, Caracas\n\n";
    t += esCred ? "*COMPROBANTE VENTA A CRÉDITO*\n" : "*FACTURA / TICKET DE CAJA*\n";
    t += "--------------------------------\n";
    t += "Factura N: 000-" + ticket.id + "\n";
    t += "Fecha/Hora: " + ticket.fecha + "\n";
    t += "Cliente:    " + (ticket.cliente?.nombre || 'Consumidor Final') + "\n";
    t += "C.I./RIF:   " + (ticket.cliente?.doc || 'V-00000000') + "\n";
    t += "Condición:  " + (esCred ? "CRÉDITO (FIADO)" : "CONTADO") + "\n";
    t += "Tasa BCV:   Bs. " + ticket.tasa + "\n";
    t += "--------------------------------\n";
    t += "CANT  DESCRIPCIÓN        TOTAL $\n";
    t += "--------------------------------\n";
    
    ticket.items.forEach(it => {
      const nombreCorto = (it.nombre.length > 16 ? it.nombre.substring(0, 14) + ".." : it.nombre).padEnd(16, " ");
      const cant = String(it.cantidad).padEnd(4, " ");
      const total = ("$" + (it.precioUSD * it.cantidad).toFixed(2)).padStart(8, " ");
      t += cant + "  " + nombreCorto + " " + total + "\n";
    });

    t += "--------------------------------\n";
    t += "TOTAL ORDEN ($):        $" + ticket.totalUSD.padStart(7, " ") + "\n";
    t += "TOTAL BOLÍVARES:    Bs. " + ticket.totalBS.padStart(7, " ") + "\n";
    t += "--------------------------------\n";
    
    if (esCred) {
      t += "ABONADO HOY:\n";
      if (parseFloat(ticket.pagoUSD) > 0) t += "• Divisas ($):       $" + ticket.pagoUSD + "\n";
      if (parseFloat(ticket.pagoPM) > 0)  t += "• Pago Móvil:      Bs. " + ticket.pagoPM + "\n";
      if (parseFloat(ticket.pagoPunto) > 0) t += "• Punto Débito:    Bs. " + ticket.pagoPunto + "\n";
      t += "--------------------------------\n";
      t += "*SALDO PENDIENTE (DEUDA):*\n";
      t += "• EN DIVISA ($):     $" + ticket.saldoDeudaUSD + "\n";
      t += "• EN BOLÍVARES:    Bs. " + ticket.saldoDeudaBS + "\n";
    } else {
      t += "PAGADO:\n";
      if (parseFloat(ticket.pagoUSD) > 0) t += "• Divisa Efectivo: $" + ticket.pagoUSD + "\n";
      if (parseFloat(ticket.pagoPM) > 0)  t += "• Pago Móvil:      Bs. " + ticket.pagoPM + "\n";
      if (parseFloat(ticket.pagoPunto) > 0) t += "• Punto Débito:    Bs. " + ticket.pagoPunto + "\n";
      if (parseFloat(ticket.vueltoBS) > 0)  t += "• VUELTO:          Bs. " + ticket.vueltoBS + " ($" + ticket.vueltoUSD + ")\n";
    }

    t += "--------------------------------\n";
    t += "Revise su mercancía.\n¡Gracias por su preferencia!\n";

    const codigoBloque = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
    const mensajeCompleto = codigoBloque + "\n" + t + codigoBloque;
    
    const telefono = ticket.cliente?.telefono ? ticket.cliente.telefono.replace(/\D/g, '') : '';
    const url = telefono 
      ? "https://wa.me/" + telefono + "?text=" + encodeURIComponent(mensajeCompleto)
      : "https://wa.me/?text=" + encodeURIComponent(mensajeCompleto);
      
    window.open(url, '_blank');
  };

  const qrDato = "FACTURA:" + ticket.id + "|CLIENTE:" + (ticket.cliente?.doc || '') + "|TOTAL_BS:" + ticket.totalBS + "|FECHA:" + ticket.fecha;
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=" + encodeURIComponent(qrDato);

  return (
    <div style={stylesTicket.overlay} translate="no">
      <div style={stylesTicket.modal}>
        <div style={stylesTicket.headerModal} className="no-print">
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#111' }}>
            {ticket.esCredito ? 'Ticket Venta a Crédito' : 'Factura Emitida'}
          </span>
          <button type="button" onClick={alCerrar} style={stylesTicket.btnCerrar}>
            <X size={20} />
          </button>
        </div>

        <div style={stylesTicket.papelTermico} id="area-ticket-impresion" translate="no">
          <div style={stylesTicket.centro}>
            <h2 style={stylesTicket.nombreComercio}>COMERCIALIZADORA POS C.A.</h2>
            <p style={stylesTicket.textoEmpresa}>RIF: J-41235678-0</p>
            <p style={stylesTicket.textoEmpresa}>Av. Principal El Hatillo, Caracas</p>
            <p style={stylesTicket.textoEmpresa}>Teléfono: (0212) 961-0000</p>
            <p style={stylesTicket.tituloDoc}>{ticket.esCredito ? 'COMPROBANTE DE VENTA A CRÉDITO' : 'FACTURA / TICKET DE CAJA'}</p>
            <div style={stylesTicket.lineaDoble}>================================</div>
          </div>

          <div style={stylesTicket.bloqueInfo}>
            <div style={stylesTicket.filaDato}>
              <span>COMPROBANTE Nº:</span>
              <strong style={{ fontFamily: 'monospace' }}>000-{ticket.id}</strong>
            </div>
            <div style={stylesTicket.filaDato}>
              <span>FECHA / HORA:</span>
              <span>{ticket.fecha}</span>
            </div>
            <div style={stylesTicket.filaDato}>
              <span>CLIENTE:</span>
              <strong>{ticket.cliente?.nombre || 'Consumidor Final'}</strong>
            </div>
            <div style={stylesTicket.filaDato}>
              <span>C.I. / RIF:</span>
              <span>{ticket.cliente?.doc || 'V-00000000'}</span>
            </div>
            <div style={stylesTicket.filaDato}>
              <span>CONDICIÓN:</span>
              <strong style={{ color: ticket.esCredito ? '#e65100' : '#000' }}>
                {ticket.esCredito ? 'A CRÉDITO (FIADO)' : 'CONTADO'}
              </strong>
            </div>
          </div>

          <div style={stylesTicket.lineaDoble}>================================</div>

          <div style={stylesTicket.cabeceraTabla}>
            <span style={{ width: '35px' }}>CANT</span>
            <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
            <span style={{ width: '55px', textAlign: 'right' }}>TOTAL $</span>
          </div>

          <div style={stylesTicket.lineaSimple}>--------------------------------</div>

          <div style={stylesTicket.cuerpoTabla}>
            {ticket.items.map((it) => (
              <div key={it.id} style={stylesTicket.filaProducto}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ width: '35px', fontWeight: 'bold' }}>{it.cantidad}</span>
                  <span style={{ flex: 1, paddingRight: '4px' }}>{it.nombre}</span>
                  <span style={{ width: '55px', textAlign: 'right', fontWeight: 'bold' }}>
                    ${(it.precioUSD * it.cantidad).toFixed(2)}
                  </span>
                </div>
                <div style={stylesTicket.subPrecioFila}>
                  P.Unit: ${it.precioUSD.toFixed(2)} | Bs. {(it.precioUSD * parseFloat(ticket.tasa)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div style={stylesTicket.lineaSimple}>--------------------------------</div>

          <div style={stylesTicket.seccionTotales}>
            <div style={stylesTicket.filaGranTotal}>
              <span>TOTAL ORDEN ($):</span>
              <span>${ticket.totalUSD}</span>
            </div>

            <div style={stylesTicket.filaGranTotalBs}>
              <span translate="no">TOTAL BOLÍVARES:</span>
              <span translate="no">Bs. {ticket.totalBS}</span>
            </div>

            <div style={stylesTicket.filaTasaInfo}>
              <span>Tasa Cambio Oficial BCV:</span>
              <span>Bs. {ticket.tasa}</span>
            </div>
          </div>

          <div style={stylesTicket.lineaDoble}>================================</div>

          {ticket.esCredito ? (
            <div style={stylesTicket.seccionPagos}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '0.75rem', color: '#e65100' }}>
                ESTADO DEL CRÉDITO:
              </div>
              <div style={stylesTicket.filaDato}>
                <span>Abono Efectivo Divisa:</span>
                <strong>${ticket.pagoUSD}</strong>
              </div>
              <div style={stylesTicket.filaDato}>
                <span>Abono Bolívares (PM/Punto):</span>
                <strong>Bs. {(parseFloat(ticket.pagoPM) + parseFloat(ticket.pagoPunto)).toFixed(2)}</strong>
              </div>
              <div style={{ ...stylesTicket.filaDato, backgroundColor: '#ffebee', padding: '4px', marginTop: '4px' }}>
                <strong style={{ color: '#c62828' }}>RESTA POR PAGAR:</strong>
                <strong style={{ color: '#c62828' }}>${ticket.saldoDeudaUSD} (Bs. {ticket.saldoDeudaBS})</strong>
              </div>
            </div>
          ) : (
            <div style={stylesTicket.seccionPagos}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '0.72rem' }}>PAGADO POR CLIENTE:</div>
              {parseFloat(ticket.pagoUSD) > 0 && (
                <div style={stylesTicket.filaDato}>
                  <span>- Efectivo Divisa ($):</span>
                  <strong>${ticket.pagoUSD}</strong>
                </div>
              )}
              {parseFloat(ticket.pagoPM) > 0 && (
                <div style={stylesTicket.filaDato}>
                  <span>- Pago Móvil:</span>
                  <strong>Bs. {ticket.pagoPM}</strong>
                </div>
              )}
              {parseFloat(ticket.pagoPunto) > 0 && (
                <div style={stylesTicket.filaDato}>
                  <span>- Punto Débito:</span>
                  <strong>Bs. {ticket.pagoPunto}</strong>
                </div>
              )}
              {parseFloat(ticket.vueltoBS) > 0 && (
                <div style={{ ...stylesTicket.filaDato, backgroundColor: '#f1f1f1', padding: '3px 4px', marginTop: '4px' }}>
                  <strong style={{ color: '#000' }}>VUELTO ENTREGADO:</strong>
                  <strong>Bs. {ticket.vueltoBS} (${ticket.vueltoUSD})</strong>
                </div>
              )}
            </div>
          )}

          <div style={stylesTicket.centro}>
            <div style={{ margin: '10px 0 4px 0' }}>
              <img src={qrUrl} alt="QR Factura" style={{ width: '95px', height: '95px' }} />
            </div>
            <p style={{ margin: '2px 0', fontSize: '0.68rem', fontWeight: 'bold' }}>NO FISCAL - COPIA CLIENTE</p>
            <p style={{ margin: '2px 0', fontSize: '0.62rem', color: '#444' }}>Revise su mercancía antes de retirarse.</p>
            <p style={{ margin: '2px 0', fontSize: '0.65rem' }}>¡GRACIAS POR SU COMPRA!</p>
          </div>
        </div>

        <div style={stylesTicket.acciones} className="no-print">
          <button type="button" onClick={imprimir} style={stylesTicket.btnImprimir}>
            <Printer size={18} /> Imprimir / PDF
          </button>
          <button type="button" onClick={compartirWhatsApp} style={stylesTicket.btnWhatsapp}>
            <Share2 size={18} /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

const stylesTicket = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 10000, padding: '16px',
  },
  modal: {
    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px',
    padding: '16px', display: 'flex', flexDirection: 'column', maxHeight: '92vh',
  },
  headerModal: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',
  },
  btnCerrar: {
    background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer',
    width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  papelTermico: {
    backgroundColor: '#fff', padding: '14px 12px', border: '1px solid #ddd',
    borderRadius: '4px', fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.78rem', color: '#000', overflowY: 'auto', lineHeight: '1.25',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
  },
  centro: { textAlign: 'center' },
  nombreComercio: { margin: '0 0 3px 0', fontSize: '1rem', fontWeight: 'bold' },
  textoEmpresa: { margin: '1px 0', fontSize: '0.7rem' },
  tituloDoc: { margin: '6px 0 2px 0', fontSize: '0.82rem', fontWeight: 'bold' },
  lineaDoble: { textAlign: 'center', fontSize: '0.75rem', letterSpacing: '-1px', margin: '4px 0' },
  lineaSimple: { textAlign: 'center', fontSize: '0.75rem', letterSpacing: '-1px', margin: '4px 0' },
  bloqueInfo: { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' },
  filaDato: { display: 'flex', justifyContent: 'space-between' },
  cabeceraTabla: { display: 'flex', fontWeight: 'bold', fontSize: '0.72rem', marginTop: '4px' },
  cuerpoTabla: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filaProducto: { display: 'flex', flexDirection: 'column', fontSize: '0.75rem' },
  subPrecioFila: { fontSize: '0.65rem', color: '#555', paddingLeft: '35px' },
  seccionTotales: { display: 'flex', flexDirection: 'column', gap: '3px' },
  filaGranTotal: { display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 'bold' },
  filaGranTotalBs: {
    display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 'bold',
    backgroundColor: '#000', color: '#fff', padding: '3px 6px', borderRadius: '3px', margin: '4px 0'
  },
  filaTasaInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#333' },
  seccionPagos: { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem', margin: '4px 0' },
  acciones: { display: 'flex', gap: '8px', marginTop: '12px' },
  btnImprimir: {
    flex: 1, padding: '12px', backgroundColor: '#0052cc', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer',
  },
  btnWhatsapp: {
    flex: 1, padding: '12px', backgroundColor: '#25d366', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer',
  },
};

function ModuloInventario({ productos, alGuardarProducto, alEliminarProducto, alVolver }) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [prodEditandoId, setProdEditandoId] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [precioUSD, setPrecioUSD] = useState('');
  const [stock, setStock] = useState('');
  const [imagen, setImagen] = useState('');
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const fileInputRef = useRef(null);

  const iniciarNuevo = () => {
    setModoEdicion(true);
    setProdEditandoId(null);
    setCodigo('');
    setNombre('');
    setPrecioUSD('');
    setStock('');
    setImagen('');
  };

  const iniciarEditar = (prod) => {
    setModoEdicion(true);
    setProdEditandoId(prod.id);
    setCodigo(prod.codigo);
    setNombre(prod.nombre);
    setPrecioUSD(prod.precioUSD);
    setStock(prod.stock || 0);
    setImagen(prod.imagen || '');
  };

  const cancelar = () => {
    setModoEdicion(false);
    setProdEditandoId(null);
  };

  const manejarSeleccionImagen = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImagen(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim() || !precioUSD) {
      alert('Completa Código, Nombre y Precio');
      return;
    }

    alGuardarProducto({
      id: prodEditandoId || Date.now(),
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      precioUSD: parseFloat(precioUSD) || 0,
      stock: parseInt(stock) || 0,
      imagen: imagen || '',
    });

    cancelar();
  };

  return (
    <div style={stylesInv.contenedor} translate="no">
      <header style={stylesInv.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={stylesInv.btnBack}>
            <ArrowLeft color="#333" size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#111' }}>Inventario de Productos</h2>
        </div>
        {!modoEdicion && (
          <button type="button" onClick={iniciarNuevo} style={stylesInv.btnNuevo}>
            <Plus size={16} /> Nuevo
          </button>
        )}
      </header>

      {modoEdicion ? (
        <form onSubmit={guardar} style={stylesInv.formulario}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0052cc' }}>
            {prodEditandoId ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </h3>

          <div style={stylesInv.seccionImagen}>
            <div 
              style={stylesInv.cajaPreview} 
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
            >
              {imagen ? (
                <img src={imagen} alt="Preview" style={stylesInv.previewImg} />
              ) : (
                <div style={stylesInv.placeholderImg}>
                  <ImageIcon color="#888" size={26} />
                  <span style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px' }}>Subir o Tomar Foto</span>
                </div>
              )}
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={manejarSeleccionImagen} 
              style={{ display: 'none' }} 
            />
            {imagen && (
              <button 
                type="button" 
                onClick={() => setImagen('')} 
                style={stylesInv.btnQuitarFoto}
              >
                Quitar foto
              </button>
            )}
          </div>

          <div style={stylesInv.campo}>
            <label style={stylesInv.label}>Código de Barras:</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Escanea o escribe..."
                style={stylesInv.input}
                required
              />
              <button
                type="button"
                onClick={() => setCamaraAbierta(true)}
                style={stylesInv.btnEscanear}
                title="Escanear con cámara"
              >
                <Camera size={18} />
              </button>
            </div>
          </div>

          <div style={stylesInv.campo}>
            <label style={stylesInv.label}>Nombre del Producto:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Harina PAN"
              style={stylesInv.input}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ ...stylesInv.campo, flex: 1 }}>
              <label style={stylesInv.label}>Precio ($):</label>
              <input
                type="number"
                step="any"
                value={precioUSD}
                onChange={(e) => setPrecioUSD(e.target.value)}
                placeholder="0.00"
                style={stylesInv.input}
                required
              />
            </div>
            <div style={{ ...stylesInv.campo, flex: 1 }}>
              <label style={stylesInv.label}>Stock Disponible:</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                style={stylesInv.input}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={cancelar} style={stylesInv.btnCancelar}>
              Cancelar
            </button>
            <button type="submit" style={stylesInv.btnGuardar}>
              Guardar Producto
            </button>
          </div>

          <ScannerModal 
            abierto={camaraAbierta} 
            alDetectar={(cod) => setCodigo(cod)}
            alCerrar={() => setCamaraAbierta(false)}
          />
        </form>
      ) : (
        <div style={stylesInv.lista}>
          {productos.map((p) => (
            <div key={p.id} style={stylesInv.itemCard}>
              {p.imagen ? (
                <img src={p.imagen} alt={p.nombre} style={stylesInv.thumbMini} />
              ) : (
                <div style={stylesInv.thumbVacio}>
                  <Package color="#aaa" size={18} />
                </div>
              )}
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <strong style={{ fontSize: '0.92rem', color: '#111' }}>{p.nombre}</strong>
                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                  Código: <span style={{ fontFamily: 'monospace', color: '#0052cc', fontWeight: 'bold' }}>{p.codigo}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#28a745', fontWeight: 'bold', marginTop: '2px' }}>
                  Precio: ${p.precioUSD.toFixed(2)} | Stock: {p.stock || 0} unid.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => iniciarEditar(p)} style={stylesInv.btnAccionEdit}>
                  <Edit color="#0052cc" size={16} />
                </button>
                <button type="button" onClick={() => alEliminarProducto(p.id)} style={stylesInv.btnAccionDelete}>
                  <Trash2 color="#de350b" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const stylesInv = {
  contenedor: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    backgroundColor: '#f4f6f8', fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    padding: '14px 16px', backgroundColor: '#fff', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e4e8',
  },
  btnBack: {
    background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnNuevo: {
    display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#0052cc',
    color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px',
    fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
  },
  lista: { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  itemCard: {
    backgroundColor: '#fff', padding: '12px 14px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  thumbMini: { width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' },
  thumbVacio: {
    width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f0f2f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnAccionEdit: {
    background: '#e6f0ff', border: 'none', borderRadius: '8px', padding: '8px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnAccionDelete: {
    background: '#ffebe6', border: 'none', borderRadius: '8px', padding: '8px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  formulario: {
    padding: '16px', backgroundColor: '#fff', margin: '14px',
    borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
  },
  seccionImagen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px',
  },
  cajaPreview: {
    width: '84px', height: '84px', borderRadius: '12px', border: '2px dashed #ccd0d5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    overflow: 'hidden', backgroundColor: '#fafbfc',
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholderImg: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '6px' },
  btnQuitarFoto: {
    background: 'none', border: 'none', color: '#de350b', fontSize: '0.75rem',
    fontWeight: 'bold', marginTop: '6px', cursor: 'pointer',
  },
  campo: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' },
  label: { fontSize: '0.8rem', fontWeight: 'bold', color: '#444' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '10px',
    borderRadius: '8px', border: '1px solid #ced4da', fontSize: '0.95rem', outline: 'none',
  },
  btnEscanear: {
    backgroundColor: '#20c997', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '0 12px', cursor: 'pointer',
  },
  btnCancelar: {
    flex: 1, padding: '12px', border: '1px solid #ccc', background: '#f8f9fa',
    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
  },
  btnGuardar: {
    flex: 2, padding: '12px', border: 'none', background: '#28a745',
    color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
  },
};

export default function App() {
  const [vistaActual, setVistaActual] = useState('pos');
  
  const [productos, setProductos] = useState(() => {
    try {
      const guardados = localStorage.getItem('pos_productos_v19');
      if (guardados) return JSON.parse(guardados);
    } catch (e) {}
    return PRODUCTOS_INICIALES;
  });

  const [clientes, setClientes] = useState(() => {
    try {
      const guardados = localStorage.getItem('pos_clientes_v19');
      if (guardados) return JSON.parse(guardados);
    } catch (e) {}
    return CLIENTES_INICIALES;
  });

  const [transacciones, setTransacciones] = useState(() => {
    try {
      const guardadas = localStorage.getItem('pos_transacciones_v19');
      if (guardadas) return JSON.parse(guardadas);
    } catch (e) {}
    return [];
  });

  const [clienteActual, setClienteActual] = useState({
    doc: 'V-00000000',
    nombre: 'Consumidor Final',
    telefono: '',
    saldoPendienteUSD: 0
  });

  const [tasaCambio, setTasaCambio] = useState(45.50);
  const [carrito, setCarrito] = useState([]);
  const [busquedaInput, setBusquedaInput] = useState('');
  const [mostrarPredictivo, setMostrarPredictivo] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [ticketActual, setTicketActual] = useState(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('pos_productos_v19', JSON.stringify(productos));
    } catch (e) {}
  }, [productos]);

  useEffect(() => {
    try {
      localStorage.setItem('pos_clientes_v19', JSON.stringify(clientes));
    } catch (e) {}
  }, [clientes]);

  useEffect(() => {
    try {
      localStorage.setItem('pos_transacciones_v19', JSON.stringify(transacciones));
    } catch (e) {}
  }, [transacciones]);

  const obtenerTasaBCV = async () => {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        if (data.promedio) {
          setTasaCambio(data.promedio);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    obtenerTasaBCV();
  }, []);

  useEffect(() => {
    function handleClickAfuera(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMostrarPredictivo(false);
      }
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const agregarProductoAlCarrito = (prod) => {
    setCarrito((actual) => {
      const existe = actual.find((item) => item.id === prod.id);
      if (existe) {
        return actual.map((item) =>
          item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...actual, { ...prod, cantidad: 1 }];
    });
    setBusquedaInput('');
    setMostrarPredictivo(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const procesarBusquedaOEnter = (e) => {
    if (e) e.preventDefault();
    const limpio = busquedaInput.trim().toLowerCase();
    if (!limpio) return;

    const coincidenciaExactaCodigo = productos.find(p => p.codigo === busquedaInput.trim());
    if (coincidenciaExactaCodigo) {
      agregarProductoAlCarrito(coincidenciaExactaCodigo);
      return;
    }

    const coincidenciaNombre = productos.find(p => p.nombre.toLowerCase().includes(limpio) || p.codigo.includes(limpio));
    if (coincidenciaNombre) {
      agregarProductoAlCarrito(coincidenciaNombre);
    } else {
      alert('Producto o código "' + busquedaInput + '" no encontrado.');
    }
  };

  const productosSugeridos = busquedaInput.trim().length > 0 
    ? productos.filter(p => 
        p.nombre.toLowerCase().includes(busquedaInput.trim().toLowerCase()) || 
        p.codigo.includes(busquedaInput.trim())
      ).slice(0, 5)
    : [];

  const actualizarCantidad = (id, delta) => {
    setCarrito((actual) =>
      actual
        .map((item) => {
          if (item.id === id) {
            const nueva = item.cantidad + delta;
            return nueva > 0 ? { ...item, cantidad: nueva } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setClienteActual({ doc: 'V-00000000', nombre: 'Consumidor Final', telefono: '', saldoPendienteUSD: 0 });
  };

  const tasaNum = parseFloat(tasaCambio) || 0;
  const totalUSD = carrito.reduce((acc, p) => acc + (p.precioUSD * p.cantidad), 0);
  const totalBS = totalUSD * tasaNum;

  const guardarClienteEnDB = (nuevoCliente) => {
    setClientes((actuales) => {
      const nTarget = normalizarDoc(nuevoCliente.doc);
      const index = actuales.findIndex(c => normalizarDoc(c.doc) === nTarget);
      if (index >= 0) {
        const actualizados = [...actuales];
        actualizados[index] = { ...actualizados[index], ...nuevoCliente };
        return actualizados;
      }
      return [...actuales, { id: Date.now(), saldoPendienteUSD: 0, ...nuevoCliente }];
    });
  };

  const registrarAbonoCliente = (clienteObj, montoAbonadoUSD, desglose) => {
    const nuevoSaldo = Math.max(0, (clienteObj.saldoPendienteUSD || 0) - montoAbonadoUSD);

    setClientes((actuales) => {
      return actuales.map(c => {
        if (c.id === clienteObj.id) {
          return { ...c, saldoPendienteUSD: nuevoSaldo };
        }
        return c;
      });
    });

    setTransacciones((prev) => [
      {
        id: Date.now(),
        tipo: 'abono',
        cliente: clienteObj.nombre,
        doc: clienteObj.doc,
        fecha: new Date().toLocaleString('es-VE'),
        pagoUSD: desglose.pagoUSD,
        pagoPM: desglose.pagoPM,
        pagoPunto: desglose.pagoPunto,
        totalAbonoUSD: montoAbonadoUSD
      },
      ...prev
    ]);

    if (clienteObj.telefono) {
      let t = "*COMPROBANTE DE ABONO*\n";
      t += "COMERCIALIZADORA POS C.A.\n";
      t += "--------------------------------\n";
      t += "Cliente:    " + clienteObj.nombre + "\n";
      t += "Doc:        " + clienteObj.doc + "\n";
      t += "Fecha/Hora: " + new Date().toLocaleString('es-VE') + "\n";
      t += "Tasa BCV:   Bs. " + tasaCambio.toFixed(2) + "\n";
      t += "--------------------------------\n";
      t += "MONTO ABONADO:  $" + montoAbonadoUSD.toFixed(2) + "\n";
      t += "En Bolívares:   Bs. " + (montoAbonadoUSD * tasaNum).toFixed(2) + "\n";
      t += "--------------------------------\n";
      t += "*SALDO RESTANTE:* $" + nuevoSaldo.toFixed(2) + "\n";
      t += "En Bolívares:   Bs. " + (nuevoSaldo * tasaNum).toFixed(2) + "\n";
      t += "--------------------------------\n";
      t += "¡Gracias por su pago puntual!\n";

      const b = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
      const msg = b + "\n" + t + b;
      const telf = clienteObj.telefono.replace(/\D/g, '');
      window.open("https://wa.me/" + telf + "?text=" + encodeURIComponent(msg), '_blank');
    }
  };

  const finalizarVenta = (datos) => {
    const idTicket = Math.floor(100000 + Math.random() * 900000);

    const nuevoTicket = {
      id: idTicket,
      items: [...carrito],
      ...datos
    };

    setTransacciones((prev) => [
      {
        id: idTicket,
        tipo: 'venta',
        ...datos
      },
      ...prev
    ]);

    if (datos.esCredito && parseFloat(datos.saldoDeudaUSD) > 0) {
      setClientes((actuales) => {
        const nTarget = normalizarDoc(datos.cliente.doc);
        const index = actuales.findIndex(c => normalizarDoc(c.doc) === nTarget);
        const incremento = parseFloat(datos.saldoDeudaUSD);
        if (index >= 0) {
          const actualizados = [...actuales];
          const saldoAnterior = actualizados[index].saldoPendienteUSD || 0;
          actualizados[index] = { 
            ...actualizados[index], 
            saldoPendienteUSD: saldoAnterior + incremento 
          };
          return actualizados;
        }
        return [...actuales, { id: Date.now(), ...datos.cliente, saldoPendienteUSD: incremento }];
      });
    }

    setProductos((prodsActuales) => {
      return prodsActuales.map((p) => {
        const itemVendido = carrito.find((item) => item.id === p.id);
        if (itemVendido) {
          const nuevoStock = Math.max(0, (p.stock || 0) - itemVendido.cantidad);
          return { ...p, stock: nuevoStock };
        }
        return p;
      });
    });

    limpiarCarrito();
    setModalCobroAbierto(false);
    setTicketActual(nuevoTicket);
  };

  const cerrarTurnoCaja = () => {
    setTransacciones([]);
    try {
      localStorage.removeItem('pos_transacciones_v19');
    } catch (e) {}
    alert('Turno cerrado exitosamente. Los contadores de caja han quedado en cero para el nuevo turno.');
    setVistaActual('pos');
  };

  const guardarProducto = (productoForm) => {
    setProductos((actual) => {
      const existe = actual.some((p) => p.id === productoForm.id);
      if (existe) {
        return actual.map((p) => p.id === productoForm.id ? productoForm : p);
      }
      return [...actual, productoForm];
    });
  };

  const eliminarProducto = (id) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    setProductos((actual) => actual.filter((p) => p.id !== id));
    setCarrito((actual) => actual.filter((item) => item.id !== id));
  };

  if (vistaActual === 'inventario') {
    return (
      <ModuloInventario 
        productos={productos}
        alEliminarProducto={eliminarProducto} 
        alGuardarProducto={guardarProducto} 
        alVolver={() => setVistaActual('pos')} 
      />
    );
  }

  if (vistaActual === 'creditos') {
    return (
      <ModuloCreditos 
        clientes={clientes}
        tasaCambio={tasaCambio}
        alRegistrarAbono={registrarAbonoCliente}
        alVolver={() => setVistaActual('pos')}
      />
    );
  }

  if (vistaActual === 'caja') {
    return (
      <ModuloCaja 
        transacciones={transacciones}
        tasaCambio={tasaCambio}
        alCerrarTurno={cerrarTurnoCaja}
        alVolver={() => setVistaActual('pos')}
      />
    );
  }

  const clientesMorosos = clientes.filter(c => (c.saldoPendienteUSD || 0) > 0.01).length;

  const clienteEncontrado = clientes.find(c => {
    const cDoc = normalizarDoc(c.doc);
    const currDoc = normalizarDoc(clienteActual.doc);
    return cDoc === currDoc || (currDoc.length >= 6 && (cDoc.endsWith(currDoc) || currDoc.endsWith(cDoc)));
  });
  const saldoActualMostrador = clienteEncontrado ? (clienteEncontrado.saldoPendienteUSD || 0) : (clienteActual.saldoPendienteUSD || 0);

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Punto de Venta POS</h1>
          <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={() => setVistaActual('inventario')} 
              style={styles.btnIrInventario}
            >
              <Package size={13} /> Inventario
            </button>
            <button 
              type="button"
              onClick={() => setVistaActual('creditos')} 
              style={{ ...styles.btnIrInventario, backgroundColor: clientesMorosos > 0 ? '#fff3e0' : '#e6f0ff', color: clientesMorosos > 0 ? '#e65100' : '#0052cc' }}
            >
              <BookOpen size={13} /> Créditos {clientesMorosos > 0 ? `(${clientesMorosos})` : ''}
            </button>
            <button 
              type="button"
              onClick={() => setVistaActual('caja')} 
              style={{ ...styles.btnIrInventario, backgroundColor: '#e8f5e9', color: '#2e7d32' }}
            >
              <Wallet size={13} /> Caja / Arqueo
            </button>
          </div>
        </div>
        <div style={styles.boxTasa}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#555' }}>Tasa BCV (Bs):</span>
            <button 
              type="button"
              onClick={obtenerTasaBCV} 
              style={styles.btnSyncTasa} 
              title="Actualizar tasa del BCV"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <input
            type="number"
            step="any"
            value={tasaCambio}
            onChange={(e) => setTasaCambio(e.target.value)}
            style={styles.inputTasa}
          />
        </div>
      </header>

      <section style={styles.barraClienteMostrador}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          <User color="#0052cc" size={16} />
          <input
            type="text"
            placeholder="Cédula cliente (ej: 24808845)..."
            value={clienteActual.doc === 'V-00000000' ? '' : clienteActual.doc}
            onChange={(e) => {
              const valor = e.target.value;
              const inLimpio = normalizarDoc(valor);
              const encontrado = clientes.find(c => {
                const cLimpio = normalizarDoc(c.doc);
                return cLimpio === inLimpio || (inLimpio.length >= 6 && (cLimpio.endsWith(inLimpio) || inLimpio.endsWith(cLimpio)));
              });

              if (encontrado) {
                setClienteActual({ ...encontrado });
              } else {
                setClienteActual(prev => ({ 
                  ...prev, 
                  doc: valor, 
                  nombre: valor ? 'Cliente Nuevo' : 'Consumidor Final', 
                  saldoPendienteUSD: 0 
                }));
              }
            }}
            style={styles.inputDocMostrador}
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={styles.nombreClienteTag}>
            {clienteActual.nombre}
          </span>
          {saldoActualMostrador > 0 && (
            <div style={{ fontSize: '0.68rem', color: '#c62828', fontWeight: 'bold' }}>
              Debe: ${saldoActualMostrador.toFixed(2)}
            </div>
          )}
        </div>
      </section>

      <section style={styles.seccionBuscador}>
        <div ref={wrapperRef} style={{ position: 'relative', flex: 1, display: 'flex', gap: '6px' }}>
          <form onSubmit={procesarBusquedaOEnter} style={{ display: 'flex', flex: 1, gap: '6px' }}>
            <div style={styles.inputIconWrapper}>
              <Search color="#666" size={18} style={styles.iconoInput} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribe nombre o código..."
                value={busquedaInput}
                onChange={(e) => {
                  setBusquedaInput(e.target.value);
                  setMostrarPredictivo(true);
                }}
                onFocus={() => setMostrarPredictivo(true)}
                style={styles.inputBuscador}
              />
            </div>
            <button type="submit" style={styles.btnAgregar}>
              Ingresar
            </button>
          </form>

          {mostrarPredictivo && productosSugeridos.length > 0 && (
            <div style={styles.dropdownPredictivo}>
              {productosSugeridos.map(p => (
                <div
                  key={p.id}
                  onClick={() => agregarProductoAlCarrito(p)}
                  style={styles.itemPredictivo}
                >
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#111' }}>{p.nombre}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>Cód: {p.codigo} | Stock: {p.stock || 0}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#28a745' }}>${p.precioUSD.toFixed(2)}</span>
                    <small style={{ display: 'block', fontSize: '0.68rem', color: '#555' }}>Bs. {(p.precioUSD * tasaNum).toFixed(2)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCamaraAbierta(true)}
          style={styles.btnCamara}
        >
          <Camera size={19} />
          <span style={{ fontSize: '0.8rem', marginLeft: '5px', fontWeight: '600' }}>Cámara</span>
        </button>
      </section>

      <main style={styles.seccionCarrito}>
        {carrito.length === 0 ? (
          <div style={styles.carritoVacio}>
            <Barcode color="#ccd0d5" size={54} />
            <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>La caja está vacía. Escanea o busca un producto.</p>
          </div>
        ) : (
          <div style={styles.listaItems}>
            {carrito.map((item) => {
              const subtotalUSD = item.precioUSD * item.cantidad;
              const subtotalBS = subtotalUSD * tasaNum;

              return (
                <div key={item.id} style={styles.itemFila}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} style={styles.thumbCarrito} />
                  ) : null}

                  <div style={styles.infoProd}>
                    <strong style={{ fontSize: '0.9rem', color: '#222' }}>{item.nombre}</strong>
                    <span style={styles.precioUnitario}>
                      ${item.precioUSD.toFixed(2)} | Bs. {(item.precioUSD * tasaNum).toFixed(2)}
                    </span>
                  </div>

                  <div style={styles.controlesCantidad}>
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, -1)}
                      style={styles.btnCant}
                    >
                      <Minus color="#333" size={14} />
                    </button>
                    <span style={styles.cantTexto}>{item.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, 1)}
                      style={styles.btnCant}
                    >
                      <Plus color="#333" size={14} />
                    </button>
                  </div>

                  <div style={styles.subtotalItem}>
                    <strong style={{ fontSize: '0.95rem', color: '#111' }}>
                      ${subtotalUSD.toFixed(2)}
                    </strong>
                    <small style={{ color: '#666', fontSize: '0.75rem' }}>
                      Bs. {subtotalBS.toFixed(2)}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <div style={styles.filaTotales}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>Total en Bolívares:</span>
            <div style={styles.totalBs}>Bs. {totalBS.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>Total Divisa:</span>
            <div style={styles.totalUsd}>${totalUSD.toFixed(2)}</div>
          </div>
        </div>

        <div style={styles.botonesAccion}>
          <button type="button" onClick={limpiarCarrito} style={styles.btnLimpiar} title="Vaciar Carrito">
            <Trash2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (carrito.length === 0) return alert('El carrito está vacío');
              setModalCobroAbierto(true);
            }}
            style={styles.btnCobrar}
          >
            <DollarSign size={20} />
            Cobrar Orden
          </button>
        </div>
      </footer>

      <ScannerModal 
        abierto={camaraAbierta} 
        alDetectar={(codigo) => {
          const prod = productos.find(p => p.codigo === codigo.trim());
          if (prod) {
            agregarProductoAlCarrito(prod);
          } else {
            alert('Código "' + codigo + '" no encontrado.');
          }
        }}
        alCerrar={() => setCamaraAbierta(false)}
      />

      <ModalCobro 
        abierto={modalCobroAbierto} 
        alCerrar={() => setModalCobroAbierto(false)}
        totalUSD={totalUSD.toFixed(2)}
        totalBS={totalBS.toFixed(2)}
        tasaCambio={tasaCambio}
        clienteActual={clienteActual}
        setClienteActual={setClienteActual}
        clientes={clientes}
        guardarClienteEnDB={guardarClienteEnDB}
        alFinalizarVenta={finalizarVenta}
      />

      <ModalTicket 
        ticket={ticketActual}
        alCerrar={() => setTicketActual(null)}
      />
    </div>
  );
}

const styles = {
  contenedor: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f4f6f8',
  },
  header: {
    padding: '12px 16px', backgroundColor: '#fff', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e4e8',
  },
  titulo: { margin: 0, fontSize: '1.05rem', color: '#111' },
  btnIrInventario: {
    background: '#e6f0ff', color: '#0052cc', border: 'none', borderRadius: '6px',
    padding: '5px 8px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '4px',
  },
  boxTasa: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' },
  btnSyncTasa: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
    display: 'flex', alignItems: 'center', color: '#0052cc',
  },
  inputTasa: {
    width: '85px', padding: '4px 6px', border: '1px solid #ccc', borderRadius: '6px',
    textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', outline: 'none',
  },
  barraClienteMostrador: {
    backgroundColor: '#fff', padding: '8px 16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', gap: '10px'
  },
  inputDocMostrador: {
    border: 'none', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px',
    fontSize: '0.82rem', fontWeight: 'bold', width: '170px', outline: 'none',
  },
  nombreClienteTag: {
    fontSize: '0.78rem', color: '#334155', fontWeight: '600', maxWidth: '140px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block'
  },
  seccionBuscador: {
    padding: '10px 16px', backgroundColor: '#fff', display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8',
  },
  inputIconWrapper: { position: 'relative', flex: 1 },
  iconoInput: { position: 'absolute', left: '10px', top: '10px' },
  inputBuscador: {
    width: '100%', boxSizing: 'border-box', padding: '9px 10px 9px 34px',
    border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.9rem', outline: 'none',
  },
  dropdownPredictivo: {
    position: 'absolute', top: '44px', left: 0, right: 0,
    backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 100, border: '1px solid #e1e4e8', overflow: 'hidden'
  },
  itemPredictivo: {
    padding: '8px 12px', borderBottom: '1px solid #f1f3f5', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
  },
  btnAgregar: {
    padding: '0 14px', backgroundColor: '#0052cc', color: '#fff', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
  },
  btnCamara: {
    display: 'flex', alignItems: 'center', backgroundColor: '#20c997', color: '#fff',
    border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer',
  },
  seccionCarrito: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  carritoVacio: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: '#888',
  },
  listaItems: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemFila: {
    backgroundColor: '#fff', padding: '10px 12px', borderRadius: '10px', display: 'flex',
    alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: '10px',
  },
  thumbCarrito: { width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' },
  infoProd: { display: 'flex', flexDirection: 'column', flex: 2 },
  precioUnitario: { fontSize: '0.75rem', color: '#666', marginTop: '2px' },
  controlesCantidad: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' },
  btnCant: {
    width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd',
    background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  cantTexto: { fontWeight: 'bold', fontSize: '0.95rem' },
  subtotalItem: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 },
  footer: {
    backgroundColor: '#fff', padding: '14px 16px 32px 16px', borderTop: '1px solid #e1e4e8',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
  },
  filaTotales: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  totalBs: { fontSize: '1.25rem', fontWeight: 'bold', color: '#0052cc' },
  totalUsd: { fontSize: '1.25rem', fontWeight: 'bold', color: '#28a745' },
  botonesAccion: { display: 'flex', gap: '10px' },
  btnLimpiar: {
    backgroundColor: '#ffebe6', border: 'none', color: '#de350b', borderRadius: '8px',
    padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnCobrar: {
    flex: 1, backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px', cursor: 'pointer',
  },
};
