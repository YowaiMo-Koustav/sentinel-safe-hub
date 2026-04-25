import { Link, useNavigate } from "react-router-dom";
import { Shield, Siren, Radio, Map, ArrowRight, CheckCircle2, Activity, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentinelLogo } from "@/components/SentinelLogo";
import { StatusChip } from "@/components/StatusChip";

const features = [
  { icon: Siren, title: "One-tap Guest SOS", desc: "Guests trigger help from any room. Location, room, and context auto-attached." },
  { icon: Radio, title: "Auto-dispatch responders", desc: "Nearest qualified responder is alerted in seconds with full incident context." },
  { icon: Activity, title: "Live operations dashboard", desc: "Staff see active incidents, sensor signals, and responder status in one view." },
  { icon: Map, title: "Safe-route evacuation", desc: "Guests get the fastest, hazard-aware route to the nearest safe assembly point." },
];

const stats = [
  { v: "< 8s", l: "median dispatch" },
  { v: "1 venue", l: "single source of truth" },
  { v: "24/7", l: "sensor coverage" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <SentinelLogo />
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#problem" className="text-muted-foreground hover:text-foreground transition-base">Problem</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-base">How it works</a>
            <a href="#built" className="text-muted-foreground hover:text-foreground transition-base">Built for</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 60%, white 0, transparent 35%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="flex flex-col items-start gap-6 animate-fade-in-up">
            <StatusChip label="Google Solution Challenge 2026" tone="info" />
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Crisis response for hospitality, <span className="text-accent">in seconds.</span>
            </h1>
            <p className="max-w-2xl text-lg text-primary-foreground/80 sm:text-xl">
              Project Sentinel turns hotels and venues into a coordinated safety network — guests trigger help with one tap, staff see everything live, responders move with confidence.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate("/login")}
              >
                Sign in to Sentinel <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <a href="#how">See how it works</a>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-primary-foreground/70">
              <span>· ISO 27001 ready</span>
              <span>· GDPR aligned</span>
              <span>· WCAG 2.1 AA</span>
            </div>

            <dl className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-8">
              {stats.map((s) => (
                <div key={s.l}>
                  <dt className="text-2xl font-bold sm:text-3xl">{s.v}</dt>
                  <dd className="text-xs uppercase tracking-wider text-primary-foreground/70">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emergency">The problem</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              In a crisis, every second is fragmented across phones, radios, and front desks.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Guests don't know who to call. Staff relay messages over walkie-talkies. Responders arrive without context. Evacuations rely on printed maps. The result: slower response, confused coordination, and avoidable harm.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Average emergency call routing in hotels: 90+ seconds",
              "Staff use 3–5 disconnected tools during incidents",
              "Guests rarely know room-to-exit routes",
              "Sensor data sits in silos, unused in real time",
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emergency/10 text-emergency">!</div>
                <span className="text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-y bg-gradient-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One platform. Four roles. Zero confusion.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 shadow-card transition-base hover:-translate-y-1 hover:shadow-elegant">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for */}
      <section id="built" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border bg-gradient-hero p-10 text-primary-foreground shadow-elegant sm:p-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <Building2 className="mb-4 h-8 w-8 text-accent" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for hotels, resorts, and large venues.
              </h2>
              <p className="mt-4 text-primary-foreground/80">
                From the lobby to the back of house, Sentinel unifies guest safety, staff coordination, and responder dispatch into a single, trustworthy system.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/login")}>
                  Sign in <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ul className="space-y-3 rounded-2xl bg-primary-foreground/5 p-6 backdrop-blur">
              {[
                "End-to-end encrypted incident records",
                "Role-based access for staff & responders",
                "Works on any device, no app install",
                "Integrates with existing sensors & PMS",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Project Sentinel · Google Solution Challenge 2026
          </div>
          <p className="text-xs text-muted-foreground">Prototype for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
