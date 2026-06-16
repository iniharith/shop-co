"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { navItems, printingCategories } from "@/constants";
import { Input } from "../ui/input";
import { IoCloseCircle, IoNotifications, IoSearch } from "react-icons/io5";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { Button } from "@heroui/button";
import { FaCartShopping } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import { FaBars } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import NotificationsDrawer from "./notifications-drawer";
import { useNav } from "@/hooks/useNav";
import AuthModal from "../page-sections/auth/authModal";

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "Order Shipped",
    message: "Your order #12345 has been shipped and is on its way!",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Special Offer",
    message: "Get 20% off on all summer collection items!",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 3,
    title: "Cart Reminder",
    message: "You have items waiting in your cart. Complete your purchase now!",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    title: "Order Delivered",
    message: "Your order #10987 has been delivered successfully.",
    time: "3 days ago",
    read: true,
  },
];

const MobileNavSheetContent = ({ closeDrawer }: { closeDrawer: Function }) => {
  const pathname = usePathname();
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed z-50 inset-0 bg-black/10 backdrop-blur-sm" />
      <Drawer.Content
        className="left-1 top-2 bottom-2 fixed z-50 outline-none w-[310px] flex"
        style={
          { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
        }
      >
        <div className="bg-gray-200 h-full w-full grow px-3 py-1 flex flex-col rounded-[16px]">
          <Drawer.Title className="font-medium px-0 border-b border-dashed border-zinc-900/20 justify-between flex items-center mb-2 text-white">
            {/* ── MOBILE LOGO ── */}
            <div className="top-0 -translate-x-1 left-0 py-2">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/kampung-cetak-logo.png"
                  alt="Kampung Cetak"
                  width={56}
                  height={56}
                  className="object-contain rounded-2xl"
                />
                <span className="text-lg text-black font-bold">Kampung Cetak</span>
              </Link>
            </div>
            <Button
              onPress={() => closeDrawer()}
              size="sm"
              isIconOnly
              variant="ghost"
              className="text-xl active:scale-100 border-0 px-0 text-primary bg-transparent"
            >
              <IoCloseCircle />
            </Button>
          </Drawer.Title>
          <Drawer.Description className="mb-2 flex flex-col gap-4">
            {navItems.map((e, i) => (
              <Link
                className={cn(
                  "w-full flex items-center justify-between",
                  pathname == e.href && "text-primary"
                )}
                key={e.href + "mobile" + i}
                href={e.href}
              >
                <span className="">{e.label}</span>
                <IoIosArrowDroprightCircle
                  className={cn(
                    "text-primary text-lg",
                    pathname != e.href && "opacity-50"
                  )}
                />
              </Link>
            ))}
          </Drawer.Description>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
};

const Nav = () => {
  const {
    isOpen,
    setIsOpen,
    closeDrawer,
    cartCount,
    isNotificationsOpen,
    setIsNotificationsOpen,
    pathname,
    session,
    router,
    setIsAuthModalOpen,
    notification,
  } = useNav();

  return (
    <>
      <div className="w-full flex flex-col bg-gray-200">
      {/* ── MAIN HEADER (LOGO, SEARCH, ICONS) ── */}
      <div className="w-full px-7 py-4 flex justify-between items-center gap-6">
        <Drawer.Root
          shouldScaleBackground
          open={isOpen}
          onOpenChange={setIsOpen}
          direction="left"
        >
          <Drawer.Trigger className="md:hidden block">
            <FaBars />
          </Drawer.Trigger>
          <MobileNavSheetContent closeDrawer={closeDrawer} />
        </Drawer.Root>

        {/* ── DESKTOP LOGO ── */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/kampung-cetak-logo.png"
              alt="Kampung Cetak"
              width={64}
              height={64}
              className="object-contain rounded-2xl"
            />
            <h1 className="text-2xl font-bold tracking-tight text-primary">Kampung Cetak</h1>
          </Link>
        </div>

        {/* ── BIG SEARCH BAR (MIDDLE) ── */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-auto relative items-center bg-white rounded-full border border-gray-300 shadow-sm overflow-hidden px-4 py-1">
          <IoSearch className="text-gray-500 text-xl mr-2 shrink-0" />
          <Input
            className="w-full focus-visible:ring-0 text-md bg-transparent border-none shadow-none ring-0 focus-visible:ring-offset-0 px-0 h-10"
            type="text"
            placeholder="Search products, services, or categories..."
          />
          <Button className="bg-primary text-white rounded-full px-6 h-9 shrink-0 ml-2">
            Search
          </Button>
        </div>

        {/* ── ICONS & AUTH ── */}
        <div className="flex gap-3 items-center shrink-0">
          {session?.user?.id ? (
            <>
              <div className="relative">
                <Button
                  onPress={() => router.push("/home/cart")}
                  isIconOnly
                  variant="ghost"
                  className="rounded-full p-2 cursor-pointer hover:bg-gray-300 transition-colors"
                >
                  <FaCartShopping className="text-xl text-gray-700" />
                </Button>
                <Badge className="absolute top-0 right-0 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-200">
                  {cartCount}
                </Badge>
              </div>
              <div className="relative">
                <Button
                  onPress={() => setIsNotificationsOpen(true)}
                  isIconOnly
                  variant="ghost"
                  className="rounded-full p-2 cursor-pointer hover:bg-gray-300 transition-colors hidden md:flex"
                >
                  <IoNotifications className="text-xl text-gray-700" />
                </Button>
                <Badge className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full md:flex items-center justify-center border-2 border-gray-200 hidden">
                  {notification
                    ? notification.filter((n) => !n.read).length
                    : 0}
                </Badge>
              </div>
              <Button
                onPress={() => router.push("/home/profile")}
                isIconOnly
                variant="ghost"
                className="rounded-full p-2 cursor-pointer hover:bg-gray-300 transition-colors hidden sm:flex"
              >
                <CgProfile className="text-xl text-gray-700" />
              </Button>
            </>
          ) : (
            <Button
              onPress={() => setIsAuthModalOpen(true)}
              className="rounded-full px-6 font-semibold cursor-pointer border-primary border text-sm bg-primary hover:bg-primary/90 transition-all duration-300 text-white"
            >
              Login
            </Button>
          )}
        </div>
      </div>

      {/* ── SECONDARY NAVBAR (MEGA MENU / CATEGORIES) ── */}
      <div className="w-full bg-white border-y border-gray-200 hidden md:block relative z-50">
        <div className="max-w-[1400px] mx-auto px-7 py-3 flex items-center justify-center gap-8 flex-wrap">
          {printingCategories.map((item, index) => (
            <div key={index} className="relative group">
              <Link
                href={item.href}
                className="text-primary font-bold uppercase tracking-wide inline-block py-2"
              >
                <p className="relative text-sm inline-block overflow-hidden transition-colors">
                  <span className="inline-block transition-all duration-300 opacity-100 group-hover:-translate-y-6">
                    {item.label}
                  </span>
                  <span className="absolute left-0 inline-block translate-y-5 transition-all duration-300 group-hover:scale-[.9] group-hover:translate-y-0">
                    {item.label}
                  </span>
                </p>
              </Link>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border border-gray-200 shadow-xl rounded-md min-w-[220px] py-2 z-50 transition-all duration-300">
                {item.subItems?.map((sub, idx) => (
                  <Link
                    key={idx}
                    href={sub.href}
                    className="px-4 py-2 text-sm text-black font-medium hover:bg-gray-100 hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
      <AuthModal nowProp={"login"} />
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        setIsOpen={setIsNotificationsOpen}
        notifications={notification}
      />
    </>
  );
};

export default Nav;
