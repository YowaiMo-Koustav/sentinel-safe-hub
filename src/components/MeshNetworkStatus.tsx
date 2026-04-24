import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Wifi, 
  WifiOff, 
  Users, 
  Send, 
  AlertTriangle,
  Copy,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { meshNetwork, type MeshMessage } from '@/services/meshNetwork';
import { toast } from 'sonner';

export function MeshNetworkStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(meshNetwork.getNetworkStatus());
  const [signalData, setSignalData] = useState('');
  const [peerSignal, setPeerSignal] = useState('');
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        await meshNetwork.initialize();
        setNetworkStatus(meshNetwork.getNetworkStatus());
        
        // Set up message handlers
        meshNetwork.onMessage('sos', (msg) => {
          toast.warning('SOS received through mesh network!', {
            description: `From: ${msg.senderName} - ${msg.payload.location}`
          });
          addMessage(msg);
        });

        meshNetwork.onMessage('incident', (msg) => {
          toast.error('Incident broadcast received', {
            description: `${msg.payload.type} at ${msg.payload.location}`
          });
          addMessage(msg);
        });

        meshNetwork.onMessage('location', (msg) => {
          addMessage(msg);
        });

        meshNetwork.onMessage('heartbeat', (msg) => {
          // Update network status on heartbeat
          setNetworkStatus(meshNetwork.getNetworkStatus());
        });

        meshNetwork.onPeerConnected((peerId, peerName) => {
          setIsConnected(true);
          setNetworkStatus(meshNetwork.getNetworkStatus());
          toast.success('Peer connected', { description: `${peerName} joined the mesh` });
        });

        meshNetwork.onPeerDisconnected((peerId) => {
          setNetworkStatus(meshNetwork.getNetworkStatus());
          if (networkStatus.peerCount <= 1) {
            setIsConnected(false);
          }
          toast.error('Peer disconnected', { description: 'A peer left the mesh network' });
        });

        // Update status periodically
        const interval = setInterval(() => {
          setNetworkStatus(meshNetwork.getNetworkStatus());
        }, 2000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Failed to initialize mesh network:', error);
        toast.error('Mesh network initialization failed');
      }
    };

    initializeNetwork();

    return () => {
      meshNetwork.destroy();
    };
  }, []);

  const addMessage = (msg: MeshMessage) => {
    setMessages(prev => [msg, ...prev].slice(0, 50)); // Keep last 50 messages
  };

  const createPeerConnection = async () => {
    try {
      const peerId = await meshNetwork.createPeer(true);
      const signal = await meshNetwork.getSignalData(peerId);
      setSignalData(signal);
      toast.success('Peer connection created', { description: 'Share this signal with another device' });
    } catch (error) {
      console.error('Failed to create peer:', error);
      toast.error('Failed to create peer connection');
    }
  };

  const connectToPeer = async () => {
    if (!peerSignal.trim()) {
      toast.error('Please enter signal data');
      return;
    }

    try {
      const peerId = await meshNetwork.createPeer(false);
      await meshNetwork.connectToPeer(peerId, peerSignal);
      setPeerSignal('');
      toast.success('Attempting to connect to peer...');
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      toast.error('Failed to connect to peer');
    }
  };

  const sendTestMessage = () => {
    if (!testMessage.trim()) return;
    
    meshNetwork.broadcast('status', {
      message: testMessage,
      timestamp: Date.now()
    });
    
    setTestMessage('');
    toast.success('Message broadcasted to mesh network');
  };

  const sendSOS = () => {
    meshNetwork.sendSOS('Tower A · Lobby', 'smoke_fire', 'critical');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="h-4 w-4" />
          Mesh Network
        </CardTitle>
        <StatusChip 
          label={isConnected ? "Connected" : "Standalone"} 
          tone={isConnected ? "success" : "muted"}
          pulse={isConnected}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{networkStatus.peerCount} peers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted'}`} />
            <span>{isConnected ? 'Mesh active' : 'Standalone'}</span>
          </div>
        </div>

        {/* Peer Connection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Peer Connection</Label>
            <Badge variant="outline" className="text-xs">
              Node: {networkStatus.nodeId.slice(0, 8)}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={createPeerConnection} size="sm" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Create Peer
            </Button>
            <Button onClick={sendSOS} size="sm" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Test SOS
            </Button>
          </div>

          {signalData && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Your Signal (share this):</Label>
              <div className="relative">
                <Textarea
                  value={signalData}
                  readOnly
                  className="text-xs font-mono h-20 resize-none"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1"
                  onClick={() => copyToClipboard(signalData)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Peer Signal (connect to):</Label>
            <div className="flex gap-2">
              <Input
                value={peerSignal}
                onChange={(e) => setPeerSignal(e.target.value)}
                placeholder="Paste signal data here..."
                className="text-xs"
              />
              <Button onClick={connectToPeer} size="sm" disabled={!peerSignal.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Test Messaging */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Test Message</Label>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendTestMessage} size="sm" disabled={!testMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Connected Peers */}
        {networkStatus.peers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Connected Peers</Label>
            <div className="space-y-1">
              {networkStatus.peers.map((peer) => (
                <div key={peer.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {peer.connected ? (
                      <Wifi className="h-3 w-3 text-success" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-sm">{peer.name}</span>
                  </div>
                  <Badge variant={peer.connected ? "default" : "secondary"} className="text-xs">
                    {peer.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Messages */}
        {messages.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mesh Messages ({messages.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {messages.slice(0, 5).map((msg) => (
                <div key={msg.id} className="text-xs p-2 rounded bg-muted">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{msg.senderName}</span>
                    <Badge variant="outline" className="text-xs">
                      {msg.type}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {msg.payload.message || msg.payload.location || 'System message'}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {msg.hops} hops
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
