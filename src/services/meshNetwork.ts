import SimplePeer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';
import { incidentAutomation } from './incidentAutomation';

export interface MeshMessage {
  id: string;
  type: 'incident' | 'sos' | 'location' | 'status' | 'heartbeat';
  payload: any;
  senderId: string;
  senderName: string;
  timestamp: number;
  hops: number;
  route: string[];
}

export interface PeerConnection {
  id: string;
  name: string;
  peer: SimplePeer.Instance;
  connected: boolean;
  lastSeen: number;
}

export class MeshNetwork {
  private peers: Map<string, PeerConnection> = new Map();
  private messageHandlers: Map<string, (msg: MeshMessage) => void> = new Map();
  private onPeerConnectedCallbacks: ((peerId: string, peerName: string) => void)[] = [];
  private onPeerDisconnectedCallbacks: ((peerId: string) => void)[] = [];
  private isInitialized = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private nodeId: string;
  private nodeName: string;

  constructor(nodeName: string) {
    this.nodeId = uuidv4();
    this.nodeName = nodeName;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing mesh network...');
      this.startHeartbeat();
      this.isInitialized = true;
      console.log(`Mesh network initialized. Node ID: ${this.nodeId}`);
    } catch (error) {
      console.error('Failed to initialize mesh network:', error);
      throw error;
    }
  }

  // Create a new peer connection (for initiating connections)
  async createPeer(isInitiator: boolean = false): Promise<string> {
    const peerId = uuidv4();
    
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    const peerConnection: PeerConnection = {
      id: peerId,
      name: `Peer-${peerId.slice(0, 8)}`,
      peer,
      connected: false,
      lastSeen: Date.now()
    };

    this.setupPeerEvents(peerId, peer);
    this.peers.set(peerId, peerConnection);

    return peerId;
  }

  private setupPeerEvents(peerId: string, peer: SimplePeer.Instance): void {
    peer.on('connect', () => {
      console.log(`Connected to peer ${peerId}`);
      const connection = this.peers.get(peerId);
      if (connection) {
        connection.connected = true;
        connection.lastSeen = Date.now();
      }
      this.onPeerConnectedCallbacks.forEach(cb => cb(peerId, connection?.name || 'Unknown'));
    });

    peer.on('data', (data) => {
      try {
        const message: MeshMessage = JSON.parse(data.toString());
        this.handleMessage(message, peerId);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    peer.on('close', () => {
      console.log(`Peer ${peerId} disconnected`);
      const connection = this.peers.get(peerId);
      if (connection) {
        connection.connected = false;
      }
      this.onPeerDisconnectedCallbacks.forEach(cb => cb(peerId));
    });

    peer.on('error', (error) => {
      console.error(`Peer ${peerId} error:`, error);
    });
  }

  private handleMessage(message: MeshMessage, fromPeerId: string): void {
    // Update route and hop count
    message.hops++;
    message.route.push(fromPeerId);

    // Handle based on message type
    switch (message.type) {
      case 'heartbeat':
        this.updatePeerLastSeen(message.senderId);
        break;
      case 'incident':
        // Forward critical messages to all other peers
        this.forwardMessage(message, fromPeerId);
        break;
      case 'sos':
        // Create incident from SOS and forward to all other peers
        this.handleSOSMessage(message);
        this.forwardMessage(message, fromPeerId);
        break;
      case 'location':
      case 'status':
        // Forward to all peers (for demo purposes)
        this.forwardMessage(message, fromPeerId);
        break;
    }

    // Call registered handlers
    this.messageHandlers.forEach(handler => handler(message));
  }

  private handleSOSMessage(message: MeshMessage): void {
    // Automatically create incident from SOS message
    incidentAutomation.createIncidentFromMeshSOS(
      message.payload.location,
      message.payload.incidentType,
      message.payload.severity,
      message.senderName
    );
  }

  private forwardMessage(message: MeshMessage, excludePeerId: string): void {
    // Prevent infinite loops
    if (message.hops > 10) return;

    const messageData = JSON.stringify(message);
    
    this.peers.forEach((peerConnection, peerId) => {
      if (peerId !== excludePeerId && peerConnection.connected) {
        try {
          peerConnection.peer.send(messageData);
        } catch (error) {
          console.error(`Failed to forward message to peer ${peerId}:`, error);
        }
      }
    });
  }

  // Send message to all connected peers
  broadcast(type: MeshMessage['type'], payload: any): void {
    const message: MeshMessage = {
      id: uuidv4(),
      type,
      payload,
      senderId: this.nodeId,
      senderName: this.nodeName,
      timestamp: Date.now(),
      hops: 0,
      route: []
    };

    const messageData = JSON.stringify(message);
    
    this.peers.forEach((peerConnection) => {
      if (peerConnection.connected) {
        try {
          peerConnection.peer.send(messageData);
        } catch (error) {
          console.error(`Failed to broadcast to peer ${peerConnection.id}:`, error);
        }
      }
    });
  }

  // Send SOS signal through mesh network
  sendSOS(location: string, incidentType: string, severity: string): void {
    this.broadcast('sos', {
      location,
      incidentType,
      severity,
      urgent: true
    });
  }

  // Send location update
  sendLocation(zone: string, room?: string): void {
    this.broadcast('location', {
      zone,
      room,
      timestamp: Date.now()
    });
  }

  // Get signal data for peer connection
  async getSignalData(peerId: string): Promise<string> {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) {
      throw new Error(`Peer ${peerId} not found`);
    }

    return new Promise((resolve, reject) => {
      peerConnection.peer.once('signal', (data) => {
        resolve(JSON.stringify(data));
      });
      
      peerConnection.peer.once('error', reject);
    });
  }

  // Connect to peer using signal data
  async connectToPeer(peerId: string, signalData: string): Promise<void> {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      const signal = JSON.parse(signalData);
      peerConnection.peer.signal(signal);
    } catch (error) {
      console.error('Failed to process signal data:', error);
      throw error;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', {
        timestamp: Date.now()
      });
    }, 5000); // Send heartbeat every 5 seconds
  }

  private updatePeerLastSeen(senderId: string): void {
    // Find peer by sender ID and update last seen
    this.peers.forEach((peerConnection) => {
      if (peerConnection.id === senderId) {
        peerConnection.lastSeen = Date.now();
      }
    });
  }

  // Event handlers
  onMessage(type: string, handler: (msg: MeshMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  onPeerConnected(callback: (peerId: string, peerName: string) => void): void {
    this.onPeerConnectedCallbacks.push(callback);
  }

  onPeerDisconnected(callback: (peerId: string) => void): void {
    this.onPeerDisconnectedCallbacks.push(callback);
  }

  // Get network status
  getNetworkStatus(): {
    isConnected: boolean;
    peerCount: number;
    nodeId: string;
    nodeName: string;
    peers: Array<{ id: string; name: string; connected: boolean; lastSeen: number }>;
  } {
    const peers = Array.from(this.peers.values()).map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      lastSeen: p.lastSeen
    }));

    return {
      isConnected: peers.some(p => p.connected),
      peerCount: peers.filter(p => p.connected).length,
      nodeId: this.nodeId,
      nodeName: this.nodeName,
      peers
    };
  }

  // Cleanup
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.peers.forEach((peerConnection) => {
      peerConnection.peer.destroy();
    });

    this.peers.clear();
    this.messageHandlers.clear();
    this.isInitialized = false;
  }
}

// Singleton instance for the application
export const meshNetwork = new MeshNetwork('Sentinel-Node');
