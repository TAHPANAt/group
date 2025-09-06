import { useEffect, useState } from "react";
import "./Profile.css";
import useEcomStore from "../../store/ecom-store";
import { getMyProfile, updatePeople } from "../../api/profile";

interface EditAccountProps {
  onClose: () => void;
  onSave: () => void; // ✅ เพิ่ม onSave
}

export default function EditAccount({ onClose, onSave }: EditAccountProps) {
  const token = useEcomStore((state: any) => state.token);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: 0,
    birthDay: "",
    address: "",
    gender: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getMyProfile(token);
        const u = res.data;
        setForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phone: u.phone || "",
          age: u.age || 0,
          birthDay: u.birthDay ? u.birthDay.split("T")[0] : "",
          address: u.address || "",
          gender: u.gender || "",
        });
      } catch (err) {
        console.error("โหลดข้อมูล account ล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const onField =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((s) => ({ ...s, [key]: e.target.value }));
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updatePeople(form, token);
      alert("บันทึกข้อมูลส่วนตัวสำเร็จ ✅");
      onSave(); // ✅ เรียก refresh หน้า
      onClose();
    } catch (err) {
      console.error("update account failed:", err);
      alert("บันทึกข้อมูลไม่สำเร็จ ❌");
    }
  }

  if (loading) return <p>⏳ กำลังโหลด...</p>;

  return (
    <div className="edit-page">
      <div className="edit-card">
        <h2 className="edit-title">แก้ไขข้อมูลส่วนตัว</h2>
        <form onSubmit={handleSubmit} className="edit-form">
          <label>ชื่อจริง</label>
          <input value={form.firstName} onChange={onField("firstName")} required />

          <label>นามสกุล</label>
          <input value={form.lastName} onChange={onField("lastName")} required />

          <label>Email</label>
          <input type="email" value={form.email} onChange={onField("email")} required />

          <label>เบอร์โทร</label>
          <input value={form.phone} onChange={onField("phone")} />

          <label>อายุ</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm((s) => ({ ...s, age: parseInt(e.target.value, 10) }))}
          />

          <label>วันเกิด</label>
          <input type="date" value={form.birthDay} onChange={onField("birthDay")} />

          <label>ที่อยู่</label>
          <textarea value={form.address} onChange={onField("address")} rows={3} />

          <label>เพศ</label>
          <select value={form.gender} onChange={onField("gender")}>
            <option value="">-- เลือกเพศ --</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
          </select>

          <div className="edit-actions">
            <button type="submit" className="btn-save">💾 บันทึก</button>
            <button type="button" className="btn-cancel" onClick={onClose}>❌ ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}