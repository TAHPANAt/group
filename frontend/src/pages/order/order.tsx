import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
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

interface Voucher {
  id?: number;
  code: string;
  amount: number;
  minOrder?: number;
  imageURL?: string;
}

interface People {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}

const OrderPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [voucherModal, setVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [customVoucher, setCustomVoucher] = useState("");
  const [paymentMethodID, setPaymentMethodID] = useState<number | null>(null);
  const [people, setPeople] = useState<People | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const tokenInStore = useEcomStore((state: any) => state.token);
  const navigate = useNavigate();
  const clearCart = () => useEcomStore.setState({ carts: [] });

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/members/me", {
          headers: { Authorization: `Bearer ${tokenInStore}` },
        });
        setPeople(res.data.data.people);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [tokenInStore]);

  // Fetch latest order
  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const res = await axios.get("/api/orders/latest", {
          headers: { Authorization: `Bearer ${tokenInStore}` },
        });
        const latestOrder = {
          id: res.data.data.ID,
          status: res.data.data.status,
          total_price: res.data.data.total_price,
          order_items: res.data.data.order_items,
        };
        setOrder(latestOrder);
      } catch (err) {
        console.error("Error fetching latest order:", err);
      }
    };
    fetchLatestOrder();
  }, [tokenInStore]);

  const subtotal = order
    ? order.order_items.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      )
    : 0;

  // Fetch vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      if (!subtotal) return;
      try {
        const res = await axios.get(`/api/discounts?total=${subtotal}`, {
          headers: { Authorization: `Bearer ${tokenInStore}` },
        });
        const vouchers = res.data.data.map((v: any) => ({
          id: v.id,
          code: v.name,
          amount: v.amount,
          minOrder: v.min_order,
          imageURL: v.image_url,
        }));
        setAvailableVouchers(vouchers);
      } catch (err) {
        console.error("Error fetching vouchers:", err);
      }
    };
    fetchVouchers();
  }, [subtotal, tokenInStore]);

  // Apply voucher
  const applyVoucher = async (voucher: Voucher) => {
    if (!order) return;
    setSelectedVoucher(voucher);
    setVoucherModal(false);

    const discountAmount = voucher.amount || 0;

    try {
      const res = await axios.patch(
        "/api/orders/update-total",
        {
          order_id: order.id,
          subtotal: subtotal,
          discount: discountAmount,
        },
        { headers: { Authorization: `Bearer ${tokenInStore}` } }
      );
      setOrder((prev) =>
        prev ? { ...prev, total_price: res.data.total_price } : prev
      );
    } catch (err) {
      console.error("Failed to apply voucher:", err);
      alert("Failed to apply voucher");
    }
  };

  // Apply custom voucher
  const applyCustomVoucher = async (code: string) => {
    if (!order || !code) return;

    try {
      const res = await axios.get(`/api/discounts/validate?code=${code}`, {
        headers: { Authorization: `Bearer ${tokenInStore}` },
      });
      const voucher = res.data.data;

      if (!voucher || !voucher.id) {
        alert("Invalid voucher code");
        return;
      }

      applyVoucher({
        id: voucher.id,
        code: voucher.name,
        amount: voucher.amount,
        minOrder: voucher.min_order,
        imageURL: voucher.image_url,
      });
    } catch (err) {
      console.error("Failed to validate custom voucher:", err);
      alert("Failed to validate custom voucher");
    }
  };

  const discount = selectedVoucher ? selectedVoucher.amount : 0;

  // Checkout
  const handleCheckout = async () => {
    if (!order || !paymentMethodID) return;

    try {
      if (selectedVoucher?.id) {
        await axios.post(
          "/api/discount-usage",
          { order_id: order.id, discountcode_id: selectedVoucher.id },
          { headers: { Authorization: `Bearer ${tokenInStore}` } }
        );
      }

      if (paymentMethodID === 1) {
        // QR Code Payment
        await axios.post(
          "/api/payments",
          { order_id: order.id, payment_method_id: paymentMethodID },
          { headers: { Authorization: `Bearer ${tokenInStore}` } }
        );
        clearCart();
        navigate(`/user/pay-qrcode/${order.id}`);
      } else if (paymentMethodID === 2) {
        // Cash on Delivery → แสดง Modal Success
        clearCart();
        setShowSuccessModal(true);

        // เด้งไปหน้าหลักหลัง 2 วินาที
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Checkout failed:", err.response?.data || err.message);
      alert(
        "Checkout failed: " + (err.response?.data?.error || err.message)
      );
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
            {people ? (
              <>
                <p>
                  <strong>
                    {people.first_name} {people.last_name}
                  </strong>{" "}
                  {people.phone}
                </p>
                <p>{people.address}</p>
              </>
            ) : (
              <p>Loading address...</p>
            )}
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
                    <td>
                      ฿{(item.product.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Voucher */}
          <div className="voucher-card">
            <span>Platform Voucher</span>
            <button
              className="voucher-btn"
              onClick={() => setVoucherModal(true)}
            >
              {selectedVoucher
                ? `Applied: ${selectedVoucher.code}`
                : "Select or enter code"}
            </button>
          </div>

          {/* Voucher Modal */}
          {voucherModal && (
            <div
              className="modal-overlay"
              onClick={() => setVoucherModal(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Select Voucher</h3>
                <ul>
                  {availableVouchers.map((v) => (
                    <li key={v.code}>
                      <button
                        className="voucher-option"
                        onClick={() => applyVoucher(v)}
                        disabled={subtotal < (v.minOrder || 0)}
                      >
                        {v.code} - ฿{v.amount}{" "}
                        {v.minOrder ? `(Min ฿${v.minOrder})` : ""}
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
                  <button
                    className="apply-btn"
                    onClick={() => applyCustomVoucher(customVoucher)}
                  >
                    Apply
                  </button>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setVoucherModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="order-card">
            <h3>💳 Payment Method</h3>
            <div style={{ display: "flex", gap: 20 }}>
              <button
                className={
                  paymentMethodID === 2 ? "selected-btn" : "payment-btn"
                }
                onClick={() => setPaymentMethodID(2)}
              >
                Cash on Delivery
              </button>
              <button
                className={
                  paymentMethodID === 1 ? "selected-btn" : "payment-btn"
                }
                onClick={() => setPaymentMethodID(1)}
              >
                QR Code
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <p>
              Order Total ({order.order_items.length} Items):{" "}
              <strong>฿{subtotal.toLocaleString()}</strong>
            </p>
            {selectedVoucher &&
              subtotal >= (selectedVoucher.minOrder || 0) && (
                <p>
                  Discount ({selectedVoucher.code}): -฿
                  {discount.toLocaleString()}
                </p>
              )}
            <h3>
              Total Payment:{" "}
              <strong>
                ฿{Math.max(subtotal - discount, 0).toLocaleString()}
              </strong>
            </h3>
            {paymentMethodID && (
              <p>
                Payment Method:{" "}
                <strong>
                  {paymentMethodID === 2 ? "Cash on Delivery" : "QR Payment"}
                </strong>
              </p>
            )}
          </div>

          {/* Checkout Button */}
          <div className="order-submit">
            <button
              className="submit-btn"
              onClick={handleCheckout}
              disabled={!paymentMethodID}
            >
              Checkout
            </button>
          </div>
        </>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>✅ Checkout Successful!</h2>
            <p>Redirecting to homepage...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
