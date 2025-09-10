import React from "react";
import { ShoppingOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Space, Typography } from "antd";
import useEcomStore from "../../store/ecom-store";
import axios from "axios";
import "./Cart.css";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

export default function CartPage() {
  const carts = useEcomStore((state) => state.carts);
  const actionUpdateQuantity = useEcomStore((state) => state.actionUpdateQuantity);
  const actionRemoveProduct = useEcomStore((state) => state.actionRemoveProduct);
  const authHeader = useEcomStore((state) => state.authHeader);
  const navigate = useNavigate();

  // Checkbox
  const allChecked = carts.every((i: any) => i.checked);
  const toggleAll = (checked: boolean) => {
    useEcomStore.setState({
      carts: carts.map((i: any) => ({ ...i, checked })),
    });
  };
  const toggleOne = (id: number, checked: boolean) => {
    useEcomStore.setState({
      carts: carts.map((i: any) =>
        i.ID === id ? { ...i, checked } : i
      ),
    });
  };

  // Update quantity / delete
  const handleUpdateCartItem = async (productId: number, newQuantity: number, itemId: number) => {
    try {
      if (newQuantity < 1) {
        await axios.delete(`/api/cart/item/product/${productId}`, {
          headers: { ...authHeader() },
        });
        actionRemoveProduct(itemId);
      } else {
        await axios.post(
          "/api/cart",
          { cart_items: [{ product_id: productId, quantity: newQuantity }] },
          { headers: { ...authHeader(), "Content-Type": "application/json" } }
        );
        actionUpdateQuantity(itemId, newQuantity);
      }
    } catch (err) {
      console.error("Error updating cart item:", err);
      alert("อัปเดตตะกร้าไม่สำเร็จ");
    }
  };

  // ลบสินค้าที่เลือก
  const deleteSelected = async () => {
    for (const item of carts.filter((i: any) => i.checked)) {
      try {
        await axios.delete(`/api/cart/item/product/${item.Product.ID}`, {
          headers: { ...authHeader() },
        });
      } catch (err) {
        console.error("Error deleting cart item:", err);
        alert(`ลบสินค้า ${item.Product.name} ไม่สำเร็จ`);
      }
    }
    useEcomStore.setState({
      carts: carts.filter((i: any) => !i.checked),
    });
  };

  // Checkout
  const handleCheckout = async () => {
    const selectedItems = carts.filter((i: any) => i.checked);
    if (selectedItems.length === 0) {
      alert("กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นก่อนสั่งซื้อ");
      return;
    }

    try {
      const payload = {
        order_items: selectedItems.map((i: any) => ({
          cart_item_id: i.ID,
          product_id: i.Product.ID,
          quantity: i.count,
          price: i.Product.price,
        })),
      };

      await axios.post("/api/order", payload, {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      });

      alert("สั่งซื้อสำเร็จ บันทึกข้อมูลเรียบร้อยแล้ว");
      navigate("/Order");
    } catch (err) {
      console.error("Error during checkout:", err);
      alert("เกิดข้อผิดพลาดในการสั่งซื้อ");
    }
  };

  const total = carts
    .filter((i: any) => i.checked)
    .reduce((sum: number, i: any) => sum + i.Product.price * i.count, 0);

  return (
    <div className="cart-page">
      {carts.map((item: any) => (
        <Card key={item.ID} className="cart-card">
          <div className="cart-item">
            <Checkbox
              checked={item.checked}
              onChange={(e) => toggleOne(item.ID, e.target.checked)}
              className="cart-checkbox"
            />
            <img
              src={`http://localhost:8080${item.Product.ProductImage?.[0]?.image_path}`}
              alt={item.Product.name}
              className="cart-thumb"
            />

            {/* ✅ รายละเอียดสินค้าแบบแนวนอน */}
            <div className="cart-item-info">
              <span className="cart-name">{item.Product.name}</span>
              <span className="cart-price">฿{item.Product.price}</span>
              <span className="cart-qty">
                <Button
                  className="cart-qty-btn"
                  onClick={() =>
                    handleUpdateCartItem(item.Product.ID, item.count - 1, item.ID)
                  }
                >
                  -
                </Button>
                <span className="cart-qty-display">{item.count}</span>
                <Button
                  className="cart-qty-btn"
                  onClick={() =>
                    handleUpdateCartItem(item.Product.ID, item.count + 1, item.ID)
                  }
                >
                  +
                </Button>
              </span>
              <span className="cart-total">฿{item.Product.price * item.count}</span>
            </div>

            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="cart-btn-delete"
              onClick={() =>
                handleUpdateCartItem(item.Product.ID, 0, item.ID)
              }
            >
              ลบ
            </Button>
          </div>
        </Card>
      ))}

      {/* Footer */}
      <div className="cart-footer">
        <Space>
          <Checkbox
            checked={allChecked}
            indeterminate={!allChecked && carts.some((i: any) => i.checked)}
            onChange={(e) => toggleAll(e.target.checked)}
            className="cart-checkbox"
          >
            เลือกทั้งหมด
          </Checkbox>
          <Button danger onClick={deleteSelected}>
            ลบสินค้าที่เลือก
          </Button>
        </Space>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text strong className="cart-total">
            รวมทั้งหมด: ฿{total}
          </Text>

          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            className="cart-btn-checkout"
            onClick={handleCheckout}
          >
            สั่งซื้อ
          </Button>
        </div>
      </div>
    </div>
  );
}
