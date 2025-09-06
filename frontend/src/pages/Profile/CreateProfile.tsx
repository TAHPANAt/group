import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { createOrUpdateProfile, getMyProfile } from "../../api/profile";
import useEcomStore from "../../store/ecom-store";

export interface ProfileDraft {
  name: string;
  bio: string;
  coverUrl?: string;
  avatarUrl?: string;
}

export default function CreateProfile() {
  const user = useEcomStore((state) => state.user);
  const token = useEcomStore((state: any) => state.token);
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileDraft>({
    name: "",
    bio: "",
    coverUrl: undefined,
    avatarUrl: undefined,
  });

  const [checking, setChecking] = useState(true);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ✅ ตรวจสอบว่ามีโปรไฟล์อยู่แล้วหรือไม่
  useEffect(() => {
    async function checkProfile() {
      if (!user || !token) {
        navigate("/login");
        return;
      }
      try {
        const res = await getMyProfile(token);
        if (res.data) {
          navigate("/myprofile"); // ถ้ามีแล้ว ไปหน้า myprofile เลย
        } else {
          setChecking(false);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setChecking(false); // ยังไม่มี → สร้างใหม่
        } else {
          console.error("เช็คโปรไฟล์ผิดพลาด:", err);
        }
      }
    }
    checkProfile();
  }, [user, token, navigate]);

  const onField =
    (key: keyof ProfileDraft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim() || !token) return;

    const fd = new FormData();
    fd.append("username", form.name);
    fd.append("bio", form.bio);

    const avatarFile = avatarInputRef.current?.files?.[0];
    const coverFile = coverInputRef.current?.files?.[0];
    if (avatarFile) fd.append("avatar", avatarFile);
    if (coverFile) fd.append("cover", coverFile);

    try {
      await createOrUpdateProfile(fd, token);
      alert("บันทึกโปรไฟล์สำเร็จ ✅");
      navigate("/myprofile"); // ✅ ไปหน้า myprofile ทันที
    } catch (err) {
      console.error("create profile failed:", err);
      alert("บันทึกโปรไฟล์ไม่สำเร็จ ❌");
    }
  }

  if (checking) {
    return <div className="create-page">⏳ กำลังตรวจสอบโปรไฟล์...</div>;
  }

  return (
    <div className="create-page">
      <div className="create-card">
        <h2 className="create-title">สร้างโปรไฟล์</h2>

        {/* Cover */}
        <div className="edit-cover">
          {form.coverUrl ? (
            <img src={form.coverUrl} alt="cover preview" />
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
                reader.onload = () =>
                  setForm((s) => ({ ...s, coverUrl: String(reader.result) }));
                reader.readAsDataURL(file);
              }
            }}
          />
          <button
            type="button"
            className="btn-change"
            onClick={() => coverInputRef.current?.click()}
          >
            📷 เปลี่ยนรูปปก
          </button>
        </div>

        {/* Avatar */}
        <div className="edit-avatar-wrap">
          {form.avatarUrl ? (
            <img className="avatar" src={form.avatarUrl} alt="avatar preview" />
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
                reader.onload = () =>
                  setForm((s) => ({ ...s, avatarUrl: String(reader.result) }));
                reader.readAsDataURL(file);
              }
            }}
          />
          <button
            type="button"
            className="btn-change"
            onClick={() => avatarInputRef.current?.click()}
          >
            📷 เปลี่ยนรูปโปรไฟล์
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="create-form">
          <label>ชื่อ</label>
          <input
            value={form.name}
            onChange={onField("name")}
            placeholder="เช่น Naphat Ssc"
            required
          />

          <label>คำอธิบาย</label>
          <textarea
            value={form.bio}
            onChange={onField("bio")}
            placeholder="เขียนข้อความสั้นๆ แนะนำตัว"
            rows={3}
          />

          <div className="edit-actions">
            <button type="submit" className="btn-save">
              💾 บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}