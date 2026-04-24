import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wifi, 
  WifiOff, 
  Send, 
  Users, 
  AlertTriangle, 
  Radio, 
  Settings,
  Plus,
  Link,
  MessageSquare
} from 'lucide-react';
import { meshNetwork, type MeshMessage } from '@/services/meshNetwork';
import { demoMode } from '@/services/demoMode';
import { toast } from 'sonner';

export function EnhancedMeshNetworkStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<Array<{id: string, name: string, status: string}>>([]);
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [signalData, setSignalData] = useState('');
  const [peerName, setPeerName] = useState('Device-' + Math.random().toString(36).substr(2, 9));
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [demoStats, setDemoStats] = useState({
    peersConnected: 0,
    messagesExchanged: 0,
    sosSignals: 0
  });

  // Demo mode simulation
  useEffect(() => {
    if (useDemoMode) {
      demoMode.enableDemoMode();
      
      const simulationInterval = setInterval(() => {
        // Simulate peer connections
        const simulatedPeers = demoMode.simulateMeshPeers();
        setPeers(simulatedPeers);
        setIsConnected(simulatedPeers.some(p => p.status === 'connected'));
        
        setDemoStats(prev => ({
          ...prev,
          peersConnected: simulatedPeers.filter(p => p.status === 'connected').length
        }));

        // Simulate messages
        const simulatedMessage = demoMode.simulateMeshMessage();
        if (simulatedMessage) {
          const meshMessage: MeshMessage = {
            id: simulatedMessage.id,
            type: simulatedMessage.type as any,
            payload: { content: simulatedMessage.content },
            senderId: 'demo-sender',
            senderName: simulatedMessage.sender,
            timestamp: simulatedMessage.timestamp,
            hops: 0,
            route: []
          };
          
          setMessages(prev => [meshMessage, ...prev].slice(0, 10));
          
          setDemoStats(prev => ({
            ...prev,
            messagesExchanged: prev.messagesExchanged + 1,
            sosSignals: prev.sosSignals + (simulatedMessage.type === 'sos' ? 1 : 0)
          }));
          
          if (simulatedMessage.type === 'sos') {
            toast.warning('Demo: SOS signal received!', {
              description: simulatedMessage.content
            });
          }
        }
      }, 4000); // Simulate every 4 seconds

      return () => {
        clearInterval(simulationInterval);
        demoMode.disableDemoMode();
      };
    }
  }, [useDemoMode]);

  // Real mesh network event handlers (only when not in demo mode)
  useEffect(() => {
    if (!useDemoMode) {
      const handlePeerConnected = (peerId: string, peerName: string) => {
        setPeers(prev => [...prev, { id: peerId, name: peerName, status: 'connected' }]);
        setIsConnected(true);
        toast.success(`Connected to ${peerName}`);
      };

      const handlePeerDisconnected = (peerId: string) => {
        setPeers(prev => {
          const newPeers = prev.filter(p => p.id !== peerId);
          setIsConnected(newPeers.length > 0);
          return newPeers;
        });
      };

      const handleMessage = (message: MeshMessage) => {
        setMessages(prev => [message, ...prev].slice(0, 10));
        
        if (message.type === 'sos') {
          toast.warning('SOS signal received!', {
            description: `From: ${message.senderName}`
          });
        }
      };

      meshNetwork.onPeerConnected(handlePeerConnected);
      meshNetwork.onPeerDisconnected(handlePeerDisconnected);
      meshNetwork.onMessage('message', handleMessage);

      return () => {
        // Cleanup is handled by the mesh network service
      };
    }
  }, [useDemoMode]);

  const createPeer = async () => {
    if (useDemoMode) {
      // In demo mode, simulate creating a peer
      toast.info('Demo: Peer creation simulated');
      return;
    }

    try {
      const peerId = await meshNetwork.createPeer(true); // Create as initiator
      // For demo purposes, we'll simulate signal data
      const mockSignal = {
        type: 'offer',
        sdp: 'mock-sdp-data',
        peerId,
        name: peerName
      };
      setSignalData(JSON.stringify(mockSignal));
      toast.success('Peer created', { description: 'Share signal data to connect' });
    } catch (error) {
      toast.error('Failed to create peer');
    }
  };

  const connectToPeer = async () => {
    if (!signalData.trim()) {
      toast.error('Please enter signal data');
      return;
    }

    try {
      const signal = JSON.parse(signalData);
      const peerId = await meshNetwork.createPeer(false); // Create as receiver
      // In a real implementation, we would signal the peer with the received data
      setSignalData('');
      toast.success('Connecting to peer...');
    } catch (error) {
      toast.error('Invalid signal data');
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (useDemoMode) {
      // Simulate sending message
      const demoMessage: MeshMessage = {
        id: `msg-${Date.now()}`,
        type: 'status',
        payload: { content: messageInput },
        senderId: 'demo-user',
        senderName: peerName,
        timestamp: Date.now(),
        hops: 0,
        route: []
      };
      
      setMessages(prev => [demoMessage, ...prev].slice(0, 10));
      setDemoStats(prev => ({
        ...prev,
        messagesExchanged: prev.messagesExchanged + 1
      }));
      
      setMessageInput('');
      toast.success('Demo: Message sent');
      return;
    }

    meshNetwork.broadcast('status', { content: messageInput });
    setMessageInput('');
    toast.success('Message sent');
  };

  const sendSOS = () => {
    if (useDemoMode) {
      // Simulate SOS
      const sosMessage: MeshMessage = {
        id: `sos-${Date.now()}`,
        type: 'sos',
        payload: { 
          location: 'Tower A · Lobby',
          incidentType: 'smoke_fire',
          severity: 'critical'
        },
        senderId: 'demo-user',
        senderName: peerName,
        timestamp: Date.now(),
        hops: 0,
        route: []
      };
      
      setMessages(prev => [sosMessage, ...prev].slice(0, 10));
      setDemoStats(prev => ({
        ...prev,
        messagesExchanged: prev.messagesExchanged + 1,
        sosSignals: prev.sosSignals + 1
      }));
      
      toast.warning('Demo: SOS signal sent!');
      return;
    }

    meshNetwork.broadcast('sos', {
      location: 'Tower A · Lobby',
      incidentType: 'smoke_fire',
      severity: 'critical'
    });
    
    toast.warning('SOS signal sent!');
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Mesh Network
        </CardTitle>
        <div className="flex items-center gap-2">
          {useDemoMode && (
            <StatusChip 
              label="Demo Mode" 
              tone="info"
              pulse={true}
            />
          )}
          <StatusChip 
            label={isConnected ? "Connected" : "Disconnected"} 
            tone={isConnected ? "success" : "muted"}
            pulse={isConnected}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <div>
              <div className="text-sm font-medium">Demo Mode</div>
              <div className="text-xs text-muted-foreground">
                Simulate mesh network without WebRTC
              </div>
            </div>
          </div>
          <Switch 
            checked={useDemoMode}
            onCheckedChange={setUseDemoMode}
          />
        </div>

        {/* Network Status */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-success">
              {peers.filter(p => p.status === 'connected').length}
            </div>
            <div className="text-xs text-muted-foreground">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning">
              {peers.filter(p => p.status === 'connecting').length}
            </div>
            <div className="text-xs text-muted-foreground">Connecting</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-info">
              {messages.length}
            </div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
        </div>

        {/* Peer Management */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Device Name</Label>
          <Input
            value={peerName}
            onChange={(e) => setPeerName(e.target.value)}
            placeholder="Enter device name"
            disabled={!useDemoMode}
          />
        </div>

        <div className="grid gap-2">
          <Button onClick={createPeer} disabled={!useDemoMode} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Peer
          </Button>
          
          {!useDemoMode && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Signal Data</Label>
                <Input
                  value={signalData}
                  onChange={(e) => setSignalData(e.target.value)}
                  placeholder="Paste signal data from another device"
                />
              </div>
              <Button onClick={connectToPeer} disabled={!signalData.trim()} variant="outline" className="w-full">
                <Link className="h-4 w-4 mr-2" />
                Connect to Peer
              </Button>
            </>
          )}
        </div>

        {/* Connected Peers */}
        {peers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connected Devices
            </h4>
            <div className="space-y-1">
              {peers.map((peer) => (
                <div key={peer.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <span className="text-sm">{peer.name}</span>
                  <Badge 
                    variant={peer.status === 'connected' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {peer.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Send Message</Label>
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* SOS Button */}
        <Button onClick={sendSOS} variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Send SOS Signal
        </Button>

        {/* Recent Messages */}
        {messages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Messages
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {messages.slice(0, 5).map((message) => (
                <div key={message.id} className="text-xs p-2 rounded border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{message.senderName}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.type}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    {message.payload.content || 'System message'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Stats (only shown in demo mode) */}
        {useDemoMode && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {demoStats.peersConnected}
              </div>
              <div className="text-xs text-muted-foreground">Peers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-info">
                {demoStats.messagesExchanged}
              </div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emergency">
                {demoStats.sosSignals}
              </div>
              <div className="text-xs text-muted-foreground">SOS Sent</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
