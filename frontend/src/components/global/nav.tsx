/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { navItems, printingCategories } from "@/constants";
import { Input } from "../ui/input";
import { IoCloseCircle, IoNotifications, IoSearch } from "react-icons/io5";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { Button } from "@heroui/button";
import { FaCartShopping, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { FaBars } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import NotificationsDrawer from "./notifications-drawer";
import { useNav } from "@/hooks/useNav";
import AuthModal from "../page-sections/auth/authModal";
import { CgProfile } from "react-icons/cg";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageProvider";
import { categoryLabels } from "@/i18n/messages";
import { AI_SEARCH_ENABLED, aiSemanticSearch, aiSearchSuggestions } from "@/utils/aiSearch";

// ── Mobile Drawer Content ────────────────────────────────────────────────────
const MobileNavSheetContent = ({
  closeDrawer,
  session,
  router,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearchFocused,
  setIsSearchFocused,
  handleSearch,
  aiSuggestions,
}: {
  closeDrawer: Function;
  session: any;
  router: any;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchResults: any[];
  isSearchFocused: boolean;
  setIsSearchFocused: (val: boolean) => void;
  handleSearch: (e: React.FormEvent) => void;
  aiSuggestions: string[];
}) => {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  // Track which category accordion is open (by index, null = none)
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  const toggleCategory = (index: number) => {
    setOpenCategory((prev) => (prev === index ? null : index));
  };

  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed z-50 inset-0 bg-black/10 backdrop-blur-sm" />
      <Drawer.Content
        className="left-1 top-2 bottom-2 fixed z-50 outline-none w-[310px] flex"
        style={
          { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
        }
      >
        <div className="bg-muted text-foreground h-full w-full grow px-3 py-1 flex flex-col rounded-[16px] overflow-y-auto">

          {/* ── HEADER: Logo + Close ── */}
          <Drawer.Title className="font-medium px-0 border-b border-dashed border-border justify-between flex items-center mb-3">
            <div className="top-0 -translate-x-1 left-0 py-2">
              <Link href="/" className="flex items-center gap-2" onClick={() => closeDrawer()}>
                <Image
                  src="/images/kampung-cetak-logo.png"
                  alt="Kampung Cetak"
                  width={36}
                  height={36}
                  className="object-contain rounded-full"
                />
                <span className="text-lg text-black dark:text-foreground font-bold">Kampung Cetak</span>
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

          {/* ── USER PROFILE CHIP ── */}
          {session?.user?.id && (
            <button
              onClick={() => { router.push("/home/profile"); closeDrawer(); }}
              className="flex items-center gap-3 mb-3 px-3 py-2 bg-white dark:bg-popover rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-muted transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 overflow-hidden">
                {(() => {
                  const avatar = (session?.user as any)?.avatar || (session?.user as any)?.image;
                  if (!avatar) return session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <CgProfile size={16} />;
                  const url = avatar.startsWith('http') ? avatar.replace('http://', 'https://') : `${process.env.NEXT_PUBLIC_BACKEND_URL}/${avatar.replace(/\\/g, '/').replace(/^\/?/, '')}`;
                  return <Image src={url} alt={session.user.name || "Profile"} width={36} height={36} className="object-cover w-full h-full" />;
                })()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
                  {session.user.name || t("nav.profile")}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">{session.user.email || ""}</p>
              </div>
            </button>
          )}

          {/* ── MOBILE SEARCH ── */}
          <form 
            onSubmit={(e) => { handleSearch(e); closeDrawer(); }}
            className="z-50 flex flex-col relative bg-card rounded-xl border border-border shadow-sm overflow-visible mb-3 px-3 py-1"
          >
            <div className="flex items-center w-full">
              <IoSearch className="text-gray-500 dark:text-muted-foreground text-lg mr-2 shrink-0" />
              <Input
                className="w-full focus-visible:ring-0 text-sm bg-transparent border-none shadow-none ring-0 focus-visible:ring-offset-0 px-0 h-10 dark:text-foreground"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder={t("nav.mobileSearchPlaceholder")}
              />
            </div>
            {isSearchFocused && searchQuery.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl max-h-[250px] overflow-y-auto z-[60] py-2">
                {searchResults.length > 0 ? (
                  searchResults.map((prod: any) => (
                    <div 
                      key={prod._id}
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchFocused(false);
                        closeDrawer();
                        router.push(`/home/shop/${prod._id}`);
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 shrink-0">
                        <Image src={prod.images?.[0] || "/images/kampung-cetak-logo.png"} alt={prod.name} width={32} height={32} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground">{prod.name}</span>
                        <span className="text-[10px] text-primary font-bold">RM {prod.price}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-xs text-muted-foreground text-center">{t("nav.noProducts")}</div>
                )}
                {aiSuggestions.length > 0 && (
                  <div className="border-t border-border mt-1 pt-1">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">🤖 Cadangan AI</p>
                    <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
                      {aiSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSearchQuery("");
                            setIsSearchFocused(false);
                            closeDrawer();
                            router.push(`/home/shop?search=${encodeURIComponent(s)}`);
                          }}
                          className="text-xs bg-muted hover:bg-primary/10 text-foreground border border-border rounded-full px-3 py-1 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* ── MAIN NAV LINKS ── */}
          <Drawer.Description className="mb-3 flex flex-col gap-3">
            {navItems.map((e, i) => (
              <Link
                className={cn(
                  "w-full flex items-center justify-between py-1",
                  pathname === e.href && "text-primary"
                )}
                key={e.href + "mobile" + i}
                href={e.href}
                onClick={() => closeDrawer()}
              >
                <span className="font-medium text-sm">{e.label}</span>
                <IoIosArrowDroprightCircle
                  className={cn(
                    "text-primary text-lg",
                    pathname !== e.href && "opacity-40"
                  )}
                />
              </Link>
            ))}
          </Drawer.Description>

          {/* ── CATEGORIES (accordion) ── */}
          <div className="border-t border-dashed border-border pt-3 flex-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              {t("nav.categories")}
            </p>
            <div className="flex flex-col gap-1">
              {printingCategories.map((item, index) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openCategory === index;

                return (
                  <div key={index} className="rounded-xl overflow-hidden">
                    {/* Category Header Row */}
                    <button
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors rounded-xl",
                        isOpen
                          ? "bg-primary text-primary-foreground"
                          : "text-primary hover:bg-white dark:hover:bg-muted"
                      )}
                      onClick={() => {
                        if (hasSubItems) {
                          toggleCategory(index);
                        } else {
                          router.push(item.href);
                          closeDrawer();
                        }
                      }}
                    >
                      <span>{categoryLabels[locale][item.label] || item.label}</span>
                      {hasSubItems && (
                        isOpen
                          ? <FaChevronUp className="text-xs" />
                          : <FaChevronDown className="text-xs opacity-50" />
                      )}
                    </button>

                    {/* Sub-items — only visible when accordion is open */}
                    {hasSubItems && isOpen && (
                      <div className="bg-white dark:bg-popover rounded-b-xl px-2 pb-2 flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-150">
                        {item.subItems!.map((sub, idx) => (
                          <Link
                            key={idx}
                            href={sub.href}
                            onClick={() => closeDrawer()}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-foreground hover:text-primary hover:bg-gray-50 dark:hover:bg-muted rounded-lg transition-colors"
                          >
                            <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
};

// ── Main Nav Component ───────────────────────────────────────────────────────
const Nav = () => {
  const { locale, t } = useLanguage();
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
    isScrolled,
    isHeaderVisible,
  } = useNav();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const getAvatarUrl = () => {
    const avatar = (session?.user as any)?.avatar || (session?.user as any)?.image;
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar.replace('http://', 'https://');
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${avatar.replace(/\\/g, '/').replace(/^\/?/, '')}`;
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setAiSuggestions([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      const { dummyProducts } = await import("@/constants/dummy-products");
      if (!active) return;
      const lower = query.toLowerCase();
      let results = dummyProducts.filter((product: any) =>
        product.name?.toLowerCase().includes(lower) || product.category?.toLowerCase().includes(lower)
      ).slice(0, 8);

      if (AI_SEARCH_ENABLED) {
        const [ai, suggestions] = await Promise.all([
          aiSemanticSearch(query, { collections: ["products"], limit: 10 }),
          aiSearchSuggestions(query),
        ]);
        if (!active) return;
        if (ai?.groups?.products?.length) {
          const seen = new Set(results.map((p: any) => String(p._id)));
          const nameIndex = new Map(dummyProducts.map((p: any) => [String(p?.name || "").toLowerCase(), p]));
          const extra: any[] = [];
          for (const hit of ai.groups.products) {
            const meta = hit.metadata || {};
            const match = nameIndex.get(String(meta.name || hit.title || "").toLowerCase());
            if (match && !seen.has(String(match._id))) {
              seen.add(String(match._id));
              extra.push(match);
            }
          }
          results = [...extra, ...results].slice(0, 8);
        }
        setAiSuggestions(suggestions.filter((s) => s.toLowerCase() !== lower).slice(0, 4));
      }
      if (!active) return;
      setSearchResults(results);
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/home/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // ── Apply header-hidden class to parent .site-header element ──
  useEffect(() => {
    const headerEl = document.querySelector(".site-header");
    if (!headerEl) return;
    if (isHeaderVisible) {
      headerEl.classList.remove("header-hidden");
    } else {
      headerEl.classList.add("header-hidden");
    }
  }, [isHeaderVisible]);

  const isHomePage = pathname === "/";

  return (
    <>
      <div
        className={cn(
          "relative z-[70] w-full flex flex-col transition-all duration-300",
          isHomePage && !isScrolled
            ? "bg-transparent dark:bg-transparent"
            : "bg-white/70 dark:bg-background/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        )}
      >
        {/* ── MAIN HEADER ── */}
        <div className={cn(
          "w-full px-4 md:px-7 py-3 md:py-4 flex justify-between items-center gap-3 md:gap-6 border-b transition-colors duration-300",
          isHomePage && !isScrolled
            ? "border-white/10"
            : "border-black/5 dark:border-white/10"
        )}>

          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Drawer.Root
              shouldScaleBackground
              open={isOpen}
              onOpenChange={setIsOpen}
              direction="left"
            >
              <Drawer.Trigger className="md:hidden block p-1">
                <FaBars className={cn("text-xl transition-colors duration-300", isHomePage && !isScrolled ? "text-white" : "text-foreground")} />
              </Drawer.Trigger>
              <MobileNavSheetContent
                closeDrawer={closeDrawer}
                session={session}
                router={router}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
                handleSearch={handleSearch}
                aiSuggestions={aiSuggestions}
              />
            </Drawer.Root>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/kampung-cetak-logo.png"
                alt="Kampung Cetak"
                width={36}
                height={36}
                className="object-contain rounded-full md:w-10 md:h-10"
              />
              <h1 className={cn("text-lg md:text-2xl font-bold tracking-tight transition-colors duration-300", isHomePage && !isScrolled ? "text-white" : "text-primary")}>
                Kampung Cetak
              </h1>
            </Link>
          </div>

          {/* Center: Search (desktop only) */}
          <form 
            onSubmit={handleSearch}
            className={cn(
              "z-[80] hidden md:flex flex-1 max-w-2xl mx-auto relative items-center rounded-full border shadow-sm overflow-visible px-4 py-1 transition-colors duration-300",
              isHomePage && !isScrolled
                ? "bg-white/20 backdrop-blur-sm border-white/30"
                : "bg-card dark:bg-white/10 border-border dark:border-white/10"
            )}
          >
            <IoSearch className={cn("text-xl mr-2 shrink-0 transition-colors duration-300", isHomePage && !isScrolled ? "text-white/70" : "text-muted-foreground")} />
            <Input
              className={cn(
                "w-full focus-visible:ring-0 text-md bg-transparent border-none shadow-none ring-0 focus-visible:ring-offset-0 px-0 h-10 transition-colors duration-300",
                isHomePage && !isScrolled ? "text-white placeholder:text-white/60" : "text-foreground placeholder:text-muted-foreground"
              )}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder={t("nav.searchPlaceholder")}
            />
            <Button type="submit" className="bg-primary text-primary-foreground rounded-full px-6 h-9 shrink-0 ml-2">
              {t("nav.search")}
            </Button>

            {/* Live Search Suggestions Dropdown */}
            {isSearchFocused && searchQuery.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl max-h-[300px] overflow-y-auto z-[90] py-2">
                {searchResults.length > 0 ? (
                  searchResults.map((prod: any) => (
                    <div 
                      key={prod._id}
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchFocused(false);
                        router.push(`/home/shop/${prod._id}`);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                        <Image src={prod.images?.[0] || "/images/kampung-cetak-logo.png"} alt={prod.name} width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{prod.name}</span>
                        <span className="text-xs text-primary font-bold">RM {prod.price}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">{t("nav.noProducts")} &quot;{searchQuery}&quot;</div>
                )}
                {aiSuggestions.length > 0 && (
                  <div className="border-t border-border mt-1 pt-1">
                    <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">🤖 Cadangan AI</p>
                    <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
                      {aiSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSearchQuery("");
                            setIsSearchFocused(false);
                            router.push(`/home/shop?search=${encodeURIComponent(s)}`);
                          }}
                          className="text-xs bg-muted hover:bg-primary/10 text-foreground border border-border rounded-full px-3 py-1 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Right: Icons & Auth */}
          <div className="flex gap-2 md:gap-3 items-center shrink-0">
            <LanguageSwitcher />
            <ThemeSwitcher />
            {session?.user?.id ? (
              <>
                {/* Cart — always visible */}
                <div className="relative">
                  <Button
                    onPress={() => router.push("/home/cart")}
                    isIconOnly
                    variant="ghost"
                    className="rounded-full p-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-muted transition-colors"
                  >
                    <FaCartShopping className={cn("text-xl transition-colors duration-300", isHomePage && !isScrolled ? "text-white" : "text-foreground")} />
                  </Button>
                  <Badge className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-muted">
                    {cartCount}
                  </Badge>
                </div>

                {/* Notifications — desktop only */}
                <div className="relative hidden md:block">
                  <Button
                    onPress={() => setIsNotificationsOpen(true)}
                    isIconOnly
                    variant="ghost"
                    className="rounded-full p-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-muted transition-colors"
                  >
                    <IoNotifications className={cn("text-xl transition-colors duration-300", isHomePage && !isScrolled ? "text-white" : "text-foreground")} />
                  </Button>
                  <Badge className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-muted">
                    {notification ? notification.filter((n) => !n.read).length : 0}
                  </Badge>
                </div>

                {/* Profile Chip — avatar initial + name + email */}
                <Button
                  onPress={() => router.push("/home/profile")}
                  variant="ghost"
                  className="rounded-full px-2 md:px-3 py-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden transition-colors duration-300", isHomePage && !isScrolled ? "bg-white text-black" : "bg-primary text-primary-foreground")}>
                    {getAvatarUrl() ? (
                      <Image src={getAvatarUrl()} alt={session.user.name || "Profile"} width={32} height={32} className="object-cover w-full h-full" />
                    ) : session.user.name ? (
                      session.user.name.charAt(0).toUpperCase()
                    ) : (
                      <CgProfile size={16} />
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className={cn("text-sm font-semibold max-w-[100px] truncate transition-colors duration-300", isHomePage && !isScrolled ? "text-white" : "text-foreground")}>
                      {session.user.name || t("nav.profile")}
                    </span>
                    <span className={cn("text-[10px] max-w-[100px] truncate transition-colors duration-300", isHomePage && !isScrolled ? "text-white/70" : "text-muted-foreground")}>
                      {session.user.email || ""}
                    </span>
                  </div>
                </Button>
              </>
            ) : (
              <Button
                onPress={() => setIsAuthModalOpen(true)}
                className={cn(
                  "rounded-full px-4 md:px-6 font-semibold cursor-pointer border text-sm transition-all duration-300",
                  isHomePage && !isScrolled
                    ? "border-white/40 bg-white/10 hover:bg-white/20 text-white"
                    : "border-primary border bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {t("nav.login")}
              </Button>
            )}
          </div>
        </div>

        {/* ── DESKTOP CATEGORY NAV ── */}
        <div className={cn(
          "w-full border-y hidden md:block relative z-40 transition-all duration-300",
          isHomePage && !isScrolled
            ? "bg-transparent border-white/10"
            : "bg-white/50 dark:bg-background/50 backdrop-blur-xl border-black/5 dark:border-white/10"
        )}>
          <div className="max-w-[1400px] mx-auto px-7 py-3 flex items-center justify-center gap-8 flex-wrap">
            {printingCategories.map((item, index) => (
              <div key={index} className="relative group">
                <div
                  className={cn("font-bold uppercase tracking-wide inline-block py-2 cursor-default transition-colors duration-300", isHomePage && !isScrolled ? "text-white" : "text-primary")}
                >
                  <p className="relative text-sm inline-block overflow-hidden transition-colors">
                    <span className={cn("inline-block transition-all duration-300 opacity-100 group-hover:-translate-y-6", isHomePage && !isScrolled ? "text-white" : "text-primary")}>
                      {categoryLabels[locale][item.label] || item.label}
                    </span>
                    <span className={cn("absolute left-0 inline-block translate-y-5 transition-all duration-300 group-hover:scale-[.9] group-hover:translate-y-0", isHomePage && !isScrolled ? "text-white" : "text-primary")}>
                      {categoryLabels[locale][item.label] || item.label}
                    </span>
                  </p>
                </div>

                {/* Dropdown */}
                <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white dark:bg-popover border border-gray-200 dark:border-border shadow-xl rounded-md min-w-[220px] py-2 z-50">
                  {item.subItems?.map((sub, idx) => (
                    <Link
                      key={idx}
                      href={sub.href}
                      className="px-4 py-2 text-sm text-foreground font-medium hover:bg-gray-100 dark:hover:bg-muted hover:text-primary transition-colors whitespace-nowrap"
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
