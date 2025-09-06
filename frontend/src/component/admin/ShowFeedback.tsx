import { useEffect, useState } from "react";
import axios from "axios";
import "./ShowFeedback.css";

interface Feedback {
  id: number;
  message: string;
  screenshot: string;
  timestamp: string;
  member: string;
  category: string;
  rating: number;
}

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get("http://localhost:8080/api/feedbacks");

        console.log("📦 API feedbacks:", res.data);

        // ✅ รองรับทั้ง [] และ { data: [] }
        const data = Array.isArray(res.data) ? res.data : res.data?.data;
        setFeedbacks(data || []);
      } catch (err) {
        console.error("โหลด feedback ไม่สำเร็จ:", err);
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>⏳ กำลังโหลด...</p>;
  if (feedbacks.length === 0) return <p>❌ ไม่มี Feedback</p>;

  return (
    <div className="feedback-page">
      <h2>💬 รายการ Feedback</h2>
      <div className="feedback-grid">
        {feedbacks.map((fb, idx) => (
          <div
            key={fb.id ? `fb-${fb.id}` : `idx-${idx}`}
            className="feedback-card"
          >
            <div className="feedback-header">
              <strong>{fb.member}</strong>
              <span className="timestamp">{fb.timestamp}</span>
            </div>

            <p className="message">{fb.message}</p>

            {fb.screenshot && (
              <img
                src={`http://localhost:8080${
                  fb.screenshot.startsWith("/") ? fb.screenshot : "/" + fb.screenshot
                }`}
                alt="screenshot"
                className="screenshot"
              />
            )}

            <div className="feedback-footer">
              <span className="category">📂 {fb.category}</span>
              <span className="rating">⭐ {fb.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}