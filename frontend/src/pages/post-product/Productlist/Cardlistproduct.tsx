import React, { useState } from 'react'
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Button, Drawer } from 'antd';
import useEcomStore from '../../../store/ecom-store';
import axios from 'axios';

type Props = {
    filteredProducts: any[];
};
const Cardlistproduct = ({ filteredProducts }: Props) => {
    const actionAddtoCart = useEcomStore((state) => state.actionAddtoCart)
    const actionUpdateQuantity = useEcomStore((state) => state.actionUpdateQuantity)
    const actionRemoveProduct = useEcomStore((state) => state.actionRemoveProduct)
    const GettotalPrice = useEcomStore((state) => state.GettotalPrice)

    const authHeader = useEcomStore((state) => state.authHeader);

    const carts = useEcomStore((state) => state.carts) as any[];
    console.log(carts)
    const [open, setOpen] = useState(false);

    const showDrawer = () => setOpen(true);
    const onClose = () => setOpen(false);

    const handleSaveCart = async () => {
        try {
            const payload = {
                cart_items: carts.map((item: any) => ({
                    product_id: item.Product.ID,       // <-- ID ของสินค้า
                    quantity: item.count,      // <-- จำนวนที่เลือก
                })),
            };

            await axios.post("/api/cart", payload, {
                headers: {
                    ...authHeader(),
                    "Content-Type": "application/json",
                },
            });

            alert("บันทึกตะกร้าเรียบร้อยแล้ว");
        } catch (err) {
            console.error("Error saving cart:", err);
            alert("เกิดข้อผิดพลาดในการบันทึกตะกร้า");
        }
    };

    const handleUpdateCartItem = async (itemId: number, newQuantity: number) => {
        try {
            if (newQuantity < 1) {
                // ลบสินค้าจาก backend
                await axios.delete(`/api/cart/item/${itemId}`, { headers: { ...authHeader() } });
                // ลบจาก frontend state
                actionRemoveProduct(itemId);
            } else {
                // update quantity
                const productId = carts.find((i) => i.ID === itemId)?.Product.ID;
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




    return (
        <div className="image-grid">
            {filteredProducts.map((product, idx) => {
                const imageUrl = `http://localhost:8080${product?.Product?.ProductImage?.[0]?.image_path}`;
                const name = product?.Product?.name || "ไม่มีชื่อสินค้า";
                const desciption = product?.Product?.description || "ไม่มีคำอธิบาย";
                const price = product?.Product?.price || 0;
                const quantity = product?.Product?.quantity || 0;
                const sellerId = product?.Seller?.ID;
                const logoUrl = product?.Seller?.ShopProfile?.logo_path
                    ? `http://localhost:8080${product?.Seller?.ShopProfile?.logo_path}`
                    : null;
                const shopName = product?.Seller?.ShopProfile?.shop_name || "ไม่ทราบชื่อร้าน";

                return (
                    <div className="image" key={idx}>
                        {/* ✅ รูปสินค้า */}
                        <img
                            src={imageUrl}
                            alt={`product-${idx}`}
                            style={{
                                width: "184px",
                                height: "184px",
                                objectFit: "cover",
                                border: "1px solid black",
                            }}
                        />
                        {/* ✅ โลโก้ร้านค้า */}
                        {logoUrl && sellerId && (
                            <Link
                                to={`/shop/${sellerId}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginBottom: "12px",
                                    textDecoration: "none",
                                    color: "#0c0909ff", // สีตัวอักษรปกติ
                                }}
                            >
                                <img
                                    src={logoUrl}
                                    alt="shop-logo"
                                    style={{
                                        width: "42px",
                                        height: "42px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "1px solid #ccc",
                                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <span
                                    style={{
                                        color: "#0c0909ff",
                                        fontWeight: 600,
                                        fontSize: "1rem",
                                        transition: "color 0.2s ease",
                                    }}
                                    className="shop-name"
                                >
                                    <h5>ชื่อร้านค้า :{shopName}</h5>
                                </span>
                            </Link>
                        )}



                        <p>ชื่อสินค้า :{name}</p>
                        <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "#555" }}>
                            คำอธิบาย: {desciption}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <p style={{ margin: 0 }}>ราคา: {price} บาท</p>


                            <div style={{ display: "flex", gap: 8 }}>

                                <Button
                                    size="small"
                                    onClick={async () => {
                                        try {
                                            // เรียก action เพิ่มใน state ของ frontend
                                            actionAddtoCart(product);

                                            // ส่งข้อมูลไป backend ทันที
                                            await axios.post(
                                                "/api/cart",
                                                {
                                                    cart_items: [
                                                        {
                                                            product_id: product.Product.ID,
                                                            quantity: 1, // เพิ่มทีละ 1
                                                        },
                                                    ],
                                                },
                                                {
                                                    headers: {
                                                        ...authHeader(),
                                                        "Content-Type": "application/json",
                                                    },
                                                }
                                            );

                                            // เปิด Drawer ให้เห็นตะกร้า
                                            showDrawer();
                                        } catch (err) {
                                            console.error("Error adding to cart:", err);
                                            alert("เพิ่มสินค้าในตะกร้าไม่สำเร็จ");
                                        }
                                    }}
                                >
                                    เพิ่ม
                                </Button>


                            </div>
                        </div>

                        <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "#555" }}>
                            คงเหลือ: {quantity}
                        </p>
                    </div>
                );
            })}
            <Drawer
                title="ตะกร้าสินค้า"
                open={open}
                onClose={onClose}
                mask={false}
                placement="right"
                width={360}
            >
                <div className="cart-drawer">
                    {carts.map((item, index) => (
                        <div key={index} className="cart-item">

                            <div className="cart-item-image"><img src={`http://localhost:8080${item?.Product?.ProductImage?.[0]?.image_path}`} /></div>

                            <div className="cart-item-details">
                                <h4>{item.Product.name}</h4>
                                <p>{item.Product.description}</p>
                                <div className="cart-item-qty">
                                    <button onClick={() => handleUpdateCartItem(item.ID, item.count - 1)}>-</button>
                                    <span>{item.count}</span>
                                    <button onClick={() => handleUpdateCartItem(item.ID, item.count + 1)}>+</button>
                                </div>

                            </div>

                            <div className="cart-item-price">
                                <div className="price">{item.Product.price * item.count}</div>
                                // ปุ่มลบ
                                <button className="remove" onClick={async () => {
                                    try {
                                        await axios.delete(`/api/cart/item/product/${item.Product.ID}`, {
                                            headers: { ...authHeader() },
                                        });
                                        actionRemoveProduct(item.ID); // update frontend state
                                    } catch (err) {
                                        console.error("Error deleting cart item:", err);
                                        alert("ลบสินค้าไม่สำเร็จ");
                                    }
                                }}>
                                    🗑️
                                </button>


                            </div>

                        </div>
                    ))}
                    <div className="cart-total">
                        <span>รวม</span>
                        <span>{GettotalPrice()}</span>
                    </div>

                    <Link to="/Cart" className="no-border-button left-font-size-large">
                        <button className="cart-checkout-btn">
                            เพิ่มสินค้า
                        </button>
                    </Link>

                </div>
            </Drawer>

            <div
                style={{
                    position: "fixed",   // ทำให้ปุ่มลอยอยู่กับที่
                    top: 56,             // ระยะจากด้านบน (px)
                    right: 16,           // ระยะจากด้านขวา (px)
                    zIndex: 1000,        // ให้ลอยอยู่เหนือ element อื่น
                }}
            >
                <Button
                    size="small"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => {
                        showDrawer();
                    }}
                />
            </div>

        </div>


    )
}

export default Cardlistproduct
