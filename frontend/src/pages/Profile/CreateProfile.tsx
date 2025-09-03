import { useRef, useState } from "react";
import "./Profile.css";
import { createOrUpdateProfile } from "../../api/profile";
// ถ้าใช้ react-router-dom จะ import useNavigate ได้
// import { useNavigate } from "react-router-dom";

export interface ProfileDraft {
  name: string;
  subtitle: string;
  bio: string;
  coverUrl?: string;
  avatarUrl?: string;
}

interface Props {
  onCancel?: () => void;
  defaults?: Partial<ProfileDraft>;
  memberId?: number;
}

export default function CreateProfile({ onCancel, defaults, memberId }: Props) {
  const [form, setForm] = useState<ProfileDraft>({
    name: defaults?.name ?? "",
    subtitle: defaults?.subtitle ?? "",
    bio: defaults?.bio ?? "",
    coverUrl: defaults?.coverUrl,
    avatarUrl: defaults?.avatarUrl,
  });

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // const navigate = useNavigate(); // ถ้าอยาก redirect หลังบันทึก

  const onField =
    (key: keyof ProfileDraft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });

  async function pickCover(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await readAsDataURL(file);
    setForm((s) => ({ ...s, coverUrl: dataUrl }));
  }

  async function pickAvatar(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await readAsDataURL(file);
    setForm((s) => ({ ...s, avatarUrl: dataUrl }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const fd = new FormData();
    fd.append("username", form.name);
    fd.append("bio", form.bio);
    if (memberId != null) fd.append("member_id", String(memberId));

    const avatarFile = avatarInputRef.current?.files?.[0];
    const coverFile = coverInputRef.current?.files?.[0];
    if (avatarFile) fd.append("avatar", avatarFile);
    if (coverFile) fd.append("cover", coverFile);

    try {
      const res = await createOrUpdateProfile(fd);
      console.log("Profile saved:", res.data);

      alert("บันทึกโปรไฟล์สำเร็จ ✅");

      // ถ้าอยากให้ redirect ไปหน้า MyAccount
      // navigate("/myaccount");

    } catch (err) {
      console.error("create profile failed:", err);
      alert("บันทึกโปรไฟล์ไม่สำเร็จ ❌");
    }
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
            onChange={(e) => pickCover(e.target.files?.[0])}
          />
          <button type="button" className="btn-change" onClick={() => coverInputRef.current?.click()}>
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
            onChange={(e) => pickAvatar(e.target.files?.[0])}
          />
          <button type="button" className="btn-change" onClick={() => avatarInputRef.current?.click()}>
            📷 เปลี่ยนรูปโปรไฟล์
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="create-form">
          <label>ชื่อ</label>
          <input value={form.name} onChange={onField("name")} placeholder="เช่น Naphat Ssc" required />

          <label>สถานะ/บทบาท</label>
          <input value={form.subtitle} onChange={onField("subtitle")} placeholder="เช่น นิสิตภายในมหาวิทยาลัย" />

          <label>คำอธิบาย</label>
          <textarea
            value={form.bio}
            onChange={onField("bio")}
            placeholder="เขียนข้อความสั้นๆ แนะนำตัว"
            rows={3}
          />

          <div className="edit-actions">
            {onCancel && (
              <button type="button" className="btn-cancel" onClick={onCancel}>
                ✖ ยกเลิก
              </button>
            )}
            <button type="submit" className="btn-save">
              💾 บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
