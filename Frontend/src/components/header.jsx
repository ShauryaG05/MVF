import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import WatchlistModal from "./watchlistModal";
import ReviewsModal from "./reviewsModal";

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */

// Bar radius (16px) = inner radius (10px) + bar padding (6px) → concentric.
const INNER_RADIUS = "rounded-[10px]";

const EASE = "ease-[cubic-bezier(0.2,0,0,1)]";

// Every interactive item is h-10 (40px) so the hit area never drops below 40x40.
const itemBase = `relative inline-flex h-10 items-center ${INNER_RADIUS} px-3.5 text-[13px] font-semibold tracking-tight select-none cursor-pointer transition-[background-color,color,scale] duration-150 active:scale-[0.96]`;

const navLinkClass = ({ isActive }) =>
    `${itemBase} ${
        isActive
            ? "bg-white/10 text-white"
            : "text-gray-400 hover:bg-white/6 hover:text-white"
    }`;

const iconButton = `relative grid h-10 w-10 shrink-0 place-items-center ${INNER_RADIUS} text-gray-300 hover:bg-white/8 hover:text-white cursor-pointer transition-[background-color,color,scale] duration-150 active:scale-[0.96]`;

// PostHog-style CTA: light fill, hard offset shadow that "presses" in.
const ctaClass =
    "inline-flex h-10 items-center rounded-[10px] bg-white px-4 text-[13px] font-bold tracking-tight text-[#0c0d12] shadow-[0_3px_0_0_#3b82f6] cursor-pointer select-none transition-[background-color,box-shadow,scale] duration-150 hover:bg-gray-100 hover:shadow-[0_4px_0_0_#3b82f6] active:scale-[0.96] active:shadow-[0_1px_0_0_#3b82f6]";

const ghostClass = `${itemBase} text-gray-300 hover:bg-white/6 hover:text-white`;

const mobileRow = ({ isActive }) =>
    `flex h-11 items-center ${INNER_RADIUS} px-3 text-sm font-semibold transition-[background-color,color] duration-150 ${
        isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/6 hover:text-white"
    }`;

const mobileButtonRow =
    `flex h-11 w-full items-center justify-between ${INNER_RADIUS} px-3 text-left text-sm font-semibold text-gray-400 hover:bg-white/6 hover:text-white cursor-pointer transition-[background-color,color] duration-150`;

