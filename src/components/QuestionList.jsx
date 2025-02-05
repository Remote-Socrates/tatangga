import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const QuestionsList = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched Questions:", questionsData); // Debugging
      setQuestions(questionsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h2>Live Q&A</h2>
      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.text}</p>
          <p>
            👤 {q.author} | 👍 {q.votes} votes
          </p>
        </div>
      ))}
    </div>
  );
};

export default QuestionsList;
