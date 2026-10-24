import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import WatchlistModal from "./watchlistModal";
import ReviewsModal from "./reviewsModal";
import Logo from "./Logo";

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
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

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

    return (
        <>
            <header
                className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled
                        ? "bg-[#0c0d12]/85 backdrop-blur-2xl border-b border-white/8 shadow-2xl py-3"
                        : "bg-[#0c0d12]/50 backdrop-blur-lg border-b border-white/4 py-4"
                    }`}
            >
                <div className="flex justify-between items-center px-4 sm:px-8 md:px-12 w-full max-w-360 mx-auto">

                    {/* Unified Brand Logo: MVF | MovieForecasts */}
                    <Logo size="md" subtitle="" />

                    {/* Desktop Navigation Pills */}
                    <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/4 border border-white/8 backdrop-blur-md">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                                    isActive
                                        ? "bg-white/12 text-white shadow-xs border border-white/10"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`
                            }
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/trending"
                            className={({ isActive }) =>
                                `px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                                    isActive
                                        ? "bg-white/12 text-white shadow-xs border border-white/10"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`
                            }
                        >
                            Trending
                        </NavLink>

                        <NavLink
                            to="/upcoming"
                            className={({ isActive }) =>
                                `px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                                    isActive
                                        ? "bg-white/12 text-white shadow-xs border border-white/10"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`
                            }
                        >
                            Upcoming
                        </NavLink>

                        <button
                            onClick={() => setIsWatchlistOpen(true)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>Watchlist</span>
                            {savedWatchlist.length > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2 shadow-[0_0_10px_rgba(37,99,235,0.6)]">
                                    {savedWatchlist.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setIsReviewsOpen(true)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                        >
                            Reviews
                        </button>
                    </nav>

                    {/* Action Tools */}
                    <div className="flex items-center gap-3">
                        {isSearchOpen ? (
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center animate-fadeIn">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search titles, actors, genres..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48 sm:w-64 bg-[#14151b] text-white text-xs rounded-full py-1.5 pl-4 pr-8 border border-white/15 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(false)}
                                    className="absolute right-2.5 text-gray-400 hover:text-white cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </form>
                        ) : (
                            <button
                                aria-label="Search"
                                onClick={() => setIsSearchOpen(true)}
                                className="w-9 h-9 rounded-full bg-white/4 border border-white/6 hover:border-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                                title="Search"
                            >
                                <span className="material-symbols-outlined text-lg">search</span>
                            </button>
                        )}

                        <button
                            aria-label="Watchlist Drawer"
                            onClick={() => setIsWatchlistOpen(true)}
                            className="w-9 h-9 rounded-full bg-white/4 border border-white/6 hover:border-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 relative"
                            title="Watchlist"
                        >
                            <span className="material-symbols-outlined text-lg">bookmark</span>
                            {savedWatchlist.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            )}
                        </button>

                        {loggedin ? (
                            <Link
                                to="/account"
                                className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-blue-400 transition-all cursor-pointer shrink-0 hover:scale-105"
                                title="Account"
                            >
                                <img
                                    alt="User profile avatar"
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwMu2TzzKtq5kC3CNOwyBXjBHAgVca-h083I_KeKizlPcaoJ2czLOt5Nhx7GXoVpyuXlMwQd_hKhzGBB1zCUF2av0dPzVdfOvj1ObZtIYwH9bL3qnv-MiH6lbtESDbII9b_52j8tznqJf4CaXu8ooADGPhubLs8WYJzv9VnHTWUnGXsY8a3XCvp6kK6HwsMtrHGzeNPTb-0mNJ0L5i72ZjAinTk0XIWRON7DnGRtkQ09P2ZNX_Jz-f"
                                />
                            </Link>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link
                                    to="/auth/login"
                                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-white rounded-full transition-all hover:bg-white/6 border border-transparent hover:border-white/10 cursor-pointer active:scale-95"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/auth/signup"
                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full shadow-md shadow-blue-600/25 hover:shadow-blue-600/40 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Hamburger Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden text-gray-300 hover:text-white focus:outline-none ml-1 p-1"
                        >
                            <span className="material-symbols-outlined text-2xl">
                                {isMobileMenuOpen ? "close" : "menu"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-[#101117] border-b border-white/10 px-6 py-5 flex flex-col gap-4 animate-fadeIn">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                placeholder="Search movies & forecasts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#171821] text-white text-sm rounded-full py-2.5 pl-4 pr-10 border border-white/10 focus:border-blue-500 focus:outline-none"
                            />
                            <button type="submit" className="absolute right-3.5 top-2.5 text-gray-400">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </button>
                        </form>

                        <div className="flex flex-col gap-2 font-medium text-sm">
                            <NavLink
                                to="/"
                                end
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `py-2 px-3 rounded-lg transition-colors ${isActive ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-white"
                                    }`
                                }
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/trending"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `py-2 px-3 rounded-lg transition-colors ${isActive ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-white"
                                    }`
                                }
                            >
                                Trending
                            </NavLink>
                            <NavLink
                                to="/upcoming"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `py-2 px-3 rounded-lg transition-colors ${isActive ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-white"
                                    }`
                                }
                            >
                                Upcoming Releases
                            </NavLink>
                            <button
                                onClick={() => {
                                    setIsWatchlistOpen(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="py-2 px-3 rounded-lg text-left text-gray-400 hover:text-white flex items-center justify-between cursor-pointer"
                            >
                                <span>Watchlist</span>
                                {savedWatchlist.length > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {savedWatchlist.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsReviewsOpen(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="py-2 px-3 rounded-lg text-left text-gray-400 hover:text-white cursor-pointer"
                            >
                                Editorial Reviews
                            </button>

                            {loggedin ? (
                                <Link
                                    to="/account"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="py-2 px-3 rounded-lg text-left text-white font-bold bg-white/5"
                                >
                                    My Account
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                                    <Link
                                        to="/auth/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center py-2.5 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/auth/signup"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center py-2.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-full shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                                    >
                                        Create Free Account
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
