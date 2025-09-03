// frontend/src/profile/Profile.tsx
import { useState } from "react";
import EditProfile from "./EditProfile";
import "./Profile.css";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  // mock data
  const [user, setUser] = useState({
    name: "Naphat Ssc",
    subtitle: "นิสิตภายในมหาวิทยาลัย",
    bio: "ยินดีที่ได้รู้จักครับ/ค่ะ 👋",
    coverUrl: "/images/cover.jpg",
    avatarUrl: "/images/profile.jpg",
  });

  return (
    <>
      {isEditing ? (
        <EditProfile user={user} onClose={() => setIsEditing(false)} onSave={setUser} />
      ) : (
        <div className="profile-page">
          {/* Cover */}
          <div className="cover">
            <img src={user.coverUrl} alt="cover" />
          </div>

          {/* Avatar */}
          <div className="avatar-wrap">
            <img className="avatar" src={user.avatarUrl} alt="profile" />
          </div>

          {/* Card */}
          <section className="card">
            <h1 className="name">{user.name}</h1>
            <p className="subtitle">{user.subtitle}</p>
            <p className="bio">{user.bio}</p>

            <div className="actions">
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                ✏️ แก้ไขโปรไฟล์
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
