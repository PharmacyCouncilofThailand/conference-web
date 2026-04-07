'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertCircle, Mail, Lock, User, Phone, Sparkles, ArrowRight, ArrowLeft,
    Eye, EyeOff, Stethoscope, Check, GraduationCap, Smartphone,
    CheckCircle, Building2, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

// ──────────── Schemas ────────────
const loginSchema = z.object({
    email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

const registerSchema = z.object({
    firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
    email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
    phone: z.string().optional(),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(6, 'กรุณายืนยันรหัสผ่าน'),
    organization: z.string().optional(),
    idCard: z.string().optional(),
    pharmacyLicenseId: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const accountTypes = [
    { value: 'pharmacist' as const, label: 'เภสัชกร', icon: Stethoscope, description: 'สำหรับเภสัชกรที่ต้องการสะสมหน่วยกิต CPE' },
    { value: 'medicalProfessional' as const, label: 'บุคลากรทางการแพทย์', icon: Briefcase, description: 'แพทย์ พยาบาล และบุคลากรทางการแพทย์อื่นๆ' },
    { value: 'postgraduateStudent' as const, label: 'นักศึกษาบัณฑิตศึกษา', icon: GraduationCap, description: 'นักศึกษาระดับปริญญาโท-เอก' },
    { value: 'undergraduateStudent' as const, label: 'นักศึกษาปริญญาตรี', icon: GraduationCap, description: 'นักศึกษาเภสัชศาสตร์และสาขาที่เกี่ยวข้อง' },
    { value: 'generalPublic' as const, label: 'บุคคลทั่วไป', icon: User, description: 'ผู้สนใจทั่วไป' },
];

type AccountType = 'pharmacist' | 'medicalProfessional' | 'postgraduateStudent' | 'undergraduateStudent' | 'generalPublic';

// ──────────── Main Component ────────────
export default function AuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
    const router = useRouter();
    const { login: authLogin } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ── Login state ──
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginRecaptchaToken, setLoginRecaptchaToken] = useState<string | null>(null);
    const loginTurnstileRef = useRef<TurnstileInstance>(null);
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

    const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    const onLoginSubmit = async (data: LoginForm) => {
        setLoginLoading(true);
        setLoginError(null);
        if (turnstileSiteKey && !loginRecaptchaToken) {
            setLoginError('กรุณายืนยันว่าคุณไม่ใช่บอท');
            setLoginLoading(false);
            return;
        }
        try {
            const response = await authApi.login(data.email, data.password, loginRecaptchaToken || undefined);
            const authUser = {
                id: response.user.id,
                email: response.user.email,
                firstName: response.user.firstName,
                lastName: response.user.lastName,
                role: response.user.role,
                country: response.user.country,
                delegateType: response.user.delegateType,
                isThai: response.user.isThai,
                name: `${response.user.firstName} ${response.user.lastName}`,
            };
            authLogin(response.token, authUser);
            router.push('/');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
            if (errorMessage === 'ACCOUNT_PENDING') {
                setLoginError('บัญชีของคุณอยู่ระหว่างรอการอนุมัติ กรุณารอการตรวจสอบจากเจ้าหน้าที่');
            } else if (errorMessage === 'ACCOUNT_REJECTED') {
                setLoginError('บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อเจ้าหน้าที่');
            } else {
                setLoginError(errorMessage);
            }
            loginTurnstileRef.current?.reset();
            setLoginRecaptchaToken(null);
        } finally {
            setLoginLoading(false);
        }
    };

    // ── Register state ──
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [registerStep, setRegisterStep] = useState<1 | 2>(1);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const registerTurnstileRef = useRef<TurnstileInstance>(null);

    const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    const onRegisterSubmit = async (data: RegisterForm) => {
        setRegisterLoading(true);
        setRegisterError(null);
        try {
            if (!termsAccepted) {
                setRegisterError('กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว');
                setRegisterLoading(false);
                return;
            }
            if (turnstileSiteKey && !recaptchaToken) {
                setRegisterError('กรุณายืนยันว่าคุณไม่ใช่บอท');
                setRegisterLoading(false);
                return;
            }
            if (accountType === 'pharmacist' && !data.pharmacyLicenseId) {
                setRegisterError('กรุณากรอกเลขใบอนุญาตสำหรับเภสัชกร');
                setRegisterLoading(false);
                return;
            }
            if ((accountType === 'postgraduateStudent' || accountType === 'undergraduateStudent') && !data.organization) {
                setRegisterError('กรุณากรอกชื่อมหาวิทยาลัย');
                setRegisterLoading(false);
                return;
            }
            if (!accountType) {
                setRegisterError('กรุณาเลือกประเภทบัญชี');
                setRegisterLoading(false);
                return;
            }
            const formData = new FormData();
            formData.append('firstName', data.firstName);
            formData.append('lastName', data.lastName);
            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('accountType', accountType as string);
            formData.append('source', 'conference-web');
            formData.append('country', 'Thailand');
            if (data.phone) formData.append('phone', data.phone);
            if (data.organization) formData.append('organization', data.organization);
            if (data.idCard) formData.append('idCard', data.idCard);
            if (data.pharmacyLicenseId) formData.append('pharmacyLicenseId', data.pharmacyLicenseId);
            if (recaptchaToken) formData.append('recaptchaToken', recaptchaToken);

            const response = await authApi.register(formData);
            // Auto-login with token from register response
            if (response.token && response.user) {
                const authUser = {
                    id: response.user.id,
                    email: response.user.email,
                    firstName: response.user.firstName,
                    lastName: response.user.lastName,
                    role: response.user.role,
                    name: `${response.user.firstName} ${response.user.lastName}`,
                };
                authLogin(response.token, authUser);
                router.push('/');
                return;
            }
            // Fallback: switch to login mode
            setMode('login');
            setLoginError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
            setRegisterError(errorMessage);
            registerTurnstileRef.current?.reset();
            setRecaptchaToken(null);
        } finally {
            setRegisterLoading(false);
        }
    };

    const switchMode = (newMode: 'login' | 'register') => {
        setMode(newMode);
        setLoginError(null);
        setRegisterError(null);
        setRegisterStep(1);
        setAccountType(null);
        setTermsAccepted(false);
        // Update URL without full navigation
        window.history.replaceState(null, '', newMode === 'login' ? '/login' : '/register');
    };

    const selectAccountType = (type: AccountType) => {
        setAccountType(type);
        setRegisterStep(2);
    };

    const goBackToRoleSelection = () => {
        setRegisterStep(1);
    };

    const isRegister = mode === 'register';

    return (
        <div className="min-h-screen bg-white text-[#6f7e0d] flex overflow-hidden relative">

            {/* ══════════════ DECORATIVE PANEL ══════════════ */}
            {!isMobile && <div
                className={`flex absolute top-0 bottom-0 w-1/2 z-20 transition-transform duration-700 ease-in-out ${isRegister ? 'translate-x-full' : 'translate-x-0'
                    }`}
            >
                <div className="relative w-full h-full overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5a8249] via-[#4a6e3d] to-[#3a5730]" />
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                        {/* Ambient glow orbs */}
                        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-[#8ab87a]/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
                        <div className="absolute -bottom-40 -left-32 w-[450px] h-[450px] bg-[#3d6b2e]/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
                        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-white/[0.03] rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
                    </div>

                    {/* Content - vertically centered */}
                    <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-12">
                        {/* Logo section */}
                        <div className={`flex flex-col items-center mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                            <div className="relative mb-5">
                                {/* Glow behind logo */}
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-[1.2]" />
                                <Image src="/logo.png" alt="Pharmacy Council" width={160} height={200}
                                    className="relative w-[140px] h-auto object-contain drop-shadow-2xl" />
                            </div>
                            <span className="text-2xl font-bold text-white/90 tracking-wide">
                                สภาเภสัชกรรม
                            </span>
                            <span className="text-sm text-white/50 mt-1 tracking-widest uppercase">
                                The Pharmacy Council
                            </span>
                        </div>

                        {/* Decorative divider */}
                        <div className="flex items-center gap-3 mb-8 w-full max-w-xs">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/30" />
                            <Sparkles className="w-4 h-4 text-white/40" />
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/30" />
                        </div>

                        {/* Dynamic heading */}
                        <div className="text-center mb-6">
                            <h2 key={mode} className="text-3xl font-bold leading-tight text-white mb-3">
                                {isRegister ? (
                                    <>ลงทะเบียนบัญชี<br /><span className="text-white/80 text-2xl font-medium">Conference Community</span></>
                                ) : (
                                    <>ยินดีต้อนรับ<br /><span className="text-white/80 text-2xl font-medium">สู่ระบบลงทะเบียน</span></>
                                )}
                            </h2>
                            <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
                                {isRegister
                                    ? 'สร้างบัญชีเพื่อเข้าร่วมงานประชุม และรับสิทธิประโยชน์มากมาย'
                                    : 'ลงทะเบียนเข้าร่วมงานประชุมวิชาการและสะสมหน่วยกิต CPE ได้ง่ายๆ'
                                }
                            </p>
                        </div>

                        {/* Feature cards - glassmorphism */}
                        <div className="space-y-3 w-full max-w-sm">
                            {[
                                {
                                    icon: isRegister ? <CheckCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />,
                                    title: 'ลงทะเบียนง่าย',
                                    desc: 'จองที่นั่งได้ในไม่กี่คลิก',
                                    delay: '100ms'
                                },
                                {
                                    icon: <GraduationCap className="w-5 h-5" />,
                                    title: 'สะสมหน่วยกิต CPE',
                                    desc: 'รับหน่วยกิตอัตโนมัติ',
                                    delay: '200ms'
                                },
                                {
                                    icon: isRegister ? <Sparkles className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />,
                                    title: isRegister ? 'Exclusive Events' : 'QR Check-in',
                                    desc: isRegister ? 'เข้าถึงเนื้อหาพิเศษสำหรับสมาชิก' : 'เช็คอินด้วย QR Code',
                                    delay: '300ms'
                                }
                            ].map((feature, i) => (
                                <div key={i}
                                    className={`group flex items-center gap-4 bg-white/[0.07] backdrop-blur-sm border border-white/[0.12] rounded-2xl px-5 py-4 hover:-translate-y-0.5 hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300 cursor-default ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                    style={{ transitionDelay: mounted ? feature.delay : '0ms' }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/15 group-hover:bg-white/25 flex items-center justify-center flex-shrink-0 text-white transition-colors duration-300">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white text-sm">{feature.title}</div>
                                        <div className="text-xs text-white/50">{feature.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </div>
                </div>
            </div>}

            {/* ══════════════ FORM PANELS CONTAINER ══════════════ */}
            {/* Login Form - sits on the RIGHT half */}
            {!isMobile && <div
                className={`flex absolute top-0 bottom-0 right-0 w-1/2 items-center justify-center p-8 transition-all duration-700 ease-in-out ${isRegister ? 'opacity-0 pointer-events-none translate-x-[-20%]' : 'opacity-100 translate-x-0'
                    }`}
            >
                <div className="w-full max-w-md relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#6f7e0d] mb-6 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>กลับหน้าหลัก</span>
                    </Link>

                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold mb-2 text-[#6f7e0d]">เข้าสู่ระบบ</h1>
                            <p className="text-gray-500 text-sm">กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ</p>
                        </div>

                        {loginError && (
                            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{loginError}</span>
                            </div>
                        )}

                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="login-email" className="text-gray-700">อีเมล</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                                    <Input id="login-email" type="email" placeholder="name@example.com"
                                        className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] focus:ring-[#537547]/20 text-[#6f7e0d] placeholder:text-gray-400"
                                        {...loginForm.register('email')} />
                                </div>
                                {loginForm.formState.errors.email && <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="login-password" className="text-gray-700">รหัสผ่าน</Label>
                                    <Link href="/forgot-password" className="text-sm text-[#537547] hover:text-[#456339] transition-colors">ลืมรหัสผ่าน?</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                                    <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••"
                                        className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] focus:ring-[#537547]/20 text-[#6f7e0d] placeholder:text-gray-400"
                                        {...loginForm.register('password')} />
                                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-300 transition-colors">
                                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {loginForm.formState.errors.password && <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>}
                            </div>

                            {turnstileSiteKey && (
                            <div className="flex justify-center">
                                <Turnstile
                                    ref={loginTurnstileRef}
                                    siteKey={turnstileSiteKey}
                                    onSuccess={(token) => { setLoginRecaptchaToken(token); setLoginError(null); }}
                                    onExpire={() => setLoginRecaptchaToken(null)}
                                    onError={() => setLoginRecaptchaToken(null)}
                                />
                            </div>
                            )}

                            <Button type="submit" className="w-full h-12 bg-[#537547] hover:bg-[#456339] rounded-xl font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md" disabled={loginLoading}>
                                {loginLoading ? (
                                    <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังเข้าสู่ระบบ...</span>
                                ) : (
                                    <span className="flex items-center gap-2">เข้าสู่ระบบ <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </Button>
                        </form>

                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-gray-200" /><span className="text-gray-500 text-sm">หรือ</span><div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <Link href="/events" className="block">
                            <Button variant="outline" className="w-full h-12 border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-gray-700">
                                <span className="flex items-center gap-2">ดูงานประชุมโดยไม่ต้องเข้าสู่ระบบ <ArrowRight className="w-4 h-4" /></span>
                            </Button>
                        </Link>
                    </div>

                    <p className="text-center text-gray-500 mt-8">
                        ยังไม่มีบัญชี?{' '}
                        <button onClick={() => switchMode('register')} className="text-[#537547] hover:text-[#456339] font-medium transition-colors">สมัครสมาชิก</button>
                    </p>
                </div>
            </div>}

            {/* Register Form - sits on the LEFT half */}
            {!isMobile && <div
                className={`flex absolute top-0 bottom-0 left-0 w-1/2 items-center justify-center p-8 overflow-y-auto transition-all duration-700 ease-in-out ${isRegister ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-[20%]'
                    }`}
            >
                <div className="w-full max-w-lg relative z-10 py-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>กลับหน้าหลัก</span>
                    </Link>

                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold mb-2 text-[#6f7e0d]">
                                {registerStep === 1 ? 'เลือกประเภทบัญชี' : 'สร้างบัญชีผู้ใช้'}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {registerStep === 1 ? 'กรุณาเลือกประเภทผู้ใช้งานเพื่อดำเนินการต่อ' : 'กรอกข้อมูลเพื่อลงทะเบียน'}
                            </p>
                        </div>

                        {registerError && (
                            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{registerError}</span>
                            </div>
                        )}

                        {/* Step 1: Account Type Selection */}
                        {registerStep === 1 && (
                            <div className="space-y-4">
                                {accountTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button key={type.value} type="button" onClick={() => selectAccountType(type.value)}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-[#537547]/50 hover:bg-[#537547]/5 text-left transition-all group">
                                            <div className="w-12 h-12 rounded-xl bg-[#537547]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#537547]/20 transition-colors">
                                                <Icon className="w-6 h-6 text-[#537547]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{type.label}</div>
                                                <div className="text-sm text-gray-500">{type.description}</div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#537547] group-hover:translate-x-1 transition-all" />
                                        </button>
                                    );
                                })}
                                <div className="text-center pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">
                                        มีบัญชีอยู่แล้ว?{' '}
                                        <button type="button" onClick={() => switchMode('login')} className="text-[#537547] hover:text-[#456339] font-medium">
                                            เข้าสู่ระบบ
                                        </button>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Registration Form */}
                        {registerStep === 2 && (
                        <>
                        {/* Selected Type Indicator */}
                        <div className="mb-6 flex items-center justify-between bg-[#537547]/5 border border-[#537547]/20 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                {accountType && (() => {
                                    const selectedType = accountTypes.find(t => t.value === accountType);
                                    if (!selectedType) return null;
                                    const Icon = selectedType.icon;
                                    return (
                                        <>
                                            <div className="w-10 h-10 rounded-lg bg-[#537547]/10 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-[#537547]" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide">ประเภทบัญชี</div>
                                                <div className="font-medium text-[#537547]">{selectedType.label}</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            <button type="button" onClick={goBackToRoleSelection}
                                className="text-sm text-[#537547] hover:text-[#456339] font-medium px-3 py-1.5 rounded-lg hover:bg-[#537547]/10 transition-colors">
                                เปลี่ยน
                            </button>
                        </div>

                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-firstName" className="text-gray-700">ชื่อ</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                        <Input id="reg-firstName" placeholder="ชื่อ"
                                            className="pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                            {...registerForm.register('firstName')} />
                                    </div>
                                    {registerForm.formState.errors.firstName && <p className="text-sm text-red-500">{registerForm.formState.errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-lastName" className="text-gray-700">นามสกุล</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                        <Input id="reg-lastName" placeholder="นามสกุล"
                                            className="pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                            {...registerForm.register('lastName')} />
                                    </div>
                                    {registerForm.formState.errors.lastName && <p className="text-sm text-red-500">{registerForm.formState.errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reg-email" className="text-gray-700">อีเมล</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                    <Input id="reg-email" type="email" placeholder="name@example.com"
                                        className="pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                        {...registerForm.register('email')} />
                                </div>
                                {registerForm.formState.errors.email && <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reg-phone" className="text-gray-700">เบอร์โทรศัพท์ <span className="text-gray-400">(ไม่บังคับ)</span></Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                    <Input id="reg-phone" placeholder="08XXXXXXXX"
                                        className="pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                        {...registerForm.register('phone')} />
                                </div>
                            </div>

                            {accountType !== 'generalPublic' && (
                            <div className="space-y-2">
                                <Label htmlFor="reg-organization" className="text-gray-700">
                                    {accountType === 'postgraduateStudent' || accountType === 'undergraduateStudent'
                                        ? <>มหาวิทยาลัย <span className="text-red-500">*</span></>
                                        : <>หน่วยงาน/องค์กร <span className="text-gray-400">(ไม่บังคับ)</span></>}
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                    <Input id="reg-organization"
                                        placeholder={accountType === 'postgraduateStudent' || accountType === 'undergraduateStudent' ? 'ชื่อมหาวิทยาลัย...' : 'โรงพยาบาล/บริษัท...'}
                                        className="pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                        {...registerForm.register('organization')} />
                                </div>
                            </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="reg-idCard" className="text-gray-700">เลขบัตรประชาชน <span className="text-gray-400">(13 หลัก)</span></Label>
                                <Input id="reg-idCard" placeholder="X-XXXX-XXXXX-XX-X" maxLength={13}
                                    className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                    {...registerForm.register('idCard')} />
                            </div>

                            {accountType === 'pharmacist' && (
                                <div className="space-y-2">
                                    <Label htmlFor="reg-pharmacyLicenseId" className="text-gray-700">เลขใบอนุญาต <span className="text-red-500">*</span></Label>
                                    <Input id="reg-pharmacyLicenseId" placeholder="ภ.XXXXX"
                                        className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                        {...registerForm.register('pharmacyLicenseId')} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password" className="text-gray-700">รหัสผ่าน</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                        <Input id="reg-password" type={showRegisterPassword ? "text" : "password"} placeholder="••••••"
                                            className="pl-12 pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                            {...registerForm.register('password')} />
                                        <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors">
                                            {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {registerForm.formState.errors.password && <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-confirmPassword" className="text-gray-700">ยืนยัน</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                        <Input id="reg-confirmPassword" type={showRegisterPassword ? "text" : "password"} placeholder="••••••"
                                            className="pl-12 pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                            {...registerForm.register('confirmPassword')} />
                                        <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors">
                                            {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {registerForm.formState.errors.confirmPassword && <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <div className="flex items-start gap-3 py-2">
                                <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 bg-white text-[#537547] focus:ring-[#537547] accent-[#537547]" />
                                <label htmlFor="terms" className="text-sm text-gray-500">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-[#537547] hover:text-[#456339]">Terms of Service</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-[#537547] hover:text-[#456339]">Privacy Policy</Link>
                                </label>
                            </div>

                            {turnstileSiteKey && (
                            <div className="flex justify-center">
                                <Turnstile
                                    ref={registerTurnstileRef}
                                    siteKey={turnstileSiteKey}
                                    onSuccess={(token) => { setRecaptchaToken(token); setRegisterError(null); }}
                                    onExpire={() => setRecaptchaToken(null)}
                                    onError={() => setRecaptchaToken(null)}
                                />
                            </div>
                            )}

                            <Button type="submit" className="w-full h-12 bg-[#537547] hover:bg-[#456339] text-white rounded-xl font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md" disabled={registerLoading}>
                                {registerLoading ? (
                                    <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังสร้างบัญชี...</span>
                                ) : (
                                    <span className="flex items-center gap-2">สร้างบัญชี <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </Button>
                        </form>
                        </>
                        )}
                    </div>
                </div>
            </div>}

            {/* ══════════════ MOBILE LAYOUT (stacked, no slide) ══════════════ */}
            {isMobile && <div className="w-full flex flex-col">
                <div className="absolute inset-0 bg-gray-50" />
                <div className="relative z-10 flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <Image src="/logo.png" alt="Pharmacy Council" width={40} height={40} className="w-10 h-10 rounded-lg" />
                            <span className="text-2xl font-bold text-[#537547]">สภาเภสัชกรรม</span>
                        </div>

                        {/* Mode Toggle for mobile */}
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
                            <button type="button" onClick={() => switchMode('login')}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${mode === 'login' ? 'bg-[#537547] text-white shadow-lg' : 'text-gray-500'}`}>
                                เข้าสู่ระบบ
                            </button>
                            <button type="button" onClick={() => switchMode('register')}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${mode === 'register' ? 'bg-[#537547] text-white shadow-lg' : 'text-gray-500'}`}>
                                สมัครสมาชิก
                            </button>
                        </div>

                        {/* Mobile Login Form */}
                        {mode === 'login' && (
                            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
                                <div className="text-center mb-4">
                                    <h1 className="text-2xl font-bold mb-1 text-[#6f7e0d]">เข้าสู่ระบบ</h1>
                                    <p className="text-gray-500 text-sm">กรอกอีเมลและรหัสผ่าน</p>
                                </div>

                                {loginError && (
                                    <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{loginError}</span>
                                    </div>
                                )}

                                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="m-login-email" className="text-gray-700">อีเมล</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                            <Input id="m-login-email" type="email" placeholder="name@example.com"
                                                className="pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-[#6f7e0d] placeholder:text-gray-400"
                                                {...loginForm.register('email')} />
                                        </div>
                                        {loginForm.formState.errors.email && <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="m-login-password" className="text-gray-700">รหัสผ่าน</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                                            <Input id="m-login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••"
                                                className="pl-12 pr-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-[#6f7e0d] placeholder:text-gray-400"
                                                {...loginForm.register('password')} />
                                            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="absolute right-4 top-3 text-gray-500 hover:text-gray-300 transition-colors">
                                                {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {loginForm.formState.errors.password && <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>}
                                    </div>

                                    {turnstileSiteKey && (
                                    <div className="flex justify-center">
                                        <Turnstile
                                            ref={loginTurnstileRef}
                                            siteKey={turnstileSiteKey}
                                            onSuccess={(token) => { setLoginRecaptchaToken(token); setLoginError(null); }}
                                            onExpire={() => setLoginRecaptchaToken(null)}
                                            onError={() => setLoginRecaptchaToken(null)}
                                            options={{ size: 'compact' }}
                                        />
                                    </div>
                                    )}

                                    <Button type="submit" className="w-full h-11 bg-[#537547] hover:bg-[#456339] rounded-xl font-semibold shadow-lg" disabled={loginLoading}>
                                        {loginLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Mobile Register Form */}
                        {mode === 'register' && (
                            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
                                <div className="text-center mb-4">
                                    <h1 className="text-2xl font-bold mb-1 text-[#6f7e0d]">
                                        {registerStep === 1 ? 'เลือกประเภทบัญชี' : 'สร้างบัญชีผู้ใช้'}
                                    </h1>
                                    <p className="text-gray-500 text-xs">
                                        {registerStep === 1 ? 'กรุณาเลือกประเภทผู้ใช้งาน' : 'กรอกข้อมูลเพื่อลงทะเบียน'}
                                    </p>
                                </div>

                                {registerError && (
                                    <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{registerError}</span>
                                    </div>
                                )}

                                {/* Mobile Step 1: Account Type Selection */}
                                {registerStep === 1 && (
                                    <div className="space-y-3">
                                        {accountTypes.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <button key={type.value} type="button" onClick={() => selectAccountType(type.value)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-[#537547]/50 text-left transition-all group">
                                                    <div className="w-10 h-10 rounded-lg bg-[#537547]/10 flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-5 h-5 text-[#537547]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900 text-sm">{type.label}</div>
                                                        <div className="text-xs text-gray-500">{type.description}</div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Mobile Step 2: Registration Form */}
                                {registerStep === 2 && (
                                <>
                                {/* Selected Type Indicator */}
                                <div className="mb-4 flex items-center justify-between bg-[#537547]/5 border border-[#537547]/20 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        {accountType && (() => {
                                            const selectedType = accountTypes.find(t => t.value === accountType);
                                            if (!selectedType) return null;
                                            const Icon = selectedType.icon;
                                            return (
                                                <>
                                                    <div className="w-8 h-8 rounded-lg bg-[#537547]/10 flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-[#537547]" />
                                                    </div>
                                                    <span className="font-medium text-[#537547] text-sm">{selectedType.label}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <button type="button" onClick={goBackToRoleSelection}
                                        className="text-xs text-[#537547] font-medium px-2 py-1 rounded hover:bg-[#537547]/10">
                                        เปลี่ยน
                                    </button>
                                </div>

                                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="m-reg-fn" className="text-gray-700 text-sm">ชื่อ</Label>
                                            <Input id="m-reg-fn" placeholder="ชื่อ" className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400" {...registerForm.register('firstName')} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="m-reg-ln" className="text-gray-700 text-sm">นามสกุล</Label>
                                            <Input id="m-reg-ln" placeholder="นามสกุล" className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400" {...registerForm.register('lastName')} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="m-reg-email" className="text-gray-700 text-sm">อีเมล</Label>
                                        <Input id="m-reg-email" type="email" placeholder="name@example.com" className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400" {...registerForm.register('email')} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="m-reg-phone" className="text-gray-700 text-sm">เบอร์โทร <span className="text-gray-400">(ไม่บังคับ)</span></Label>
                                        <Input id="m-reg-phone" placeholder="08XXXXXXXX" className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400" {...registerForm.register('phone')} />
                                    </div>

                                    {accountType !== 'generalPublic' && (
                                    <div className="space-y-1">
                                        <Label htmlFor="m-reg-org" className="text-gray-700 text-sm">
                                            {accountType === 'postgraduateStudent' || accountType === 'undergraduateStudent'
                                                ? <>มหาวิทยาลัย <span className="text-red-500">*</span></>
                                                : <>หน่วยงาน/องค์กร <span className="text-gray-400">(ไม่บังคับ)</span></>}
                                        </Label>
                                        <Input id="m-reg-org"
                                            placeholder={accountType === 'postgraduateStudent' || accountType === 'undergraduateStudent' ? 'ชื่อมหาวิทยาลัย...' : 'โรงพยาบาล/บริษัท...'}
                                            className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                            {...registerForm.register('organization')} />
                                    </div>
                                    )}

                                    <div className="space-y-1">
                                        <Label htmlFor="m-reg-idCard" className="text-gray-700 text-sm">เลขบัตรประชาชน</Label>
                                        <Input id="m-reg-idCard" placeholder="X-XXXX-XXXXX-XX-X" maxLength={13} className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400" {...registerForm.register('idCard')} />
                                    </div>

                                    {accountType === 'pharmacist' && (
                                        <div className="space-y-1">
                                            <Label htmlFor="m-reg-license" className="text-gray-700 text-sm">เลขใบอนุญาต <span className="text-red-500">*</span></Label>
                                            <Input id="m-reg-license" placeholder="ภ.XXXXX" className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400" {...registerForm.register('pharmacyLicenseId')} />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="m-reg-pw" className="text-gray-700 text-sm">รหัสผ่าน</Label>
                                            <div className="relative">
                                                <Input id="m-reg-pw" type={showRegisterPassword ? "text" : "password"} placeholder="••••••"
                                                    className="pr-10 h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                                    {...registerForm.register('password')} />
                                                <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                    className="absolute right-3 top-2.5 text-gray-500">
                                                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="m-reg-cpw" className="text-gray-700 text-sm">ยืนยัน</Label>
                                            <Input id="m-reg-cpw" type={showRegisterPassword ? "text" : "password"} placeholder="••••••"
                                                className="h-10 bg-gray-50 border-gray-200 rounded-xl focus:border-[#537547] text-gray-900 placeholder:text-gray-400"
                                                {...registerForm.register('confirmPassword')} />
                                        </div>
                                    </div>

                                    {turnstileSiteKey && (
                                    <div className="flex justify-center">
                                        <Turnstile
                                            ref={registerTurnstileRef}
                                            siteKey={turnstileSiteKey}
                                            onSuccess={(token) => { setRecaptchaToken(token); setRegisterError(null); }}
                                            onExpire={() => setRecaptchaToken(null)}
                                            onError={() => setRecaptchaToken(null)}
                                            options={{ size: 'compact' }}
                                        />
                                    </div>
                                    )}

                                    <Button type="submit" className="w-full h-11 bg-[#537547] hover:bg-[#456339] text-white rounded-xl font-semibold shadow-lg" disabled={registerLoading}>
                                        {registerLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                                    </Button>
                                </form>
                                </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>}
        </div>
    );
}
