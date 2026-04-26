import Peer from 'simple-peer';
import { EvacuationPath } from '@/lib/api';

export interface P2PRouteMessage {
  type: 'route_discovery' | 'route_share' | 'route_request' | 'route_update';
  payload: {
    route?: EvacuationPath;
    routes?: EvacuationPath[];
    requestId?: string;
    buildingId?: string;
    timestamp: number;
    deviceId: string;
  };
}

export interface ConnectedPeer {
  id: string;
  peer: Peer.Instance;
  buildingId: string;
  lastSeen: number;
}

class P2PEvacuationService {
  private peers: Map<string, ConnectedPeer> = new Map();
  private signalingSocket: WebSocket | null = null;
  private deviceId: string;
  private buildingId: string;
  private onRouteReceivedCallbacks: ((route: EvacuationPath) => void)[] = [];
  private onPeerConnectedCallbacks: ((peerId: string) => void)[] = [];
  private onPeerDisconnectedCallbacks: ((peerId: string) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.buildingId = this.getBuildingId();
  }

  private generateDeviceId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getBuildingId(): string {
    // In a real app, this would come from GPS, WiFi network, or user selection
    return localStorage.getItem('buildingId') || 'default-building';
  }

  private createSignalingSocket(): void {
    const wsUrl = import.meta.env.VITE_P2P_SIGNALING_URL || 'ws://localhost:5001';
    this.signalingSocket = new WebSocket(`${wsUrl}/p2p-signaling`);

    this.signalingSocket.onopen = () => {
      console.log('P2P signaling connected');
      this.broadcastDiscovery();
    };

    this.signalingSocket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      } catch (error) {
        console.error('Failed to parse signaling message:', error);
      }
    };

    this.signalingSocket.onerror = (error) => {
      console.error('Signaling socket error:', error);
    };

    this.signalingSocket.onclose = () => {
      console.log('Signaling socket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.createSignalingSocket(), 3000);
    };
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    const { type, from, to, payload } = message;

    if (to !== this.deviceId) return;

    switch (type) {
      case 'offer':
        await this.handleOffer(from, payload);
        break;
      case 'answer':
        await this.handleAnswer(from, payload);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(from, payload);
        break;
      case 'discovery':
        if (from !== this.deviceId && payload.buildingId === this.buildingId) {
          await this.connectToPeer(from);
        }
        break;
    }
  }

  private async handleOffer(from: string, offer: RTCIceCandidateInit): Promise<void> {
    const peer = new Peer({ initiator: false, trickle: false });
    
    peer.on('signal', (data) => {
      this.sendSignalingMessage(from, 'answer', data);
    });

    peer.on('connect', () => {
      console.log('P2P connection established with:', from);
      this.addPeer(from, peer);
    });

    peer.on('data', (data) => {
      this.handlePeerMessage(from, data);
    });

    peer.on('close', () => {
      this.removePeer(from);
    });

    peer.on('error', (error) => {
      console.error('P2P error with peer', from, error);
      this.removePeer(from);
    });

    peer.signal(offer);
  }

  private async handleAnswer(from: string, answer: RTCIceCandidateInit): Promise<void> {
    const peerData = this.peers.get(from);
    if (peerData) {
      peerData.peer.signal(answer);
    }
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerData = this.peers.get(from);
    if (peerData) {
      peerData.peer.signal(candidate);
    }
  }

  private async connectToPeer(peerId: string): Promise<void> {
    if (this.peers.has(peerId)) return;

    const peer = new Peer({ initiator: true, trickle: false });

    peer.on('signal', (data) => {
      this.sendSignalingMessage(peerId, 'offer', data);
    });

    peer.on('connect', () => {
      console.log('P2P connection established with:', peerId);
      this.addPeer(peerId, peer);
    });

    peer.on('data', (data) => {
      this.handlePeerMessage(peerId, data);
    });

    peer.on('close', () => {
      this.removePeer(peerId);
    });

    peer.on('error', (error) => {
      console.error('P2P error with peer', peerId, error);
      this.removePeer(peerId);
    });

    // Add temporary peer data to track connection attempt
    this.peers.set(peerId, {
      id: peerId,
      peer,
      buildingId: this.buildingId,
      lastSeen: Date.now()
    });
  }

  private addPeer(peerId: string, peer: Peer.Instance): void {
    const existingPeer = this.peers.get(peerId);
    if (existingPeer) {
      existingPeer.peer = peer;
      existingPeer.lastSeen = Date.now();
    } else {
      this.peers.set(peerId, {
        id: peerId,
        peer,
        buildingId: this.buildingId,
        lastSeen: Date.now()
      });
    }

    this.onPeerConnectedCallbacks.forEach(callback => callback(peerId));
    
    // Request available routes from new peer
    this.requestRoutes(peerId);
  }

  private removePeer(peerId: string): void {
    const peerData = this.peers.get(peerId);
    if (peerData) {
      peerData.peer.destroy();
      this.peers.delete(peerId);
      this.onPeerDisconnectedCallbacks.forEach(callback => callback(peerId));
    }
  }

  private handlePeerMessage(peerId: string, data: Buffer): void {
    try {
      const message: P2PRouteMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'route_share':
          if (message.payload.route) {
            this.onRouteReceivedCallbacks.forEach(callback => 
              callback(message.payload.route!)
            );
          }
          break;
        case 'route_discovery':
          if (message.payload.routes) {
            message.payload.routes.forEach(route => {
              this.onRouteReceivedCallbacks.forEach(callback => callback(route));
            });
          }
          break;
        case 'route_request':
          // Share our available routes with requesting peer
          this.shareRoutesWithPeer(peerId);
          break;
      }
    } catch (error) {
      console.error('Failed to handle peer message:', error);
    }
  }

  private sendSignalingMessage(to: string, type: string, payload: any): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type,
        from: this.deviceId,
        to,
        payload
      }));
    }
  }

  private broadcastDiscovery(): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type: 'discovery',
        from: this.deviceId,
        payload: {
          buildingId: this.buildingId,
          timestamp: Date.now()
        }
      }));
    }
  }

  private broadcastToPeers(message: P2PRouteMessage): void {
    const messageStr = JSON.stringify(message);
    this.peers.forEach(peerData => {
      if (peerData.peer.connected) {
        peerData.peer.send(messageStr);
      }
    });
  }

  private requestRoutes(peerId: string): void {
    const message: P2PRouteMessage = {
      type: 'route_request',
      payload: {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        deviceId: this.deviceId
      }
    };

    const peerData = this.peers.get(peerId);
    if (peerData && peerData.peer.connected) {
      peerData.peer.send(JSON.stringify(message));
    }
  }

  private shareRoutesWithPeer(peerId: string): void {
    // This will be implemented when we have routes to share
    // For now, we'll share mock data
    const mockRoutes: EvacuationPath[] = [
      {
        id: 'p2p-route-1',
        name: 'Emergency Exit A',
        from_zone: 'Zone 1',
        to_zone: 'Assembly Point North',
        status: 'clear',
        estimated_seconds: 180,
        steps: ['Exit through main entrance', 'Turn left', 'Proceed to assembly point'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const message: P2PRouteMessage = {
      type: 'route_discovery',
      payload: {
        routes: mockRoutes,
        timestamp: Date.now(),
        deviceId: this.deviceId
      }
    };

    const peerData = this.peers.get(peerId);
    if (peerData && peerData.peer.connected) {
      peerData.peer.send(JSON.stringify(message));
    }
  }

  public initialize(): void {
    if (this.isInitialized) return;

    this.createSignalingSocket();
    this.isInitialized = true;

    // Periodically broadcast discovery to find new peers
    setInterval(() => {
      this.broadcastDiscovery();
    }, 30000); // Every 30 seconds

    // Clean up inactive peers
    setInterval(() => {
      const now = Date.now();
      this.peers.forEach((peerData, peerId) => {
        if (now - peerData.lastSeen > 60000) { // 1 minute timeout
          this.removePeer(peerId);
        }
      });
    }, 30000);
  }

  public shareRoute(route: EvacuationPath): void {
    const message: P2PRouteMessage = {
      type: 'route_share',
      payload: {
        route,
        timestamp: Date.now(),
        deviceId: this.deviceId
      }
    };

    this.broadcastToPeers(message);
  }

  public shareRoutes(routes: EvacuationPath[]): void {
    const message: P2PRouteMessage = {
      type: 'route_discovery',
      payload: {
        routes,
        timestamp: Date.now(),
        deviceId: this.deviceId
      }
    };

    this.broadcastToPeers(message);
  }

  public onRouteReceived(callback: (route: EvacuationPath) => void): void {
    this.onRouteReceivedCallbacks.push(callback);
  }

  public onPeerConnected(callback: (peerId: string) => void): void {
    this.onPeerConnectedCallbacks.push(callback);
  }

  public onPeerDisconnected(callback: (peerId: string) => void): void {
    this.onPeerDisconnectedCallbacks.push(callback);
  }

  public getConnectedPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  public getPeerCount(): number {
    return this.peers.size;
  }

  public setBuildingId(buildingId: string): void {
    this.buildingId = buildingId;
    localStorage.setItem('buildingId', buildingId);
    this.broadcastDiscovery();
  }

  public destroy(): void {
    this.peers.forEach(peerData => {
      peerData.peer.destroy();
    });
    this.peers.clear();

    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    this.isInitialized = false;
  }
}

export const p2pEvacuationService = new P2PEvacuationService();
