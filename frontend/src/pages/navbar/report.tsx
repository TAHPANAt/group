import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import "./Report.css";

export default function ReportPage() {
  const token = useEcomStore((state: any) => state.token);
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const sellerId = searchParams.get("sellerId");
  console.log("query params:", { productId, sellerId });


  // ✅ mock ประเภทรีพอร์ต
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.reportTypeId) {
      alert("⚠️ กรุณาเลือกประเภทการรีพอร์ตก่อน");
      return;
    }

    const reportData = {
      ...form,
      product_id: productId ? parseInt(productId) : null,
      seller_id: sellerId ? parseInt(sellerId) : null,
      report_type_id: parseInt(form.reportTypeId),
    };

    try {
      const res = await axios.post("http://localhost:8080/api/reports", reportData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ส่ง Report สำเร็จ ✅", res.data);
      alert("ส่ง Report สำเร็จ ✅");

      setForm({ targetType: "product", reportTypeId: "", description: "" });
    } catch (err) {
      console.error("ส่ง Report ล้มเหลว ❌", err);
      alert("ส่ง Report ล้มเหลว ❌");
    }
  }

  return (
    <div className="report-page">
      <div className="report-card">
        <h2>📢 ส่ง Report</h2>

        <form onSubmit={handleSubmit} className="report-form">
          {/* เลือกประเภทการรีพอร์ต */}
          <label>เลือกประเภทการรีพอร์ต</label>
          <select
            value={form.reportTypeId}
            onChange={(e) =>
              setForm({ ...form, reportTypeId: e.target.value })
            }
          >
            <option value="" disabled hidden>
              -- เลือกประเภท --
            </option>
            {reportTypes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.description})
              </option>
            ))}
          </select>

          {/* ช่องรายละเอียด */}
          <label>รายละเอียดเพิ่มเติม</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="กรอกรายละเอียดเกี่ยวกับปัญหาที่พบ..."
            rows={4}
          />

          <div className="report-actions">
            <button type="submit" className="btn-save">
              💾 ส่ง Report
            </button>
          </div>
          <Link to="shop/:sellerId" className="no-border-button left-font-size-large">
                                
                                
                                  ยกเลิก
                                
                              </Link>
        </form>
      </div>
    </div>
  );
}