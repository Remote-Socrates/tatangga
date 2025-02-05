import { useNavigate } from "react-router";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to the Real-Time Q&A App!</h1>
      {user ? (
        <h2>Hello, {user.displayName || user.email}!</h2>
      ) : (
        <h2>Please sign in to continue.</h2>
      )}

      <button
        onClick={() => navigate("/groups")}
        style={{ padding: "10px 20px", fontSize: "18px", marginTop: "20px" }}
      >
        Let's Q&A!
      </button>

      {user && (
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            fontSize: "18px",
            marginTop: "20px",
            marginLeft: "10px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default Home;
