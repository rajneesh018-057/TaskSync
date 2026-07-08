import React, { useState } from "react";
import { AlertCircle, Lock, Mail, User, CheckCircle } from "lucide-react";

interface AuthViewProps {
  onAuthSuccess: (token: string, user: { id: string; email: string; userName: string }) => void;
  darkCalmMode: boolean;
}

export default function AuthView({ onAuthSuccess, darkCalmMode }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password || (!isLogin && !userName)) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { email, password } 
      : { email, password, userName };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      if (isLogin) {
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 800);
      } else {
        setSuccess("Registration successful! Switching to login...");
        setTimeout(() => {
          setIsLogin(true);
          setPassword("");
          setLoading(false);
          setSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to server.");
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      darkCalmMode ? "bg-[#12121a] text-white" : "bg-[#fbf8ff] text-[#1b1b21]"
    }`}>
      {/* Visual background decorations */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#5054b1]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className={`relative max-w-md w-full rounded-3xl p-8 border shadow-2xl backdrop-blur-md transition-all duration-300 ${
        darkCalmMode 
          ? "bg-[#181822]/80 border-white/10" 
          : "bg-white/90 border-[#efecf6]"
      }`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#5054b1]/10 text-[#5054b1] mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className={`text-2xl font-bold tracking-tight ${darkCalmMode ? "text-white" : "text-[#010047]"}`}>
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className={`text-xs mt-1 ${darkCalmMode ? "text-gray-400" : "text-[#72749b]"}`}>
            {isLogin 
              ? "Access your Active Calm Productivity Dashboard" 
              : "Start organizing your schedule and cognitive load"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
                darkCalmMode ? "text-gray-400" : "text-[#464652]"
              }`}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72749b]" />
                <input
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5054b1]/50 ${
                    darkCalmMode 
                      ? "bg-[#efecf6]/5 border-white/10 text-white placeholder:text-gray-500" 
                      : "bg-[#f5f2fb] border-[#efecf6] text-[#1b1b21] placeholder:text-[#c7c5d4]"
                  }`}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
              darkCalmMode ? "text-gray-400" : "text-[#464652]"
            }`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72749b]" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5054b1]/50 ${
                  darkCalmMode 
                    ? "bg-[#efecf6]/5 border-white/10 text-white placeholder:text-gray-500" 
                    : "bg-[#f5f2fb] border-[#efecf6] text-[#1b1b21] placeholder:text-[#c7c5d4]"
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
              darkCalmMode ? "text-gray-400" : "text-[#464652]"
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72749b]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5054b1]/50 ${
                  darkCalmMode 
                    ? "bg-[#efecf6]/5 border-white/10 text-white placeholder:text-gray-500" 
                    : "bg-[#f5f2fb] border-[#efecf6] text-[#1b1b21] placeholder:text-[#c7c5d4]"
                }`}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200/20 bg-rose-500/10 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200/20 bg-emerald-500/10 text-emerald-500 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5054b1] hover:bg-[#373b97] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 text-white text-xs font-semibold py-3 rounded-xl shadow-lg transition-all"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkCalmMode ? "border-white/10" : "border-[#efecf6]"}`} />
            </div>
            <span className={`relative px-3 text-[10px] uppercase tracking-wider font-semibold ${
              darkCalmMode ? "bg-[#181822] text-gray-500" : "bg-white text-[#72749b]"
            }`}>
              Or
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/google?flow=login";
            }}
            className={`w-full flex items-center justify-center gap-2.5 border active:scale-[0.98] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer ${
              darkCalmMode 
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                : "bg-white border-[#efecf6] text-[#464652] hover:bg-[#f5f2fb]"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.92 3.04C6.27 7.51 8.92 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.45h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.71-4.92 3.71-8.56z" />
              <path fill="#FBBC05" d="M5.31 14.48c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 6.84C.5 8.62 0 10.61 0 12.7s.5 4.08 1.39 5.86l3.92-3.08z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.95 1.09-3.08 0-5.73-2.47-6.69-5.56L1.39 15.82C3.37 20.33 7.35 23 12 23z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-[#efecf6]/10">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className={`text-xs font-semibold text-[#5054b1] hover:underline`}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
