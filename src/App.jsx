import './App.css'
import { Signup } from './Components/LoginSignup/Signup'
import { Login } from './Components/LoginSignup/Login'
import { Welcome } from "./Components/WelcomePage/Welcome";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// const express = require("express");
// var app = express();
// app.use(express.json());

// const signup_route = require('./Components/Signup.jsx');
// app.use("/signup");

// const path = require("path");
// const rootDirectory = path.join(__dirname, '');

// app.get('/signup', (req, res) => {
//   res.send(`${rootDirectory}/Components/LoginSignup/Signup.jsx`);
// })

function App() {
  
  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
