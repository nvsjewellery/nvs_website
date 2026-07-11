import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">Get in Touch</p>
          <h1 className="font-serif text-5xl mt-2 text-[color:var(--espresso)]">Contact NVS</h1>
          <p className="text-[color:var(--muted-foreground)] mt-3">For custom orders, valuations, repairs or anything else — our team of jewellery consultants is here to help.</p>
        </div>
        <OrnamentalDivider />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form className="bg-white border border-[color:var(--border)] rounded-2xl p-6" onSubmit={(e) => { e.preventDefault(); alert("Message sent!"); }}>
            <h3 className="font-serif text-2xl text-[color:var(--espresso)] mb-5">Send a Message</h3>
            <div className="space-y-4">
              <Field label="Full name"><input required className="input" /></Field>
              <Field label="Email"><input type="email" required className="input" /></Field>
              <Field label="Message"><textarea rows={5} required className="input" /></Field>
              <button type="submit" className="pill-gold">Send Message</button>
            </div>
            <style>{`.input{width:100%;border:1px solid var(--border);border-radius:.5rem;padding:.55rem .75rem;font-size:.875rem;outline:none;background:#fff;}.input:focus{border-color:var(--gold);}`}</style>
          </form>

          <div className="space-y-4">
            <InfoCard icon={<MapPin />} title="Flagship Store">
              214, Karol Bagh Main Road, New Delhi — 110005
            </InfoCard>
            <InfoCard icon={<Phone />} title="Call Us">
              +91 98765 43210<br />+91 11 4567 8900
            </InfoCard>
            <InfoCard icon={<Mail />} title="Email">
              care@nvsjewellery.in
            </InfoCard>
            <InfoCard icon={<Clock />} title="Store Hours">
              Mon-Sat: 10:30 AM – 8:30 PM<br />Sunday: 11:00 AM – 6:00 PM
            </InfoCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs label-caps text-[color:var(--gold-dark)]">{label}</span><div className="mt-1">{children}</div></label>;
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "var(--panel)" }} className="rounded-2xl p-5 flex gap-4">
      <div className="w-11 h-11 rounded-full bg-white grid place-items-center text-[color:var(--gold-dark)] shrink-0 border border-[color:var(--gold)]/30">{icon}</div>
      <div>
        <h4 className="font-serif text-lg text-[color:var(--espresso)]">{title}</h4>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
