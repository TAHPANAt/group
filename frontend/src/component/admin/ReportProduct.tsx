import { useEffect, useState } from "react";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";

export default function ReportList() {
  const token = useEcomStore((state: any) => state.token);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await axios.get("http://localhost:8080/api/reports", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("API reports:", res.data);
        setReports(res.data?.data || []); // ✅ ตรงกับ backend
      } catch (err) {
        console.error("โหลดรายงานไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [token]);

  if (loading) return <p>⏳ กำลังโหลด...</p>;

  return (
    <div>
      <h2>📋 รายการรีพอร์ต</h2>
      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ประเภท</th>
            <th>รายละเอียด</th>
            <th>สินค้า</th>
            <th>ผู้รีพอร์ต</th>
            <th>ร้านค้า</th>
            <th>เวลา</th>
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map((r) => (
              <tr key={r.ID}>
                <td>{r.ID}</td>
                <td>{r.ReportType?.Name || r.ReportType?.name}</td>
                <td>{r.ReportType?.Description || r.ReportType?.description}</td>
                <td>{r.Product?.Name || r.Product?.name}</td>
                <td>{r.Member?.UserName || r.Member?.username}</td>
                <td>{r.Seller?.Name || r.Seller?.name}</td>
                <td>{new Date(r.CreatedAt || r.created_at).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>ไม่มีข้อมูลรีพอร์ต</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}