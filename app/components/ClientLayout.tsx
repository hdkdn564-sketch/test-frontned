"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import WhatsappButton from "./WhatsappButton";
import TrustedBadge from "./TrustedBadge";
import AddToCartPopup from "./AddToCartPopup";
import AuthProvider from "./auth/AuthProvider";
import SnapPixel from "./SnapPixel";

export default function ClientLayout({
  children,
  footer,
  whatsapp,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  whatsapp?: string;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isVerify = pathname === "/checkout/verify";
  const isMaintenance = pathname.startsWith("/maintenance");
  const isAuth = pathname.startsWith("/auth");
  const hideChrome = isAdmin || isVerify || isMaintenance;

  return (
    <AuthProvider>
      <SnapPixel />
      {!hideChrome && <Navbar />}
      {children}
      {!hideChrome && !isAuth && footer}
      {!hideChrome && !isAuth && <WhatsappButton whatsapp={whatsapp} />}
      {/* {!hideChrome && !isAuth && <TrustedBadge />} */}
      {!hideChrome && !isAuth && <AddToCartPopup />}
    </AuthProvider>
  );
}
