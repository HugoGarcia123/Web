
import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import EgresadoPage from "@/pages/EgresadoPage"
import EncuestaQuimicaPage from "@/pages/EncuestaQuimicaPage"
import EncuestaGeneralPage from "@/pages/EncuestaGeneralPage"
import JefeDepartamentoPage from "@/pages/JefeDepartamentoPage"
import InformePage from "@/pages/InformePage"
import SuperUsuarioPage from "@/pages/SuperUsuarioPage"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/egresado" element={<EgresadoPage />} />
          <Route path="/encuesta-quimica" element={<EncuestaQuimicaPage />} />
          <Route path="/encuesta-general" element={<EncuestaGeneralPage />} />
          <Route path="/jefe-departamento" element={<JefeDepartamentoPage />} />
          <Route path="/informe" element={<InformePage />} />
          <Route path="/super-usuario" element={<SuperUsuarioPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
