// OrderPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./order.css";

interface ProductImage {
  id: number;
  image_path: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  ProductImage: ProductImage[];
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: Product;
}

interface Order {
  id: number;
  status: string;
  total_price: number;
  order_items: OrderItem[];
}

const vouchers = [
  { code: "DISCOUNT10", amount: 10 },
  { code: "DISCOUNT50", amount: 50 },
  { code: "FREESHIP", amount: 36 },
];

const OrderPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [voucherModal, setVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [customVoucher, setCustomVoucher] = useState("");
  const [paymentMethodID, setPaymentMethodID] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const res = await axios.get("/api/orders/latest", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const latestOrder = {
          id: res.data.data.ID,
          status: res.data.data.status,
          total_price: res.data.data.total_price,
          order_items: res.data.data.order_items,
        };

        console.log("📌 Latest order ID:", latestOrder.id);
        console.log("📦 Full order data:", latestOrder);
        setOrder(latestOrder);
      } catch (err) {
        console.error("Error fetching latest order:", err);
      }
    };
    fetchLatestOrder();
  }, []);

  const applyVoucher = (code: string) => {
    setSelectedVoucher(code);
    setVoucherModal(false);
  };

  const subtotal = order
    ? order.order_items.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      )
    : 0;

  const discount = selectedVoucher
    ? vouchers.find((v) => v.code === selectedVoucher)?.amount || 0
    : 0;

  const total = subtotal - discount > 0 ? subtotal - discount : 0;

  const handleCheckout = async () => {
    if (!paymentMethodID || !order) return;

    try {
      const res = await axios.post(
        "/api/payments",
        {
          order_id: order.id,
          payment_method_id: paymentMethodID, // ส่ง id แทน type
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      console.log("Payment created:", res.data);

      if (paymentMethodID === 1) {
        // QR Code
        navigate(`/user/pay-qrcode/${order.id}`);
      } else {
        // COD
        navigate("/checkout-success");
      }
    } catch (err: any) {
      console.error("Error creating payment:", err.response?.data || err.message);
      alert("Error creating payment: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="order-container">
      <h2>📦 Checkout</h2>

      {!order ? (
        <p className="no-order">No order yet.</p>
      ) : (
        <>
          {/* Delivery Address */}
          <div className="address-card">
            <h3>📍 Delivery Address</h3>
            <p><strong>John Doe (+66)</strong> 0812345678</p>
            <p>Suranaree University of Technology, Suranawit Building 12, Nakhon Ratchasima, 30000</p>
          </div>

          {/* Products Ordered */}
          <div className="order-card">
            <h3>🛒 Products Ordered</h3>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                  <th>Item Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.id}>
                    <td className="product-cell">
                      <img
                        src={
                          item.product.ProductImage?.[0]?.image_path
                            ? `http://localhost:8080${item.product.ProductImage[0].image_path}`
                            : "https://via.placeholder.com/60"
                        }
                        alt={item.product.name}
                        className="order-item-img"
                      />
                      <span className="product-name">{item.product.name}</span>
                    </td>
                    <td>฿{item.product.price.toLocaleString()}</td>
                    <td>{item.quantity}</td>
                    <td>฿{(item.product.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Voucher */}
          <div className="voucher-card">
            <span>Platform Voucher</span>
            <button className="voucher-btn" onClick={() => setVoucherModal(true)}>
              {selectedVoucher ? `Applied: ${selectedVoucher}` : "Select or enter code"}
            </button>
          </div>

          {/* Voucher Modal */}
          {voucherModal && (
            <div className="modal-overlay" onClick={() => setVoucherModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Select Voucher</h3>
                <ul>
                  {vouchers.map((v) => (
                    <li key={v.code}>
                      <button className="voucher-option" onClick={() => applyVoucher(v.code)}>
                        {v.code} - ฿{v.amount}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="custom-voucher">
                  <input
                    type="text"
                    placeholder="Enter custom code"
                    value={customVoucher}
                    onChange={(e) => setCustomVoucher(e.target.value)}
                  />
                  <button className="apply-btn" onClick={() => applyVoucher(customVoucher)}>Apply</button>
                </div>
                <button className="close-btn" onClick={() => setVoucherModal(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* เลือกวิธีชำระเงิน */}
          <div className="order-card">
            <h3>💳 Payment Method</h3>
            <div style={{ display: "flex", gap: 20 }}>
              <button
                className={paymentMethodID === 2 ? "selected-btn" : "payment-btn"}
                onClick={() => setPaymentMethodID(2)}
              >
                เก็บเงินปลายทาง
              </button>
              <button
                className={paymentMethodID === 1 ? "selected-btn" : "payment-btn"}
                onClick={() => setPaymentMethodID(1)}
              >
                QR Code
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <p>Order Total ({order.order_items.length} Items): <strong>฿{subtotal.toLocaleString()}</strong></p>
            {selectedVoucher && (
              <p>Discount ({selectedVoucher}): -฿{discount}</p>
            )}
            <h3>Total Payment: ฿{total.toLocaleString()}</h3>
            {paymentMethodID && <p>Payment Method: <strong>{paymentMethodID === 2 ? "Cash on Delivery" : "QR Payment"}</strong></p>}
          </div>

          <div className="order-submit">
            <button
              className="submit-btn"
              onClick={handleCheckout}
              disabled={!paymentMethodID}
            >
              สั่งซื้อ
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderPage;
