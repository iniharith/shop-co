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

    // ── Smooth Scroll-based header visibility without jitter ──
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
      const isHomePage = pathname === "/";
      const HEADER_HEIGHT = 150;
      const SCROLL_DELTA_THRESHOLD = 12;

      const updateHeaderVisibility = () => {
        const currentScrollY = window.scrollY;

        // Smooth hysteresis threshold to avoid boundary fluttering
        if (currentScrollY > 60) {
          setIsScrolled(true);
        } else if (currentScrollY <= 20) {
          setIsScrolled(false);
        }

        // On Homepage: Header is always visible, fixed and stable (never flaps/hides)
        if (isHomePage || currentScrollY <= 0) {
          setIsHeaderVisible(true);
        } else {
          // On other pages: Only toggle if scroll delta exceeds threshold
          const diff = currentScrollY - lastScrollY.current;
          if (Math.abs(diff) > SCROLL_DELTA_THRESHOLD) {
            if (diff < 0) {
              // Scrolling up
              setIsHeaderVisible(true);
            } else if (diff > 0 && currentScrollY > HEADER_HEIGHT) {
              // Scrolling down
              setIsHeaderVisible(false);
            }
          }
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
    }, [isOpen, pathname]);

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

