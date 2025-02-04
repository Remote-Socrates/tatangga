import Login from "./components/login";
import QuestionsList from "./components/QuestionList";
import QuestionForm from "./components/QuestionForm";
import "./App.css";

function App() {
  return (
    <div>
      <h1>TATANGGA</h1>
      <Login />
      <QuestionForm />
      <QuestionsList />
    </div>
  );
}

export default App;
