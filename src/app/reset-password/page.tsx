"use client";

import React, { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, Circle, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

// --- Types & Constants ---
const PASSWORD_REQUIREMENTS = [
  { id: 1, label: "8+ characters", regex: /.{8,}/ },
  { id: 2, label: "At least one uppercase", regex: /[A-Z]/ },
  { id: 3, label: "At least one number", regex: /\d/ },
  { id: 4, label: "Special character (@$!%*?&)", regex: /[@$!%*?&]/ },
];

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const emailParam = params.get("email");
    const codeParam = params.get("code");
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      if (codeParam) {
        setVerificationCode(codeParam);
        setCodeVerified(true);
      }
    }
  }, [params]);

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || verificationCode.length !== 6) return toast.error("Valid email and 6-digit code required");

    setVerifying(true);
    try {
      const { data } = await axios.post("/api/email/verify", { email, code: verificationCode });
      if (data.success) {
        setCodeVerified(true);
        toast.success("Identity verified!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAllValid = PASSWORD_REQUIREMENTS.every(req => req.regex.test(password));
    
    if (!isAllValid) return toast.error("Please meet all password requirements");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await axios.post("/api/email/reset-password", { email, code: verificationCode, password });
      if (res.status === 200) {
        toast.success("Password updated! Redirecting to login...");
        router.push("/login");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        {/* Header Decor */}
        <div className="h-2 bg-indigo-600 w-full" />
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="text-indigo-600" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {codeVerified ? "Set New Password" : "Verify Identity"}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {email ? (
                <span>Account: <span className="font-medium text-slate-800">{email}</span></span>
              ) : "Enter your details to continue"}
            </p>
          </div>

          {!codeVerified ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="block w-full text-center text-3xl tracking-[0.3em] font-mono py-4 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none text-slate-800"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button
                type="submit"
                disabled={verifying || verificationCode.length !== 6}
                className="w-full flex justify-center py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {verifying ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="New Password"
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Real-time Checklist */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Security Checklist</p>
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const isMet = req.regex.test(password);
                    return (
                      <div key={req.id} className={`flex items-center text-xs transition-colors ${isMet ? "text-emerald-600" : "text-slate-400"}`}>
                        {isMet ? <CheckCircle2 size={14} className="mr-2" /> : <Circle size={14} className="mr-2 opacity-50" />}
                        {req.label}
                      </div>
                    );
                  })}
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || !password}
                className="w-full flex justify-center py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
              </button>

              <button 
                type="button"
                onClick={() => setCodeVerified(false)}
                className="w-full flex items-center justify-center text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
              >
                <ArrowLeft size={14} className="mr-2" /> Back to code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}