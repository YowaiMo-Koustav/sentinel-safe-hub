import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EvacuationPath } from "@/lib/api";
import { 
  ArrowRight, 
  ArrowLeft, 
  Navigation, 
  MapPin, 
  Footprints, 
  CheckCircle, 
  AlertTriangle,
  Volume2,
  Maximize2,
  Compass,
  Users
} from "lucide-react";

interface GuidedNavigationProps {
  evacuationPath: EvacuationPath;
  onClose: () => void;
}

interface NavigationStep {
  id: number;
  instruction: string;
  distance?: string;
  estimatedTime?: number;
  type: 'start' | 'corridor' | 'stairs' | 'exit' | 'assembly' | 'safety';
  completed: boolean;
  isCurrent: boolean;
}

const GuidedNavigation: React.FC<GuidedNavigationProps> = ({ evacuationPath, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [isNavigating, setIsNavigating] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [compassHeading, setCompassHeading] = useState(0);

  // Initialize navigation steps
  useEffect(() => {
    const steps: NavigationStep[] = evacuationPath.steps.map((instruction, index) => {
      let stepType: NavigationStep['type'] = 'corridor';
      
      if (index === 0) stepType = 'start';
      else if (instruction.toLowerCase().includes('stair')) stepType = 'stairs';
      else if (instruction.toLowerCase().includes('exit')) stepType = 'exit';
      else if (instruction.toLowerCase().includes('assembly')) stepType = 'assembly';
      else if (instruction.toLowerCase().includes('safety') || instruction.toLowerCase().includes('calm')) stepType = 'safety';
      
      return {
        id: index,
        instruction,
        distance: index < evacuationPath.steps.length - 1 ? `${Math.floor(Math.random() * 20 + 10)}m` : undefined,
        estimatedTime: Math.floor(Math.random() * 30 + 15),
        type: stepType,
        completed: false,
        isCurrent: index === 0
      };
    });

    setNavigationSteps(steps);
  }, [evacuationPath]);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isNavigating]);

  // Simulated compass heading
  useEffect(() => {
    const interval = setInterval(() => {
      setCompassHeading(prev => (prev + Math.random() * 10 - 5 + 360) % 360);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Voice synthesis for step instructions
  const speakInstruction = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Speak current step when it changes
  useEffect(() => {
    if (voiceEnabled && navigationSteps[currentStepIndex]) {
      speakInstruction(navigationSteps[currentStepIndex].instruction);
    }
  }, [currentStepIndex, voiceEnabled, navigationSteps, speakInstruction]);

  const handleNextStep = () => {
    if (currentStepIndex < navigationSteps.length - 1) {
      // Mark current step as completed
      setNavigationSteps(prev => prev.map((step, index) => ({
        ...step,
        completed: index === currentStepIndex,
        isCurrent: index === currentStepIndex + 1
      })));
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Navigation completed
      setIsNavigating(false);
      setNavigationSteps(prev => prev.map(step => ({ ...step, completed: true, isCurrent: false })));
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setNavigationSteps(prev => prev.map((step, index) => ({
        ...step,
        completed: index === currentStepIndex - 1,
        isCurrent: index === currentStepIndex - 1
      })));
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepIcon = (type: NavigationStep['type']) => {
    switch (type) {
      case 'start': return <Navigation className="h-5 w-5" />;
      case 'stairs': return <Footprints className="h-5 w-5" />;
      case 'exit': return <MapPin className="h-5 w-5" />;
      case 'assembly': return <CheckCircle className="h-5 w-5" />;
      case 'safety': return <AlertTriangle className="h-5 w-5" />;
      default: return <ArrowRight className="h-5 w-5" />;
    }
  };

  const getStepColor = (type: NavigationStep['type']) => {
    switch (type) {
      case 'start': return 'text-blue-600 bg-blue-50';
      case 'stairs': return 'text-amber-600 bg-amber-50';
      case 'exit': return 'text-red-600 bg-red-50';
      case 'assembly': return 'text-green-600 bg-green-50';
      case 'safety': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / navigationSteps.length) * 100;

  if (!isNavigating && currentStepIndex === navigationSteps.length - 1) {
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

  const currentStep = navigationSteps[currentStepIndex];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Guided Evacuation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={voiceEnabled ? "text-blue-600" : "text-muted-foreground"}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Step {currentStepIndex + 1} of {navigationSteps.length}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Step */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${getStepColor(currentStep?.type)}`}>
              {getStepIcon(currentStep?.type)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Current Step</h3>
              <p className="text-blue-800">{currentStep?.instruction}</p>
              {currentStep?.distance && (
                <p className="text-sm text-blue-600 mt-1">Distance: {currentStep.distance}</p>
              )}
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
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Compass className="h-4 w-4" />
              <span>{Math.round(compassHeading)}°</span>
            </div>
            <div className="flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <Button
            onClick={handleNextStep}
            className="flex items-center gap-2"
          >
            {currentStepIndex === navigationSteps.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">All Steps</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {navigationSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  step.isCurrent ? 'bg-blue-50 border border-blue-200' : 
                  step.completed ? 'bg-green-50' : 'bg-muted/30'
                }`}
              >
                <div className={`p-1 rounded-full ${getStepColor(step.type)}`}>
                  {step.completed ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    getStepIcon(step.type)
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${
                    step.isCurrent ? 'font-medium text-blue-800' : 
                    step.completed ? 'text-green-700' : 'text-muted-foreground'
                  }`}>
                    {step.instruction}
                  </p>
                  {step.distance && (
                    <p className="text-xs text-muted-foreground">{step.distance}</p>
                  )}
                </div>
                <Badge variant={step.isCurrent ? "default" : step.completed ? "secondary" : "outline"}>
                  {step.completed ? "Done" : step.isCurrent ? "Current" : index + 1}
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
              Help others who may need assistance. Follow emergency personnel instructions.
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-4">
            <span>Route: {evacuationPath.name}</span>
            <span>•</span>
            <span>Status: {evacuationPath.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Share with others</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuidedNavigation;
