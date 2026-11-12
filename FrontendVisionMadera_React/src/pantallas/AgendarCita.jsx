import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, obtenerLista, mensajeDeError } from "../api";

export default function AgendarCita() {
  const location = useLocation();
  const navigate = useNavigate();
  const citaEditar = location.state?.cita || null; 
  
  // Estados de control del Formulario
  const [fecha, setFecha] = useState("");
  const [sedes, setSedes] = useState([]); 
  const [idSede, setIdSede] = useState(""); 
  const [isEdit, setIsEdit] = useState(false); 

  // Estados para el flujo dinámico de atención
  const [disenadores, setDisenadores] = useState([]);
  const [idDisenador, setIdDisenador] = useState("");
  const [bloques, setBloques] = useState([]);
  const [idBloque, setIdBloque] = useState("");

  // Estado para guardar los bloques que la BD nos diga que ya están ocupados
  const [bloquesOcupados, setBloquesOcupados] = useState([]);

  // 1. Cargar las sedes desde el backend al montar la vista
  useEffect(() => {
    const cargarSedes = async () => {
      try {
        setSedes(await obtenerLista("/sedes/"));
      } catch (error) {
        console.error("Error de red al traer sedes:", error);
      }
    };
    cargarSedes();
  }, []);

  // 2. Cargar diseñadores filtrados automáticamente cuando cambia la sede
  useEffect(() => {
    const cargarDisenadores = async () => {
      if (!idSede) {
        setDisenadores([]);
        return;
      }
      try {
        const data = await obtenerLista("/disenadores/");
        setDisenadores(data.filter((d) => String(d.sede) === String(idSede)));
      } catch (error) {
        console.error("Error al cargar diseñadores:", error);
      }
    };

    if(!idSede) return;
    setIdDisenador("");
    setBloques([]);
    cargarDisenadores();     
  }, [idSede]);

  // 3. Cargar bloques horarios según diseñador y el día de la semana correspondiente
  useEffect(() => {
    const cargarHorarios = async () => {
      if (!idDisenador || !fecha) {
        setBloques([]);
        return;
      }

      const diasSemanaIngles = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Crear la fecha de forma local usando sus componentes enteros para evitar desvíos en los selectores
      const [year, month, day] = fecha.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); 

      const nombreDia = diasSemanaIngles[dateObj.getDay()]; 

      try {
        const [agenda, catalogo] = await Promise.all([
          obtenerLista("/agenda-disenadores/"),
          obtenerLista("/bloques-horario/"),
        ]);
        const delDia = agenda
          .filter((a) => String(a.disenador) === String(idDisenador) && a.dia_semana === nombreDia)
          .map((a) => ({
            ...a,
            id_bloque: a.bloque,
            BloqueHorario: catalogo.find((b) => b.id_bloque === a.bloque),
          }))
          .sort((x, y) => String(x.BloqueHorario?.hora_inicio).localeCompare(String(y.BloqueHorario?.hora_inicio)));
        setBloques(delDia);
      } catch (error) {
        console.error("Error de conexión al cargar la agenda:", error);
      }
    };

    cargarHorarios();
    setIdBloque(""); 
  }, [idDisenador, fecha]);

  // Consulta de disponibilidad de bloques ya ocupados en la BD
  useEffect(() => {
    const consultarOcupados = async () => {
      if (!fecha || !idDisenador) {
        setBloquesOcupados([]);
        return;
      }
      try {
        const citas = await obtenerLista("/citas/");
        setBloquesOcupados(
          citas
            .filter((c) => c.fecha === fecha
              && String(c.disenador) === String(idDisenador)
              && c.id_cita !== citaEditar?.id)
            .map((c) => c.bloque)
        );
      } catch (error) {
        console.error("Error consultando bloques ocupados:", error);
        setBloquesOcupados([]);
      }
    };

    consultarOcupados();
  }, [fecha, idDisenador]);

  // Cargar datos para edición si aplica
  useEffect(() => {
    if (citaEditar) {
      const fechaLimpia = citaEditar.fecha ? citaEditar.fecha.split("T")[0] : "";
      setFecha(fechaLimpia);
      setIdSede(String(citaEditar.id_sede || ""));
      // id_disenador e id_bloque se precargan para mostrar los valores actuales
      // El usuario puede cambiarlos o mantenerlos al guardar
      if(citaEditar.id_disenador) setIdDisenador(String(citaEditar.id_disenador));
      if (citaEditar.id_bloque) setIdBloque(String(citaEditar.id_bloque)); 
      setIsEdit(true);
    }
  }, [citaEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const documentoUsuario = localStorage.getItem("documentoUsuario");
    if (!documentoUsuario) {
      alert("No se encontró tu sesión. Por favor vuelve a iniciar sesión.");
      navigate("/");
      return;
    }
    try {
      const cuerpoPeticion = {
        fecha: fecha,
        sede: parseInt(idSede),
        disenador: parseInt(idDisenador),
        bloque: parseInt(idBloque),
        usuario: documentoUsuario,
      };

      const ruta = isEdit ? `/citas/${citaEditar.id_cita || citaEditar.id}/` : "/citas/";
      const response = await apiFetch(ruta, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(cuerpoPeticion),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(mensajeDeError(errorData, isEdit ? "Error al reprogramar la cita" : "Error al agendar la cita"));
      }
      alert(isEdit ? "Cita reprogramada con éxito." : "Cita agendada con éxito.");
      navigate("/home");
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar la cita. Intenta de nuevo.");
    }
  };

  const extraerHoraFija = (valorHora) => {
    if (!valorHora) return "--:--";
    
    if (typeof valorHora === "string" && valorHora.includes("T")) {
      const parteHora = valorHora.split("T")[1]; 
      if (parteHora) {
        return parteHora.substring(0, 5); 
      }
    }
    
    const stringLimpio = String(valorHora).trim();
    if (stringLimpio.includes(":")) {
      return stringLimpio.substring(0, 5); 
    }
    
    return "--:--";
  };

  // Funciones auxiliares para formatear la fecha de texto de forma segura sin desfase local
  const obtenerFechaFormateadaLocal = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const obtenerFechaResumenLocal = (fechaString) => {
    if (!fechaString) return "Fecha no seleccionada";
    const [year, month, day] = fechaString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
  };

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: "#FAFAF9",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <style>{`
      input::placeholder { color: #999; opacity: 1; }
      input[type="date"]::-webkit-datetime-edit,
      input[type="date"]::-webkit-datetime-edit-fields-wrapper,
      input[type="date"]::-webkit-datetime-edit-text,
      input[type="date"]::-webkit-datetime-edit-month-field,
      input[type="date"]::-webkit-datetime-edit-day-field,
      input[type="date"]::-webkit-datetime-edit-year-field { color: #1a1a1a !important; }
      input[type="date"] { position: relative; }
      input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer; filter: invert(0.1); position: absolute; right: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0;
      }
      `}</style>
      
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ color: "#E8580A", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            📅 {isEdit ? "Reprogramar Cita" : "Agendar Cita"}
          </h1>
          <p style={{ color: "#666", fontSize: 14 }}>Completa los detalles de tu cita en Madecentro</p>
          <button
            onClick={() => navigate("/home")}
            style={{
              marginTop: "18px", padding: "12px 22px", backgroundColor: "#fff", color: "#333", border: "1px solid #E8580A", borderRadius: "999px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = "#E8580A"; e.target.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = "#fff"; e.target.style.color = "#333"; }}
          >
            ← Volver al inicio
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, alignItems: "start" }}>
          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ backgroundColor: "#fff", padding: "32px", borderRadius: "12px" }}>
            
            {/* Fecha */}
            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="fecha" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "10px", fontWeight: 600, fontSize: 14 }}>
                📆 Fecha de la cita
              </label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                style={{
                  width: "100%", padding: "16px 14px", border: "2px solid #E8E8E8", borderRadius: "12px", fontSize: 14, fontFamily: "Poppins, sans-serif", transition: "all 0.3s", boxSizing: "border-box", color: "#1a1a1a", backgroundColor: "#f2f2f7", minHeight: "52px",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#E8580A"; e.target.style.backgroundColor = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(232, 88, 10, 0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8E8E8"; e.target.style.backgroundColor = "#f2f2f7"; e.target.style.boxShadow = "none"; }}
              />
              <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Formato: dd/mm/aaaa</p>
              {fecha && (
                <p style={{ fontSize: 12, color: "#E8580A", marginTop: 6 }}>
                  ✓ {obtenerFechaFormateadaLocal(fecha)}
                </p>
              )}
            </div>

            {/* Sede */}
            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="sede" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "10px", fontWeight: 600, fontSize: 14 }}>
                🏢 Selecciona la sede
              </label>
              <select
                id="sede"
                value={idSede}
                onChange={(e) => setIdSede(e.target.value)}
                required
                style={{
                  width: "100%", padding: "16px 14px", border: "2px solid #E8E8E8", borderRadius: "12px", fontSize: 14, fontFamily: "Poppins, sans-serif", transition: "all 0.3s", boxSizing: "border-box", color: "#1a1a1a", backgroundColor: "#f2f2f7", minHeight: "52px", outline: "none", cursor: "pointer"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#E8580A"; e.target.style.backgroundColor = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(232, 88, 10, 0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8E8E8"; e.target.style.backgroundColor = "#f2f2f7"; e.target.style.boxShadow = "none"; }}
              >
                <option value="">-- Elige una sede --</option>
                {sedes.map((s) => (
                  <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Diseñador */}
            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="disenador" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "10px", fontWeight: 600, fontSize: 14 }}>
                👤 Selecciona el Diseñador
              </label>
              <select
                id="disenador"
                value={idDisenador}
                onChange={(e) => setIdDisenador(e.target.value)}
                disabled={!idSede}
                required
                style={{
                  width: "100%", padding: "16px 14px", border: "2px solid #E8E8E8", borderRadius: "12px", fontSize: 14, fontFamily: "Poppins, sans-serif", transition: "all 0.3s", boxSizing: "border-box", color: "#1a1a1a", backgroundColor: !idSede ? "#e5e5ea" : "#f2f2f7", minHeight: "52px", outline: "none", cursor: !idSede ? "not-allowed" : "pointer"
                }}
                onFocus={(e) => { if(idSede) { e.target.style.borderColor = "#E8580A"; e.target.style.backgroundColor = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(232, 88, 10, 0.1)"; } }}
                onBlur={(e) => { e.target.style.borderColor = "#E8E8E8"; e.target.style.backgroundColor = !idSede ? "#e5e5ea" : "#f2f2f7"; e.target.style.boxShadow = "none"; }}
              >
                <option value="">-- Elige un diseñador --</option>
                {disenadores.map((d) => (
                  <option key={d.id_disenador} value={d.id_disenador}>{d.nombre} {d.apellido}</option>
                ))}
              </select>
            </div>

            {/* Bloques Horarios */}
            <div style={{ marginBottom: "32px" }}>
              <label htmlFor="horario" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "10px", fontWeight: 600, fontSize: 14 }}>
                🕐 Horarios Disponibles
              </label>
              <select
                id="horario"
                value={idBloque}
                onChange={(e) => setIdBloque(e.target.value)}
                disabled={!idDisenador || !fecha}
                required
                style={{
                  width: "100%", padding: "16px 14px", border: "2px solid #E8E8E8", borderRadius: "12px", fontSize: 14, fontFamily: "Poppins, sans-serif", transition: "all 0.3s", boxSizing: "border-box", color: "#1a1a1a", backgroundColor: (!idDisenador || !fecha) ? "#e5e5ea" : "#f2f2f7", minHeight: "52px", outline: "none", cursor: (!idDisenador || !fecha) ? "not-allowed" : "pointer"
                }}
                onFocus={(e) => { if(idDisenador && fecha) { e.target.style.borderColor = "#E8580A"; e.target.style.backgroundColor = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(232, 88, 10, 0.1)"; } }}
                onBlur={(e) => { e.target.style.borderColor = "#E8E8E8"; e.target.style.backgroundColor = (!idDisenador || !fecha) ? "#e5e5ea" : "#f2f2f7"; e.target.style.boxShadow = "none"; }}
              >
                <option value="">-- Elige un horario --</option>
                {bloques
                  .filter(b => !bloquesOcupados.some(ocupadoId => String(ocupadoId) === String(b.id_bloque)))
                  .map((b) => {
                    const inicio = extraerHoraFija(b.BloqueHorario?.hora_inicio);
                    const fin = extraerHoraFija(b.BloqueHorario?.hora_fin);
                    
                    return (
                      <option key={b.id_agenda} value={b.id_bloque}>
                        {inicio} - {fin}
                      </option>
                    );
                  })}
              </select>
            </div>

            <button
              type="submit"
              style={{
                width: "100%", padding: "14px", backgroundColor: "#E8580A", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.3s", boxShadow: "0 4px 12px rgba(232, 88, 10, 0.3)",
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = "#d1480a"; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 6px 16px rgba(232, 88, 10, 0.4)"; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = "#E8580A"; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 12px rgba(232, 88, 10, 0.3)"; }}
            >
              {isEdit ? "💾 Guardar Cambios" : "✓ Agendar Cita"}
            </button>
          </form>

          {/* Resumen de Cita */}
          <div style={{ backgroundColor: "#FDF0E8", padding: "32px", borderRadius: "12px", border: "2px solid #E8580A", position: "sticky", top: "20px" }}>
            <h2 style={{ color: "#E8580A", fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              📋 Resumen de tu cita
            </h2>

            {/* Sede */}
            <div style={{ backgroundColor: "#fff", padding: "12px 16px", borderRadius: "8px", marginBottom: "12px", borderLeft: "4px solid #E8580A" }}>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>SEDE</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                {idSede ? sedes.find((s) => s.id_sede == idSede)?.nombre || "Sede no encontrada" : "No seleccionada"}
              </p>
            </div>

            {/* Diseñador */}
            <div style={{ backgroundColor: "#fff", padding: "12px 16px", borderRadius: "8px", marginBottom: "12px", borderLeft: "4px solid #E8580A" }}>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>DISEÑADOR</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                {idDisenador 
                  ? `${disenadores.find((d) => d.id_disenador == idDisenador)?.nombre || ''} ${disenadores.find((d) => d.id_disenador == idDisenador)?.apellido || ''}`.trim() || "Diseñador no encontrado"
                  : "No seleccionado"}
              </p>
            </div>

            {/* Fecha y Bloque */}
            <div style={{ backgroundColor: "#fff", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", borderLeft: "4px solid #E8580A" }}>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>FECHA Y HORARIO</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                {obtenerFechaResumenLocal(fecha)}
              </p>
              <p style={{ fontSize: 13, color: "#E8580A", fontWeight: 500, marginTop: 2 }}>
                {(() => {
                  const bloqueSeleccionado = bloques.find(b => b.id_bloque == idBloque);
                  if (idBloque && bloqueSeleccionado) {
                    
                    const inicio = extraerHoraFija(bloqueSeleccionado.BloqueHorario?.hora_inicio);
                    const fin = extraerHoraFija(bloqueSeleccionado.BloqueHorario?.hora_fin);
                    return `🕒 ${inicio} - ${fin}`;
                  }
                  return "Horario no seleccionado";
                })()}
              </p>
            </div>

            <div style={{ backgroundColor: idSede && idDisenador && idBloque && fecha ? "#E8F4E8" : "#F5F5F5", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: idSede && idDisenador && idBloque && fecha ? "#2d8a2d" : "#888", fontWeight: 500 }}>
                {idSede && idDisenador && idBloque && fecha ? "✓ Todo listo para agendar" : "⚠️ Completa todos los pasos requeridos"}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}