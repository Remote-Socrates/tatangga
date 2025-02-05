import { useContext, useState, useEffect } from "react";
import { useParams } from "react-router";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  increment,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  doc,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
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

const QuestionDetails = () => {
  const { groupId, questionId } = useParams();
  const { user } = useContext(AuthContext);
  const { questions } = useContext(QuestionContext);
  const question = questions.find((q) => q.id === questionId);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [error, setError] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState("");
  const [votedAnswers, setVotedAnswers] = useState(new Set());

  useEffect(() => {
    if (!groupId || !questionId) return;

    const q = query(
      collection(db, `groups/${groupId}/questions/${questionId}/answers`),
      orderBy("votes", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnswers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [groupId, questionId]);

  useEffect(() => {
    if (!user) return;

    const fetchUserVotes = async () => {
      const q = query(
        collection(
          db,
          `groups/${groupId}/questions/${questionId}/answer_votes`
        ),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      setVotedAnswers(new Set(snapshot.docs.map((doc) => doc.data().answerId)));
    };

    fetchUserVotes();
  }, [user, groupId, questionId]);

  const postAnswer = async () => {
    if (!user) {
      setError("You must be logged in to post an answer.");
      return;
    }

    if (!answerText.trim()) {
      setError("Answer cannot be empty.");
      return;
    }

    try {
      await addDoc(
        collection(db, `groups/${groupId}/questions/${questionId}/answers`),
        {
          text: answerText,
          author: user.displayName || user.email,
          userId: user.uid,
          votes: 0,
        }
      );

      setAnswerText("");
    } catch (err) {
      setError("Error posting answer.");
    }
  };

  const upvoteAnswer = async (answerId) => {
    if (!user) {
      setError("You must be logged in to vote.");
      return;
    }

    if (votedAnswers.has(answerId)) {
      setError("You can only vote on an answer once.");
      return;
    }

    try {
      const answerRef = doc(
        db,
        `groups/${groupId}/questions/${questionId}/answers`,
        answerId
      );
      await updateDoc(answerRef, { votes: increment(1) });

      await addDoc(
        collection(
          db,
          `groups/${groupId}/questions/${questionId}/answer_votes`
        ),
        {
          userId: user.uid,
          answerId: answerId,
        }
      );

      setVotedAnswers(new Set([...votedAnswers, answerId]));
    } catch (err) {
      setError("Error upvoting answer.");
    }
  };

  const startEditingAnswer = (answer) => {
    setEditingAnswerId(answer.id);
    setEditAnswerText(answer.text);
  };

  const saveEditedAnswer = async () => {
    if (!editAnswerText.trim()) {
      setError("Answer cannot be empty.");
      return;
    }

    try {
      const answerRef = doc(
        db,
        `groups/${groupId}/questions/${questionId}/answers`,
        editingAnswerId
      );
      await updateDoc(answerRef, { text: editAnswerText });

      setEditingAnswerId(null);
      setEditAnswerText("");
    } catch (err) {
      setError("Error updating answer.");
    }
  };

  const deleteAnswer = async (answerId) => {
    if (!window.confirm("Are you sure you want to delete this answer?")) return;

    try {
      await deleteDoc(
        doc(db, `groups/${groupId}/questions/${questionId}/answers`, answerId)
      );
    } catch (err) {
      setError("Error deleting answer.");
    }
  };

  return (
    <Container className="mt-5">
      {error && <p className="text-danger">{error}</p>}

      {question ? (
        <Card className="p-4 shadow-lg">
          <Card.Body>
            <h2 className="text-primary">{question.text}</h2>
            <p className="text-muted">
              👤 {question.author} | 👍 {question.votes} votes
            </p>

            {/* Formulir jawaban */}
            <Form className="mt-4">
              <h4>Post an Answer</h4>
              <Form.Control
                type="text"
                placeholder="Write your answer..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="mb-2"
              />
              <Button variant="primary" className="w-100" onClick={postAnswer}>
                Post Answer
              </Button>
            </Form>

            {/* Daftar jawaban di map */}
            <h4 className="mt-4">Answers</h4>
            <ListGroup className="mt-2">
              {answers.length > 0 ? (
                answers.map((answer) => (
                  <ListGroup.Item
                    key={answer.id}
                    className="d-flex flex-column gap-2"
                  >
                    {editingAnswerId === answer.id ? (
                      <div>
                        <Form.Control
                          type="text"
                          value={editAnswerText}
                          onChange={(e) => setEditAnswerText(e.target.value)}
                          className="mb-2"
                        />
                        <Button
                          variant="success"
                          size="sm"
                          onClick={saveEditedAnswer}
                          className="me-2"
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingAnswerId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Row>
                        <Col xs={8}>
                          <p className="mb-1">
                            {answer.text} - 👤 {answer.author} | 👍{" "}
                            {answer.votes} votes
                          </p>
                        </Col>
                        <Col xs={4} className="text-end">
                          {user && user.uid === answer.userId && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => startEditingAnswer(answer)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => deleteAnswer(answer.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="ms-2"
                            onClick={() => upvoteAnswer(answer.id)}
                            disabled={votedAnswers.has(answer.id)}
                          >
                            {votedAnswers.has(answer.id) ? "Voted" : "Upvote"}
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </ListGroup.Item>
                ))
              ) : (
                <p className="text-muted">
                  No answers yet. Be the first to answer!
                </p>
              )}
            </ListGroup>
          </Card.Body>
        </Card>
      ) : (
        <p className="text-muted">Loading question...</p>
      )}
    </Container>
  );
};

export default QuestionDetails;
