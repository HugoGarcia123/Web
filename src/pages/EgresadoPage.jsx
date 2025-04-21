
import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

function EgresadoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const user = JSON.parse(localStorage.getItem('user'))

  const handleStartSurvey = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor inicia sesión nuevamente"
      })
      navigate('/login')
      return
    }

    // Determine which survey to show based on career ID
    const careerId = user.idCarrera
    if (careerId === 2 || careerId === 3) {
      navigate('/encuesta-quimica') // This will load survey with id 1
    } else {
      navigate('/encuesta-general') // This will load survey with id 2
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior */}
      <header className="bg-[#084c7c] h-16 flex items-center px-6 fixed w-full top-0 z-50">
        <img  
          alt="Logo TecNM" 
          className="h-12"
         src="https://images.unsplash.com/photo-1571243545933-0cda65bbb621" />
      </header>

      {/* Contenido principal */}
      <main className="flex-1 pt-16">
        {/* Banner de bienvenida */}
        <div className="relative h-[400px] w-full overflow-hidden">
          <img  
            alt="Banner de bienvenida" 
            className="w-full h-full object-cover"
           src="https://images.unsplash.com/photo-1702970106982-af7043c8d168" />
          
          {/* Overlay con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20" />
          
          {/* Texto de bienvenida */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-white px-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              ¡Bienvenido, {user?.nombre}!
            </h1>
            <p className="text-xl md:text-2xl text-center max-w-2xl">
              Tu opinión es importante para mejorar la calidad educativa
            </p>
          </motion.div>
        </div>

        {/* Sección de la encuesta */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">
              Encuesta para Egresados
            </h2>
            <p className="text-gray-600 mb-8">
              Tu retroalimentación nos ayudará a mejorar la experiencia educativa para futuros estudiantes.
            </p>
            <Button
              onClick={handleStartSurvey}
              className="bg-[#088c44] hover:bg-[#086c34] text-white px-8 py-6 text-lg rounded-lg transition-transform hover:scale-105"
            >
              Iniciar Encuesta
            </Button>
          </motion.div>
        </section>
      </main>
    </div>
  )
}

export default EgresadoPage
