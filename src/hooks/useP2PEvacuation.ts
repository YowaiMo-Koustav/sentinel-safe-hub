import { useEffect, useState, useCallback } from 'react';
import { p2pEvacuationService, P2PRouteMessage, ConnectedPeer } from '@/services/p2pEvacuationService';
import { EvacuationPath } from '@/lib/api';

export interface P2PRouteInfo extends EvacuationPath {
  sourceDeviceId: string;
  sourceDeviceName?: string;
  isShared: boolean;
  receivedAt: number;
}

export function useP2PEvacuation(buildingId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [sharedRoutes, setSharedRoutes] = useState<P2PRouteInfo[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    // Initialize P2P service
    if (!isInitialized) {
      p2pEvacuationService.initialize();
      setIsInitialized(true);
      setIsConnected(true);
      setConnectionStatus('connected');

      if (buildingId) {
        p2pEvacuationService.setBuildingId(buildingId);
      }
    }

    return () => {
      // Cleanup on unmount
      p2pEvacuationService.destroy();
    };
  }, [buildingId, isInitialized]);

  useEffect(() => {
    // Listen for peer connections
    const handlePeerConnected = (peerId: string) => {
      setConnectedPeers(prev => [...prev, peerId]);
      console.log('Peer connected:', peerId);
    };

    const handlePeerDisconnected = (peerId: string) => {
      setConnectedPeers(prev => prev.filter(id => id !== peerId));
      console.log('Peer disconnected:', peerId);
    };

    const handleRouteReceived = (route: EvacuationPath) => {
      const p2pRoute: P2PRouteInfo = {
        ...route,
        sourceDeviceId: 'peer-device', // This would be enhanced to include actual device info
        isShared: true,
        receivedAt: Date.now()
      };
      
      setSharedRoutes(prev => {
        // Avoid duplicates
        const exists = prev.some(r => r.id === route.id && r.sourceDeviceId === p2pRoute.sourceDeviceId);
        if (!exists) {
          return [...prev, p2pRoute];
        }
        return prev;
      });
    };

    p2pEvacuationService.onPeerConnected(handlePeerConnected);
    p2pEvacuationService.onPeerDisconnected(handlePeerDisconnected);
    p2pEvacuationService.onRouteReceived(handleRouteReceived);

    return () => {
      // Cleanup listeners
    };
  }, []);

  const shareRoute = useCallback((route: EvacuationPath) => {
    p2pEvacuationService.shareRoute(route);
  }, []);

  const shareRoutes = useCallback((routes: EvacuationPath[]) => {
    p2pEvacuationService.shareRoutes(routes);
  }, []);

  const clearSharedRoutes = useCallback(() => {
    setSharedRoutes([]);
  }, []);

  const removeSharedRoute = useCallback((routeId: string) => {
    setSharedRoutes(prev => prev.filter(route => route.id !== routeId));
  }, []);

  return {
    isConnected,
    connectedPeers,
    sharedRoutes,
    peerCount: connectedPeers.length,
    connectionStatus,
    shareRoute,
    shareRoutes,
    clearSharedRoutes,
    removeSharedRoute,
    isInitialized
  };
}
