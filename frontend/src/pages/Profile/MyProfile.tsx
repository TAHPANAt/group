import { useEffect, useState } from "react";
import EditProfile from "./EditProfile";
import EditAccount from "./EditAccount";
import { getMyProfile } from "../../api/profile";
import "./Profile.css";
import useEcomStore from "../../store/ecom-store";
import { Link } from "react-router-dom";

export default function Account() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = useEcomStore((state: any) => state.token);
  const API_BASE = "http://localhost:8080"; // backend host

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getMyProfile(token);
        setUser(res.data);
        console.log("Profile loaded:", res.data);
      } catch (err) {
        console.error("โหลดโปรไฟล์ล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  if (loading) return <p>⏳ กำลังโหลด...</p>;
  if (!user) return <p>❌ ไม่พบโปรไฟล์</p>;

  const coverPath = `${API_BASE}${user.backgroundUrl}`;
  const avatarPath = `${API_BASE}${user.avatarUrl}`;

  return (
    <>
      {isEditingProfile ? (
        <EditProfile
          user={user}
          onClose={() => setIsEditingProfile(false)}
          onSave={setUser}
        />
      ) : isEditingAccount ? (
        <EditAccount
          onClose={() => setIsEditingAccount(false)}
          onSave={() => window.location.reload()}
        />
      ) : (
        <div className="profile-page">
          {/* Cover */}
          <div className="cover">
            <img src={coverPath} alt="cover" />
          </div>

          {/* Avatar */}
          <div className="avatar-wrap">
            <img className="avatar" src={avatarPath} alt="profile" />
          </div>

          {/* Card */}
          <section className="card">
            <h1 className="name">{user.username}</h1>
            <p className="bio">{user.bio}</p>

            {/* ✅ People Info */}
            {user.firstName && (
              <div className="people-info">
                <h2>ข้อมูลส่วนตัว</h2>
                <p>
                  <b>ชื่อจริง:</b> {user.firstName} {user.lastName}
                </p>
                <p>
                  <b>Email:</b> {user.email}
                </p>
                <p>
                  <b>เบอร์โทร:</b> {user.phone}
                </p>
                <p>
                  <b>อายุ:</b> {user.age}
                </p>
                <p>
                  <b>วันเกิด:</b> {user.birthDay}
                </p>
                <p>
                  <b>ที่อยู่:</b> {user.address}
                </p>
                <p>
                  <b>เพศ:</b> {user.gender}
                </p>
              </div>
            )}

            <div className="actions">
              <button
                className="btn-edit"
                onClick={() => setIsEditingProfile(true)}
              >
                ✏️ แก้ไขโปรไฟล์
              </button>

              <button
                className="btn-edit"
                onClick={() => setIsEditingAccount(true)}
                style={{ marginLeft: "10px" }}
              >
                👤 แก้ไขข้อมูลส่วนตัว
              </button>
            </div>

            {/* ✅ ปุ่ม Feedback แยกลงมาข้างล่าง */}
            <div className="feedback-btn-wrap">
              <Link to="/Feedback">
                <button className="btn-edit">
                  💬 Feedback
                </button>
              </Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}