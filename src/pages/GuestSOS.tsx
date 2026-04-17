import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, Heart, Flame, Shield, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";
import { toast } from "sonner";

type Kind = "medical" | "fire" | "security" | "other";

const kinds: { id: Kind; label: string; icon: typeof Heart; tone: string }[] = [
  { id: "medical", label: "Medical", icon: Heart, tone: "bg-emergency/10 text-emergency" },
  { id: "fire", label: "Fire / Smoke", icon: Flame, tone: "bg-warning/10 text-warning" },
  { id: "security", label: "Security", icon: Shield, tone: "bg-info/10 text-info" },
  { id: "other", label: "Other", icon: Siren, tone: "bg-muted text-muted-foreground" },
];

const GuestSOS = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"idle" | "selecting" | "sent">("idle");
  const [kind, setKind] = useState<Kind | null>(null);

  const trigger = () => setStage("selecting");
  const send = (k: Kind) => {
    setKind(k);
    setStage("sent");
    toast.success("Help is on the way", { description: "Responders have been dispatched." });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Guest"
        title="Emergency SOS"
        description="One tap notifies on-site responders with your room and location."
        actions={<StatusChip label="Room 1407 · Tower A" tone="info" />}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        {stage !== "sent" ? (
          <Card className="overflow-hidden border-2 border-emergency/20 shadow-elegant">
            <CardContent className="flex flex-col items-center gap-6 p-8 sm:p-12">
              <p className="text-center text-sm text-muted-foreground">
                Press and hold the button below if you need urgent help.
              </p>
              <button
                onClick={trigger}
                className="group relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-emergency text-emergency-foreground shadow-emergency transition-transform hover:scale-105 active:scale-95 animate-pulse-emergency sm:h-52 sm:w-52"
                aria-label="Trigger emergency SOS"
              >
                <div className="flex flex-col items-center gap-2">
                  <Siren className="h-14 w-14" strokeWidth={2.2} />
                  <span className="text-lg font-bold uppercase tracking-widest">SOS</span>
                </div>
              </button>

              {stage === "selecting" && (
                <div className="w-full animate-fade-in-up">
                  <p className="mb-3 text-center text-sm font-medium">What's happening?</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {kinds.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => send(k.id)}
                        className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-base hover:-translate-y-0.5 hover:shadow-elegant"
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${k.tone}`}>
                          <k.icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium">{k.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex w-full items-center justify-center gap-6 border-t pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location shared</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Front desk reachable</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-success/30 shadow-elegant animate-fade-in-up">
            <CardContent className="p-8 sm:p-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-bold">Help is on the way</h2>
                <p className="max-w-md text-muted-foreground">
                  An on-site responder has been dispatched to <strong>Room 1407</strong>. Stay where you are if it's safe. We'll keep you updated.
                </p>
                <div className="grid w-full gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-card p-3 text-left">
                    <p className="text-xs text-muted-foreground">Incident</p>
                    <p className="font-semibold">INC-2041</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-left">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-semibold capitalize">{kind}</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-left">
                    <p className="text-xs text-muted-foreground">ETA</p>
                    <p className="font-semibold">~ 90s</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button onClick={() => navigate("/evacuation")}>Show safe route</Button>
                  <Button variant="outline" onClick={() => navigate("/incidents/INC-2041")}>Track incident</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GuestSOS;
