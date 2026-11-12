export const API_URL = "/api";

export async function apiFetch(ruta, opciones = {}) {
    const token = localStorage.getItem("token");
    const headers = { ...(opciones.headers || {}) };
    if (opciones.body) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
    if (res.status === 401 && token) {
    localStorage.clear();
    window.location.replace("/");
    }
    return res;
}

export async function obtenerLista(ruta) {
    const res = await apiFetch(ruta);
    if (!res.ok) throw new Error(`Error ${res.status} en ${ruta}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
}

export const normalizarCita = (c) => ({
    ...c,
    id_sede: c.sede,
    id_disenador: c.disenador,
    id_bloque: c.bloque,
});

export async function obtenerMisCitas() {
    const citas = await obtenerLista("/citas/");
    const doc = localStorage.getItem("documentoUsuario");
    return citas.filter((c) => String(c.usuario) === String(doc)).map(normalizarCita);
}

export function mensajeDeError(data, porDefecto = "Ocurrió un error.") {
    if (!data || typeof data !== "object") return porDefecto;
    const texto = Object.entries(data)
        .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
        .join(" | ");
    return texto || porDefecto;
}