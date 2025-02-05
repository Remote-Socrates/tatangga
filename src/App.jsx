import { Routes, Route, Navigate } from "react-router";
import Home from "./components/Home";
import Groups from "./components/Groups";
import GroupQuestions from "./components/GroupQuestions";
import QuestionDetails from "./components/QuestionDetails";
import Auth from "./components/Auth";
import { QuestionProvider } from "./context/QuestionContext";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

const ProtectedRoute = ({ element }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;
  return user ? element : <Navigate to="/login" />;
};

const PublicRoute = ({ element }) => {
  const { user } = useContext(AuthContext);

  return user ? <Navigate to="/" /> : element;
};

const App = () => {
  return (
    <Routes>
      {/* ✅ Skip login if user is already logged in and redirect to Home */}
      <Route path="/login" element={<PublicRoute element={<Auth />} />} />

      {/* ✅ Keep homepage, user clicks "Let's Q&A" to go to groups */}
      <Route path="/" element={<Home />} />

      {/* ✅ Protected Routes */}
      <Route path="/groups" element={<ProtectedRoute element={<Groups />} />} />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute
            element={
              <QuestionProvider>
                <GroupQuestions />
              </QuestionProvider>
            }
          />
        }
      />
      <Route
        path="/groups/:groupId/questions/:questionId"
        element={
          <ProtectedRoute
            element={
              <QuestionProvider>
                <QuestionDetails />
              </QuestionProvider>
            }
          />
        }
      />
    </Routes>
  );
};

export default App;
