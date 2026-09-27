const API_URL = `http://${window.location.hostname}:4000/api`;

export const apiService = {
  async registrarDueno(datos) {
    try {
      const res = await fetch(`${API_URL}/auth/registro-dueno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async loginDueno(correo, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login-dueno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async crearCajero(negocioId, nombre, pin) {
    try {
      const res = await fetch(`${API_URL}/cajeros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId, nombre, pin })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async obtenerCajeros(negocioId) {
    try {
      const res = await fetch(`${API_URL}/cajeros/${negocioId || 'neg_local'}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  async consultarLicencia(negocioId) {
    try {
      const res = await fetch(`${API_URL}/licencia/${negocioId || 'neg_local'}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async sincronizarVentas(negocioId, ventas) {
    try {
      const res = await fetch(`${API_URL}/ventas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId: negocioId || 'neg_local', ventas })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async obtenerVentasServidor(negocioId) {
    try {
      const res = await fetch(`${API_URL}/ventas/${negocioId || 'neg_local'}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  async guardarConfiguracion(config) {
    try {
      const res = await fetch(`${API_URL}/configuracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async obtenerConfiguracion() {
    try {
      const res = await fetch(`${API_URL}/configuracion`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  }
};
