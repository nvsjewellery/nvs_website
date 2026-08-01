import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">
            Visit Our Showroom
          </p>

          <h1 className="font-serif text-5xl mt-2 text-[color:var(--espresso)]">
            Contact NVS Jewellery
          </h1>

          <p className="text-[color:var(--muted-foreground)] mt-4 leading-relaxed">
            We'd love to welcome you to our showroom. Visit us to explore our
            exclusive jewellery collections and receive personalized assistance
            from our experienced team.
          </p>
        </div>

        <OrnamentalDivider />

        <div className="max-w-2xl mx-auto space-y-5">

          <InfoCard
            icon={<MapPin className="w-6 h-6" />}
            title="Store Address"
          >
            <div className="space-y-1">
              <p className="font-semibold text-[color:var(--espresso)]">
                NVS Jewellery
              </p>

              <p>
                8-1-99, Near Dabathota
                <br />
                M.G. Road
                <br />
                Vizianagaram
                <br />
                Andhra Pradesh – 535001
              </p>
            </div>
          </InfoCard>

          <InfoCard
            icon={<Phone className="w-6 h-6" />}
            title="Call Us"
          >
            +91 94903 03003
          </InfoCard>

          <InfoCard
            icon={<Mail className="w-6 h-6" />}
            title="Email"
          >
            singakumarnv@gmail.com
          </InfoCard>

          <InfoCard
            icon={<Clock className="w-6 h-6" />}
            title="Store Hours"
          >
            <div>
              <p>10:30 AM – 9:00 PM</p>
              <p className="mt-2 font-semibold text-red-500">
                Closed on Tuesdays
              </p>
            </div>
          </InfoCard>

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
      className="
        bg-white
        border
        border-[color:var(--border)]
        rounded-2xl
        p-7
        transition-all
        duration-300
        hover:border-[color:var(--gold)]
        hover:shadow-lg
      "
    >
      <div className="flex flex-col items-center text-center">

        <div className="w-14 h-14 rounded-full bg-[color:var(--panel)] border border-[color:var(--gold)]/30 flex items-center justify-center text-[color:var(--gold-dark)] mb-4">
          {icon}
        </div>

        <h3 className="font-serif text-2xl text-[color:var(--espresso)] mb-3">
          {title}
        </h3>

        <div className="text-[color:var(--muted-foreground)] leading-7">
          {children}
        </div>

      </div>
    </div>
  );
}