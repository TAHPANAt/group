import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "./payment.css";

interface PaymentResponse {
  order_id: string;
  qr_code: string;
  total_amount: number; // เราจะเพิ่ม amount จาก backend
}

const PayQRCodePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!orderId) return;

      try {
        const res = await axios.get(`/api/payments/qrcode/${orderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        // สมมติ backend ส่ง qr_code และ total_amount
        setPayment({
          order_id: res.data.order_id,
          qr_code: res.data.qr_code,
          total_amount: res.data.total_amount,
        });
      } catch (err) {
        console.error("Error fetching QR code:", err);
        setPayment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [orderId]);

  const handleConfirmPayment = () => {
    navigate("/checkout-success");
  };

  if (loading) return <p>กำลังโหลด QR Code...</p>;
  if (!payment) return <p>ไม่พบ QR Code สำหรับคำสั่งซื้อนี้</p>;

  // เราจะเอา qr_code + จำนวนเงิน เป็น string ให้สแกนจ่ายได้
  const qrValue = `ORDER:${payment.order_id};AMOUNT:${payment.total_amount}`;

  return (
    <div className="payment-container" style={{ textAlign: "center", padding: 50 }}>
      <h2>💳 ชำระเงินด้วย QR Code</h2>

      <div className="summary-card" style={{ marginBottom: 30 }}>
        <p>Order No: <strong>#{payment.order_id}</strong></p>
        <p>Amount to Pay: <strong>฿{payment.total_amount.toLocaleString()}</strong></p>
      </div>

      <div className="qr-card">
        <QRCodeCanvas value={qrValue} size={256} />
        <p className="instruction">
          เปิดแอปธนาคารมือถือของคุณแล้วสแกน QR Code เพื่อชำระเงิน
        </p>
      </div>

      <button
        className="confirm-btn"
        style={{
          marginTop: 30,
          padding: "12px 24px",
          fontSize: 18,
          backgroundColor: "#d17a00",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
        onClick={handleConfirmPayment}
      >
        ยืนยันชำระเงินแล้ว
      </button>
    </div>
  );
};

export default PayQRCodePage;
