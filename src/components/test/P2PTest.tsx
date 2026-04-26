import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useP2PEvacuation } from '@/hooks/useP2PEvacuation';
import { EvacuationPath } from '@/lib/api';
import { Wifi, Users, Share2, CheckCircle, AlertCircle } from 'lucide-react';

const P2PTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const {
    isConnected,
    connectedPeers,
    sharedRoutes,
    peerCount,
    connectionStatus,
    shareRoute,
    shareRoutes,
    isInitialized
  } = useP2PEvacuation('test-building');

  const addTestResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${type.toUpperCase()}: ${message}`]);
  };

  const runP2PTest = async () => {
    setIsTesting(true);
    setTestResults([]);

    // Test 1: P2P Service Initialization
    addTestResult('Starting P2P evacuation test...');
    
    if (!isInitialized) {
      addTestResult('P2P service not initialized', 'error');
      setIsTesting(false);
      return;
    }
    addTestResult('P2P service initialized successfully', 'success');

    // Test 2: Connection Status
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for connection
    
    if (isConnected) {
      addTestResult('Connected to P2P signaling server', 'success');
    } else {
      addTestResult('Not connected to P2P signaling server', 'error');
    }

    // Test 3: Route Sharing
    const testRoute: EvacuationPath = {
      id: 'test-route-p2p',
      name: 'P2P Test Route',
      from_zone: 'Test Zone A',
      to_zone: 'Test Assembly Point',
      status: 'clear',
      estimated_seconds: 120,
      steps: ['Step 1', 'Step 2', 'Step 3'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      shareRoute(testRoute);
      addTestResult('Test route shared successfully', 'success');
    } catch (error) {
      addTestResult(`Failed to share test route: ${error}`, 'error');
    }

    // Test 4: Multiple Route Sharing
    const testRoutes: EvacuationPath[] = [
      testRoute,
      {
        ...testRoute,
        id: 'test-route-p2p-2',
        name: 'P2P Test Route 2',
        from_zone: 'Test Zone B'
      }
    ];

    try {
      shareRoutes(testRoutes);
      addTestResult('Multiple test routes shared successfully', 'success');
    } catch (error) {
      addTestResult(`Failed to share multiple routes: ${error}`, 'error');
    }

    // Test 5: Peer Detection
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for peer discovery
    
    if (peerCount > 0) {
      addTestResult(`Detected ${peerCount} peers in the network`, 'success');
    } else {
      addTestResult('No other peers detected (expected for single device test)', 'info');
    }

    // Test 6: Shared Routes Reception
    if (sharedRoutes.length > 0) {
      addTestResult(`Received ${sharedRoutes.length} shared routes from peers`, 'success');
    } else {
      addTestResult('No shared routes received from peers', 'info');
    }

    addTestResult('P2P evacuation test completed', 'success');
    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            P2P Evacuation Route Sharing Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Connection Status:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{peerCount} peers</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={runP2PTest} 
              disabled={isTesting || !isInitialized}
              className="flex items-center gap-2"
            >
              {isTesting ? 'Testing...' : 'Run P2P Test'}
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={testResults.length === 0}
            >
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => {
                  const isSuccess = result.includes('SUCCESS');
                  const isError = result.includes('ERROR');
                  return (
                    <div 
                      key={index} 
                      className={`flex items-start gap-2 text-sm ${
                        isSuccess ? 'text-green-600' : isError ? 'text-red-600' : 'text-muted-foreground'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      ) : isError ? (
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      ) : null}
                      <span className="break-all">{result}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared Routes Display */}
          {sharedRoutes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Shared Routes from Network:</h4>
              <div className="grid gap-2">
                {sharedRoutes.map((route) => (
                  <div key={`${route.id}-${route.sourceDeviceId}`} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{route.name}</span>
                      <Badge variant="outline" className="text-xs">From Peer</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {route.from_zone} → {route.to_zone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">How to Test Multi-Device P2P:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Open this application in multiple browser tabs or devices</li>
              <li>Make sure all instances are connected to the same building ID</li>
              <li>Run the P2P test on one device to share routes</li>
              <li>Check other devices for received shared routes</li>
              <li>The routes should appear in the "Shared Routes from Network" section</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default P2PTest;
