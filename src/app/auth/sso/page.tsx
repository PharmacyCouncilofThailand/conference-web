"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return "/events";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/events";
  return redirect;
}

function SSOCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isLoggedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;

    const ssoToken = searchParams.get("sso");
    const redirectTo = sanitizeRedirect(searchParams.get("redirect"));

    if (isLoggedIn && !ssoToken) {
      router.replace(redirectTo);
      return;
    }

    if (!ssoToken) {
      setError("ไม่พบข้อมูล SSO token");
      setIsVerifying(false);
      return;
    }

    verifiedRef.current = true;

    const verifySSO = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/sso-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ssoToken }),
        });

        const data = await res.json();

        if (data.success) {
          // Store SSO source app so downstream pages can detect SSO origin
          if (data.sourceApp) {
            sessionStorage.setItem('sso-origin-app', data.sourceApp);
          }
          login(data.token, data.user);
          router.replace(redirectTo);
        } else {
          verifiedRef.current = false;
          setError(data.error || "SSO verification failed");
        }
      } catch (err) {
        verifiedRef.current = false;
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } finally {
        setIsVerifying(false);
      }
    };

    verifySSO();
  }, [searchParams, router, login, isLoggedIn]);

  if (isVerifying) {
    return (
      <div className="ui-centered-page">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">กำลังเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-centered-page">
        <div className="text-center max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ไปยังหน้า Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-centered-page">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">กำลังเข้าสู่ระบบ...</p>
          </div>
        </div>
      }
    >
      <SSOCallbackInner />
    </Suspense>
  );
}
