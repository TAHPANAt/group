import React from "react";
import { ShoppingOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Space, Typography } from "antd";
import useEcomStore from "../../store/ecom-store";
import axios from "axios";
import "./Cart.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";


const { Text } = Typography;

export default function CartPage() {
  const carts = useEcomStore((state) => state.carts);
  const actionUpdateQuantity = useEcomStore((state) => state.actionUpdateQuantity);
  const actionRemoveProduct = useEcomStore((state) => state.actionRemoveProduct);
  const GettotalPrice = useEcomStore((state) => state.GettotalPrice);
  const authHeader = useEcomStore((state) => state.authHeader);
  const navigate = useNavigate(); // ✅ สร้าง navigate


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
        // ลบสินค้า
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

  // ฟังก์ชันชำระเงิน / บันทึก order item
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

      // ล้าง cart state หลังสั่งซื้อ
      useEcomStore.setState({ carts: [] });

      // ✅ navigate ไปหน้า order แทน window.location.href
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
        <Card key={item.ID} style={{ marginBottom: 16 }}>
          <Space align="start">
            <Checkbox
              checked={item.checked}
              onChange={(e) => toggleOne(item.ID, e.target.checked)}
            />
            <img
              src={`http://localhost:8080${item.Product.ProductImage?.[0]?.image_path}`}
              alt={item.Product.name}
              style={{ width: 80, height: 80, objectFit: "cover" }}
            />
            <div>
              <Text strong>{item.Product.name}</Text>
              <p>ราคา: {item.Product.price} บาท</p>
              <p>
                จำนวน:{" "}
                <Button
                  onClick={() =>
                    handleUpdateCartItem(item.Product.ID, item.count - 1, item.ID)
                  }
                >
                  -
                </Button>
                <span style={{ margin: "0 8px" }}>{item.count}</span>
                <Button
                  onClick={() =>
                    handleUpdateCartItem(item.Product.ID, item.count + 1, item.ID)
                  }
                >
                  +
                </Button>
              </p>
              <p>รวม: {item.Product.price * item.count} บาท</p>
            </div>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                handleUpdateCartItem(item.Product.ID, 0, item.ID)
              }
            >
              ลบ
            </Button>
          </Space>
        </Card>
      ))}

      <Card>
        <Space>
          <Checkbox
            checked={allChecked}
            indeterminate={!allChecked && carts.some((i: any) => i.checked)}
            onChange={(e) => toggleAll(e.target.checked)}
          >
            เลือกทั้งหมด
          </Checkbox>
          <Button danger onClick={deleteSelected}>
            ลบสินค้าที่เลือก
          </Button>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Text strong>รวมทั้งหมด: {total} บาท</Text>

          {!carts.some((i: any) => i.checked) ? (
            <Button
              type="primary"
              icon={<ShoppingOutlined />}
              style={{ marginLeft: 16 }}
              onClick={() => alert("กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้น")}
            >
              สั่งซื้อ
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<ShoppingOutlined />}
              style={{ marginLeft: 16 }}
              onClick={handleCheckout}
            >
              สั่งซื้อ
            </Button>
          )}


        </div>
      </Card>
    </div>
  );
}