/* Staggered reveal for the mobile panel children (~40ms steps). */
function Stagger({ open, index, children }) {
    return (
        <div
            className={`transition-[opacity,translate] duration-200 ${EASE} ${
                open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
            style={{ transitionDelay: open ? `${60 + index * 40}ms` : "0ms" }}
        >
            {children}
        </div>
    );
}

/* Icon cross-fade: scale 0.25→1, opacity 0→1, blur 4px→0. Both icons stay in the DOM. */
function SwapIcon({ showSecond, first, second }) {
    const base = `absolute inset-0 grid place-items-center transition-[opacity,scale,filter] duration-200 ${EASE}`;
    const shown = "opacity-100 scale-100 blur-none";
    const hidden = "opacity-0 scale-[0.25] blur-[4px]";
    return (
        <span className="relative block h-6 w-6">
            <span className={`${base} ${showSecond ? hidden : shown}`}>{first}</span>
            <span className={`${base} ${showSecond ? shown : hidden}`}>{second}</span>
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [savedWatchlist, setSavedWatchlist] = useState([]);
    const [loggedin, setLoggedin] = useState(false);

    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    const syncWatchlist = () => {
        try {
            const list = JSON.parse(localStorage.getItem("cineaste_watchlist") || "[]");
            setSavedWatchlist(list);
        } catch {
            setSavedWatchlist([]);
        }
    };

    useEffect(() => {
        syncWatchlist();
        window.addEventListener("storage", syncWatchlist);
        window.addEventListener("watchlist_updated", syncWatchlist);
        return () => {
            window.removeEventListener("storage", syncWatchlist);
            window.removeEventListener("watchlist_updated", syncWatchlist);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Escape closes search + mobile menu.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setIsSearchOpen(false);
            setIsMobileMenuOpen(false);
        }
    };

    const handleRemoveFromWatchlist = (id) => {
        const updated = savedWatchlist.filter((item) => item.id !== id);
        setSavedWatchlist(updated);
        localStorage.setItem("cineaste_watchlist", JSON.stringify(updated));
        window.dispatchEvent(new Event("watchlist_updated"));
    };

    async function isloggedin() {
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/isloggedin`, {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify({})
            });
            const data = await response.json();
            setLoggedin(Boolean(data.loggedin));
        } catch {
            setLoggedin(false);
        }
    }

    useEffect(() => {
        isloggedin();
        window.addEventListener("auth_state_changed", isloggedin);
        return () => window.removeEventListener("auth_state_changed", isloggedin);
    }, []);

    const closeMobile = () => setIsMobileMenuOpen(false);
    const watchlistCount = savedWatchlist.length;

    return (
        <>
            {/* Wrapper ignores pointer events so the page stays clickable beside the floating bar */}
            <header className="pointer-events-none fixed inset-x-0 top-3 z-40 px-3 antialiased sm:px-6">
                <div className="relative mx-auto w-full max-w-360">
                    {/* ───────── Bar ───────── */}
                    <div
                        className={`pointer-events-auto flex items-center justify-between gap-2 rounded-2xl p-1.5 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 lg:grid lg:grid-cols-[1fr_auto_1fr] ${
                            scrolled
                                ? "bg-[#0c0d12]/90 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_1px_0_0_rgba(255,255,255,0.05)_inset,0_16px_40px_-12px_rgba(0,0,0,0.8)]"
                                : "bg-[#0c0d12]/65 shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_1px_0_0_rgba(255,255,255,0.04)_inset,0_10px_30px_-14px_rgba(0,0,0,0.6)]"
                        }`}
                    >
                        {/* Brand cell: a flush, full-height segment of the bar (PostHog tab idea).
                            -my-1.5 -ml-1.5 cancels the bar padding so it touches the bar's top,
                            left and bottom edges. Left radius 16px = the bar's outer radius,
                            so it hugs the corner. The 36px badge sits 8px from the edge
                            (8px padding + 8px badge radius = 16px, concentric). */}
                        <Link
                            to="/"
                            aria-label="MovieForecasts, go to home"
                            className="group relative -my-1.5 -ml-1.5 flex h-[52px] shrink-0 items-center gap-2.5 justify-self-start rounded-l-2xl rounded-r-[10px] bg-white/5 py-2 pl-2 pr-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-[scale] duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                        >
                            {/* Hover sheen: opacity only */}
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            />

                            {/* MVF badge: one solid white label (no dark letters), tinted shadow */}
                            <span
                                aria-hidden="true"
                                className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-linear-to-b from-blue-500 to-blue-700 text-[11px] font-extrabold leading-none tracking-tight text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(147,197,253,0.22),0_4px_10px_-3px_rgba(37,99,235,0.5)] transition-[scale] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]"
                            >
                                MVF
                            </span>

                            {/* Wordmark: one line, restrained size. Hidden on very narrow phones. */}
                            <span className="relative hidden whitespace-nowrap text-[15px] font-bold leading-none tracking-tight text-white min-[400px]:block">
                                MovieForecasts
                            </span>
                        </Link>

                        {/* Desktop navigation (true-centered via the 1fr / auto / 1fr grid) */}
                        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
                            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
                            <NavLink to="/trending" className={navLinkClass}>Trending</NavLink>
                            <NavLink to="/upcoming" className={navLinkClass}>Upcoming</NavLink>

                            <button
                                type="button"
                                onClick={() => setIsWatchlistOpen(true)}
                                className={`${itemBase} gap-1.5 text-gray-400 hover:bg-white/6 hover:text-white`}
                            >
                                <span>Watchlist</span>
                                {watchlistCount > 0 && (
                                    <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white tabular-nums">
                                        {watchlistCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsReviewsOpen(true)}
                                className={`${itemBase} text-gray-400 hover:bg-white/6 hover:text-white`}
                            >
                                Reviews
                            </button>
                        </nav>

                        {/* Right-hand tools */}
                        <div className="flex items-center gap-1 justify-self-end">
                            {/* Desktop search: expands in place */}
                            <form
                                onSubmit={handleSearchSubmit}
                                role="search"
                                className={`relative hidden h-10 items-center overflow-hidden ${INNER_RADIUS} transition-[width,background-color] duration-300 ${EASE} lg:flex ${
                                    isSearchOpen ? "w-64 bg-white/6" : "w-10 bg-transparent"
                                }`}
                            >
                                <button
                                    type={isSearchOpen ? "submit" : "button"}
                                    aria-label={isSearchOpen ? "Submit search" : "Open search"}
                                    title="Search"
                                    onClick={() => !isSearchOpen && setIsSearchOpen(true)}
                                    className={`${iconButton} absolute left-0 top-0`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </button>

                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search titles, actors, genres..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    tabIndex={isSearchOpen ? 0 : -1}
                                    aria-hidden={!isSearchOpen}
                                    className={`h-full w-full bg-transparent pl-10 pr-10 text-[13px] text-white placeholder:text-gray-500 focus:outline-none transition-opacity duration-200 ${
                                        isSearchOpen ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
                                    }`}
                                />

                                <button
                                    type="button"
                                    aria-label="Close search"
                                    tabIndex={isSearchOpen ? 0 : -1}
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`${iconButton} absolute right-0 top-0 transition-opacity ${
                                        isSearchOpen ? "opacity-100" : "pointer-events-none opacity-0"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </form>

                            {/* Quick watchlist access below lg (desktop has it in the nav) */}
                            <button
                                type="button"
                                aria-label="Open watchlist"
                                title="Watchlist"
                                onClick={() => setIsWatchlistOpen(true)}
                                className={`${iconButton} lg:hidden`}
                            >
                                <span className="material-symbols-outlined text-[20px]">bookmark</span>
                                {watchlistCount > 0 && (
                                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_0_2px_#0c0d12]" />
                                )}
                            </button>

                            {loggedin ? (
                                <Link
                                    to="/account"
                                    aria-label="Account"
                                    title="Account"
                                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-gray-200 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-[background-color,box-shadow,scale] duration-150 hover:bg-white/14 hover:text-white hover:shadow-[0_0_0_1px_rgba(96,165,250,0.7)] active:scale-[0.96]"
                                >
                                    <span className="material-symbols-outlined text-[22px]">person</span>
                                </Link>
                            ) : (
                                <div className="hidden items-center gap-1.5 sm:flex">
                                    <Link to="/auth/login" className={ghostClass}>
                                        Sign In
                                    </Link>
                                    <Link to="/auth/signup" className={ctaClass}>
                                        Get Started
                                    </Link>
                                </div>
                            )}

                            {/* Mobile hamburger with icon cross-fade */}
                            <button
                                type="button"
                                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                                aria-expanded={isMobileMenuOpen}
                                aria-controls="mobile-nav"
                                onClick={() => setIsMobileMenuOpen((v) => !v)}
                                className={`${iconButton} lg:hidden`}
                            >
                                <SwapIcon
                                    showSecond={isMobileMenuOpen}
                                    first={<span className="material-symbols-outlined text-[24px]">menu</span>}
                                    second={<span className="material-symbols-outlined text-[24px]">close</span>}
                                />
                            </button>
                        </div>
                    </div>

                    {/* ───────── Mobile panel ───────── */}
                    <div
                        id="mobile-nav"
                        aria-hidden={!isMobileMenuOpen}
                        inert={!isMobileMenuOpen}
                        className={`absolute inset-x-0 top-full mt-2 origin-top rounded-2xl bg-[#0c0d12]/95 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-[opacity,translate,visibility] duration-200 ${EASE} lg:hidden ${
                            isMobileMenuOpen
                                ? "pointer-events-auto visible translate-y-0 opacity-100"
                                : "pointer-events-none invisible -translate-y-2 opacity-0"
                        }`}
                    >
                        <div className="flex flex-col gap-1">
                            <Stagger open={isMobileMenuOpen} index={0}>
                                <form onSubmit={handleSearchSubmit} role="search" className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search movies & forecasts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`h-11 w-full ${INNER_RADIUS} bg-white/6 pl-3 pr-11 text-sm text-white placeholder:text-gray-500 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] focus:outline-none focus:shadow-[0_0_0_1px_rgba(96,165,250,0.8)] transition-shadow duration-150`}
                                    />
                                    <button
                                        type="submit"
                                        aria-label="Search"
                                        className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-gray-400 hover:text-white cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">search</span>
                                    </button>
                                </form>
                            </Stagger>

                            <Stagger open={isMobileMenuOpen} index={1}>
                                <NavLink to="/" end onClick={closeMobile} className={mobileRow}>Home</NavLink>
                            </Stagger>
                            <Stagger open={isMobileMenuOpen} index={2}>
                                <NavLink to="/trending" onClick={closeMobile} className={mobileRow}>Trending</NavLink>
                            </Stagger>
                            <Stagger open={isMobileMenuOpen} index={3}>
                                <NavLink to="/upcoming" onClick={closeMobile} className={mobileRow}>Upcoming Releases</NavLink>
                            </Stagger>
                            <Stagger open={isMobileMenuOpen} index={4}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsWatchlistOpen(true);
                                        closeMobile();
                                    }}
                                    className={mobileButtonRow}
                                >
                                    <span>Watchlist</span>
                                    {watchlistCount > 0 && (
                                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white tabular-nums">
                                            {watchlistCount}
                                        </span>
                                    )}
                                </button>
                            </Stagger>
                            <Stagger open={isMobileMenuOpen} index={5}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsReviewsOpen(true);
                                        closeMobile();
                                    }}
                                    className={mobileButtonRow}
                                >
                                    Editorial Reviews
                                </button>
                            </Stagger>

                            <Stagger open={isMobileMenuOpen} index={6}>
                                {loggedin ? (
                                    <NavLink to="/account" onClick={closeMobile} className={mobileRow}>
                                        <span className="material-symbols-outlined mr-2 text-[20px]">person</span>
                                        My Account
                                    </NavLink>
                                ) : (
                                    <div className="mt-1 flex flex-col gap-2 border-t border-white/8 pt-3">
                                        <Link
                                            to="/auth/login"
                                            onClick={closeMobile}
                                            className={`${ghostClass} w-full justify-center bg-white/5`}
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/auth/signup"
                                            onClick={closeMobile}
                                            className={`${ctaClass} w-full justify-center`}
                                        >
                                            Create Free Account
                                        </Link>
                                    </div>
                                )}
                            </Stagger>
                        </div>
                    </div>
                </div>
            </header>

            {/* Modals & Drawers */}
            <WatchlistModal
                isOpen={isWatchlistOpen}
                onClose={() => setIsWatchlistOpen(false)}
                watchlistMovies={savedWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
            />

            <ReviewsModal
                isOpen={isReviewsOpen}
                onClose={() => setIsReviewsOpen(false)}
            />
        </>
    );
}

export default Header;