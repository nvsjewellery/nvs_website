import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { actions } from "@/lib/store";
import authPanel from "@/assets/auth-panel.jpg";

export const Route = createFileRoute("/signin")({ component: SignIn });

function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email && pass) {
      actions.signIn(email);
      nav({ to: "/account" });
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[45%_1fr]">
      <div className="relative min-h-[300px] md:min-h-screen">
        <img src={authPanel} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        <div className="relative z-10 h-full flex items-end p-10">
          <div>
            <p className="label-caps text-[color:var(--gold)] text-xs">NVS Jewellery</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white mt-3 max-w-sm">Your journey with heirlooms begins here</h2>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 bg-white">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="font-serif text-4xl text-[color:var(--espresso)]">Welcome back</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-2">Sign in to view your orders, wishlist and saved addresses.</p>
          <label className="block mt-6">
            <span className="text-xs label-caps text-[color:var(--gold-dark)]">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
          </label>
          <label className="block mt-4">
            <span className="text-xs label-caps text-[color:var(--gold-dark)]">Password</span>
            <input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
          </label>
          <button type="submit" className="pill-gold w-full justify-center mt-6 flex">Sign In</button>
          <button type="button" onClick={() => { if (email && pass) { actions.signIn(email); nav({ to: "/account" }); } }} className="w-full text-sm text-[color:var(--gold-dark)] mt-4 font-medium">
            New to NVS? Create account
          </button>
          <p className="text-[11px] text-[color:var(--muted-foreground)] mt-6 text-center">Demo login — any email/password is accepted (mock only).</p>
          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--gold-dark)]">← Back to home</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
