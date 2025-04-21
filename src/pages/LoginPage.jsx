
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

function LoginPage() {
  const [controlNumber, setControlNumber] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!controlNumber || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa todos los campos requeridos."
      })
      setIsLoading(false)
      return
    }

    const controlNumberInt = parseInt(controlNumber, 10)

    if (isNaN(controlNumberInt)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El número de control debe ser un número válido."
      })
      setIsLoading(false)
      return
    }

    try {
      // First, get the basic user data
      const { data: egresado, error } = await supabase
        .from('egresado')
        .select(`
          numero_control,
          contraseña,
          nombre,
          apellido,
          id_carrera,
          id_tipo_usuario,
          carrera:id_carrera (
            id_carrera,
            nombre
          )
        `)
        .eq('numero_control', controlNumberInt)
        .single()

      if (error) {
        console.error('Database error:', error)
        throw new Error('Error al buscar usuario')
      }

      if (!egresado) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Número de control o contraseña incorrectos"
        })
        return
      }

      if (egresado.contraseña !== password) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Número de control o contraseña incorrectos"
        })
        return
      }

      // Login successful
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${egresado.nombre} ${egresado.apellido}`
      })

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        numeroControl: egresado.numero_control,
        nombre: egresado.nombre,
        apellido: egresado.apellido,
        carrera: egresado.carrera?.nombre || 'Super Usuario',
        idCarrera: egresado.carrera?.id_carrera || 12,
        tipoUsuario: egresado.id_tipo_usuario
      }))

      // Redirect based on user type
      switch (egresado.id_tipo_usuario) {
        case 1: // egresado
          navigate('/egresado')
          break
        case 2: // jefe de departamento
          navigate('/jefe-departamento')
          break
        case 3: // superusuario
          navigate('/super-usuario')
          break
        default:
          toast({
            variant: "destructive",
            title: "Error",
            description: "Tipo de usuario no válido"
          })
          navigate('/login')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al iniciar sesión. Por favor intenta de nuevo."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Barra azul superior */}
      <div className="bg-blue-900 h-16 flex items-center px-6">
        <img  
          alt="Logo TecNM" 
          className="h-12"
         src="https://images.unsplash.com/photo-1571243545933-0cda65bbb621" />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-orange-500 mb-8">
            INICIA SESIÓN
          </h2>
          
          <div className="bg-gray-100 p-8 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="controlNumber" className="text-gray-700">
                  Número de Control
                </Label>
                <Input
                  id="controlNumber"
                  type="number"
                  value={controlNumber}
                  onChange={(e) => setControlNumber(e.target.value)}
                  placeholder="Ingresa tu número de control"
                  className="bg-white border-gray-300"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="bg-white border-gray-300"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Cargando..." : "Ingresar"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
