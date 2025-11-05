import React, { useState } from 'react'
import './LoginSignup.css'

import user_icon from '../../assets/person.png'
import email_icon from '../../assets/email.png'
import password_icon from '../../assets/password.png'

export const LoginSignup = () => {

  const [action, setAction] = useState("Sign Up");

  return (
    <div className='container'>

      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      {/* Name */}
      <div className="inputs">
        {action === "Login" ? <div></div> :
          <div className="input">
          <img src={user_icon} alt="user icon" />
          <input type="text" placeholder='Name' />
        </div>
        }
        
      </div>

      {/* email */}
      <div className="inputs">
        <div className="input">
          <img src={email_icon} alt="email icon" />
          <input type="email" placeholder='Email' />
        </div>
      </div>

      {/* password */}
      <div className="inputs">
        <div className="input">
          <img src={password_icon} alt="password icon" />
          <input type="password" placeholder='Password' />
        </div>
      </div>

      {action === "Sign Up" ? <div></div> : <div className="forgot-password"><span>Forgot password?</span></div>}

      <div className="submit-container">
        <div className={action === "Login" ? "submit gray" : "submit"} onClick={() =>{setAction("Sign Up")}}>Sign Up</div>
        <div className={action === "Sign Up" ? "submit gray" : "submit"} onClick={() =>{setAction("Login")}}>Login</div>
      </div>
    </div>
    //TODO: better practice is to use routes to redirect the user to a /login page and /signup page upon button press
  )
}
