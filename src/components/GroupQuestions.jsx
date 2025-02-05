import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const GroupQuestions = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [isMember, setIsMember] = useState(null);
  const [votedQuestions, setVotedQuestions] = useState(new Set());
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");
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
          const sortedQuestions = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => b.votes - a.votes);
          setQuestions(sortedQuestions);
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

  const postQuestion = async () => {
    setError("");
    setSuccess("");

    if (!user) {
      setError("You must be logged in to post a question.");
      return;
    }

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
        timestamp: serverTimestamp(),
      });

      setQuestionText(""); // Reset input field
      setSuccess("Question posted successfully!");
    } catch (err) {
      setError("Error posting question. Please try again.");
    }
  };

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

  const startEditingQuestion = (question) => {
    setEditingQuestionId(question.id);
    setEditQuestionText(question.text);
  };

  const saveEditedQuestion = async () => {
    if (!editQuestionText.trim()) {
      setError("Question cannot be empty.");
      return;
    }

    try {
      const questionRef = doc(
        db,
        `groups/${groupId}/questions`,
        editingQuestionId
      );
      await updateDoc(questionRef, { text: editQuestionText });

      setEditingQuestionId(null);
      setEditQuestionText("");
      setSuccess("Question updated successfully!");
    } catch (err) {
      setError("Error updating question.");
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    try {
      await deleteDoc(doc(db, `groups/${groupId}/questions`, questionId));
      setSuccess("Question deleted successfully!");
    } catch (err) {
      setError("Error deleting question.");
    }
  };

  if (isMember === null) {
    return <p>Loading...</p>;
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
      <h2>Group Questions</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <h3>Post a Question</h3>
      <input
        type="text"
        placeholder="Ask a question..."
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <button onClick={postQuestion}>Post Question</button>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {questions.map((question) => (
          <li
            key={question.id}
            style={{
              margin: "10px 0",
              border: "1px solid #ccc",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                flex: 1,
                cursor:
                  editingQuestionId === question.id ? "default" : "pointer",
              }}
              onClick={(e) => {
                if (editingQuestionId !== question.id)
                  navigate(`/groups/${groupId}/questions/${question.id}`);
              }}
            >
              {editingQuestionId === question.id ? (
                <>
                  <input
                    type="text"
                    value={editQuestionText}
                    onChange={(e) => setEditQuestionText(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent click from triggering navigation
                  />
                  <button onClick={saveEditedQuestion}>Save</button>
                  <button onClick={() => setEditingQuestionId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p>
                    <strong>{question.text}</strong>
                  </p>
                  <p>
                    👤 {question.author} | 👍 {question.votes} votes
                  </p>
                </>
              )}
            </div>
            {user && user.uid === question.userId && !editingQuestionId && (
              <>
                <button onClick={() => startEditingQuestion(question)}>
                  Edit
                </button>
                <button onClick={() => deleteQuestion(question.id)}>
                  Delete
                </button>
              </>
            )}
            <button
              onClick={() => upvoteQuestion(question.id)}
              disabled={votedQuestions.has(question.id)}
            >
              {votedQuestions.has(question.id) ? "Voted" : "Upvote"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupQuestions;
