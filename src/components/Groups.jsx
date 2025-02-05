import { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));

    const fetchGroups = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "groups"));
        setGroups(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        setError("Failed to load groups.");
      }
    };

    const fetchJoinedGroups = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "group_members"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        setJoinedGroups(snapshot.docs.map((doc) => doc.data().groupId));
      } catch (err) {
        setError("Failed to fetch joined groups.");
      }
    };

    fetchGroups();
    if (user) fetchJoinedGroups();
    return () => unsubscribe();
  }, [user]);

  const createGroup = async () => {
    setError("");
    setSuccess("");

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

      setGroups([
        ...groups,
        { id: newGroupRef.id, name: groupName, description: groupDescription },
      ]);
      setGroupName("");
      setGroupDescription("");
      setSuccess("Group created successfully!");
    } catch (err) {
      setError("Error creating group.");
    }
  };

  const joinGroup = async (groupId) => {
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please log in first.");
      return;
    }

    if (joinedGroups.includes(groupId)) {
      setError("You are already a member of this group.");
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
      setError("Error joining group.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Available Groups</h2>

      {/* Error & Success Messages */}
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
          <button
            onClick={createGroup}
            style={{ marginLeft: "10px", padding: "5px 15px" }}
          >
            Create Group
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {groups.map((group) => (
          <li
            key={group.id}
            style={{
              margin: "10px 0",
              border: "1px solid #ccc",
              padding: "10px",
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
