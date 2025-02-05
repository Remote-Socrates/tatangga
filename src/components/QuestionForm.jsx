import { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const QuestionForm = () => {
  const [question, setQuestion] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;
    if (!auth.currentUser) {
      alert("Mohon login terlebih dahulu.");
      return;
    }

    try {
      await addDoc(collection(db, "questions"), {
        text: question,
        author: auth.currentUser.displayName,
        votes: 0,
        timestamp: serverTimestamp(),
      });
      setQuestion(""); // Bersihin input setelah submit
      console.log("Question submitted successfully!");
    } catch (error) {
      console.error("Error mengirimkan pertanyaan: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Masukkan pertanyaanmu disini"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
};

export default QuestionForm;
