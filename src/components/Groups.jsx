import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { GroupContext } from "../context/GroupContext";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

const Groups = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]); // Local state for groups
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joinedGroups, setJoinedGroups] = useState([]);

  // ✅ Real-time listener for groups
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
      setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch user's joined groups
  useEffect(() => {
    if (!user) return;

    const fetchJoinedGroups = async () => {
      const q = query(
        collection(db, "group_members"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      setJoinedGroups(snapshot.docs.map((doc) => doc.data().groupId));
    };

    fetchJoinedGroups();
  }, [user]);

  // ✅ Create a new group and update UI immediately
  const createGroup = async () => {
    if (!user) {
      setError("You must be logged in to create a group.");
      return;
    }
    if (!groupName.trim() || !groupDescription.trim()) {
      setError("Please enter both group name and description.");
      return;
    }
    try {
      const newGroupRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        description: groupDescription,
        createdBy: user.uid,
      });

      // ✅ Optimistically update the UI
      setGroups((prevGroups) => [
        ...prevGroups,
        {
          id: newGroupRef.id,
          name: groupName,
          description: groupDescription,
          createdBy: user.uid,
        },
      ]);

      setGroupName("");
      setGroupDescription("");
      setSuccess("Group created successfully!");
    } catch (err) {
      setError("Error creating group. Please try again.");
    }
  };

  const joinGroup = async (groupId) => {
    if (!user) {
      setError("You must be logged in to join a group.");
      return;
    }
    if (joinedGroups.includes(groupId)) {
      setError("You have already joined this group.");
      return;
    }

    try {
      await addDoc(collection(db, "group_members"), {
        userId: user.uid,
        groupId: groupId,
      });

      setJoinedGroups([...joinedGroups, groupId]);
      setSuccess("Successfully joined the group!");
    } catch (err) {
      setError("Error joining group. Please try again.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Available Groups</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {user && (
        <div>
          <h3>Create a New Group</h3>
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Group Description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
          />
          <button onClick={createGroup}>Create Group</button>
        </div>
      )}

      <ul>
        {groups.map((group) => (
          <li
            key={group.id}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <button onClick={() => navigate(`/groups/${group.id}`)}>
              View Group
            </button>
            {!joinedGroups.includes(group.id) && (
              <button
                onClick={() => joinGroup(group.id)}
                style={{ marginLeft: "10px" }}
              >
                Join Group
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Groups;
