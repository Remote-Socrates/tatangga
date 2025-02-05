import { useState } from "react";
import { auth, googleProvider, db } from "../firebaseConfig";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Auth = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  // Sign in pakai google
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setUser(user);

      // Buat cek di DB apakah user sudah ada
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      // Kalau belum ada, buat baru
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          joinedGroups: [],
        });
      }
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  // Daftar manual lewat email
  const handleEmailSignup = async () => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;

      // Ganti nama user
      await updateProfile(user, { displayName: name });
      setUser({ ...user, displayName: name });

      // Simpan ke database
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        joinedGroups: [],
      });
    } catch (error) {
      console.error("Signup Error:", error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div>
      <h2>Authentication</h2>
      {user ? (
        <div>
          <p>Welcome, {user.displayName || user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={handleGoogleLogin}>Sign in with Google</button>
          <br />
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleEmailSignup}>Sign up with Email</button>
        </div>
      )}
    </div>
  );
};

export default Auth;
