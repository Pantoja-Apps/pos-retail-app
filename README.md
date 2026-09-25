# 🛒 Punto de Venta Retail POS (PWA & Web)

Sistema de Punto de Venta (**POS**) moderno, ligero y modular diseñado específicamente para el comercio minorista, minimarkets, bodegas y tiendas de conveniencia que operan en economías multimoneda (Dólares USD y Bolívares Bs.).

Desarrollado con **React**, **Vite** y **Lucide Icons**, optimizado para ejecutarse con máxima fluidez y diseño responsivo tanto en teléfonos móviles como en computadoras de escritorio.

---

## 🚀 Características Principales

### ⚡ 1. Mostrador de Ventas y Cobro Ágil (POS)
* **Buscador predictivo y por código de barras:** Reconocimiento instantáneo mediante teclado físico, lector USB/Bluetooth o búsqueda directa por nombre del producto.
* **Escáner por Cámara Integrado (`html5-qrcode`):** Lector de códigos de barra (EAN-13, EAN-8, UPC-A, Code 128) con filtro automático de lentes traseros y activación de linterna/flash en vivo.
* **Cuentas en Espera (Pausar y Reanudar):** Permite suspender la compra de un cliente para atender a otro en cola y reanudarla con un solo toque (incluye intercambio de carritos activos sin perder datos).
* **Multi-moneda en tiempo real:** Conversión bimonetaria constante (USD / Bs.) sincronizada con la tasa oficial del Banco Central de Venezuela (BCV) vía API, con opción de ajuste manual directo.

### 💳 2. Métodos de Pago Mixtos y Control de Vueltos
* Soporte nativo para 4 formas de pago simultáneas:
  * 💵 **Divisas ($)** (Efectivo USD)
  * 🇻🇪 **Efectivo Bolívares (Bs)**
  * 📲 **Pago Móvil (Bs)**
  * 💳 **Punto de Venta (Tarjeta de Débito Bs)**
* Asistente inteligente de importes rápidos (*Monto Exacto* y *Completar Resto*).
* Cálculo y deducción automática de **vueltos entregados** (en Bs y $) para evitar descuadres contables en la caja.

### 📖 3. Cuentas por Cobrar y Créditos (Libreta Fiada)
* Registro de compras a crédito vinculadas a la cédula/RIF y teléfono del cliente.
* **Estado de Cuenta Detallado:** Pestañas separadas para auditar compras fiadas pendientes y el historial permanente de abonos realizados.
* **Cobranza por WhatsApp:** Notificaciones estructuradas con recordatorio formal de deuda y comprobantes de abono generados al instante.

### 📦 4. Gestión Inteligente de Inventario y Márgenes
* **Asistente de Compra:** Entrada de mercancía por **Unidad** o por **Bulto/Caja** (calcula automáticamente el costo unitario según el número de piezas y multiplica el stock entrante).
* **Calculadora de Rentabilidad:** Sugerencia de precio de venta según la categoría del producto (Víveres, Bebidas, Chucherías, Higiene, Limpieza, Licores).
* **Régimen Fiscal:** Clasificación entre productos **Exentos** y productos gravados con **IVA (16%)**.
* **Reabastecimiento Inteligente:** Detección de productos existentes para sumar stock y actualizar costos sin duplicar registros.

### 📊 5. Cuadre y Cierre de Caja (Corte Z)
* Arqueo discriminado entre **Fondos Físicos en Gaveta** (Divisas $ y Efectivo Bs) y **Fondos Electrónicos en Banco** (Pago Móvil y Punto).
* Auditoría de **Vueltos Deducidos** para reflejar la disponibilidad líquida real en mano.
* Resumen de facturas cobradas, anuladas y créditos otorgados.
* Exportación e impresión térmica del reporte de cierre, con opción de envío directo por WhatsApp.

### 🧾 6. Comprobantes Térmicos y Personalización del Negocio
* **Tickets configurables:** Carga de logotipo comercial, nombre de la bodega, RIF/C.I., dirección física, teléfono de contacto y mensaje al pie del comprobante.
* Formato optimizado para impresión térmica (58mm y 80mm), copiado al portapapeles y compartición por WhatsApp en formato monospace alineado.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React 18 + Vite
* **Iconografía:** Lucide React
* **Lector de Códigos:** Html5-QRCode (WebRTC nativo)
* **API de Tasa de Cambio:** DolarApi Venezuela
* **Persistencia Local:** LocalStorage con arquitectura desacoplada y modular, preparada para migración a base de datos en la nube (Supabase / Firebase).

---

## 📁 Arquitectura del Proyecto

```text
pos-app/
├── src/
│   ├── components/
│   │   ├── CajaModal.jsx          # Arqueo de caja y reporte Corte Z
│   │   ├── ConfiguracionModal.jsx # Perfil del negocio, logo y ajustes
│   │   ├── CreditosModal.jsx      # Cuentas por cobrar, abonos y estado de cuenta
│   │   ├── HistorialModal.jsx     # Registro y anulación de ventas
│   │   ├── InventarioModal.jsx    # Catálogo, costos, márgenes e IVA
│   │   ├── ModalCobro.jsx         # Pasarela de pagos multi-método
│   │   ├── ScannerModal.jsx       # Lector de códigos de barra por cámara WebRTC
│   │   └── TicketModal.jsx        # Factura térmica digital e imprimible
│   ├── App.jsx                    # Orquestador principal del mostrador POS
│   ├── main.jsx                   # Punto de entrada de la aplicación
│   └── index.css                  # Estilos globales y reset
├── public/
├── package.json
└── README.md
```

---

## ⚙️ Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/pos-app.git
   cd pos-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev -- --host --port 5176
   ```

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Desarrollado con fines comerciales y de optimización para el comercio minorista.
