import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/StatusChip";
import { incidents, priorityColor } from "@/lib/sampleData";
import { MapPin, Clock, ArrowRight } from "lucide-react";

const ResponderView = () => {
  const navigate = useNavigate();
  const queue = incidents.filter((i) => i.status !== "resolved");

  return (
    <div>
      <PageHeader
        eyebrow="Responder"
        title="My response queue"
        description="Incidents assigned to you, sorted by priority."
        actions={<StatusChip label="On duty" tone="success" pulse />}
      />

      <div className="grid gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-2">
        {queue.map((i) => (
          <Card key={i.id} className="shadow-card transition-base hover:shadow-elegant">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{i.id}</CardTitle>
                  <Badge className={priorityColor(i.priority)}>{i.priority}</Badge>
                </div>
                <p className="mt-1 text-sm capitalize text-muted-foreground">{i.type} incident</p>
              </div>
              <Badge variant="outline" className="capitalize">{i.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{i.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {i.location}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {i.createdAt}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={() => navigate(`/incidents/${i.id}`)}>
                  Open <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/evacuation")}>
                  Route to scene
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResponderView;
