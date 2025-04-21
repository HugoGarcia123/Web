
import React from "react"

function SurveyHeader() {
  return (
    <header className="bg-[#084c7c] text-white py-4 px-6 fixed w-full top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <img  
          alt="Logo TecNM" 
          className="h-12"
          src="https://images.unsplash.com/photo-1571243545933-0cda65bbb621" />
        <h1 className="text-xl font-semibold">Encuesta para Egresados</h1>
      </div>
    </header>
  )
}

export default SurveyHeader
