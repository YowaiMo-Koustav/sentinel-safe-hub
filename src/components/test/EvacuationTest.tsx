import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building } from "lucide-react";

const EvacuationTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [testData, setTestData] = useState<any[]>([]);

  useEffect(() => {
    // Test basic loading
    const timer = setTimeout(() => {
      setTestData([
        { id: '1', name: 'Test Route 1', status: 'clear', from_zone: 'Office 201', to_zone: 'North Assembly' },
        { id: '2', name: 'Test Route 2', status: 'partial', from_zone: 'Meeting 205', to_zone: 'South Assembly' },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading evacuation test...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Evacuation System Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Testing basic evacuation page functionality...
            </div>
            
            {testData.map((route) => (
              <div key={route.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{route.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {route.from_zone} → {route.to_zone}
                  </div>
                </div>
                <Badge variant={route.status === 'clear' ? 'default' : 'secondary'}>
                  {route.status}
                </Badge>
              </div>
            ))}
            
            <Button className="w-full">
              Test Complete - Page Loads Successfully
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvacuationTest;
