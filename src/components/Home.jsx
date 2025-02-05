import { useNavigate } from "react-router";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import "../index.css"; // Ensure styles are imported

import Swal from "sweetalert2";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      Swal.fire({
        title: "Are you sure you want to logout?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes!",
      }).then(result => {
        if (result.isConfirmed) {
          try {
            signOut(auth);
            setUser(null);
          } catch (err) {
            setError("Error logging out.");
          }
        } else {
          Swal.fire("Cancelled", "Logout Cancelled", "error");
        }
      })
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <Container fluid className="home-container text-center">
      {/* Gambar */}
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={10}>
          <img
            src="https://img.freepik.com/free-vector/neighbors-communication-friendly-people-windows_107791-15347.jpg"
            alt="Community"
            className="img-fluid home-banner"
          />
        </Col>
      </Row>

      {/* Kartu welcome */}
      <Row className="justify-content-center">
        <Col xs={12} md={12} lg={12}>
          <Card className="p-5 shadow-lg home-card">
            <h1 className="home-title">Euy TATANGGA!</h1>
            {user ? (
              <h3 className="text-secondary">
                Halo, {user.displayName || user.email}!
              </h3>
            ) : (
              <h3 className="text-secondary">Sign in dulu yaa.</h3>
            )}

            <div className="mt-4">
              <Button
                variant="primary"
                size="lg"
                className="px-4 py-2"
                onClick={() => navigate("/groups")}
              >
                <i className="bi bi-chat-left-text"></i> Yu Q&A!
              </Button>

              {user && (
                <Button
                  variant="danger"
                  size="lg"
                  className="ms-3 px-4 py-2"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i> Keluar
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
