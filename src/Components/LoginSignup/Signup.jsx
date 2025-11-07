import React, { useState } from 'react'
import './LoginSignup.css'
import { Link } from "react-router-dom";

import user_icon from '../../assets/person.png'
import email_icon from '../../assets/email.png'
import password_icon from '../../assets/password.png'

export const Signup = () => {


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

      <div className="submit-container">
        <button type="submit" className='submit'>Submit</button>
      </div>

      <span>Already have an account? <Link to="/login">Sign in</Link></span>

      {/* <div className="submit-container">
        <div className={action === "Login" ? "submit gray" : "submit"} onClick={() =>{setAction("Sign Up")}}>Sign Up</div>
        <div className={action === "Sign Up" ? "submit gray" : "submit"} onClick={() =>{setAction("Login")}}>Login</div>
      </div> */}
    </div>
  )
}
