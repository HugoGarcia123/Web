
import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

function JefeDepartamentoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const user = JSON.parse(localStorage.getItem('user'))
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  React.useEffect(() => {
    if (!user || user.tipoUsuario !== 2) {
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página"
      })
      navigate('/login')
    }
  }, [user, navigate, toast])

  const handleViewReport = () => {
    navigate('/informe', {
      state: {
        selectedCareer: user.idCarrera,
        startDate,
        endDate
      }
    })
  }

  const handleDownloadExcel = async () => {
    console.log("🚀 Iniciando descarga...")
    setIsDownloading(true)
    
    try {
      // Build query for graduates who completed the survey
      let query = supabase
        .from('egresado')
        .select('numero_control, nombre, apellido, telefono, correo')
        .eq('id_carrera', user.idCarrera)
        .eq('encuesta_completada', true)

      // Add date filters only if both dates are provided
      if (startDate && endDate) {
        query = query
          .gte('fecha_respuesta', `${startDate}T00:00:00`)
          .lte('fecha_respuesta', `${endDate}T23:59:59`)
      }

      const { data: graduates, error: graduatesError } = await query

      if (graduatesError) throw graduatesError
      console.log("📋 Graduates:", graduates)

      if (!graduates?.length) {
        toast({
          variant: "destructive",
          title: "Sin datos",
          description: "No hay egresados que hayan completado la encuesta"
        })
        setIsDownloading(false)
        return
      }

      // Get responses for single choice questions
      const baseQuestionIds = user.idCarrera === 2 || user.idCarrera === 3 
        ? { titulado: 6, labora: 9, sector: 14 }
        : { titulado: 45, labora: 48, sector: 53 }

      const { data: singleChoiceResponses, error: singleChoiceError } = await supabase
        .from('respuestas')
        .select('numero_control, id_pregunta, opciones:id_opcion(texto)')
        .in('numero_control', graduates.map(g => g.numero_control))
        .in('id_pregunta', Object.values(baseQuestionIds))

      if (singleChoiceError) throw singleChoiceError

      // Get responses for area de desempeño (multiple choice)
      const areaQuestionId = user.idCarrera === 2 || user.idCarrera === 3 ? 16 : 55
      const { data: areaResponses, error: areaError } = await supabase
        .from('respuestas')
        .select(`
          numero_control,
          respuestas_opciones (
            opciones (
              texto
            )
          )
        `)
        .eq('id_pregunta', areaQuestionId)
        .in('numero_control', graduates.map(g => g.numero_control))

      if (areaError) throw areaError

      // Process data for Excel
      const excelData = graduates.map(graduate => {
        const getResponseText = (questionId) => {
          const response = singleChoiceResponses.find(
            r => r.numero_control === graduate.numero_control && r.id_pregunta === questionId
          )
          return response?.opciones?.texto || ''
        }

        // Get area de desempeño text
        const areaResponse = areaResponses.find(
          r => r.numero_control === graduate.numero_control
        )
        const areaText = areaResponse?.respuestas_opciones
          ?.map(ro => ro.opciones.texto)
          .join(', ') || ''

        return {
          'No. DE CONTROL': graduate.numero_control,
          'NOMBRE DEL EGRESADO': `${graduate.nombre} ${graduate.apellido}`,
          'TELÉFONO': graduate.telefono || '',
          'CORREO': graduate.correo || '',
          'TITULADO': getResponseText(baseQuestionIds.titulado),
          'LABORA (SI/NO)': getResponseText(baseQuestionIds.labora),
          'SECTOR (PUBLICO / PRIVADO)': getResponseText(baseQuestionIds.sector),
          'AREA DE DESEMPEÑO': areaText
        }
      })

      console.log("📊 Datos para Excel:", excelData)

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // No. DE CONTROL
        { wch: 35 }, // NOMBRE DEL EGRESADO
        { wch: 15 }, // TELÉFONO
        { wch: 35 }, // CORREO
        { wch: 12 }, // TITULADO
        { wch: 15 }, // LABORA
        { wch: 25 }, // SECTOR
        { wch: 35 }  // AREA DE DESEMPEÑO
      ]

      // Style the header row
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1"
        if (!ws[address]) continue
        ws[address].s = {
          fill: { fgColor: { rgb: "084C7C" } },
          font: { color: { rgb: "FFFFFF" }, bold: true },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Egresados')

      // Generate filename with date range if provided
      let fileName = `egresados_${user.carrera.replace(/\s+/g, '_')}`
      if (startDate && endDate) {
        fileName += `_${startDate}_a_${endDate}`
      }
      fileName += '.xlsx'
      
      console.log("💾 Escribiendo archivo:", fileName)

      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, fileName)

      toast({
        title: "¡Éxito!",
        description: "La tabla se ha descargado correctamente"
      })
    } catch (error) {
      console.error('Error downloading excel:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar la tabla. Por favor intenta de nuevo."
      })
    } finally {
      setIsDownloading(false)
    }
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
      <main className="container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-[#084c7c] mb-4">
              ¡Bienvenid@ {user?.nombre}!
            </h1>
            <h2 className="text-2xl text-gray-700">
              Jef@ de Departamento de {user?.carrera}
            </h2>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 rounded-lg overflow-hidden shadow-xl"
          >
            <img 
              className="w-full h-64 object-cover"
              alt="Departamento académico"
              src="https://images.unsplash.com/photo-1555529941-66b8c99c4593" />
          </motion.div>

          {/* Date Range Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-100 p-6 rounded-lg mb-8"
          >
            <h3 className="text-lg font-semibold mb-4 text-[#084c7c]">
              Selecciona el rango de fechas (opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Button
              onClick={handleViewReport}
              className="bg-[#084c7c] hover:bg-[#084c7c]/90 text-white p-8 text-lg rounded-lg transition-transform hover:scale-105"
            >
              Ver Informe
            </Button>
            <Button
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              className="bg-[#084c7c] hover:bg-[#084c7c]/90 text-white p-8 text-lg rounded-lg transition-transform hover:scale-105"
            >
              {isDownloading ? "Descargando..." : "Descargar Tabla"}
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default JefeDepartamentoPage
