'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoggedIn, isLoading, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSSOMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !!sessionStorage.getItem('sso-origin-app');
    });

    // Close mobile menu when route changes
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setIsMobileMenuOpen(false);
            setShowDropdown(false);
        });

        return () => cancelAnimationFrame(frame);
    }, [pathname]);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    // Don't show navbar on login/register pages
    if (['/login', '/register', '/forgot-password'].includes(pathname)) return null;

    const handleLogout = () => {
        logout();
        router.push('/');
        setShowDropdown(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50">
            {/* Navbar Background — #686805 */}
            <div className="absolute inset-0 bg-[#686805] backdrop-blur-md border-b border-[#686805]/80 -z-10" />

            <div className="ui-nav-shell flex items-center justify-between">
                {isSSOMode ? (
                    <div className="flex items-center gap-3">
                        <Image src="/logo-pharmacy.png" alt="สภาเภสัชกรรม" width={160} height={40} className="ui-nav-logo w-auto object-contain" />
                    </div>
                ) : (
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo-pharmacy.png" alt="สภาเภสัชกรรม" width={160} height={40} className="ui-nav-logo w-auto object-contain" />
                    </Link>
                )}

                {!isSSOMode && (
                    <div className="hidden lg:flex items-center gap-8">
                        <Link href="/" className="text-sm text-white/90 hover:text-white transition-colors">หน้าหลัก</Link>
                        <Link href="/events" className="text-sm text-white/90 hover:text-white transition-colors">งานประชุม</Link>
                        <Link href="/agenda" className="text-sm text-white/90 hover:text-white transition-colors">กำหนดการ</Link>
                        <Link href="/contact" className="text-sm text-white/90 hover:text-white transition-colors">ติดต่อเรา</Link>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {isLoading ? (
                        // Loading state
                        <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
                    ) : isLoggedIn && user ? (
                        // Logged in - Show user menu
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-sm font-bold">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
                                    {user.name}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-[#737300]">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-[#686805]/10 text-[#686805]">
                                                {user.role}
                                            </span>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-1">
                                            <Link
                                                href="/profile"
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#737300] transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                                โปรไฟล์
                                            </Link>

                                            {/* Admin/Staff Dashboard Link */}
                                            {(user.role === 'admin' || user.role === 'staff') && (
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#737300] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                    </svg>
                                                    Dashboard
                                                </Link>
                                            )}
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-gray-200 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                ออกจากระบบ
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        // Not logged in - Show login/register buttons (hide in SSO mode)
                        !isSSOMode && (
                            <div className="hidden lg:flex items-center gap-4">
                                <Link href="/login">
                                    <Button variant="ghost" className="text-white hover:text-white hover:bg-white/15">เข้าสู่ระบบ</Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-white text-[#686805] hover:bg-white/90 border-0 rounded-full px-6 font-semibold">ลงทะเบียน</Button>
                                </Link>
                            </div>
                        )
                    )}
                    {/* Mobile Menu Toggle (hide in SSO mode) */}
                    {!isSSOMode && (
                        <button
                            className="lg:hidden p-2 text-white hover:bg-white/15 rounded-full transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open mobile menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <div
                className={`fixed inset-0 z-[60] lg:hidden bg-[#686805] backdrop-blur-xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <span className="text-xl font-bold text-white">เมนูหลัก</span>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/15 transition-colors"
                            aria-label="Close mobile menu"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col p-6 gap-4 overflow-y-auto">
                        <Link href="/" className="text-lg text-white/90 hover:text-white py-2 border-b border-white/10">
                            หน้าหลัก
                        </Link>
                        <Link href="/events" className="text-lg text-white/90 hover:text-white py-2 border-b border-white/10">
                            งานประชุม
                        </Link>
                        <Link href="/agenda" className="text-lg text-white/90 hover:text-white py-2 border-b border-white/10">
                            กำหนดการ
                        </Link>
                        <Link href="/contact" className="text-lg text-white/90 hover:text-white py-2 border-b border-white/10">
                            ติดต่อเรา
                        </Link>

                        {!isLoggedIn && (
                            <div className="mt-4 flex flex-col gap-3">
                                <Link href="/login">
                                    <Button variant="ghost" className="w-full justify-center border border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white">
                                        เข้าสู่ระบบ
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="w-full justify-center bg-white text-[#686805] hover:bg-white/90 font-semibold">
                                        ลงทะเบียน
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {isLoggedIn && user && (
                            <div className="mt-auto pt-6 border-t border-white/20">
                                <div className="flex items-center gap-3 px-2 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white font-bold">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{user.name}</div>
                                        <div className="text-xs text-white/70 capitalize">{user.role}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <User className="w-5 h-5" />
                                        โปรไฟล์
                                    </Link>

                                    {(user.role === 'admin' || user.role === 'staff') && (
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            Dashboard
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-red-200 hover:bg-red-500/20 rounded-lg transition-colors w-full text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
