
import React from "react"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

function QuestionCard({ question, answers, onAnswerChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Question header with blue background */}
      <div className="bg-[#084c7c] p-4 rounded-t-lg">
        <Label className="text-lg font-medium text-white block">
          {question.texto}
        </Label>
      </div>

      {/* Answer section with gray background */}
      <div className="bg-[#e0e0e0] p-4 rounded-b-lg">
        {question.tipo_pregunta.tipo === 'Abierta' && (
          <textarea
            value={answers[question.id_pregunta] || ''}
            onChange={(e) => onAnswerChange(question.id_pregunta, e.target.value)}
            className="w-full p-3 rounded-md border-0 focus:ring-2 focus:ring-[#084c7c] bg-white"
            placeholder="Tu respuesta..."
            rows={4}
          />
        )}

        {question.tipo_pregunta.tipo === 'Opción Única' && (
          <div className="flex flex-wrap justify-center gap-8">
            {question.opciones.map((option) => (
              <div key={option.id_opcion} className="flex flex-col items-center gap-2">
                <input
                  type="radio"
                  name={`question-${question.id_pregunta}`}
                  value={option.id_opcion}
                  checked={answers[question.id_pregunta] === option.id_opcion.toString()}
                  onChange={(e) => onAnswerChange(question.id_pregunta, e.target.value)}
                  className="w-6 h-6 text-black border-gray-300 focus:ring-[#084c7c] checked:bg-black"
                />
                <span className="text-center text-black">{option.texto}</span>
              </div>
            ))}
          </div>
        )}

        {question.tipo_pregunta.tipo === 'Opción Múltiple' && (
          <div className="flex flex-wrap gap-6">
            {question.opciones.map((option) => (
              <div key={option.id_opcion} className="flex flex-col items-center gap-2">
                <input
                  type="checkbox"
                  value={option.id_opcion}
                  checked={answers[question.id_pregunta]?.[option.id_opcion] || false}
                  onChange={() => onAnswerChange(
                    question.id_pregunta,
                    option.id_opcion,
                    true
                  )}
                  className="w-6 h-6 rounded text-black border-gray-300 focus:ring-[#084c7c] checked:bg-black"
                />
                <span className="text-center text-black">{option.texto}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default QuestionCard
