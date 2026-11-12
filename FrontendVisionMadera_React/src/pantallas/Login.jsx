import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/Login.css';
import LogoVM from '../assets/ResourcesLogin/LogoVisionMadera.png'
import VerIcono from '../assets/ResourcesLogin/MostrarContrasena.png'
import OcultarIcono from '../assets/ResourcesLogin/OcultarContrasena.png'
import { API_URL } from '../api';


const Login = () => {
    const navigate = useNavigate(); // Hook para navegar entre pantallas
    const location = useLocation();
    const mensajeExpiracion = location.state?.mensaje || ""; // Mensaje de expiración de sesión (si viene desde Home)
    const [usuarios, setUsuarios] = useState([]); // Lista de usuarios (ya no se usa directamente)
    const [correo, setCorreo] = useState(""); // Estado para el campo correo
    const [contrasena, setContrasena] = useState(""); // Estado para el campo contraseña
    const [verContrasena, setVerContrasena] = useState(false); // Controla si se ve la contraseña
    const [recordarme, setRecordarme] = useState(false); // Controla el checkbox "Recordarme"
    const [error, setError] = useState(""); // Mensaje de error visible en pantalla

    useEffect(() => {
        // Al cargar la pantalla, revisa si hay un correo guardado en localStorage
        // Si existe, lo precarga en el campo y activa el checkbox "Recordarme"
        const correoGuardado = localStorage.getItem("correoUsuario");
        if (correoGuardado) {
            setCorreo(correoGuardado);
            setRecordarme(true);
        }
    }, []);

    // Valida que el correo tenga formato válido usando expresión regular
    const validarEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    async function acceder(e) {
        e.preventDefault(); // Evita que la página recargue al enviar el formulario
        setError(""); // Limpia errores anteriores

        // Verifica que los campos no estén vacíos
        if (!correo || !contrasena) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        // Verifica que el correo tenga formato válido
        if (!validarEmail(correo)) {
            setError("El formato del correo no es válido.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/token/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: correo, password: contrasena })
            });

            if (!response.ok) {
                setError("Correo o contraseña incorrectos");
                return;
            }

            const data = await response.json();

            if (!data.usuario) {
                setError("Esta cuenta no tiene un perfil de cliente.");
                return;
            }

            if (recordarme) {
                localStorage.setItem("correoUsuario", correo);
            } else {
                localStorage.removeItem("correoUsuario");
            }

            localStorage.setItem("token", data.access);
            localStorage.setItem("refreshToken", data.refresh);
            localStorage.setItem("nombreUsuario", `${data.usuario.nombre1} ${data.usuario.apellido1}`);
            localStorage.setItem("documentoUsuario", data.usuario.documento);

            navigate("/home");

        } catch (error) {
            // Si hay error de red o el servidor no responde
            setError("No se pudo conectar con el servidor");
        }
    }

    return (
        <div className="pantalla-login">
            <div className="tarjeta-login">
                <img src={LogoVM} alt="Logo VisionMadera" className="logo-imagen"/>
                <form onSubmit={acceder} noValidate>
                    <h2>Login</h2>
                    {/* Muestra el mensaje de error si existe */}
                    {error && <p className="mensaje-error">{error}</p>}
                    {mensajeExpiracion && <p className="mensaje-error">{mensajeExpiracion}</p>}
                    
                    {/* Campo de correo */}
                    <div className="campo-entrada">
                        <input
                            type="text"
                            required
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                        />
                        <label>Ingrese su correo</label>
                    </div>

                    {/* Campo de contraseña con botón para mostrar/ocultar */}
                    <div className="campo-entrada">
                        <input
                            type={verContrasena ? "text" : "password"}
                            required
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                        />
                        <label>Ingrese su contraseña</label>
                        <img
                            src={verContrasena ? OcultarIcono : VerIcono}
                            alt="Ver/Ocultar"
                            className="icono-ojo"
                            onClick={() => setVerContrasena(!verContrasena)}
                        />
                    </div>

                    {/* Checkbox recordarme y link olvidé contraseña */}
                    <div className="opciones-extra">
                        <label style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                            <input
                                type="checkbox"
                                checked={recordarme}
                                onChange={(e)=> setRecordarme(e.target.checked)}
                                />
                                Recordarme
                                </label>
                                <a href="#" onClick={(e)=>{e.preventDefault(); alert("Proximamente...")}}>¿Olvidaste tu contraseña?</a>
                        </div>
                        <button type="submit">Ingresar</button>
                        <div className="registro">
                            <p>¿No tienes cuenta? 
                                <span 
                                className="link-falso"
                                onClick={() => navigate("/registro")}
                            >
                                Regístrate
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;