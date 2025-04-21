
import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import QuestionCard from "@/components/survey/QuestionCard"

function EncuestaGeneralPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [surveyName, setSurveyName] = useState("")
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const checkSurveyCompletion = async () => {
      try {
        const { data: egresado, error } = await supabase
          .from('egresado')
          .select('encuesta_completada')
          .eq('numero_control', user.numeroControl)
          .single()

        if (error) throw error

        if (egresado.encuesta_completada) {
          toast({
            title: "Encuesta ya completada",
            description: "Ya has completado esta encuesta anteriormente.",
            duration: 5000
          })
          navigate('/egresado')
          return
        }

        // Get survey with id 2 (general survey)
        const { data: surveyData, error: surveyError } = await supabase
          .from('encuestas')
          .select('id_encuesta, nombre')
          .eq('id_encuesta', 2)
          .single()

        if (surveyError) throw surveyError

        setSurveyName(surveyData.nombre)

        const { data: questions, error: questionsError } = await supabase
          .from('preguntas')
          .select(`
            id_pregunta,
            texto,
            tipo_pregunta (
              id_tipo_pregunta,
              tipo
            ),
            opciones (
              id_opcion,
              texto
            )
          `)
          .eq('id_encuesta', surveyData.id_encuesta)
          .order('id_pregunta', { ascending: true })

        if (questionsError) throw questionsError

        setQuestions(questions)
      } catch (error) {
        console.error('Error:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las preguntas de la encuesta."
        })
        navigate('/egresado')
      } finally {
        setIsLoading(false)
      }
    }

    checkSurveyCompletion()
  }, [navigate, toast, user])

  const handleAnswerChange = (questionId, value, isMultiple = false) => {
    if (isMultiple) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...(prev[questionId] || {}),
          [value]: !(prev[questionId]?.[value] || false)
        }
      }))
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) {
      return // Prevent multiple submissions
    }
    
    setIsSubmitting(true)

    try {
      // Check if survey is already completed
      const { data: checkData, error: checkError } = await supabase
        .from('egresado')
        .select('encuesta_completada')
        .eq('numero_control', user.numeroControl)
        .single()

      if (checkError) throw checkError

      if (checkData.encuesta_completada) {
        toast({
          variant: "destructive",
          title: "Encuesta ya completada",
          description: "Esta encuesta ya fue completada anteriormente."
        })
        navigate('/egresado')
        return
      }

      // Save all answers
      for (const [questionId, value] of Object.entries(answers)) {
        const question = questions.find(q => q.id_pregunta === parseInt(questionId))
        
        if (!question) continue

        const baseAnswer = {
          id_pregunta: parseInt(questionId),
          numero_control: user.numeroControl,
          id_opcion: null,
          respuesta_texto: null
        }

        switch (question.tipo_pregunta.id_tipo_pregunta) {
          case 1: // Pregunta Abierta
            const { error: openError } = await supabase
              .from('respuestas')
              .insert([{
                ...baseAnswer,
                respuesta_texto: value
              }])

            if (openError) throw openError
            break

          case 2: // Opción Única
            const { error: singleError } = await supabase
              .from('respuestas')
              .insert([{
                ...baseAnswer,
                id_opcion: parseInt(value)
              }])

            if (singleError) throw singleError
            break

          case 3: // Opción Múltiple
            const { data: multipleResponse, error: multipleError } = await supabase
              .from('respuestas')
              .insert([baseAnswer])
              .select()

            if (multipleError) throw multipleError

            const selectedOptions = Object.entries(value)
              .filter(([_, isSelected]) => isSelected)
              .map(([optionId]) => parseInt(optionId))

            if (selectedOptions.length > 0) {
              const optionsToInsert = selectedOptions.map(optionId => ({
                id_respuesta: multipleResponse[0].id_respuesta,
                id_opcion: optionId
              }))

              const { error: optionsError } = await supabase
                .from('respuestas_opciones')
                .insert(optionsToInsert)

              if (optionsError) throw optionsError
            }
            break
        }
      }

      // Mark survey as completed and update fecha_respuesta
      const { error: updateError } = await supabase
        .from('egresado')
        .update({ 
          encuesta_completada: true,
          fecha_respuesta: new Date().toISOString()
        })
        .eq('numero_control', user.numeroControl)

      if (updateError) throw updateError

      toast({
        title: "¡Éxito!",
        description: "Tu encuesta ha sido guardada correctamente."
      })

      // Immediate redirect
      navigate('/egresado')
    } catch (error) {
      console.error('Error saving answers:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un error al guardar tus respuestas. Por favor intenta de nuevo."
      })
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Cargando encuesta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#084c7c] text-white py-4 px-6 fixed w-full top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <img  
            alt="Logo TecNM" 
            className="h-12"
            src="https://images.unsplash.com/photo-1571243545933-0cda65bbb621" />
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Survey title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center mb-12"
          >
            {surveyName}
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((question) => (
              <QuestionCard
                key={question.id_pregunta}
                question={question}
                answers={answers}
                onAnswerChange={handleAnswerChange}
              />
            ))}

            {/* Submit button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
              <div className="max-w-3xl mx-auto">
                <Button
                  type="submit"
                  className="w-full bg-[#084c7c] hover:bg-[#084c7c]/90 text-white py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Enviar Encuesta"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default EncuestaGeneralPage
