import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "./payment.css";

interface PaymentResponse {
  order_id: string;
  qr_code: string;
  total_amount: number;
}

const PayQRCodePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false); // สำหรับ modal

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!orderId) return;
      try {
        const res = await axios.get(`/api/payments/qrcode/${orderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
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
    setShowSuccess(true); // แสดง modal
    setTimeout(() => {
      navigate("/checkout-success"); // หลัง 2 วินาทีไปหน้า success
    }, 2000);
  };

  if (loading) return <p>กำลังโหลด QR Code...</p>;
  if (!payment) return <p>ไม่พบ QR Code สำหรับคำสั่งซื้อนี้</p>;

  const qrValue = `ORDER:${payment.order_id};AMOUNT:${payment.total_amount}`;

  return (
    <div className="payment-container">
      <h2>💳 ชำระเงินด้วย QR Code</h2>

      <div className="summary-card">
        <p>Order No: <strong>#{payment.order_id}</strong></p>
        <p>Amount to Pay: <strong className="amount">฿{payment.total_amount.toLocaleString()}</strong></p>
      </div>

      <div className="qr-card">
        <QRCodeCanvas value={qrValue} size={256} />
        <p className="instruction">
          เปิดแอปธนาคารมือถือของคุณแล้วสแกน QR Code เพื่อชำระเงิน
        </p>
      </div>

      <button
        className="confirm-btn"
        onClick={handleConfirmPayment}
      >
        ยืนยันชำระเงินแล้ว
      </button>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-modal">
          <div className="success-content">
            <h3>✅ ชำระเงินสำเร็จ!</h3>
            <p>ขอบคุณที่ใช้บริการของเรา</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayQRCodePage;
