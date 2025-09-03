// frontend/src/profile/EditProfile.tsx
import { useState } from "react";
import "./Profile.css";

type User = {
  name: string;
  subtitle: string;
  bio: string;
  coverUrl: string;
  avatarUrl: string;
};

type Props = {
  user: User;
  onSave: (u: User) => void;
  onClose: () => void;
};

export default function EditProfile({ user, onSave, onClose }: Props) {
  const [form, setForm] = useState(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="edit-overlay">
      <div className="edit-card">
        <h2>แก้ไขโปรไฟล์</h2>

        {/* Cover */}
        <div className="edit-cover">
          <img src={form.coverUrl} alt="cover" />
          <button className="btn-change">📷 เปลี่ยนรูปปก</button>
        </div>

        {/* Avatar */}
        <div className="edit-avatar-wrap">
          <img className="avatar" src={form.avatarUrl} alt="profile" />
          <button className="btn-change">📷 เปลี่ยนรูปโปรไฟล์</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label>ชื่อ</label>
          <input name="name" value={form.name} onChange={handleChange} />

          <label>สถานะ/บทบาท</label>
          <input name="subtitle" value={form.subtitle} onChange={handleChange} />

          <label>คำอธิบาย</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} />

          <div className="edit-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              ❌ ยกเลิก
            </button>
            <button type="submit" className="btn-save">
              💾 บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
