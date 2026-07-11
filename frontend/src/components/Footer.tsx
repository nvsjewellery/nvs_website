import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Mail, Phone, ShieldCheck } from "lucide-react";
import logo from "@/assets/nvs-logo.png";

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--espresso)" }} className="text-white/85 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-[color:var(--gold)] grid place-items-center bg-white overflow-hidden">
                <img src={logo} alt="NVS" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <div className="font-serif text-xl">NVS Jewellery</div>
                <div className="label-caps text-[10px] text-[color:var(--gold)]">Est. 1978</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Handcrafted heirlooms in gold, silver, platinum, diamond and rose gold — certified purity, timeless design.
            </p>
          </div>
          <FCol title="Categories" items={[
            { l: "Gold", to: "/gold" },
            { l: "Silver", to: "/silver" },
            { l: "Platinum", to: "/platinum" },
            { l: "Diamond", to: "/diamond" },
            { l: "Live Rates", to: "/" },
          ]} />
          <FCol title="Customer Service" items={[
            { l: "Help Center", to: "/contact" },
            { l: "Returns & Exchanges", to: "/contact" },
            { l: "Shipping Info", to: "/contact" },
            { l: "Track Order", to: "/account" },
            { l: "FAQs", to: "/contact" },
          ]} />
          <div>
            <h4 className="label-caps text-[color:var(--gold)] mb-4">Follow Us</h4>
            <div className="flex gap-3 mb-4">
              {[Facebook, Instagram, Twitter].map((I, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-white/20 grid place-items-center hover:border-[color:var(--gold)] transition">
                  <I className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="text-sm space-y-2 text-white/70">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[color:var(--gold)]" />care@nvsjewellery.in</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[color:var(--gold)]" />+91 98765 43210</div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[color:var(--gold)]/40 my-10" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <FCol title="Gold" items={[{l:"Rings",to:"/gold"},{l:"Chains",to:"/gold"},{l:"Necklaces",to:"/gold"},{l:"Bangles",to:"/gold"},{l:"Pendants",to:"/gold"}]} />
          <FCol title="Silver" items={[{l:"Rings",to:"/silver"},{l:"Anklets",to:"/silver"},{l:"Bracelets",to:"/silver"},{l:"Chains",to:"/silver"}]} />
          <FCol title="Diamond" items={[{l:"Rings",to:"/diamond"},{l:"Earrings",to:"/diamond"},{l:"Necklaces",to:"/diamond"},{l:"Pendants",to:"/diamond"}]} />
          <div>
            <h4 className="label-caps text-[color:var(--gold)] mb-4">Certifications</h4>
            <ul className="space-y-2 text-white/75">
              {["BIS Hallmark","GIA Certified","IGI Certified","Purity Guarantee"].map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[color:var(--gold)]" />{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px bg-[color:var(--gold)]/40 my-8" />
        <div className="text-center text-xs text-white/60">© 2026 NVS Jewellery. All rights reserved.</div>
      </div>
    </footer>
  );
}

function FCol({ title, items }: { title: string; items: { l: string; to: string }[] }) {
  return (
    <div>
      <h4 className="label-caps text-[color:var(--gold)] mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-white/75">
        {items.map((i) => (
          <li key={i.l}><Link to={i.to} className="hover:text-[color:var(--gold)] transition">{i.l}</Link></li>
        ))}
      </ul>
    </div>
  );
}
