import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvacuationPath } from "@/lib/api";
import { 
  ArrowRight, 
  ArrowLeft, 
  Navigation, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  X
} from "lucide-react";

interface SimpleGuidedNavigationProps {
  evacuationPath: EvacuationPath;
  onClose: () => void;
}

const SimpleGuidedNavigation: React.FC<SimpleGuidedNavigationProps> = ({ evacuationPath, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNextStep = () => {
    if (currentStepIndex < evacuationPath.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((currentStepIndex + 1) / evacuationPath.steps.length) * 100;

  if (currentStepIndex >= evacuationPath.steps.length - 1) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">Evacuation Complete!</h3>
          <p className="text-green-700 mb-4">
            You have successfully reached the assembly point: {evacuationPath.to_zone}
          </p>
          <div className="text-sm text-muted-foreground mb-6">
            Total time: {formatTime(elapsedTime)}
          </div>
          <Button onClick={onClose} className="w-full">
            Exit Navigation
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStep = evacuationPath.steps[currentStepIndex];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Guided Evacuation
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Step {currentStepIndex + 1} of {evacuationPath.steps.length}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Step */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Navigation className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Current Step</h3>
              <p className="text-blue-800">{currentStep}</p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Time: {formatTime(elapsedTime)}
          </div>

          <Button
            onClick={handleNextStep}
            className="flex items-center gap-2"
          >
            {currentStepIndex === evacuationPath.steps.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">All Steps</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {evacuationPath.steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  index === currentStepIndex ? 'bg-blue-50 border border-blue-200' : 
                  index < currentStepIndex ? 'bg-green-50' : 'bg-muted/30'
                }`}
              >
                <div className="p-1 rounded-full bg-gray-100">
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : index === currentStepIndex ? (
                    <Navigation className="h-3 w-3 text-blue-600" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${
                    index === currentStepIndex ? 'font-medium text-blue-800' : 
                    index < currentStepIndex ? 'text-green-700' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </p>
                </div>
                <Badge variant={index === currentStepIndex ? "default" : index < currentStepIndex ? "secondary" : "outline"}>
                  {index < currentStepIndex ? "Done" : index === currentStepIndex ? "Current" : index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Safety Reminder:</strong> Move quickly but calmly. Do not run. 
              Help others who may need assistance.
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <span>Route: {evacuationPath.name}</span>
          <span>Status: {evacuationPath.status}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleGuidedNavigation;
