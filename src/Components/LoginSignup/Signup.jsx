import './LoginSignup.css'
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import user_icon from '../../assets/person.png'
import email_icon from '../../assets/email.png'
import password_icon from '../../assets/password.png'

export const Signup = () => {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [msg, setMsg] = useState(null);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        const body = { name, email, password };
        try {
            const res = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.status === 201) {
                if (res.status === 201) {
                    setMsg({ type: 'success', text: 'Account created! Redirecting to login…' });
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    const err = await res.json().catch(() => ({}));
                    setMsg({ type: 'error', text: err.error || `Signup failed (${res.status})` });
                }
                ;
            } else {
                const err = await res.json().catch(() => ({}));
                setMsg({ type: 'error', text: err.error || `Signup failed (${res.status})` });
            }
        } catch (e) {
            setMsg({ type: 'error', text: 'Network error. Please try again.' });
        }
    };


    return (
      <div className='container'>

          <div className="header">
              <div className="text">Sign Up</div>
              <div className="underline"></div>
          </div>

          <form onSubmit={handleSubmit}>
              <div className="inputs">
                  <div className="input">
                      <img src={user_icon} alt="user icon"/>
                      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}/>
                  </div>

              </div>

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

              msg && (
                  <div role="alert" className={`notice ${msg.type}`}>
                      {msg.text}
                  </div>
              )

          </form>

              <span>Already have an account? <Link to="/login">Sign in</Link></span>
      </div>
)
}
