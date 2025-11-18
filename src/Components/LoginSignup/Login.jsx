import React, { useState } from 'react'
import './LoginSignup.css'
import { Link } from "react-router-dom";

import email_icon from '../../assets/email.png'
import password_icon from '../../assets/password.png'

export const Login = () => {

    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = {name, email};
        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => null);
            console.log('login response:', res.status, data);
        } catch (e) {
            console.error('Network error. Please try again.');
        }
    };

  
    return (
        <div className='container'>

            <div className="header">
                <div className="text">Login</div>
                <div className="underline"></div>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="inputs">
                    <div className="input">
                        <img src={email_icon} alt="email icon"/>
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                    </div>
                </div>

                <div className="inputs">
                    <div className="input">
                        <img src={password_icon} alt="password icon"/>
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    </div>
                </div>

                <div className="submit-container">
                    <button type="submit" className='submit'>Submit</button>
                </div>

            </form>

                <div className="forgot-password"><a href='https://www.google.com'>Forgot password?</a></div>

                <span>Not a member yet? <Link to="/signup">Sign Up</Link></span>

        </div>
)
}