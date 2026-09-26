const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'pos_database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite:', DB_PATH);
  }
});

// Inicializar tablas del sistema
db.serialize(() => {
  // 1. TABLA DE NEGOCIOS / TIENDAS (Multi-Tenant)
  db.run(`
    CREATE TABLE IF NOT EXISTS negocios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      rif TEXT,
      direccion TEXT,
      telefono TEXT,
      logo TEXT,
      mensaje_pie TEXT,
      plan_suscripcion TEXT DEFAULT 'basico',
      licencia_valida_hasta TEXT,
      estado TEXT DEFAULT 'activo',
      fecha_creacion TEXT
    )
  `);

  // 2. TABLA DE USUARIOS (Dueño y Cajeros)
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      negocio_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE,
      password_hash TEXT,
      pin_hash TEXT,
      rol TEXT NOT NULL, -- 'dueno' o 'cajero'
      fecha_creacion TEXT,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
    )
  `);

  // 3. TABLA DE PRODUCTOS / INVENTARIO
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id TEXT PRIMARY KEY,
      negocio_id TEXT NOT NULL,
      codigo TEXT,
      nombre TEXT NOT NULL,
      categoria TEXT,
      costo_usd REAL DEFAULT 0,
      precio_usd REAL NOT NULL,
      precio_mayor_usd REAL DEFAULT 0,
      cant_minima_mayor INTEGER DEFAULT 0,
      stock REAL DEFAULT 0,
      aplica_iva INTEGER DEFAULT 0,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
    )
  `);

  // 4. TABLA DE VENTAS Y SINCRONIZACIÓN
  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id TEXT PRIMARY KEY,
      negocio_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      cajero_nombre TEXT,
      total_usd REAL NOT NULL,
      total_bs REAL NOT NULL,
      tasa_cambio REAL NOT NULL,
      items_json TEXT NOT NULL,
      es_credito INTEGER DEFAULT 0,
      cliente_doc TEXT,
      cliente_nombre TEXT,
      descuento_usd REAL DEFAULT 0,
      fecha TEXT NOT NULL,
      anulada INTEGER DEFAULT 0,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
    )
  `);

  console.log('Tablas inicializadas correctamente.');
});

module.exports = db;
