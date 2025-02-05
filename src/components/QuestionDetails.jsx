import { useContext, useState, useEffect } from "react";
import { useParams } from "react-router";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  increment,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { QuestionContext } from "../context/QuestionContext";

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

  // ✅ Load answers in real-time and sort by votes
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

  // ✅ Fetch user's voted answers
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

  // ✅ Post an answer
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

      setAnswerText(""); // Reset input
    } catch (err) {
      setError("Error posting answer.");
    }
  };

  // ✅ Upvote an answer (only once per user)
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

  // ✅ Start editing an answer
  const startEditingAnswer = (answer) => {
    setEditingAnswerId(answer.id);
    setEditAnswerText(answer.text);
  };

  // ✅ Save the edited answer
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

  // ✅ Delete an answer (only for the original author)
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
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {question ? (
        <>
          <h2>{question.text}</h2>
          <p>
            👤 {question.author} | 👍 {question.votes} votes
          </p>

          <h3>Post an Answer</h3>
          <input
            type="text"
            placeholder="Write your answer..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
          <button onClick={postAnswer}>Post Answer</button>

          <h3>Answers</h3>
          <ul>
            {answers.length > 0 ? (
              answers.map((answer) => (
                <li
                  key={answer.id}
                  style={{
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    padding: "10px",
                  }}
                >
                  {editingAnswerId === answer.id ? (
                    <>
                      <input
                        type="text"
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                      />
                      <button onClick={saveEditedAnswer}>Save</button>
                      <button onClick={() => setEditingAnswerId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        {answer.text} - 👤 {answer.author} | 👍 {answer.votes}{" "}
                        votes
                      </p>
                    </>
                  )}

                  <div style={{ display: "flex", gap: "10px" }}>
                    {user && user.uid === answer.userId && (
                      <>
                        <button onClick={() => startEditingAnswer(answer)}>
                          Edit
                        </button>
                        <button onClick={() => deleteAnswer(answer.id)}>
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => upvoteAnswer(answer.id)}
                      disabled={votedAnswers.has(answer.id)}
                    >
                      {votedAnswers.has(answer.id) ? "Voted" : "Upvote"}
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <p>No answers yet. Be the first to answer!</p>
            )}
          </ul>
        </>
      ) : (
        <p>Loading question...</p>
      )}
    </div>
  );
};

export default QuestionDetails;
