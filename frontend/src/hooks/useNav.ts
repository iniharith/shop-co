/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "nextjs-toploader/app";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import { useGetCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotification";

export const useNav = () => {
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = React.useState(false);
    const closeDrawer = () => setIsOpen(false);
    const { data: session } = useSession();
    const router = useRouter();
    const { setIsAuthModalOpen } = useUIStore();
    useEffect(() => {
      if (isOpen) {
        setIsOpen(false);
      }
    }, [pathname]);
  
    const { data: response } = useGetCart();
    const [cartCount, setCartCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { data: notificationsResponse } = useNotifications();
    const notification = notificationsResponse?.notifications || [];
    useEffect(() => {
      console.log("response", response);
      if (response?.cart) {
        setCartCount(response.cart.items.length);
      }
    }, [response]);

    // ── Scroll-based header visibility (ThrottleHaus + Arteriors style) ──
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
      const HEADER_HEIGHT = 120;

      const updateHeaderVisibility = () => {
        const currentScrollY = window.scrollY;

        setIsScrolled(currentScrollY > 0);

        // At top of page → always show
        if (currentScrollY <= 0) {
          setIsHeaderVisible(true);
        }
        // Scrolling up → show
        else if (currentScrollY < lastScrollY.current) {
          setIsHeaderVisible(true);
        }
        // Scrolling down → hide (only if past header height)
        else if (currentScrollY > lastScrollY.current && currentScrollY > HEADER_HEIGHT) {
          setIsHeaderVisible(false);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      };

      const onScroll = () => {
        if (!ticking.current) {
          requestAnimationFrame(updateHeaderVisibility);
          ticking.current = true;
        }
      };

      // Always show header when drawer is open
      if (isOpen) {
        setIsHeaderVisible(true);
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }, [isOpen]);

    return {
        isOpen,
        setIsOpen,
        closeDrawer,
        cartCount,
        isNotificationsOpen,
        setIsNotificationsOpen,
        notification,
        pathname,
        isMobile,
        session,
        router,
        setIsAuthModalOpen,
        response,
        isScrolled,
        isHeaderVisible,
    }
}

