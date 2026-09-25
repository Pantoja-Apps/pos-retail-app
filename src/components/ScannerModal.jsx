import React, { useRef, useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Repeat } from 'lucide-react';

const FORMATOS_RETAIL = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A
];

export default function ScannerModal({ abierto, alDetectar, alCerrar }) {
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
    try {
      const html5QrCode = new Html5Qrcode('lector-camara-nativo', { formatsToSupport: FORMATOS_RETAIL, verbose: false });
      scannerRef.current = html5QrCode;
      const constraint = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      html5QrCode.start(
        constraint,
        { fps: 20, aspectRatio: 1.0, videoConstraints: { ...constraint, width: { ideal: 1280 }, height: { ideal: 720 } } },
        (decodedText) => {
          const limpio = decodedText.trim();
          if (limpio.length >= 8) {
            html5QrCode.stop().then(() => { alDetectar(limpio); alCerrar(); }).catch(() => { alDetectar(limpio); alCerrar(); });
          }
        },
        () => {}
      ).then(() => {
        try {
          const cap = html5QrCode.getRunningTrackCapabilities();
          if (cap && cap.torch) setSoportaFlash(true);
        } catch (e) {}
      }).catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    if (!abierto) return;
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        setCamaras(devices);
        arrancarCamara(devices[0].id);
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#111' }}>Escanear Código EAN-13</h3>
            {soportaFlash && (
              <button 
                type="button" 
                onClick={alternarFlash} 
                style={{ ...styles.btnTool, backgroundColor: flashEncendido ? '#ffeb3b' : '#f1f3f5' }}
              >
                <Zap size={14} color={flashEncendido ? '#000' : '#444'} />
              </button>
            )}
            {camaras.length > 1 && (
              <button type="button" onClick={cambiarLente} style={styles.btnCam}>
                <Repeat size={13} /> {indiceCamara + 1}
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
            style={styles.btnCerrar}
          >
            <X size={18} color="#333" />
          </button>
        </div>
        <div style={styles.visor}>
          <div id="lector-camara-nativo" style={{ width: '100%', height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  btnTool: { border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center' },
  btnCam: { display: 'flex', alignItems: 'center', gap: '3px', background: '#e6f0ff', color: '#0052cc', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCerrar: { background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  visor: { width: '100%', height: '280px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }
};
