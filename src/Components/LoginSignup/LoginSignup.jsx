import React from 'react'
import './LoginSignup.css'

import user_icon from '../../assets/person.png'
import email_icon from '../../assets/email.png'
import password_icon from '../../assets/password.png'

export const LoginSignup = () => {

  //TO DO:
  //const [action, setAction] = useState("Sign Up"); //action is our current state, setAction is the function that will update our state
  // we use this to update Sign Up to Login when we press the login button
  return (
    <div className='container'>

      <div className="header">
        <div className="text">Sign Up</div>
        <div className="underline"></div>
      </div>

      {/* Name */}
      <div className="inputs">
        <div className="input">
          <img src={user_icon} alt="user icon" />
          <input type="text" placeholder='Name' />
        </div>
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

      <div className="forgot-password"><span>Forgot password?</span></div>

      <div className="submit-container">
        <div className="submit">Sign Up</div>
        <div className="submit">Login</div>
      </div>
    </div>
  )
}
