
import React from "react"
import { motion } from "framer-motion"

function SurveyStats({ title, data, type }) {
  const renderOpenAnswers = () => (
    <div className="space-y-4">
      {data.map((answer, index) => (
        <div key={index} className="bg-gray-100 p-4 rounded-lg">
          <p className="text-black">{answer.respuesta_texto}</p>
        </div>
      ))}
    </div>
  )

  const renderChoiceStats = () => {
    const total = data.reduce((acc, curr) => acc + curr.count, 0)
    return (
      <div className="space-y-4">
        {data.map((option, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="min-w-[200px] text-black">{option.texto}</span>
            <div className="flex-1">
              <div className="relative">
                <div className="w-full bg-gray-200 h-8 rounded">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(option.count / total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#2074ac] hover:bg-[#084c7c] transition-colors rounded"
                  />
                </div>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-medium">
                  {option.count} ({((option.count / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-[#084c7c] p-4 rounded-lg mb-4">
        <h3 className="text-lg font-medium text-white">{title}</h3>
      </div>
      <div className="px-4">
        {type === 1 && renderOpenAnswers()}
        {(type === 2 || type === 3) && renderChoiceStats()}
      </div>
    </motion.div>
  )
}

export default SurveyStats
