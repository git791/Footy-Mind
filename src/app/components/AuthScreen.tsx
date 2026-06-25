import React, { useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { loginWithEmail, registerUser, saveUserFavorites, auth } from "../../services/firebase";

const C = {
  bg: "#0a0d26",
  sapphire: "#0d1133",
  sapphireDk: "#070a1a",
  sapphireSm: "#1a2255",
  red: "#dc2626",
  redDk: "#991b1b",
  gray: "#8899bb",
  white: "#ffffff",
  border: "rgba(255,255,255,0.1)",
  borderSub: "rgba(255,255,255,0.05)"
};

const TEKO: React.CSSProperties = { fontFamily: "'Teko', sans-serif" };
const BARLOW: React.CSSProperties = { fontFamily: "'Barlow', sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

// Simplified Countries list for the dropdown
const COUNTRIES = [
  { id: "arg", name: "Argentina", flag: "🇦🇷" },
  { id: "bra", name: "Brazil", flag: "🇧🇷" },
  { id: "fra", name: "France", flag: "🇫🇷" },
  { id: "eng", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "spa", name: "Spain", flag: "🇪🇸" },
  { id: "ger", name: "Germany", flag: "🇩🇪" },
  { id: "ita", name: "Italy", flag: "🇮🇹" },
  { id: "por", name: "Portugal", flag: "🇵🇹" },
  { id: "ned", name: "Netherlands", flag: "🇳🇱" },
  { id: "usa", name: "United States", flag: "🇺🇸" },
  { id: "mex", name: "Mexico", flag: "🇲🇽" },
  { id: "can", name: "Canada", flag: "🇨🇦" }
];

export function AuthScreen({ onContinue }: { onContinue: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Auth State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uid, setUid] = useState<string | null>(null);

  // Favorites
  const [favCountryId, setFavCountryId] = useState("usa");

  const [needsVerification, setNeedsVerification] = useState(false);

  const handleAuth = async () => {
    setError("");
    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await loginWithEmail(email, password);
      } else {
        user = await registerUser(email, password, name);
      }
      
      // Check if user needs to verify email (skip for local mock user)
      if (user.uid !== "local-dev-user" && user.emailVerified === false) {
        setNeedsVerification(true);
        setUid(user.uid);
      } else {
        setUid(user.uid);
        setStep(2);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (auth.currentUser) {
      try {
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(auth.currentUser);
        alert("Verification email resent to " + email + ". Please check your spam folder!");
      } catch (err: any) {
        setError(err.message || "Failed to resend email.");
      }
    } else {
      setError("User not found. Please log in again.");
    }
  };

  const handleFinish = async () => {
    if (uid) {
      await saveUserFavorites(uid, [favCountryId]);
    }
    onContinue();
  };

  return (
    <div className="min-h-screen flex" style={{ ...BARLOW }}>
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden px-12 py-10" style={{ background: `linear-gradient(150deg,${C.sapphire} 0%,${C.bg} 65%)` }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -right-20 top-10 w-72 h-72 rounded-full" style={{ border: `44px solid ${C.red}12`, transform: "rotate(8deg)" }} />
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(to bottom,transparent,${C.red},transparent)` }} />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.red }}><span className="text-white text-sm font-bold" style={{ ...TEKO }}>PIQ</span></div>
          <span className="font-semibold tracking-[0.22em] text-sm uppercase" style={{ color: "rgba(255,255,255,0.8)", ...TEKO }}>Pitch IQ</span>
        </div>
        <div className="relative z-10">
          <div className="text-[10px] tracking-[0.38em] uppercase mb-5" style={{ color: C.red, ...MONO }}>FIFA World Cup 2026</div>
          <h1 className="leading-[0.88] tracking-wide text-white" style={{ fontSize: "clamp(3.5rem,5.8vw,5.5rem)", fontWeight: 600, ...TEKO }}>THE<br /><span style={{ color: C.red }}>ULTIMATE</span><br />FOOTBALL<br />COMPANION</h1>
          <p className="mt-7 text-[15px] leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.45)", ...BARLOW }}>AI-powered tactics, live player intelligence, and interactive quiz content — built for the 2026 World Cup.</p>
        </div>
        <div className="relative z-10">
          <div className="h-px w-full mb-5" style={{ background: C.border }} />
          <div className="flex gap-10">{[["32", "Nations"], ["736", "Players"], ["64", "Matches"]].map(([n, l]) => (
            <div key={l}><div style={{ color: C.red, fontSize: "2rem", lineHeight: 1, fontWeight: 600, ...TEKO }}>{n}</div><div className="text-[9px] tracking-[0.28em] uppercase mt-1" style={{ color: "rgba(255,255,255,0.35)", ...MONO }}>{l}</div></div>
          ))}</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto" style={{ background: C.bg }}>
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.red }}><span className="text-white text-xs font-bold" style={{ ...TEKO }}>PIQ</span></div>
            <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.8)", ...TEKO }}>Pitch IQ</span>
          </div>
          
          <div className="flex items-center gap-2 mb-8">{[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all" style={{ background: step >= s ? C.red : C.sapphireSm, color: C.white, ...MONO }}>{step > s ? <Check size={11} /> : s}</div>
              {s < 2 && <div className="w-8 h-px" style={{ background: step > 1 ? C.red : C.border }} />}
            </div>
          ))}</div>

          {needsVerification ? (
            <div>
              <h2 className="text-white mb-1" style={{ fontSize: "2.5rem", lineHeight: 1, fontWeight: 600, ...TEKO }}>
                Verify Email
              </h2>
              <p className="text-sm mb-8" style={{ color: C.gray, ...BARLOW }}>
                We sent a verification link to your email. Please check your inbox and verify your email to access the dashboard.
              </p>
              
              <button onClick={handleResend} className="w-full py-3.5 mb-4 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: C.sapphireSm, border: `1px solid ${C.border}`, fontSize: "1.05rem", fontWeight: 600, ...TEKO }}>
                Resend Link
              </button>
              
              <button onClick={async () => {
                  if (auth && auth.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                      window.location.reload(); // Quick refresh to update full app state
                    } else {
                      setError("Email not verified yet. Please check your inbox and click the link.");
                    }
                  } else {
                    window.location.reload();
                  }
              }} className="w-full py-3.5 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: `linear-gradient(135deg,${C.red},${C.redDk})`, fontSize: "1.05rem", fontWeight: 600, ...TEKO }}>
                I have verified →
              </button>
            </div>
          ) : step === 1 ? (
            <div>
              <h2 className="text-white mb-1" style={{ fontSize: "2.5rem", lineHeight: 1, fontWeight: 600, ...TEKO }}>
                {isLogin ? "Welcome back." : "Create Account."}
              </h2>
              <p className="text-sm mb-8" style={{ color: C.gray, ...BARLOW }}>
                {isLogin ? "Sign in to your Pitch IQ account" : "Join the ultimate football companion"}
              </p>

              {error && <div className="mb-4 text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

              <div className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color: C.gray, ...MONO }}>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lionel Messi"
                      className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: C.sapphireSm, border: `1px solid ${C.border}`, color: C.white, ...BARLOW }}
                      onFocus={e => (e.target.style.borderColor = C.red)} onBlur={e => (e.target.style.borderColor = C.border)} />
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color: C.gray, ...MONO }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: C.sapphireSm, border: `1px solid ${C.border}`, color: C.white, ...BARLOW }}
                    onFocus={e => (e.target.style.borderColor = C.red)} onBlur={e => (e.target.style.borderColor = C.border)} />
                </div>
                
                <div>
                  <label className="block text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color: C.gray, ...MONO }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: C.sapphireSm, border: `1px solid ${C.border}`, color: C.white, ...BARLOW }}
                    onFocus={e => (e.target.style.borderColor = C.red)} onBlur={e => (e.target.style.borderColor = C.border)} />
                </div>

                <button onClick={handleAuth} disabled={loading} className="w-full py-3.5 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50" style={{ background: `linear-gradient(135deg,${C.red},${C.redDk})`, fontSize: "1.05rem", fontWeight: 600, ...TEKO }}>
                  {loading ? "Authenticating..." : "Continue →"}
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3"><div className="flex-1 h-px" style={{ background: C.borderSub }} /><span className="text-xs" style={{ color: "#555", ...MONO }}>or</span><div className="flex-1 h-px" style={{ background: C.borderSub }} /></div>
              
              <p className="mt-4 text-center text-xs" style={{ color: "#777", ...BARLOW }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLogin(!isLogin)} className="hover:underline" style={{ color: C.red }}>
                  {isLogin ? "Create one" : "Sign In"}
                </button>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-white mb-1" style={{ fontSize: "2.2rem", lineHeight: 1, fontWeight: 600, ...TEKO }}>Choose Your Favorite</h2>
              <p className="text-sm mb-6" style={{ color: C.gray, ...BARLOW }}>Personalise your World Cup experience</p>
              
              <div className="mb-7">
                <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{ color: "#aaa", ...MONO }}>Select National Team</div>
                
                <select 
                  value={favCountryId} 
                  onChange={e => setFavCountryId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-lg outline-none transition-all cursor-pointer appearance-none"
                  style={{ background: C.sapphireSm, border: `1px solid ${C.border}`, color: C.white, ...BARLOW }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={handleFinish} className="w-full py-3.5 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg,${C.red},${C.redDk})`, fontSize: "1.05rem", fontWeight: 600, ...TEKO }}>Enter Pitch IQ →</button>
              <div className="mt-4 text-center"><button onClick={onContinue} className="text-xs underline underline-offset-2 hover:text-white" style={{ color: "#777", ...BARLOW }}>Skip for now</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
