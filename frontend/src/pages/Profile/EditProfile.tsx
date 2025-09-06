import { useRef, useState } from "react";
import { createOrUpdateProfile, getMyProfile } from "../../api/profile"; // ⬅️ เพิ่ม getMyProfile
import "./Profile.css";
import useEcomStore from "../../store/ecom-store";

interface EditProfileProps {
  user: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}

export default function EditProfile({ user, onClose, onSave }: EditProfileProps) {
  const [name, setName] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(user.backgroundUrl || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const token = useEcomStore((state: any) => state.token); // ✅ token จาก store

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      alert("กรุณาล็อกอินก่อน");
      return;
    }

    const fd = new FormData();
    fd.append("username", name);
    fd.append("bio", bio);

    const avatarFile = avatarInputRef.current?.files?.[0];
    const coverFile = coverInputRef.current?.files?.[0];
    if (avatarFile) fd.append("avatar", avatarFile);
    if (coverFile) fd.append("cover", coverFile);

    try {
      await createOrUpdateProfile(fd, token);
      alert("แก้ไขโปรไฟล์สำเร็จ ✅");

      // ✅ โหลดข้อมูล user ล่าสุดจาก backend
      const refreshed = await getMyProfile(token);
      onSave(refreshed.data);

      onClose();
    } catch (err) {
      console.error("update profile failed:", err);
      alert("แก้ไขโปรไฟล์ไม่สำเร็จ ❌");
    }
  }

  return (
    <div className="edit-page">
      <div className="edit-card">
        <h2 className="edit-title">แก้ไขโปรไฟล์</h2>

        {/* Cover */}
        <div className="edit-cover">
          {coverPreview ? (
            <img
              src={
                coverPreview.startsWith("/uploads")
                  ? `http://localhost:8080${coverPreview}`
                  : coverPreview
              }
              alt="cover preview"
            />
          ) : (
            <div className="cover-placeholder">ใส่รูปปก</div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setCoverPreview(String(reader.result));
                reader.readAsDataURL(file);
              }
            }}
          />
          <button type="button" className="btn-change" onClick={() => coverInputRef.current?.click()}>
            📷 เปลี่ยนรูปปก
          </button>
        </div>

        {/* Avatar */}
        <div className="edit-avatar-wrap">
          {avatarPreview ? (
            <img
              className="avatar"
              src={
                avatarPreview.startsWith("/uploads")
                  ? `http://localhost:8080${avatarPreview}`
                  : avatarPreview
              }
              alt="avatar preview"
            />
          ) : (
            <div className="avatar placeholder" />
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setAvatarPreview(String(reader.result));
                reader.readAsDataURL(file);
              }
            }}
          />
          <button type="button" className="btn-change" onClick={() => avatarInputRef.current?.click()}>
            📷 เปลี่ยนรูปโปรไฟล์
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-form">
          <label>ชื่อ</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Naphat Ssc"
            required
          />

          <label>คำอธิบาย</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="เขียนข้อความสั้นๆ แนะนำตัว"
            rows={3}
          />

          <div className="edit-actions">
            <button type="submit" className="btn-save">💾 บันทึก</button>
            <button type="button" className="btn-cancel" onClick={onClose}>❌ ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}