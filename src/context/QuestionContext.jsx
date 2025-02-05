import { createContext, useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const QuestionContext = createContext();

export const QuestionProvider = ({ children, groupId }) => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    const fetchQuestions = async () => {
      const querySnapshot = await getDocs(
        collection(db, `groups/${groupId}/questions`)
      );
      setQuestions(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchQuestions();
  }, [groupId]);

  return (
    <QuestionContext.Provider value={{ questions, setQuestions }}>
      {children}
    </QuestionContext.Provider>
  );
};
