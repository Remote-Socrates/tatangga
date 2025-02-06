import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import "../index.css";

import Swal from "sweetalert2";

const Groups = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joinedGroups, setJoinedGroups] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
      setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchJoinedGroups = async () => {
      const q = query(
        collection(db, "group_members"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      setJoinedGroups(snapshot.docs.map((doc) => doc.data().groupId));
    };

    fetchJoinedGroups();
  }, [user]);

  const createGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) {
      setError("");
      Swal.fire({
        title: "Caution",
        icon: "error",
        text: "Please enter both group name and description.",
      });
      return;
    }
    try {
      const newGroupRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        description: groupDescription,
        createdBy: user.uid,
      });
      setGroupName("");
      setGroupDescription("");
      setSuccess("");
      Swal.fire({
        title: "Success",
        icon: "success",
        text: `You have successfully created new group!`,
      });
    } catch (err) {
      setError("Error creating group. Please try again.");
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await addDoc(collection(db, "group_members"), {
        userId: user.uid,
        groupId: groupId,
      });

      setJoinedGroups([...joinedGroups, groupId]);
      setSuccess("");
      const group = groups.find((g) => g.id === groupId);
      Swal.fire({
        title: "Success",
        icon: "success",
        text: `You have successfully joined the ${group.name} group!`,
      });
    } catch (err) {
      setError("Error joining group. Please try again.");
    }
  };

  return (
    <Container fluid className="groups-container text-center">
      <h2 className="groups-title">Explore Groups</h2>
      {error && <p className="text-danger">{error}</p>}
      {success && <p className="text-success">{success}</p>}

      {user && (
        <Card className="p-4 shadow-sm create-group-card">
          <h4>Create a New Group</h4>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-2"
            />
            <Form.Control
              type="text"
              placeholder="Group Description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="mb-2"
            />
            <Button variant="primary" onClick={createGroup}>
              Create Group
            </Button>
          </Form.Group>
        </Card>
      )}

      <Row className="mt-4">
        {groups.map((group) => (
          <Col xs={12} md={6} lg={4} key={group.id} className="mb-4">
            <Card className="group-card shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="flex-grow-1">
                  <Card.Title className="fw-bold">{group.name}</Card.Title>
                  <Card.Text className="text-muted mb-3">
                    {group.description}
                  </Card.Text>
                </div>

                <div className="button-container">
                  <Button
                    variant="outline-primary"
                    className="w-100 rounded-pill"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    View Group
                  </Button>

                  <div className="button-placeholder">
                    {!joinedGroups.includes(group.id) && (
                      <Button
                        variant="outline-primary"
                        className="w-100 mt-2 rounded-pill"
                        onClick={() => joinGroup(group.id)}
                      >
                        Join Group
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Groups;
