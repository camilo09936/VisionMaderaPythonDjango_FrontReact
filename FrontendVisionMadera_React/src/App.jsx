import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pantallas/Login";
import Registro from "./pantallas/Registro";
import Home from "./pantallas/Home";
import AgendarCita from "./pantallas/AgendarCita";
import ReprogramarCita from "./pantallas/ReprogramarCita";
import CancelarCita from "./pantallas/CancelarCita";
import PQRS from "./pantallas/PQRS";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/agendar-cita" element={<AgendarCita />} />
        <Route path="/reprogramar-cita" element={<ReprogramarCita />} />
        <Route path="/cancelar-cita" element={<CancelarCita />} />
        <Route path="/PQRS" element={<PQRS />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
