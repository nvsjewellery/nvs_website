import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { actions } from "@/lib/store";
import authPanel from "@/assets/auth-panel.jpg";
import { Eye, EyeOff } from "lucide-react";

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
              <span className="text-xs label-caps text-[color:var(--gold-dark)]">
                Password
              </span>

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
    </div>
  );
}