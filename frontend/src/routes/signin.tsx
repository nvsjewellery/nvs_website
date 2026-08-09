import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { actions } from "@/lib/store";
import { api } from "@/lib/api";
import authPanel from "@/assets/auth-panel.jpg";
import { Eye, EyeOff, X, KeyRound, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/signin")({
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  /* =========================================================
     FORGOT & RESET PASSWORD STATE
  ========================================================= */
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  // Token & New Password Step
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetStep, setIsResetStep] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !pass || (mode === "register" && !name)) return;

    setLoading(true);

    try {
      if (mode === "register") {
        await actions.register(name, email, pass);
      } else {
        await actions.signIn(email, pass);
      }

      nav({ to: "/account" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     HANDLE FORGOT PASSWORD (REQUEST RESET LINK/TOKEN)
  ========================================================= */
  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotSuccessMsg("");

    if (!forgotEmail) return;

    setForgotLoading(true);

    try {
      const res = await api.forgotPassword(forgotEmail);

      if (res.resetToken) {
        setResetToken(res.resetToken);
        setIsResetStep(true);
        setForgotSuccessMsg("Reset token generated! Enter your new password below.");
      } else {
        setForgotSuccessMsg(
          res.message || "Password reset link has been generated."
        );
      }
    } catch (err: any) {
      setForgotError(
        err?.message || "Failed to generate password reset link."
      );
    } finally {
      setForgotLoading(false);
    }
  }

  /* =========================================================
     HANDLE RESET PASSWORD (SET NEW PASSWORD)
  ========================================================= */
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotSuccessMsg("");

    if (!resetToken || !newPassword) return;

    setForgotLoading(true);

    try {
      await actions.resetPassword(resetToken, newPassword);

      setForgotSuccessMsg("Password reset successful! Redirecting...");
      setTimeout(() => {
        closeForgotModal();
        nav({ to: "/account" });
      }, 1500);
    } catch (err: any) {
      setForgotError(err?.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgotModal() {
    setForgotEmail(email);
    setForgotError("");
    setForgotSuccessMsg("");
    setIsResetStep(false);
    setResetToken("");
    setNewPassword("");
    setShowForgotModal(true);
  }

  function closeForgotModal() {
    setShowForgotModal(false);
    setForgotError("");
    setForgotSuccessMsg("");
    setIsResetStep(false);
    setResetToken("");
    setNewPassword("");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[color:var(--background)]">
      {/* Left Image Panel */}
      <div
        className="hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: `url(${authPanel})` }}
      />

      {/* Right Authentication Panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              NVS Jewellery
            </h1>

            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              Your journey with heirlooms begins here
            </p>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-semibold">
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              {mode === "login"
                ? "Sign in to view your orders, wishlist and saved addresses."
                : "Join NVS to start saving your favourites."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="mt-6">
            {/* Full Name - Register Only */}
            {mode === "register" && (
              <label className="block mt-6">
                <span className="text-xs label-caps text-[color:var(--gold-dark)]">
                  Full Name
                </span>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]"
                />
              </label>
            )}

            {/* Email */}
            <label
              className={`block ${
                mode === "register" ? "mt-4" : "mt-6"
              }`}
            >
              <span className="text-xs label-caps text-[color:var(--gold-dark)]">
                Email
              </span>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]"
              />
            </label>

            {/* Password */}
            <label className="block mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs label-caps text-[color:var(--gold-dark)]">
                  Password
                </span>

                {/* FORGOT PASSWORD LINK */}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs text-[color:var(--gold-dark)] hover:underline cursor-pointer font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 pr-11 text-sm outline-none focus:border-[color:var(--gold)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--gold-dark)] cursor-pointer transition-colors"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </label>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 mt-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="pill-gold w-full justify-center mt-6 flex disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>

            {/* Toggle Login/Register */}
            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login" ? "register" : "login"
                );
                setError("");
                setShowPassword(false);
              }}
              className="w-full text-sm text-[color:var(--gold-dark)] mt-4 font-medium cursor-pointer"
            >
              {mode === "login"
                ? "New to NVS? Create account"
                : "Already have an account? Sign in"}
            </button>

            {/* Back to Home */}
            <div className="text-center mt-4">
              <Link
                to="/"
                className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--gold-dark)]"
              >
                ← Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* =========================================================
          FORGOT / RESET PASSWORD MODAL
      ========================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[color:var(--border)] rounded-2xl w-full max-w-md p-6 relative shadow-xl">
            {/* Close Modal */}
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute right-4 top-4 text-[color:var(--muted-foreground)] hover:text-[color:var(--espresso)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[color:var(--cream)] border border-[color:var(--gold)]/30 flex items-center justify-center text-[color:var(--gold-dark)] shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[color:var(--espresso)]">
                  {isResetStep ? "Reset Your Password" : "Forgot Password?"}
                </h3>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {isResetStep
                    ? "Enter your new password to update your account."
                    : "Enter your account email to receive a password reset link."}
                </p>
              </div>
            </div>

            {!isResetStep ? (
              /* STEP 1: REQUEST RESET TOKEN */
              <form onSubmit={handleRequestReset} className="mt-4 space-y-4">
                <div>
                  <span className="text-xs label-caps text-[color:var(--gold-dark)]">
                    Account Email
                  </span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]"
                  />
                </div>

                {forgotError && (
                  <p className="text-xs text-red-600">{forgotError}</p>
                )}

                {forgotSuccessMsg && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="pill-gold w-full justify-center flex text-xs py-2.5 cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? "Generating..." : "Generate Reset Link"}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: SET NEW PASSWORD WITH RETURNED TOKEN */
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <div>
                  <span className="text-xs label-caps text-[color:var(--gold-dark)]">
                    New Password
                  </span>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 pr-11 text-sm outline-none focus:border-[color:var(--gold)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--gold-dark)] cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {forgotError && (
                  <p className="text-xs text-red-600">{forgotError}</p>
                )}

                {forgotSuccessMsg && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="pill-gold w-full justify-center flex text-xs py-2.5 cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? "Resetting..." : "Update Password & Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}