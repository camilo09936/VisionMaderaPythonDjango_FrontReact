import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerLista, obtenerMisCitas } from "../api";

const formatearHora= (hora)=>{
  if (!hora) return "--:--";
  const str= String(hora);
  if(str.includes("T")){
    return str.split("T")[1].substring(0, 5);
  }
  return str.substring(0, 5);
};

export default function ReprogramarCita(){
  const [citas, setCitas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [disenadores, setDisenadores] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const navigate= useNavigate();

  useEffect(()=>{
    const cargarDatos= async()=>{
      try{
        const [c, s, d, b] = await Promise.all([
          obtenerMisCitas(),
          obtenerLista("/sedes/"),
          obtenerLista("/disenadores/"),
          obtenerLista("/bloques-horario/"),
        ]);
        setCitas(c); setSedes(s); setDisenadores(d); setBloques(b);
      }catch(error){
        console.error("Error cargando datos:", error);
        setMensajeModal("No se pudieron cargar las citas.");
        setMostrarModalError(true);
      }
    };
    cargarDatos();
  }, []);

  const handleReprogramar= (cita)=>{
    navigate("/agendar-cita", {
      state: {
        cita: {
          id: cita.id_cita,
          fecha: cita.fecha,
          id_sede: cita.id_sede,
          id_disenador: cita.id_disenador,
          id_bloque: cita.id_bloque,
        }
      }
    });
  };

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", backgroundColor: "#FAFAF9", minHeight: "100vh", padding: "40px 20px" }}>
      {/* Encabezado */}
      <div style={{textAlign: "center", marginBottom: "40px"}}>
        <h1 style={{color: "#E8580A", fontSize: "32px", fontWeight: "700", marginBottom: "8px"}}>
          🔄 Reprogramar Cita
        </h1>
        <p style={{color: "#666", fontSize: 14}}>Selecciona la cita que deseas reprogramar</p>
        <button
          onClick={()=>navigate("/home")}
          style={{
            marginTop: "18px", padding: "12px 22px", backgroundColor: "#fff", color: "#333",
            border: "1px solid #E8580A", borderRadius: "999px", cursor: "pointer",
            fontSize: "14px", fontWeight: 600, display: "inline-flex", alignItems: "center",
            gap: "8px", transition: "all 0.2s",
          }}
          onMouseEnter={(e)=>{e.target.style.backgroundColor="#E8580A"; e.target.style.color= "#fff";}}
          onMouseLeave={(e)=>{e.target.style.backgroundColor="#fff"; e.target.style.color= "#333"}}
          >
            ← Volver al inicio
          </button>
      </div>
      {/* Tabla */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "32px", maxWidth: "1000px", margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
        <table style={{width: "100%", borderCollapse: "collapse", textAlign: "left"}}>
          <thead>
            <tr style={{borderBottom: "2px solid #E8580A"}}>
              <th style={{ padding: "12px 8px", color: "#1a1a1a", fontWeight: "600" }}>Fecha</th>
              <th style={{ padding: "12px 8px", color: "#1a1a1a", fontWeight: "600" }}>Hora</th>
              <th style={{ padding: "12px 8px", color: "#1a1a1a", fontWeight: "600" }}>Descripción</th>
              <th style={{ padding: "12px 8px", color: "#1a1a1a", fontWeight: "600" }}>Sede</th>
              <th style={{ padding: "12px 8px", color: "#1a1a1a", fontWeight: "600" }}>Diseñador</th>
              <th style={{ padding: "12px 8px", color: "#1a1a1a", fontWeight: "600", textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {citas.length===0?(
              <tr>
                <td colSpan="6" style={{textAlign: "center", color: "#888", padding: "40px 0", fontSize: "14px"}}>
                  No hay citas registradas 📅
                </td>
              </tr>
            ) : (
              citas.map((cita)=>{
                const idCitaReal= cita.id_cita || cita.id;
                const sede= sedes.find(s=> s.id_sede==cita.id_sede);
                const disenador= disenadores.find(d=>d.id_disenador==cita.id_disenador);
                const bloque= bloques.find(b=>b.id_bloque==cita.id_bloque);

                const sedeTexto= sede ? sede.nombre: `Sede (ID: ${cita.id_sede})`;
                const disenadorTexto= disenador ? `${disenador.nombre} ${disenador.apellido}` : `Diseñador (ID: ${cita.id_disenador})`;
                const horaTexto= bloque ? `${formatearHora(bloque.hora_inicio)} - ${formatearHora(bloque.hora_fin)}` : "Por confirmar";

                return (
                  <tr key={idCitaReal} style={{borderBottom: "1px solid #f5f5f5"}}>
                    <td style={{padding: "16px 8px", fontSize: "14px", color: "#333"}}>
                      {cita.fecha?String(cita.fecha).split("T")[0]:"—"}
                    </td>
                    <td style={{padding: "16px 8px", fontSize: "14px", color: "#333"}}>{horaTexto}</td>
                    <td style={{padding: "16px 8px", fontSize: "14px", color: "#555"}}>Cita de Diseño Especializado</td>
                    <td style={{padding: "16px 8px", fontSize: "14px", color: "#333"}}>{sedeTexto}</td>
                    <td style={{padding: "16px 8px", fontSize: "14px", color: "#333"}}>{disenadorTexto}</td>
                    <td style={{padding: "16px 8px", textAlign: "center"}}>
                      <button
                      onClick={()=>handleReprogramar(cita)}
                      style={{
                        backgroundColor: "#E8580A", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "background-color 0.2s" }}
                      onMouseEnter={(e)=>e.target.style.backgroundColor= "#c64604"}
                      onMouseLeave={(e)=>e.target.style.backgroundColor= "#E8580A"}
                      >
                        Reprogramar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal error */}
      {mostrarModalError && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px 32px", borderRadius: "16px", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <p style={{color: "#333", fontSize: "15px", marginBottom: "24px", lineHeight: "1.5"}}>{mensajeModal}</p>
            <div style={{display: "flex", justifyContent: "flex-end"}}>
              <button onClick={()=>setMostrarModalError(false)} style={{backgroundColor: "transparent", color: "#E8580A", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer"}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
        )}
  </div>
  );
}