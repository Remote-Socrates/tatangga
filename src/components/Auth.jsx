import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebaseConfig";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import "../index.css";

const Auth = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/"); // Pentalin ke home abis login
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <Container fluid className="auth-container text-center">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={10}>
          <img
            src="https://img.freepik.com/free-vector/neighbors-communication-friendly-people-windows_107791-15347.jpg"
            alt="Community"
            className="img-fluid auth-banner"
          />
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={12}>
          <Card className="p-5 shadow-lg auth-card">
            <h1 className="auth-title">Euy TATANGGA!</h1>
            <p className="text-muted">Gabung dan mulai Q&A dengan tetangga!</p>

            {error && <p className="text-danger">{error}</p>}

            {user ? (
              <>
                <p className="text-secondary">
                  Anda sudah masuk sebagai{" "}
                  <strong>{user.displayName || user.email}</strong>
                </p>
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  onClick={() => navigate("/")}
                >
                  <i className="bi bi-house-door"></i> Ke Home
                </Button>
              </>
            ) : (
              <Button
                variant="danger"
                className="w-100 mt-3"
                onClick={loginWithGoogle}
              >
                <i className="bi bi-google"></i> Masuk dengan Google
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Auth;
