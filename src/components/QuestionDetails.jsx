import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const QuestionDetails = () => {
  const { groupId, questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [isMember, setIsMember] = useState(null);
  const [votedAnswers, setVotedAnswers] = useState(new Set());
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

    const fetchQuestion = async () => {
      try {
        const questionRef = doc(
          db,
          `groups/${groupId}/questions/${questionId}`
        );
        const docSnap = await getDoc(questionRef);
        if (docSnap.exists()) {
          setQuestion({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Question not found.");
        }
      } catch (err) {
        setError("Failed to load question.");
      }
    };

    const listenForAnswers = () => {
      return onSnapshot(
        collection(db, `groups/${groupId}/questions/${questionId}/answers`),
        (snapshot) => {
          setAnswers(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
      );
    };

    const fetchUserVotes = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(
            db,
            `groups/${groupId}/questions/${questionId}/answer_votes`
          ),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const voted = new Set(snapshot.docs.map((doc) => doc.data().answerId));
        setVotedAnswers(voted);
      } catch (err) {
        setError("Error fetching answer votes.");
      }
    };

    checkMembership();
    if (isMember) {
      fetchQuestion();
      fetchUserVotes();
      const unsubscribeAnswers = listenForAnswers();
      return () => unsubscribeAnswers();
    }

    return () => unsubscribeAuth();
  }, [groupId, questionId, user, isMember]);

  const postAnswer = async () => {
    setError("");
    setSuccess("");

    if (!user) {
      setError("You must be logged in to post an answer.");
      return;
    }

    if (!isMember) {
      setError("You must join this group to answer a question.");
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
          votes: 0,
          timestamp: serverTimestamp(),
        }
      );

      setAnswerText("");
      setSuccess("Answer posted successfully!");
    } catch (err) {
      setError("Error posting answer. Please try again.");
    }
  };

  const upvoteAnswer = async (answerId) => {
    if (!isMember) {
      setError("You must join this group to vote.");
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

  if (isMember === null) {
    return <p>Loading...</p>;
  }

  if (!isMember) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Access Denied</h2>
        <p>You must join this group to view answers.</p>
        <button onClick={() => navigate(`/groups/${groupId}`)}>
          Back to Questions
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Question Details</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {question ? (
        <div>
          <h3>{question.text}</h3>
          <p>
            👤 {question.author} | 👍 {question.votes} votes
          </p>
        </div>
      ) : (
        <p>Loading question...</p>
      )}

      <input
        type="text"
        placeholder="Write your answer..."
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
      />
      <button onClick={postAnswer}>Post Answer</button>

      <h3>Answers</h3>
      <ul>
        {answers
          .sort((a, b) => b.votes - a.votes)
          .map((answer) => (
            <li key={answer.id}>
              <p>
                {answer.text} - 👤 {answer.author} | 👍 {answer.votes} votes
              </p>
              {isMember && (
                <button
                  onClick={() => upvoteAnswer(answer.id)}
                  disabled={votedAnswers.has(answer.id)}
                >
                  {votedAnswers.has(answer.id) ? "Voted" : "Upvote"}
                </button>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default QuestionDetails;
