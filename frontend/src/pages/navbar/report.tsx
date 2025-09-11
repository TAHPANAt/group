import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import "./Report.css";

export default function ReportPage() {
  const token = useEcomStore((state: any) => state.token);
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const sellerId = searchParams.get("sellerId");
  const navigate = useNavigate();

  console.log("Query params:", { productId, sellerId });

  const reportTypes = [
    { id: "1", name: "สแปม", description: "โฆษณาหรือข้อความรบกวน" },
    { id: "2", name: "ไม่เหมาะสม", description: "เนื้อหาไม่เหมาะสม" },
    { id: "3", name: "อื่นๆ", description: "รายงานเหตุผลอื่น" },
  ];

  const [form, setForm] = useState({
    targetType: "product",
    reportTypeId: "",
    description: "",
  });

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Submit clicked:", form);

    if (!form.reportTypeId) {
      alert("⚠️ กรุณาเลือกประเภทการรีพอร์ตก่อน");
      console.log("Report type not selected");
      return;
    }

    const reportData = {
      ...form,
      product_id: productId ? parseInt(productId) : null,
      seller_id: sellerId ? parseInt(sellerId) : null,
      report_type_id: parseInt(form.reportTypeId),
    };

    console.log("Sending report data:", reportData);

    try {
      const res = await axios.post("http://localhost:8080/api/reports", reportData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Report submitted successfully ✅", res.data);

      setForm({ targetType: "product", reportTypeId: "", description: "" });

      setToast({ show: true, message: "ส่งรายงานสำเร็จ ✅", type: "success" });

      // Redirect หลัง 1.5 วินาที
      setTimeout(() => {
        setToast({ show: false, message: "", type: "success" });
        console.log("Redirecting to home page");
        navigate("/");
      }, 1500);

    } catch (err) {
      console.error("Failed to submit report ❌", err);
      setToast({ show: true, message: "ส่งรายงานล้มเหลว ❌", type: "error" });

      // ปิด toast หลัง 2 วินาที
      setTimeout(() => setToast({ show: false, message: "", type: "error" }), 2000);
    }
  }

  return (
    <div className="report-page">
      {/* Toast Notification */}
      {toast.show && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="report-card">
        <h2>📢 ส่ง Report</h2>

        <form onSubmit={handleSubmit} className="report-form">
          <label>เลือกประเภทการรีพอร์ต</label>
          <select
            value={form.reportTypeId}
            onChange={(e) => setForm({ ...form, reportTypeId: e.target.value })}
          >
            <option value="" disabled hidden>-- เลือกประเภท --</option>
            {reportTypes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.description})
              </option>
            ))}
          </select>

          <label>รายละเอียดเพิ่มเติม</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="กรอกรายละเอียดเกี่ยวกับปัญหาที่พบ..."
            rows={4}
          />

          <div className="report-actions">
            <button type="submit" className="btn-save">
              💾 ส่ง Report
            </button>
          </div>

          <Link to={`/shop/${sellerId}`} className="no-border-button left-font-size-large">
            ยกเลิก
          </Link>
        </form>
      </div>
    </div>
  );
}
