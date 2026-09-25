import React, { useRef, useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Repeat } from 'lucide-react';

const FORMATOS_RETAIL = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.CODE_128
];

export default function ScannerModal({ abierto, alDetectar, alCerrar }) {
  const scannerRef = useRef(null);
  const corriendoRef = useRef(false);
  const [camarasTraseras, setCamarasTraseras] = useState([]);
  const [indiceCamara, setIndiceCamara] = useState(0);
  const [soportaFlash, setSoportaFlash] = useState(false);
  const [flashEncendido, setFlashEncendido] = useState(false);

  // Detener y liberar el hardware de video de forma segura
  const detenerScanner = async () => {
    if (scannerRef.current && corriendoRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      corriendoRef.current = false;
    }
  };

  const iniciarCamara = async (cameraId) => {
    await detenerScanner();

    try {
      const html5QrCode = new Html5Qrcode('lector-camara-nativo', { 
        formatsToSupport: FORMATOS_RETAIL, 
        verbose: false 
      });
      scannerRef.current = html5QrCode;

      const configLente = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        configLente,
        {
          fps: 15,
          qrbox: { width: 250, height: 160 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          const limpio = decodedText.trim();
          if (limpio.length >= 4) {
            detenerScanner().then(() => {
              alDetectar(limpio);
              alCerrar();
            });
          }
        },
        () => {}
      );

      corriendoRef.current = true;

      // Verificar soporte de linterna sin bloquear ejecución
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setSoportaFlash(true);
        } else {
          setSoportaFlash(false);
        }
      } catch (e) {
        setSoportaFlash(false);
      }

    } catch (err) {
      corriendoRef.current = false;
    }
  };

  useEffect(() => {
    if (!abierto) return;

    let montado = true;

    Html5Qrcode.getCameras().then((dispositivos) => {
      if (!montado) return;

      if (dispositivos && dispositivos.length > 0) {
        // Filtrar exclusivamente lentes traseras principales y descartar frontales
        const traseras = dispositivos.filter(d => {
          const label = (d.label || '').toLowerCase();
          return !label.includes('front') && !label.includes('delantera') && !label.includes('selfie') && !label.includes('user');
        });

        const listaFinal = traseras.length > 0 ? traseras : dispositivos;
        setCamarasTraseras(listaFinal);
        setIndiceCamara(0);
        iniciarCamara(listaFinal[0].id);
      } else {
        iniciarCamara(null);
      }
    }).catch(() => {
      if (montado) iniciarCamara(null);
    });

    return () => {
      montado = false;
      detenerScanner();
    };
  }, [abierto]);

  const cambiarLente = () => {
    if (camarasTraseras.length <= 1) return;
    const siguiente = (indiceCamara + 1) % camarasTraseras.length;
    setIndiceCamara(siguiente);
    setFlashEncendido(false);
    iniciarCamara(camarasTraseras[siguiente].id);
  };

  const alternarFlash = async () => {
    if (!scannerRef.current || !corriendoRef.current) return;
    const nuevo = !flashEncendido;
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: nuevo }] });
      setFlashEncendido(nuevo);
    } catch (e) {}
  };

  const cerrarModal = async () => {
    await detenerScanner();
    alCerrar();
  };

  if (!abierto) return null;

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', fontWeight: 'bold' }}>
              Escanear Producto
            </h3>
            {soportaFlash && (
              <button 
                type="button" 
                onClick={alternarFlash} 
                style={{ ...styles.btnTool, backgroundColor: flashEncendido ? '#fef08a' : '#f1f5f9' }}
                title="Linterna"
              >
                <Zap size={14} color={flashEncendido ? '#a16207' : '#475569'} />
              </button>
            )}
            {camarasTraseras.length > 1 && (
              <button type="button" onClick={cambiarLente} style={styles.btnCam} title="Cambiar lente trasero">
                <Repeat size={13} /> Lente {indiceCamara + 1}
              </button>
            )}
          </div>
          <button type="button" onClick={cerrarModal} style={styles.btnCerrar}>
            <X size={18} color="#475569" />
          </button>
        </div>

        <div style={styles.visor}>
          <div id="lector-camara-nativo" style={{ width: '100%', height: '100%' }}></div>
        </div>

        <div style={styles.footerGuia}>
          Apunta al código de barras para detección automática
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000, padding: '16px' },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '14px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  btnTool: { border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px 9px', display: 'flex', alignItems: 'center' },
  btnCam: { display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#0052cc', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '5px 8px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  visor: { width: '100%', height: '260px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' },
  footerGuia: { textAlign: 'center', fontSize: '0.72rem', color: '#64748b', marginTop: '10px' }
};
