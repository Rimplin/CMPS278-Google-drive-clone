import React, { useState } from 'react'
import './LoginSignup.css'

import email_icon from '../../assets/email.png'
import password_icon from '../../assets/password.png'

export const Login = () => {
  
    return (
      <div className='container'>
  
        <div className="header">
          <div className="text">Login</div>
          <div className="underline"></div>
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

        <div className="submit-container">
          <button type="submit" className='submit'>Submit</button>
        </div>
  
        <div className="forgot-password"><a href='https://www.google.com'>Forgot password?</a></div>
  
        <p>Not a member yet? Click <a>here</a> to sign up</p>

      </div>
    )
  }