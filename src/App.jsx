import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Signup } from './Components/LoginSignup/Signup'
import { Login } from './Components/LoginSignup/Login'

function App() {
  
  return (
    <>
      <div>
        
        <Signup />
        <Login />
      </div>
    </>
  )
}

export default App
