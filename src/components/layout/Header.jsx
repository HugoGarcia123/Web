
import React from "react"
import { useNavigate } from "react-router-dom"

function Header() {
  const navigate = useNavigate()

  return (
    <header className="bg-[#084c7c] text-white py-4 px-6 fixed w-full top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <img  
          alt="Logo TecNM" 
          className="h-12 cursor-pointer hover:opacity-80 transition-opacity"
          src="https://storage.googleapis.com/hostinger-horizons-assets-prod/4df252ff-053b-4ea9-b886-d5c40af06931/ce84df1df24a1c48e906f43fca26b473.png"
          onClick={() => navigate('/login')}
        />
      </div>
    </header>
  )
}

export default Header
