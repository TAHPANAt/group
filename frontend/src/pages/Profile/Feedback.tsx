import { useEffect, useState } from "react";
import { createFeedback, getCategories } from "../../api/Feedback";
import useEcomStore from "../../store/ecom-store";
import "./Feedback.css";
import { Link } from "react-router-dom";

export default function FeedbackPage() {
  const token = useEcomStore((state: any) => state.token);

  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    message: "",
    categoryId: "",
    ratingId: "0",
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // โหลด categories
  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await getCategories(token);
        console.log("Categories loaded:", catRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error("โหลดข้อมูล categories ล้มเหลว:", err);
      }
    }
    loadData();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("message", form.message);
      fd.append("categoryId", form.categoryId);
      fd.append("ratingId", form.ratingId);
      if (screenshotFile) {
        fd.append("screenshot", screenshotFile);
      }

      await createFeedback(fd, token); // ✅ multipart/form-data
      alert("ส่ง Feedback สำเร็จ ✅");

      // reset form
      setForm({ message: "", categoryId: "", ratingId: "0" });
      setScreenshotFile(null);
    } catch (err) {
      console.error("ส่ง feedback ล้มเหลว:", err);
      alert("ส่ง Feedback ไม่สำเร็จ ❌");
    }
  }

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <h2>ส่ง Feedback</h2>

        <form onSubmit={handleSubmit} className="feedback-form">
          <label>ข้อความ</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="เขียนข้อเสนอแนะ..."
            rows={3}
          />

          <label>Screenshot</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
          />

          <label>หมวดหมู่</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">-- เลือกหมวดหมู่ --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.typeFeedback} ({c.description})
              </option>
            ))}
          </select>

          <label>ให้คะแนน</label>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${
                  Number(form.ratingId) >= star ? "selected" : ""
                }`}
                onClick={() =>
                  setForm({ ...form, ratingId: String(star) })
                }
              >
                ★
              </span>
            ))}
          </div>

          <div className="feedback-actions">
            <button type="submit" className="btn-save">
              💾 ส่ง Feedback
            </button>
          </div>
          <Link to="/MyProfile" className="no-border-button left-font-size-large">
                      
                      
                        ยกเลิก
                      
                    </Link>
        </form>
      </div>
    </div>
  );
}