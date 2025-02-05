import { Routes, Route, Navigate } from "react-router";
import Home from "./components/Home";
import Auth from "./components/Auth";
import Groups from "./components/Groups";
import GroupQuestions from "./components/GroupQuestions"; // Placeholder for Q&A page
import { auth } from "./firebaseConfig";
import { useState, useEffect } from "react";

function App() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/groups" element={user ? <Groups /> : <Auth />} />
      <Route
        path="/groups/:groupId"
        element={user ? <GroupQuestions /> : <Auth />}
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
