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

const GroupQuestions = () => {
  const { groupId } = useParams();
  const { user } = useContext(AuthContext);
  const { selectedGroup } = useContext(GroupContext);
  const { questions, setQuestions } = useContext(QuestionContext);
  const navigate = useNavigate();
  const [questionText, setQuestionText] = useState("");
  const [error, setError] = useState("");
  const [votedQuestions, setVotedQuestions] = useState(new Set());
  const [isMember, setIsMember] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");

  // ✅ Check if user is a member of the group
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

  // ✅ Fetch user's voted questions
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

  // ✅ Fetch and update questions in real time
  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, `groups/${groupId}/questions`),
      orderBy("votes", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [groupId, setQuestions]);

  // ✅ Post a new question
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

  // ✅ Upvote a question
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

  // ✅ Start editing a question
  const startEditingQuestion = (question) => {
    setEditingQuestionId(question.id);
    setEditQuestionText(question.text);
  };

  // ✅ Save the edited question
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
    } catch (err) {
      setError("Error updating question.");
    }
  };

  // ✅ Delete a question
  const deleteQuestion = async (questionId) => {
    if (!isMember) {
      setError("You must join this group to delete a question.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    try {
      await deleteDoc(doc(db, `groups/${groupId}/questions`, questionId));
    } catch (err) {
      setError("Error deleting question.");
    }
  };

  return (
    <div>
      <h2>{selectedGroup?.name} - Questions</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        <input
          type="text"
          placeholder="Ask a question..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
        <button onClick={postQuestion} disabled={!isMember}>
          Post Question
        </button>
      </div>

      <ul>
        {questions.length > 0 ? (
          questions.map((question) => (
            <li
              key={question.id}
              style={{
                marginBottom: "10px",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            >
              <div
                style={{ cursor: "pointer", flex: 1 }}
                onClick={(e) => {
                  if (!editingQuestionId)
                    navigate(`/groups/${groupId}/questions/${question.id}`);
                  e.stopPropagation();
                }}
              >
                {editingQuestionId === question.id ? (
                  <>
                    <input
                      type="text"
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
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

              <div style={{ display: "flex", gap: "10px" }}>
                {user && user.uid === question.userId && (
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
                  disabled={!isMember || votedQuestions.has(question.id)}
                >
                  {votedQuestions.has(question.id) ? "Voted" : "Upvote"}
                </button>
              </div>
            </li>
          ))
        ) : (
          <p>No questions yet. Be the first to ask one!</p>
        )}
      </ul>
    </div>
  );
};

export default GroupQuestions;
