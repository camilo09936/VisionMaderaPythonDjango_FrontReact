import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Registro.css';
import LogoVM from '../assets/ResourcesRegister/LogoVisionMadera.png';
import VerIcono from '../assets/ResourcesLogin/MostrarContrasena.png';
import OcultarIcono from '../assets/ResourcesLogin/OcultarContrasena.png';
import { API_URL, mensajeDeError } from '../api'

const Registro = () => { 
    const navigate = useNavigate();
    const [datos, setDatos] = useState({
        nombre1: "", nombre2: "",
        apellido1: "", apellido2: "",
        documento: "", fecha_nacimiento: "",
        telefono: "", direccion: "",
        correo: "", contrasena: "", confirmarContrasena: ""
    });
    const [error, setError]= useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [verConfContrasena, setVerConfContrasena] = useState(false);
    const [errores, setErrores] = useState({});

    const validarFormulario=()=>{
        const nuevosErrores={};
        if(!datos.correo.trim()){
            nuevosErrores.correo="Campo obligatorio";
        }else if (!validarEmail(datos.correo)){
            nuevosErrores.correo= "El correo no es válido."
        }
        if (!datos.fecha_nacimiento){
            nuevosErrores.fecha_nacimiento= "Campo obligatorio";
        } else if (!esMayorDeEdad(datos.fecha_nacimiento)){
            nuevosErrores.fecha_nacimiento= "Debes ser mayor de 18 años.";
        }
        if (!datos.telefono.trim()){
            nuevosErrores.telefono= "Campo obligatorio";
        }else if (!validarTelefono(datos.telefono)){
            nuevosErrores.telefono= "El número de teléfono no es válido.";
        }
        if(datos.contrasena !== datos.confirmarContrasena){
            nuevosErrores.confirmarContrasena= "Las contraseñas no coinciden.";
        }
        if (!datos.nombre1.trim()) {
            nuevosErrores.nombre1 = "Campo obligatorio";
        }
        if (!datos.apellido1.trim()) {
            nuevosErrores.apellido1 = "Campo obligatorio";
        }
        if (!datos.documento.trim()) {
            nuevosErrores.documento = "Campo obligatorio";
        }
        if (!datos.direccion.trim()) {
            nuevosErrores.direccion = "Campo obligatorio";
        }
        if (!datos.contrasena.trim()) {
            nuevosErrores.contrasena = "Campo obligatorio";
        }
        if (!datos.confirmarContrasena.trim()){
            nuevosErrores.confirmarContrasena= "Campo obligatorio";
        }
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length===0;
    };
    
    const manejarCambio=(e) => { 
        const {name,value}=e.target;
        setDatos(prev=>({...prev,[name]:value}));
        validarCampo(name,value);
    };

    const validarEmail= (email) =>{ 
        const emailRegex= /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return emailRegex.test(email);
    };

    const esMayorDeEdad= (fecha) =>{ 
        const hoy= new Date();
        const nacimiento= new Date(fecha);

        let edad= hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();

        if(m<0 || (m===0 && hoy.getDate()<nacimiento.getDate())){
            edad--;
        }
        return edad >=18;
    }

    const validarTelefono= (tel) => {
        return /^[0-9]{10,11}$/.test(tel);
    }

    const validarCampo= (name, value)=>{ 
        let error= "";
        const camposObligatorios=["nombre1", "apellido1", "documento", 
                "fecha_nacimiento", "telefono", "direccion", 
                "correo", "contrasena", "confirmarContrasena"
        ];

        if (camposObligatorios.includes(name) && !value?.trim()){
            error="Campo obligatorio";
        }
        if(name==="correo" && value && !validarEmail(value)){
            error="El correo no es válido. Debe tener un formato válido (usuario@dominio.com).";
        }
        if(name==="telefono" && value && !validarTelefono(value)){
            error="El teléfono no es válido."
        }
        if(name==="fecha_nacimiento" && value && !esMayorDeEdad(value)){
            error= "Debes ser mayor de 18 años";
        }
        if(name==="confirmarContrasena"){
            if(value !== datos.contrasena){
                error="Las contraseñas no coinciden."
            }
        }
        if (name==="contrasena" && datos.confirmarContrasena){
            if(value !== datos.confirmarContrasena){
                setErrores(prev=>({...prev, confirmarContrasena: "Las contraseñas no coinciden."}));
                }else{
                    setErrores(prev=>({...prev, confirmarContrasena: ""}));
            }
        }
        setErrores(prev=>({...prev,[name]:error}));
    };


    const registrarUsuario= async (e) => { 
        e.preventDefault();
        setError(""); 

        if (errores.documento){
            setError("El documento ya está registrado.");
            return;
        }

        const esValido=validarFormulario();
        if(!esValido){
            setError("Por favor revisa los campos marcados.");
            window.scrollTo({top: 0, behavior: "smooth"});
            return;
        }

        const {confirmarContrasena, ...datosFinales}= datos;
        try{
            const response= await fetch(`${API_URL}/usuarios/`,{
                method:"POST",
                headers:{ "Content-Type": "application/json" },
                body: JSON.stringify(datosFinales)
            });

            const data = await response.json().catch(() => ({}));

            if(response.ok){
                alert("¡Te Registraste Exitosamente!");
                navigate("/");
            }else{
                setError(mensajeDeError(data, "Hubo un problema al guardar los datos."));
                window.scrollTo({top: 0, behavior: "smooth"});
            }
        }catch(err){
            setError("Error al conectar con el servidor");
            window.scrollTo({top: 0, behavior: "smooth"});
        }
    };

    return (
        <div className="pantalla-registro">
            <div className="tarjeta-registro">
                <div style={{textAlign: 'center'}}>
                    <img src={LogoVM} width="95" alt="Logo"/>
                    </div>
                    <h2>Crea tu cuenta</h2>
                    {error && <p className="mensaje-error">{error}</p>}
                    <form className="formulario-registro" onSubmit={registrarUsuario} noValidate>
                        <div className="campo-registro">
                            <input 
                                type="text" 
                                name="nombre1" 
                                placeholder="" 
                                required 
                                onChange={manejarCambio} 
                                className={errores.nombre1 ? "input-error" : datos.nombre1 ? "input-correcto" : ""}
                            />
                            <label>Primer Nombre</label>
                            {!errores.nombre1 && datos.nombre1.trim() && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.nombre1 && (
                                    <span className="mensaje-campo-error">{errores.nombre1}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="text" 
                                name="nombre2" 
                                placeholder="" 
                                onChange={manejarCambio}
                                className={errores.nombre2 ? "input-error" : datos.nombre2 ? "input-correcto" : ""}
                            />
                            <label>Segundo Nombre</label>
                            {!errores.nombre2 && datos.nombre2.trim() && (
                                <span className="check-correcto">✔</span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="text" 
                                name="apellido1" 
                                placeholder="" 
                                required 
                                onChange={manejarCambio}
                                className={errores.apellido1 ? "input-error" : datos.apellido1 ? "input-correcto" : ""}
                            />
                            <label>Primer Apellido</label>
                            {!errores.apellido1 && datos.apellido1.trim() && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.apellido1 && (
                                    <span className="mensaje-campo-error">{errores.apellido1}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="text" 
                                name="apellido2" 
                                placeholder="" 
                                onChange={manejarCambio}
                                className={errores.apellido2 ? "input-error" : datos.apellido2 ? "input-correcto" : ""}
                            />
                            <label>Segundo Apellido</label>
                            {!errores.apellido2 && datos.apellido2.trim() && (
                                <span className="check-correcto">✔</span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input
                                type="text"
                                name="documento"
                                placeholder=""
                                required
                                onChange={manejarCambio}
                                className={errores.documento ? "input-error" : datos.documento ? "input-correcto" : ""}
                            />
                            <label>Documento Identidad</label>
                            {!errores.documento && datos.documento.trim() && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.documento && (
                                    <span className="mensaje-campo-error">{errores.documento}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="date" 
                                name="fecha_nacimiento" 
                                required 
                                onChange={manejarCambio}
                                value={datos.fecha_nacimiento}
                                className={errores.fecha_nacimiento ? "input-error" : datos.fecha_nacimiento ? "input-correcto" : ""}
                            />
                            <label>Fecha Nacimiento</label>
                            {!errores.fecha_nacimiento && datos.fecha_nacimiento && esMayorDeEdad(datos.fecha_nacimiento) && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.fecha_nacimiento && (
                                    <span className="mensaje-campo-error">{errores.fecha_nacimiento}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="tel" 
                                name="telefono" 
                                placeholder="" 
                                required 
                                onChange={manejarCambio} 
                                className={errores.telefono ? "input-error" : datos.telefono ? "input-correcto" : ""}
                                maxLength="11"
                            />
                            <label>Telefono / Celular</label>
                            {!errores.telefono && datos.telefono.trim() && validarTelefono(datos.telefono) && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.telefono && (
                                    <span className="mensaje-campo-error">{errores.telefono}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="text" 
                                name="direccion" 
                                placeholder="" 
                                required 
                                onChange={manejarCambio}
                                className={errores.direccion ? "input-error" : datos.direccion ? "input-correcto" : ""}
                            />
                            <label>Dirección</label>
                            {!errores.direccion && datos.direccion.trim() && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.direccion && (
                                    <span className="mensaje-campo-error">{errores.direccion}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input 
                                type="email" 
                                name="correo" 
                                placeholder="" 
                                required 
                                onChange={manejarCambio}
                                className={errores.correo ? "input-error" : datos.correo ? "input-correcto" : ""}
                            />
                            <label>Correo Electrónico</label>
                            {!errores.correo && datos.correo.trim() && validarEmail(datos.correo) && (
                                <span className="check-correcto">✔</span>
                                )}
                                {errores.correo && (
                                    <span className="mensaje-campo-error">{errores.correo}
                                    </span>
                                )}
                        </div>
                        <div className="campo-registro">
                            <input
                                type={verContrasena ? "text" : "password"}
                                name="contrasena"
                                placeholder=" " 
                                required
                                onChange={manejarCambio}
                                className={errores.contrasena ? "input-error" : datos.contrasena ? "input-correcto" : ""}
                            />
                            <label>Contraseña</label>
                            {!errores.contrasena && datos.contrasena.trim() && (
                                <span className="check-correcto check-con-ojo">✔</span>
                                )}
                                {errores.contrasena && (
                                    <span className="mensaje-campo-error">{errores.contrasena}
                                    </span>
                                )}
                            <img
                                src={verContrasena ? OcultarIcono : VerIcono}
                                className="icono-ojo-registro"
                                onClick={()=>setVerContrasena(!verContrasena)}
                                alt="Ver/Ocultar"
                            />
                        </div>
                        <div className="campo-registro">
                            <input 
                                type={verConfContrasena ? "text" : "password"} 
                                name="confirmarContrasena" 
                                placeholder=" " 
                                required
                                onChange={manejarCambio}
                                className={errores.confirmarContrasena ? "input-error" : datos.confirmarContrasena ? "input-correcto" : ""}
                            />
                            <label>Confirmar Contraseña</label>
                            {!errores.confirmarContrasena && datos.confirmarContrasena.trim() && (
                                <span className="check-correcto check-con-ojo">✔</span>
                                )}
                                {errores.confirmarContrasena && (
                                    <span className="mensaje-campo-error">{errores.confirmarContrasena}
                                    </span>
                                )}
                            <img
                                src={verConfContrasena ? OcultarIcono : VerIcono}
                                className="icono-ojo-registro"
                                onClick={()=>setVerConfContrasena(!verConfContrasena)}
                                alt="Ver/Ocultar"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="boton-registro"
                            >
                            Registrarse
                        </button>
                    </form>
                    <span className="link-volver" onClick={()=>navigate("/")}>
                        Volver al Login
                    </span>
                </div>
            </div>
        );
};
export default Registro;