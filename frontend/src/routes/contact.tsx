import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, Navigation } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">
            Visit Our Store
          </p>

          <h1 className="font-serif text-5xl mt-2 text-[color:var(--espresso)]">
            Contact NVS Jewellery
          </h1>

          <p className="text-[color:var(--muted-foreground)] mt-3 leading-relaxed">
            We'd love to welcome you to our showroom. Visit us for bridal
            jewellery, custom orders, jewellery exchange, repairs and
            personalized assistance.
          </p>
        </div>

        <OrnamentalDivider />

        <div className="max-w-3xl mx-auto space-y-5">

          <InfoCard
            icon={<MapPin className="w-5 h-5" />}
            title="Store Address"
          >
            8-1-99
            <br />
            Near Dabathota
            <br />
            M.G. Road
            <br />
            Vizianagaram,
            <br />
            Andhra Pradesh - 535001
          </InfoCard>

          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            title="Store Timings"
          >
            Monday : 10:30 AM – 9:00 PM
            <br />
            Tuesday : <strong>Holiday</strong>
            <br />
            Wednesday : 10:30 AM – 9:00 PM
            <br />
            Thursday : 10:30 AM – 9:00 PM
            <br />
            Friday : 10:30 AM – 9:00 PM
            <br />
            Saturday : 10:30 AM – 9:00 PM
            <br />
            Sunday : 10:30 AM – 9:00 PM
          </InfoCard>

          <InfoCard
            icon={<Phone className="w-5 h-5" />}
            title="Phone"
          >
            Contact number will be updated soon.
          </InfoCard>

          <InfoCard
            icon={<Mail className="w-5 h-5" />}
            title="Email"
          >
            Email address will be updated soon.
          </InfoCard>

          <a
            href="https://maps.google.com/?q=8-1-99+Near+Dabathota+M.G.+Road+Vizianagaram+535001"
            target="_blank"
            rel="noopener noreferrer"
            className="pill-gold mx-auto flex items-center justify-center gap-2 w-fit"
          >
            <Navigation className="w-4 h-4" />
            Open in Google Maps
          </a>

        </div>
      </div>
    </Layout>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ backgroundColor: "var(--panel)" }}
      className="rounded-2xl border border-[color:var(--border)] p-6 flex gap-5"
    >
      <div className="w-12 h-12 rounded-full bg-white border border-[color:var(--gold)]/30 grid place-items-center text-[color:var(--gold-dark)] shrink-0">
        {icon}
      </div>

      <div>
        <h3 className="font-serif text-2xl text-[color:var(--espresso)]">
          {title}
        </h3>

        <p className="mt-2 text-[color:var(--muted-foreground)] leading-7">
          {children}
        </p>
      </div>
    </div>
  );
}