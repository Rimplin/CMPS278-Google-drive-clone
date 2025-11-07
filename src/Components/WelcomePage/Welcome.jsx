import { useNavigate } from "react-router-dom";
import "./Welcome.css"; // optional styling

export const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <h1>Welcome!</h1>
      <div className="button-group">
        <button onClick={() => navigate("/signup")}>Sign Up</button>
        <button onClick={() => navigate("/login")}>Login</button>
      </div>
    </div>
  );
};