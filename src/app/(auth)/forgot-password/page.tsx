'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
    email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (_data: ForgotPasswordForm) => {
        setIsLoading(true);
        setError(null);
        try {
            // Note: Backend API for forgot password is not yet implemented
            // For now, simulate sending email
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSubmitted(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-[#737300] flex">
            {/* Left Side - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8a8a00]/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#737300]/30 rounded-full blur-[120px]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8a8a00] to-[#737300] flex items-center justify-center shadow-lg shadow-[#8a8a00]/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8a8a00] to-[#a0a030]">
                            สภาเภสัชกรรม
                        </span>
                    </div>

                    <h2 className="text-4xl font-bold text-center mb-4 leading-tight">
                        ลืมรหัสผ่าน?<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8a8a00] via-[#a0a030] to-[#8a8a00]">
                            ไม่ต้องกังวล
                        </span>
                    </h2>
                    <p className="text-gray-400 text-center max-w-md">
                        กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
                    </p>

                    {/* Illustration */}
                    <div className="mt-12 relative">
                        <div className="w-64 h-64 bg-gradient-to-br from-[#8a8a00]/20 to-[#737300]/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <Mail className="w-24 h-24 text-[#8a8a00]" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#8a8a00]/30 rounded-full animate-ping" />
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                {/* Background gradient for mobile */}
                <div className="absolute inset-0 lg:hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#8a8a00]/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#737300]/20 rounded-full blur-[100px]" />
                </div>

                <div className="w-full max-w-md relative z-10">
                    {/* Back to Login Link */}
                    <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>กลับไปหน้าเข้าสู่ระบบ</span>
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8a8a00] to-[#737300] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8a8a00] to-[#a0a030]">
                            สภาเภสัชกรรม
                        </span>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        {!isSubmitted ? (
                            <>
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-bold mb-2">ลืมรหัสผ่าน</h1>
                                    <p className="text-gray-400 text-sm">กรอกอีเมลที่ใช้ลงทะเบียน</p>
                                </div>

                                {error && (
                                    <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-300">อีเมล</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-12 h-12 bg-black/30 border-white/10 rounded-xl focus:border-[#8a8a00] focus:ring-[#8a8a00]/20 text-white placeholder:text-gray-500"
                                                {...register('email')}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-400">{errors.email.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-[#8a8a00] to-[#737300] hover:from-[#737300] hover:to-[#686805] rounded-xl font-semibold shadow-lg shadow-[#737300]/30 transition-all hover:shadow-[#737300]/50 hover:-translate-y-0.5"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                กำลังส่ง...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                ส่งลิงก์รีเซ็ตรหัสผ่าน
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            /* Success State */
                            <div className="text-center py-6">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#8a8a00] to-[#737300] flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">ส่งอีเมลเรียบร้อย!</h2>
                                <p className="text-gray-400 mb-6">
                                    เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่<br />
                                    <span className="text-[#8a8a00] font-medium">{getValues('email')}</span>
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    กรุณาตรวจสอบกล่องจดหมาย (และ Spam folder)
                                </p>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => setIsSubmitted(false)}
                                        variant="outline"
                                        className="w-full h-12 border-white/20 bg-white/5 hover:bg-white/10 rounded-xl text-white"
                                    >
                                        ส่งอีเมลอีกครั้ง
                                    </Button>
                                    <Link href="/login" className="block">
                                        <Button className="w-full h-12 bg-gradient-to-r from-[#8a8a00] to-[#737300] hover:from-[#737300] hover:to-[#686805] rounded-xl font-semibold">
                                            กลับไปหน้าเข้าสู่ระบบ
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Help Link */}
                    <p className="text-center text-gray-400 mt-8">
                        ยังมีปัญหา?{' '}
                        <Link href="/contact" className="text-[#8a8a00] hover:text-[#a0a030] font-medium transition-colors">
                            ติดต่อเรา
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
