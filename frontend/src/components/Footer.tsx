import { Mail, MapPin, Phone, Clock } from "lucide-react";
import logo from "@/assets/nvs-logo.png";

export function Footer() {
  return (
    <footer
      style={{ backgroundColor: "var(--espresso)" }}
      className="text-white/85 mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ==================== MAIN FOOTER ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="NVS Jewellery"
                className="w-14 h-14 object-contain"
              />

              <div>
                <h2 className="font-serif text-xl text-white">
                  NVS Jewellery
                </h2>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)]">
                  Timeless. Trusted. Ours.
                </p>
              </div>
            </div>

            <p className="text-sm text-white/65 leading-relaxed">
              Timeless jewellery crafted with trust, quality and tradition.
            </p>
          </div>

          {/* Store Address */}
          <div>
            <h3 className="label-caps text-[color:var(--gold)] mb-4">
              Visit Us
            </h3>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[color:var(--gold)] shrink-0 mt-0.5" />

              <p className="text-sm text-white/75 leading-relaxed">
                NVS Jewellery
                <br />
                8-1-99, Near Dabathota
                <br />
                M.G. Road
                <br />
                Vizianagaram
                <br />
                Andhra Pradesh – 535001
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="label-caps text-[color:var(--gold)] mb-4">
              Contact Us
            </h3>

            <div className="space-y-4">

              <a
                href="tel:+919490303003"
                className="flex items-center gap-3 text-sm text-white/75 hover:text-[color:var(--gold)] transition-colors cursor-pointer"
              >
                <Phone className="w-5 h-5 text-[color:var(--gold)] shrink-0" />
                <span>+91 94903 03003</span>
              </a>

              <a
                href="mailto:singakumarnv@gmail.com"
                className="flex items-center gap-3 text-sm text-white/75 hover:text-[color:var(--gold)] transition-colors cursor-pointer break-all"
              >
                <Mail className="w-5 h-5 text-[color:var(--gold)] shrink-0" />
                <span>singakumarnv@gmail.com</span>
              </a>

            </div>
          </div>

          {/* Store Hours */}
          <div>
            <h3 className="label-caps text-[color:var(--gold)] mb-4">
              Store Hours
            </h3>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[color:var(--gold)] shrink-0 mt-0.5" />

              <div className="text-sm text-white/75 leading-relaxed">
                <p>10:30 AM – 9:00 PM</p>

                <p className="text-red-400 mt-2 font-medium">
                  Closed on Tuesdays
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ==================== DIVIDER ==================== */}
        <div className="h-px bg-[color:var(--gold)]/30 my-8" />

        {/* ==================== BOTTOM ==================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>
            © 2026 NVS Jewellery. All rights reserved.
          </p>

          <p>
            Timeless. Trusted. Ours.
          </p>
        </div>

      </div>
    </footer>
  );
}