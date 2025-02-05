import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  increment,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

const GroupQuestions = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [isMember, setIsMember] = useState(null);
  const [votedQuestions, setVotedQuestions] = useState(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));

    const checkMembership = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "group_members"),
          where("userId", "==", user.uid),
          where("groupId", "==", groupId)
        );
        const snapshot = await getDocs(q);
        setIsMember(!snapshot.empty);
      } catch (err) {
        setError("Error checking group membership.");
        setIsMember(false);
      }
    };

    const fetchUserVotes = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, `groups/${groupId}/question_votes`),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const voted = new Set(
          snapshot.docs.map((doc) => doc.data().questionId)
        );
        setVotedQuestions(voted);
      } catch (err) {
        setError("Error fetching user votes.");
      }
    };

    const listenForQuestions = () => {
      return onSnapshot(
        collection(db, `groups/${groupId}/questions`),
        (snapshot) => {
          const questionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setQuestions(questionsData);
        }
      );
    };

    checkMembership();
    if (isMember) {
      fetchUserVotes();
      const unsubscribeQuestions = listenForQuestions();
      return () => unsubscribeQuestions();
    }

    return () => unsubscribeAuth();
  }, [groupId, user, isMember]);

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

  if (isMember === null) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Loading...</h2>
        <p>Checking your membership status...</p>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Access Denied</h2>
        <p>You must join this group to view and post questions.</p>
        <button onClick={() => navigate("/groups")}>Back to Groups</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Group Q&A</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {user && isMember && (
        <div>
          <h3>Ask a Question</h3>
          <input
            type="text"
            placeholder="Type your question..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
          <button
            onClick={() => {
              setSuccess("");
              setError("");
              postQuestion();
            }}
            style={{ marginLeft: "10px", padding: "5px 15px" }}
          >
            Post Question
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {questions
          .sort((a, b) => b.votes - a.votes)
          .map((question) => (
            <li
              key={question.id}
              style={{
                margin: "10px 0",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            >
              <p>{question.text}</p>
              <p>
                👤 {question.author} | 👍 {question.votes} votes
              </p>
              {isMember && (
                <button
                  onClick={() => upvoteQuestion(question.id)}
                  disabled={votedQuestions.has(question.id)}
                >
                  {votedQuestions.has(question.id) ? "Voted" : "Upvote"}
                </button>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default GroupQuestions;
