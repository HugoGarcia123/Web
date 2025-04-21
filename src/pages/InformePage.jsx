
import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

function InformePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user'))
  const [surveyResults, setSurveyResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [careerName, setCareerName] = useState("")

  // IDs of questions to exclude
  const excludedQuestionIds = [1, 2, 3, 40, 41, 42]

  useEffect(() => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "Por favor inicia sesión"
      })
      navigate('/login')
      return
    }

    // Get parameters from state
    const params = location.state || {}
    const selectedCareer = params.selectedCareer || user.idCarrera

    if (user.tipoUsuario === 3 && !selectedCareer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona una carrera"
      })
      navigate('/super-usuario')
      return
    }

    const fetchResults = async () => {
      try {
        // Get career name
        if (user.tipoUsuario === 3) {
          const { data: careerData, error: careerError } = await supabase
            .from('carrera')
            .select('nombre')
            .eq('id_carrera', selectedCareer)
            .single()

          if (careerError) throw careerError
          setCareerName(careerData.nombre)
        } else {
          setCareerName(user.carrera)
        }

        const surveyId = parseInt(selectedCareer) === 2 || parseInt(selectedCareer) === 3 ? 1 : 2

        // Get all questions excluding specific IDs
        const { data: questions, error: questionsError } = await supabase
          .from('preguntas')
          .select(`
            id_pregunta,
            texto,
            tipo_pregunta!inner (
              id_tipo_pregunta,
              tipo
            ),
            opciones (
              id_opcion,
              texto
            )
          `)
          .eq('id_encuesta', surveyId)
          .not('id_pregunta', 'in', `(${excludedQuestionIds.join(',')})`)
          .order('id_pregunta')

        if (questionsError) throw questionsError

        // Build base query for responses
        let query = supabase
          .from('respuestas')
          .select(`
            id_respuesta,
            id_pregunta,
            id_opcion,
            respuesta_texto,
            egresado!inner (id_carrera)
          `)
          .eq('egresado.id_carrera', selectedCareer)

        // Add date filters if provided
        const { startDate, endDate } = location.state || {}
        if (startDate && endDate) {
          query = query
            .gte('egresado.fecha_respuesta', `${startDate}T00:00:00`)
            .lte('egresado.fecha_respuesta', `${endDate}T23:59:59`)
        }

        // Execute query
        const { data: allResponses, error: responsesError } = await query
        if (responsesError) throw responsesError

        // Get multiple choice responses
        const { data: multipleResponses, error: multipleError } = await supabase
          .from('respuestas_opciones')
          .select(`
            id_respuesta,
            id_opcion,
            opciones!inner (
              texto
            )
          `)
          .in('id_respuesta', allResponses.map(r => r.id_respuesta))

        if (multipleError) throw multipleError

        const results = []

        // Process each question
        for (const question of questions) {
          const questionResponses = allResponses.filter(
            r => r.id_pregunta === question.id_pregunta
          )

          if (questionResponses.length === 0) continue

          if (question.tipo_pregunta.id_tipo_pregunta === 1) {
            // Open questions
            results.push({
              questionText: question.texto,
              type: question.tipo_pregunta.id_tipo_pregunta,
              responses: questionResponses
                .filter(r => r.respuesta_texto)
                .map(r => ({ text: r.respuesta_texto }))
            })
          } else if (question.tipo_pregunta.id_tipo_pregunta === 2) {
            // Single choice
            const optionCounts = {}
            questionResponses.forEach(response => {
              if (response.id_opcion) {
                optionCounts[response.id_opcion] = (optionCounts[response.id_opcion] || 0) + 1
              }
            })

            results.push({
              questionText: question.texto,
              type: question.tipo_pregunta.id_tipo_pregunta,
              responses: question.opciones.map(option => ({
                text: option.texto,
                count: optionCounts[option.id_opcion] || 0
              }))
            })
          } else if (question.tipo_pregunta.id_tipo_pregunta === 3) {
            // Multiple choice
            const optionCounts = {}
            const relevantResponses = multipleResponses.filter(mr =>
              questionResponses.some(qr => qr.id_respuesta === mr.id_respuesta)
            )

            relevantResponses.forEach(response => {
              optionCounts[response.id_opcion] = (optionCounts[response.id_opcion] || 0) + 1
            })

            results.push({
              questionText: question.texto,
              type: question.tipo_pregunta.id_tipo_pregunta,
              responses: question.opciones.map(option => ({
                text: option.texto,
                count: optionCounts[option.id_opcion] || 0
              }))
            })
          }
        }

        setSurveyResults(results)
      } catch (error) {
        console.error('Error fetching results:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los resultados"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [navigate, toast, user, location.state])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#084c7c]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#084c7c] text-white py-4 px-6 fixed w-full top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <img  
            alt="Logo TecNM" 
            className="h-12"
            src="https://images.unsplash.com/photo-1571243545933-0cda65bbb621" />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#084c7c] mb-4">
            Informe de Resultados
          </h1>
          <h2 className="text-2xl text-black">
            {careerName}
          </h2>
        </div>

        <div className="space-y-8">
          {surveyResults.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-[#084c7c] p-4">
                <h3 className="text-lg font-medium text-white">
                  {result.questionText}
                </h3>
              </div>

              <div className="p-4">
                {result.type === 1 ? (
                  <div className="bg-white border border-gray-200 rounded-lg h-[300px] overflow-y-auto">
                    <div className="space-y-2 p-4">
                      {result.responses.map((response, idx) => (
                        <div key={idx} className="bg-gray-100 p-3 rounded">
                          <p className="text-gray-800">{response.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {result.responses.map((response, idx) => {
                      const total = result.responses.reduce((acc, curr) => acc + curr.count, 0)
                      const percentage = total > 0 ? (response.count / total) * 100 : 0

                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{response.text}</span>
                            <span>{response.count} respuestas ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-[#2074ac] hover:bg-[#084c7c] transition-colors"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto">
            <Button
              onClick={() => navigate(user?.tipoUsuario === 3 ? '/super-usuario' : '/jefe-departamento')}
              className="w-full bg-[#084c7c] hover:bg-[#084c7c]/90 text-white py-6 rounded-lg"
            >
              Volver al menú
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default InformePage
