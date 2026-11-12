import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserIcon from '../assets/ResourcesHome/Usericon.png';
import LogoVM from '../assets/ResourcesLogin/LogoVisionMadera.png';
import { obtenerLista, obtenerMisCitas } from "../api";

export default function Home() {
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [cardHover, setCardHover] = useState(null);
  const [citas, setCitas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [bloques, setBloques] = useState([]);
  
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  const fotoPerfil =
    localStorage.getItem("fotoPerfil") ||
    "https://via.placeholder.com/80?text=Perfil";
    
  const navigate = useNavigate();

  // Traer citas de forma segura controlando errores 500 o estructuras vacías
  useEffect(() => {
    obtenerMisCitas()
      .then(setCitas)
      .catch((error) => {
        console.error("Error cargando citas:", error);
        setCitas([]);
      });

    Promise.all([
      obtenerLista("/sedes/"),
      obtenerLista("/bloques-horario/"),
    ]).then(([dataSedes, dataBloques]) => {
      setSedes(dataSedes);
      setBloques(dataBloques);
    }).catch(err => console.error("Error cargando catálogos:", err));
  }, []);
// Verificar si el token ha expirado al cargar el Home
useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
        // No hay token, redirige al login
        navigate("/", { state: { mensaje: "Sesión expirada. Por favor inicia sesión de nuevo." } });
        return;
    }

    // Decodifica el token para revisar su expiración
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const ahora = Math.floor(Date.now() / 1000);
        
        if (payload.exp < ahora) {
            // Token expirado, limpia localStorage y redirige
            localStorage.removeItem("token");
            localStorage.removeItem("nombreUsuario");
            localStorage.removeItem("documentoUsuario");
            navigate("/", { state: { mensaje: "Sesión expirada. Por favor inicia sesión de nuevo." } });
        }
    } catch (error) {
        // Token inválido
        localStorage.clear();
        navigate("/", { state: { mensaje: "Sesión expirada. Por favor inicia sesión de nuevo." } });
    }
}, []);

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: "#FAFAF9",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* 1. BARRA DE NAVEGACIÓN */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 48px",
          height: 80,
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ backgroundColor: "#E8580A", padding: "6px 14px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(232, 88, 10, 0.2)"}}>
            <img src={LogoVM} alt="VisiónMadera" style={{height: 50, objectFit: "contain"}}/>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          <span
            onClick={() => { setSeccionActiva("inicio"); navigate("/"); }}
            style={{
              cursor: "pointer",
              fontSize: 14,
              color: seccionActiva === "inicio" ? "#E8580A" : "#555",
              fontWeight: seccionActiva === "inicio" ? 600 : 400,
            }}
          >
            Inicio
          </span>
          <span
            onClick={() => navigate("/agendar-cita")}
            style={{
              cursor: "pointer",
              fontSize: 14,
              color: seccionActiva === "agendar" ? "#E8580A" : "#555",
              fontWeight: seccionActiva === "agendar" ? 600 : 400,
            }}
          >
            Agendar cita
          </span>
          <span
            onClick={() => navigate("/pqrs")}
            style={{
              cursor: "pointer",
              fontSize: 14,
              color: seccionActiva === "pqrs" ? "#E8580A" : "#555",
              fontWeight: seccionActiva === "pqrs" ? 600 : 400,
            }}
          >
            PQRS
          </span>
        </div>
      </nav>

      {/* 2. SECCIÓN DE BIENVENIDA */}

      
      <section
        style={{
          backgroundColor: "#FDF0E8",
          padding: "48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img
    src={UserIcon}
    alt="Foto de perfil"
    style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #E8580A",
    }}
