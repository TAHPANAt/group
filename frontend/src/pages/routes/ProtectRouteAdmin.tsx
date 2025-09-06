// routes/ProtectRouteAdmin.tsx
import { useEffect, useState, type JSX } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import { currentUser } from "../../api/auth";

type Props = { element: JSX.Element };

const ProtectRouteAdmin: React.FC<Props> = ({ element }) => {
  const [status, setStatus] = useState<"checking" | "ok" | "deny" | "forbid">("checking");
  const token = useEcomStore((s: any) => s.token);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) return;
      try {
        const res =  await currentUser(token);

        const username: string | undefined = res?.data?.user?.username;
        if (!alive) return;

        if (username && username.toLowerCase() === "admin") {
          setStatus("ok");
        } else {
          setStatus("forbid"); // มี token แต่ไม่ใช่ admin
        }
      } catch {
        if (alive) setStatus("deny"); // token ไม่ถูกต้อง/หมดอายุ
      }
    })();

    return () => { alive = false; };
  }, [token]);

  if (!token || status === "checking") return <div>Loading… ตรวจสิทธิ์แอดมิน</div>;
  if (status === "deny")   return <Navigate to="/login" replace />;
  if (status === "forbid") return <div>Loading… ตรวจสิทธิ์แอดมิน</div>;

  return element;
};

export default ProtectRouteAdmin;