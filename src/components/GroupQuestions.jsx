import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  increment,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  orderBy,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { GroupContext } from "../context/GroupContext";
import { QuestionContext } from "../context/QuestionContext";
import {
  Container,
  Card,
  Button,
  Form,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";

const GroupQuestions = () => {
  const { groupId } = useParams();
  const { user } = useContext(AuthContext);
  const { selectedGroup, setSelectedGroup } = useContext(GroupContext);
  const { questions, setQuestions } = useContext(QuestionContext);
  const navigate = useNavigate();
  const [questionText, setQuestionText] = useState("");
  const [error, setError] = useState("");
  const [votedQuestions, setVotedQuestions] = useState(new Set());
  const [isMember, setIsMember] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");

  // Ambil informasi grup dari database
  useEffect(() => {
    if (!groupId) return;

    const fetchGroup = async () => {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDocs(
        query(collection(db, "groups"), where("id", "==", groupId))
      );

      if (!groupSnap.empty) {
        setSelectedGroup(groupSnap.docs[0].data());
      }
    };

    fetchGroup();
  }, [groupId, setSelectedGroup]);

  // Cek user anggota grup atau bukan
  useEffect(() => {
    if (!user) {
      setIsMember(false);
      return;
    }

    const checkMembership = async () => {
      const q = query(
        collection(db, "group_members"),
        where("userId", "==", user.uid),
        where("groupId", "==", groupId)
      );
      const snapshot = await getDocs(q);
      setIsMember(!snapshot.empty);
    };

    checkMembership();
  }, [user, groupId]);

  // Ambil pertanyaan dari grup dan yang sudah divote user
  useEffect(() => {
    if (!user || !isMember) return;

    const fetchUserVotes = async () => {
      const q = query(
        collection(db, `groups/${groupId}/question_votes`),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      setVotedQuestions(
        new Set(snapshot.docs.map((doc) => doc.data().questionId))
      );
    };

    fetchUserVotes();
  }, [user, groupId, isMember]);

  // Ambil pertanyaan dan update real time
  useEffect(() => {
    if (!groupId || isMember === false) return;

    const q = query(
      collection(db, `groups/${groupId}/questions`),
      orderBy("votes", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [groupId, isMember, setQuestions]);

  // Posting pertanyaan baru
  const postQuestion = async () => {
    if (!isMember) {
      setError("You must join this group to post a question.");
      return;
    }

    if (!questionText.trim()) {
      setError("Question cannot be empty.");
      return;
    }

    try {
      await addDoc(collection(db, `groups/${groupId}/questions`), {
        text: questionText,
        author: user.displayName || user.email,
        userId: user.uid,
        votes: 0,
      });

      setQuestionText("");
    } catch (err) {
      setError("Error posting question.");
    }
  };

  // Voting pertanyaan
  const upvoteQuestion = async (questionId) => {
    if (!isMember) {
      setError("You must join this group to vote.");
      return;
    }

    if (votedQuestions.has(questionId)) {
      setError("You can only vote on a question once.");
      return;
    }

    try {
      const questionRef = doc(db, `groups/${groupId}/questions`, questionId);
      await updateDoc(questionRef, { votes: increment(1) });

      await addDoc(collection(db, `groups/${groupId}/question_votes`), {
        userId: user.uid,
        questionId: questionId,
      });

      setVotedQuestions(new Set([...votedQuestions, questionId]));
    } catch (err) {
      setError("Error upvoting question.");
    }
  };

  // Blok akses grup kalau bukan member grupnya
  if (isMember === null) {
    return <p className="text-center mt-5">Checking membership status...</p>;
  }

  if (!isMember) {
    return (
      <Container className="mt-5 text-center">
        <Card className="p-5 shadow-lg">
          <h2 className="text-danger">Access Denied</h2>
          <p>You must join this group to view and interact with questions.</p>
          <Button variant="primary" onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      {error && <p className="text-danger">{error}</p>}

      <Card className="p-4 shadow-lg">
        <Card.Body>
          <h2 className="text-primary text-center">
            {selectedGroup?.name || "Group"} Questions
          </h2>

          {/* Form buat nanya pertanyaan */}
          <Form className="mt-4">
            <h4>Post a Question</h4>
            <Form.Control
              type="text"
              placeholder="Ask a question..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="mb-2"
            />
            <Button
              variant="primary"
              className="w-100"
              onClick={postQuestion}
              disabled={!isMember}
            >
              Post Question
            </Button>
          </Form>

          {/* Daftar pertanyaan di map */}
          <h4 className="mt-4">Questions</h4>
          <ListGroup className="mt-2">
            {questions.length > 0 ? (
              questions.map((question) => (
                <ListGroup.Item
                  key={question.id}
                  className="d-flex flex-column gap-2"
                  onClick={() =>
                    navigate(`/groups/${groupId}/questions/${question.id}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <p className="mb-1">
                    <strong>{question.text}</strong>
                  </p>
                  <p className="text-muted mb-0">
                    👤 {question.author} | 👍 {question.votes} votes
                  </p>

                  <Row className="mt-2">
                    <Col>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          upvoteQuestion(question.id);
                        }}
                        disabled={votedQuestions.has(question.id)}
                      >
                        {votedQuestions.has(question.id) ? "Voted" : "Upvote"}
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))
            ) : (
              <p className="text-muted">
                No questions yet. Be the first to ask one!
              </p>
            )}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default GroupQuestions;