/>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8, color: "#1a1a1a" }}>
              Hola, {nombreUsuario}
            </h1>
            <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
              Gestiona tus citas de diseño en Madecentro
            </p>
            <button
              onClick={() => navigate("/agendar-cita")}
              style={{
                backgroundColor: "#E8580A",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + Agendar nueva cita
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid rgba(232,88,10,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 600, color: "#E8580A" }}>{citas.length}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Citas activas</div>
          </div>
          {/*<div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid rgba(232,88,10,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 600, color: "#E8580A" }}>{citas.length}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Citas realizadas</div>
          </div>*/}
        </div>
      </section>

      {/* 3. ACCIONES RÁPIDAS */}
      <section style={{ padding: "32px 48px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#1a1a1a" }}>
          Acciones rápidas
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 36 }}>
          <div
            onClick={() => navigate("/agendar-cita")}
            onMouseEnter={() => setCardHover("agendar")}
            onMouseLeave={() => setCardHover(null)}
            style={{
              backgroundColor: "#fff",
              border: cardHover === "agendar" ? "1px solid #E8580A" : "1px solid #eee",
              borderRadius: 12, padding: "20px 18px", cursor: "pointer",
              transform: cardHover === "agendar" ? "translateY(-3px)" : "translateY(0)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: "#FDF0E8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>📅</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Agendar cita</div>
            <div style={{ fontSize: 12, color: "#888" }}>Elige fecha, hora y sede</div>
          </div>

          <div
            onClick={() => navigate("/reprogramar-cita")}
            onMouseEnter={() => setCardHover("reprogramar")}
            onMouseLeave={() => setCardHover(null)}
            style={{
              backgroundColor: "#fff",
              border: cardHover === "reprogramar" ? "1px solid #E8580A" : "1px solid #eee",
              borderRadius: 12, padding: "20px 18px", cursor: "pointer",
              transform: cardHover === "reprogramar" ? "translateY(-3px)" : "translateY(0)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: "#FDF0E8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>✏️</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Reprogramar</div>
            <div style={{ fontSize: 12, color: "#888" }}>Cambia fecha u hora</div>
          </div>

          <div
            onClick={() => navigate("/cancelar-cita")}
            onMouseEnter={() => setCardHover("cancelar")}
            onMouseLeave={() => setCardHover(null)}
            style={{
              backgroundColor: "#fff",
              border: cardHover === "cancelar" ? "1px solid #E8580A" : "1px solid #eee",
              borderRadius: 12, padding: "20px 18px", cursor: "pointer",
              transform: cardHover === "cancelar" ? "translateY(-3px)" : "translateY(0)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: "#FDF0E8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>❌</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Cancelar cita</div>
            <div style={{ fontSize: 12, color: "#888" }}>Cancela cuando necesites</div>
          </div>

          <div
            onClick={() => navigate("/pqrs")}
            onMouseEnter={() => setCardHover("pqrs")}
            onMouseLeave={() => setCardHover(null)}
            style={{
              backgroundColor: "#fff",
              border: cardHover === "pqrs" ? "1px solid #E8580A" : "1px solid #eee",
              borderRadius: 12, padding: "20px 18px", cursor: "pointer",
              transform: cardHover === "pqrs" ? "translateY(-3px)" : "translateY(0)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: "#FDF0E8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>PQRS</div>
            <div style={{ fontSize: 12, color: "#888" }}>Soporte y solicitudes</div>
          </div>
        </div>

        <h2 style={{ marginBottom: "15px", fontSize: 18, fontWeight: 600 }}>Próximas citas</h2>
        {citas.length === 0 ? (
          <p style={{ color: "#888", fontSize: 14 }}>No tienes citas agendadas 📅</p>
        ) : (
          citas.map((cita) => {
            const fechaSolo= cita.fecha?String(cita.fecha).split("T")[0] : "0000-00-00";
            const [, mesStr, diaStr]= fechaSolo.split("-");
            const diaNum= diaStr || "00";
            const MESES= ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
            const nombreMes= MESES[parseInt(mesStr, 10)-1] || "MES";

            // Sedes y bloques desde la BD
            const sedeCita= sedes.find(s=>s.id_sede==cita.id_sede);
            const bloqueCita= bloques.find(b=>b.id_bloque==cita.id_bloque);
            const nombreSedeReal= sedeCita?sedeCita.nombre:`Sede (ID: ${cita.id_sede})`;
            const horaReal= bloqueCita
              ? `${String(bloqueCita.hora_inicio).includes("T")?String(bloqueCita.hora_inicio).split("T")[1].substring(0,5):String(bloqueCita.hora_inicio).substring(0,5)} - ${String(bloqueCita.hora_fin).includes("T")?String(bloqueCita.hora_fin).split("T")[1].substring(0,5):String(bloqueCita.hora_fin).substring(0,5)}`
              : "Horario por confirmar";

            return (
              <div key={cita.id_cita || cita.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: "#FDE6D8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontWeight: "700", color: "#E8580A", fontSize: 14 }}>{diaNum}</span>
                  <span style={{ fontSize: 10, color: "#E8580A", fontWeight: 600 }}>{nombreMes}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>
                    Cita de Diseño Especializado
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    📍 {nombreSedeReal} • 🕒 {horaReal}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 5. BOTÓN FLOTANTE DE PQRS (Movido a la esquina inferior derecha) */}
      <div
        onClick={() => navigate("/pqrs")}
        onMouseEnter={() => setCardHover("btn-flotante")}
        onMouseLeave={() => setCardHover(null)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px", 
          backgroundColor: "#E8580A",
          color: "white",
          width: cardHover === "btn-flotante" ? "180px" : "60px",
          height: "60px",
          borderRadius: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(232, 88, 10, 0.4)",
          transition: "all 0.3s ease",
          zIndex: 1000,
          overflow: "hidden",
          padding: "0 15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: "24px" }}>💬</span>
          {cardHover === "btn-flotante" && (
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              ¿Necesitas ayuda?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}