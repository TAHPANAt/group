import React from "react";
import { ShoppingOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Space, Typography, Modal } from "antd";
import useEcomStore from "../../store/ecom-store";
import axios from "axios";
import "./Cart.css";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;
const { confirm } = Modal;

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

  // ฟังก์ชันแสดง Modal ยืนยันการลบสินค้า
  const showDeleteConfirm = (productName: string, onOk: () => Promise<void>) => {
    confirm({
      title: <span style={{ color: "#d32f2f", fontWeight: 600 }}>ยืนยันการลบสินค้า</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#d32f2f", fontSize: 28 }} />,
      content: <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>
        คุณต้องการลบสินค้า <strong>{productName}</strong> หรือไม่?
      </div>,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      centered: true,
      maskClosable: true,
      okButtonProps: { style: { fontWeight: 600, borderRadius: 8, padding: "4px 16px" } },
      cancelButtonProps: { style: { borderRadius: 8, padding: "4px 16px" } },
      onOk,
    });
  };

  // Update quantity / delete
  const handleUpdateCartItem = (productId: number, newQuantity: number, itemId: number, productName?: string) => {
    if (newQuantity < 1) {
      showDeleteConfirm(productName || "", async () => {
        await axios.delete(`/api/cart/item/product/${productId}`, {
          headers: { ...authHeader() },
        });
        actionRemoveProduct(itemId);
      });
    } else {
      axios.post(
        "/api/cart",
        { cart_items: [{ product_id: productId, quantity: newQuantity }] },
        { headers: { ...authHeader(), "Content-Type": "application/json" } }
      )
      .then(() => actionUpdateQuantity(itemId, newQuantity))
      .catch(err => {
        console.error("Error updating cart item:", err);
        alert("อัปเดตตะกร้าไม่สำเร็จ");
      });
    }
  };

  // ลบสินค้าที่เลือก
  const deleteSelected = () => {
    const selectedItems = carts.filter((i: any) => i.checked);
    if (selectedItems.length === 0) {
      alert("กรุณาเลือกสินค้าที่ต้องการลบ");
      return;
    }

    confirm({
      title: <span style={{ color: "#d32f2f", fontWeight: 600 }}>ยืนยันการลบสินค้า</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#d32f2f", fontSize: 28 }} />,
      content: <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>
        คุณต้องการลบสินค้าที่เลือกจำนวน {selectedItems.length} ชิ้นหรือไม่?
      </div>,
      okText: "ลบทั้งหมด",
      okType: "danger",
      cancelText: "ยกเลิก",
      centered: true,
      maskClosable: true,
      okButtonProps: { style: { fontWeight: 600, borderRadius: 8, padding: "4px 16px" } },
      cancelButtonProps: { style: { borderRadius: 8, padding: "4px 16px" } },
      onOk() {
        return Promise.all(selectedItems.map(item =>
          axios.delete(`/api/cart/item/product/${item.Product.ID}`, { headers: { ...authHeader() } })
        ))
        .then(() => {
          useEcomStore.setState({
            carts: carts.filter((i: any) => !i.checked),
          });
        })
        .catch(err => {
          console.error("Error deleting selected cart items:", err);
          alert("ลบสินค้าที่เลือกไม่สำเร็จ");
        });
      },
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

      alert("สั่งซื้อสำเร็จ");
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
          <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
            <Checkbox
              checked={item.checked}
              onChange={(e) => toggleOne(item.ID, e.target.checked)}
            />
            <img
              src={`http://localhost:8080${item.Product.ProductImage?.[0]?.image_path}`}
              alt={item.Product.name}
              className="cart-thumb"
            />
            <div className="cart-item-info">
              <span className="cart-name">{item.Product.name}</span>
              <span className="cart-price">{item.Product.price} บาท</span>
              <span className="cart-qty">
                <Button
                  onClick={() =>
                    handleUpdateCartItem(item.Product.ID, item.count - 1, item.ID, item.Product.name)
                  }
                >
                  -
                </Button>
                <span className="cart-qty-display">{item.count}</span>
                <Button
                  onClick={() =>
                    handleUpdateCartItem(item.Product.ID, item.count + 1, item.ID, item.Product.name)
                  }
                >
                  +
                </Button>
              </span>
              <span className="cart-total">{item.Product.price * item.count} บาท</span>
            </div>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                handleUpdateCartItem(item.Product.ID, 0, item.ID, item.Product.name)
              }
            >
              ลบ
            </Button>
          </Space>
        </Card>
      ))}

      <Card className="cart-summary">
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
        <div className="cart-footer">
          <Text strong>รวมทั้งหมด: {total} บาท</Text>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            style={{ marginLeft: 16 }}
            onClick={handleCheckout}
          >
            สั่งซื้อ
          </Button>
        </div>
      </Card>
    </div>
  );
}
