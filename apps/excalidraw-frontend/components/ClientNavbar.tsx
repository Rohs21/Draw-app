"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientNavbar() {
  const pathname = usePathname();

  // hide navbar on these pages
  const hideNavbar = pathname === "/signin" || pathname === "/signup" || pathname.startsWith("/canvas/");

  if (hideNavbar) return null;

  return <Navbar />;
}
