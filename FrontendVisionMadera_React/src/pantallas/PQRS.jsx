import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, obtenerLista, obtenerMisCitas, mensajeDeError } from "../api";

const nombresSedes= { 1: "Sede Norte", 2: "Sede Sur", 3: "Sede Centro", 4: "Sede Bello", 5: "Sede Itagüí" };
const nombresDisenadores = { 1: "Daniel Ruiz", 2: "David Gómez", 3: "Laura Mora", 4: "Dayana Correa", 5: "Felipe Castro", 6: "Valentina Gil", 7: "Sebastian Rios" };

export default function Pqrs() {
  const navigate = useNavigate();
  const [tiposPqrs, setTiposPqrs] = useState([]);
  const [citas, setCitas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [disenadores, setDisenadores] = useState([]);
  const [formData, setFormData] = useState({
    id_tipo_pqrs: "",
    id_cita: "", 
    descripcion: "",
    documento: localStorage.getItem("documentoUsuario") || ""
  });

  useEffect(() => {
    obtenerLista("/tipos-pqrs/").then(setTiposPqrs).catch(err => console.error("Error tipos:", err));
    obtenerMisCitas().then(setCitas).catch(err => console.error("Error citas:", err));
    Promise.all([obtenerLista("/sedes/"), obtenerLista("/disenadores/")])
      .then(([s, d]) => { setSedes(s); setDisenadores(d); })
      .catch(err => console.error("Error catálogos:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica para evitar envíos vacíos
    if (!formData.id_tipo_pqrs || !formData.descripcion) {
      alert("Por favor rellena el tipo y la descripción");
      return;
    }

    const datosAEnviar = {
      tipo_pqrs: parseInt(formData.id_tipo_pqrs),
      descripcion: formData.id_cita
        ? `[Cita Ref: ${formData.id_cita}] - ${formData.descripcion}`
        : formData.descripcion,
      usuario: formData.documento,
    };

    try {
      const response = await apiFetch("/pqrs/", {
        method: "POST",
        body: JSON.stringify(datosAEnviar),
      });

      if (response.ok) {
        alert("¡PQRS enviada con éxito!");
        navigate("/home");
      } else {
        const err = await response.json().catch(() => ({}));
        alert(mensajeDeError(err, "Hubo un error al enviar al servidor"));
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert("No se pudo conectar con el servidor");
    }
  };

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", backgroundColor: "#FAFAF9", minHeight: "100vh", padding: "40px 20px" }}>
          {/* Encabezado */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ color: "#E8580A", fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>
              💬 PQRS
            </h1>
            <p style={{ color: "#666", fontSize: 14 }}>Peticiones, Quejas, Reclamos y Sugerencias</p>
            <button
              onClick={()=>navigate("/home")}
              style={{
                marginTop: "18px", padding: "12px 22px", backgroundColor: "#fff", color: "#333",
                border: "1px solid #E8580A", borderRadius: "999px", cursor: "pointer",
                fontSize: "14px", fontWeight: 600, display: "inline-flex", alignItems: "center",
                gap: "8px", transition: "all 0.2s",
              }}
              onMouseEnter={(e)=>{e.target.style.backgroundColor= "#E8580A"; e.target.style.color= "#fff"}}
              onMouseLeave={(e)=>{e.target.style.backgroundColor= "#fff"; e.target.style.color= "#333"}}
              >
                ← Volver al inicio
              </button>
          </div>
          {/* Formulario */}
          <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", padding: "32px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 4px 20px rgba(0,0,0,0.05)"}}>

            <form onSubmit={handleSubmit}>

              {/* Tipo de PQRS */}
              <div style={{marginBottom: "20px"}}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: "8px" }}>Tipo de PQRS</label>
                <select
                  required
                  style={{width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: 14 }}
                  value={formData.id_tipo_pqrs}
                  onChange={(e)=>setFormData({...formData, id_tipo_pqrs: e.target.value })}
              >
                <option value="">Seleccione...</option>
                {tiposPqrs.map(t=>(
                  <option key={t.id_tipo_pqrs} value={t.id_tipo_pqrs}>{t.nombre}</option>
                ))}
                </select>
          </div>
          {/* Selector de cita */}
          <div style={{marginBottom: "20px"}}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: "8px" }}>Relacionar con una cita (Opcional)</label>
            <select
              style={{width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: 14}}
              value={formData.id_cita}
              onChange={(e)=>setFormData({...formData, id_cita: e.target.value})}
              >
                <option value="">No aplica / PQRS General</option>
                {citas.map(c=>{
                  const sede= sedes.find(s=> s.id_sede==c.id_sede);
                  const disenador= disenadores.find(d=>d.id_disenador==c.id_disenador);
                  const fechaTexto= c.fecha?String(c.fecha).split("T")[0]:"Sin fecha";
                  const sedeTexto= sede?sede.nombre:`Sede (ID: ${c.id_sede})`;
                  const disenadorTexto= disenador?`${disenador.nombre} ${disenador.apellido}` : `Diseñador (ID: ${c.id_disenador})`;

                  return (
                    <option key={c.id_cita} value={c.id_cita}>
                      #{c.id_cita} — {fechaTexto} · {sedeTexto} · {disenadorTexto}
                    </option>
                  );
                })}
              </select>
            </div>
            {/* Descripción */}
            <div style={{marginBottom: "24px" }}>
              <label style={{display: "block", fontSize: 13, fontWeight: 600, marginBottom: "8px"}}>Descripción</label>
              <textarea
                required
                placeholder="Cuéntanos más detalles..."
                style={{width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", height: "120px", resize: "none", fontSize: 14, fontFamily: "Poppins, sans-serif", boxSizing: "border-box" }}
                value={formData.descripcion}
                onChange={(e)=>setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
            <button
              type="submit"
              style={{width: "100%", backgroundColor: "#E8580A", color: "#fff", border: "none", padding: "14px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
              onMouseEnter={(e)=>e.target.style.backgroundColor= "#c64604"}
              onMouseLeave={(e)=>e.target.style.backgroundColor= "#E8580A"}
            >
              Enviar PQRS
            </button>
          </form>
        </div>
      </div>
  );
}