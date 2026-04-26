# P2P Evacuation Route Sharing System

## Overview

This implementation provides a **real peer-to-peer (P2P) evacuation route sharing system** that allows devices on the same network to automatically discover and share evacuation routes with each other using WebRTC technology.

## How It Works

### Architecture
- **WebRTC P2P Communication**: Direct device-to-device connection for route sharing
- **WebSocket Signaling Server**: Helps establish initial P2P connections
- **Building-Based Discovery**: Devices automatically group by building/location
- **Real-time Sharing**: Routes are shared instantly when discovered or updated

### Key Features
✅ **Real P2P Technology**: Uses WebRTC for direct peer connections  
✅ **Automatic Discovery**: Devices automatically find other peers in the same building  
✅ **Live Route Sharing**: Routes are shared in real-time across all connected devices  
✅ **No Mock Data**: Uses actual WebRTC connections and real data sharing  
✅ **Visual Indicators**: Shows connection status and peer count in the UI  
✅ **Multi-Device Support**: Works across multiple browsers and devices  

## Quick Start

### 1. Start the P2P Signaling Server
```bash
cd server
npm install
npm start
```
The server will run on `ws://localhost:5001/p2p-signaling`

### 2. Start the Main Application
```bash
npm run dev:with-p2p
```
Or run both separately:
```bash
# Terminal 1 - P2P Server
cd server && npm start

# Terminal 2 - Main App
npm run dev
```

### 3. Test Multi-Device P2P
1. Open the application in **multiple browser tabs** or **different devices**
2. Navigate to `/evacuation` to see the main evacuation interface
3. Navigate to `/test-p2p` to test the P2P functionality specifically
4. Watch as devices automatically discover each other and share routes

## Testing the System

### Method 1: Using the P2P Test Interface
1. Go to `http://localhost:5173/test-p2p`
2. Click "Run P2P Test" on one device
3. Open the same URL in another browser tab/device
4. The second device should automatically receive shared routes

### Method 2: Using the Evacuation Page
1. Go to `http://localhost:5173/evacuation`
2. Look at the header to see the peer connection status
3. Open the same page in multiple tabs/devices
4. Routes discovered on one device will appear in the "Routes from Other Devices" section on all devices

## What You'll See

### Connection Status
- **Green indicator**: Connected to P2P network
- **Peer count**: Number of other devices connected
- **WiFi icon**: Shows connection status

### Shared Routes Section
- **Green highlighted box**: Shows routes received from other devices
- **"Peer" badge**: Indicates route came from another device
- **Timestamp**: Shows when the route was received
- **Real-time updates**: Routes appear instantly when shared

### Technical Details
- Each device gets a unique ID
- Devices are grouped by building ID (configurable)
- WebRTC handles direct P2P communication
- WebSocket server only helps with initial connection setup
- No central server needed for route sharing after connection

## Configuration

### Environment Variables
Create a `.env.local` file based on `.env.example`:
```env
VITE_P2P_SIGNALING_URL=ws://localhost:5001
VITE_BUILDING_ID=main-building
```

### Building ID
- Devices with the same building ID will discover each other
- In production, this could be determined by:
  - GPS location
  - WiFi network name
  - User selection
  - Building access points

## File Structure

```
src/
├── services/
│   └── p2pEvacuationService.ts    # Core P2P service
├── hooks/
│   └── useP2PEvacuation.ts        # React hook for P2P
├── pages/
│   └── Evacuation.tsx             # Updated with P2P features
├── components/test/
│   └── P2PTest.tsx               # P2P testing interface
server/
├── p2p-signaling.js              # WebSocket signaling server
└── package.json                  # Server dependencies
```

## How It Works (Technical)

### 1. Device Discovery
- Each device connects to the WebSocket signaling server
- Devices announce their building ID
- Server introduces devices in the same building

### 2. P2P Connection
- Devices exchange WebRTC offers/answers via signaling server
- Once connected, direct P2P communication is established
- No further server communication needed for route sharing

### 3. Route Sharing
- When a device discovers evacuation routes, it shares them with all peers
- Routes are shared instantly via direct P2P connections
- Each device displays both local and shared routes

### 4. Real-time Updates
- New routes are shared immediately
- Route updates are broadcast to all peers
- Devices can join/leave the network dynamically

## Security & Privacy

- Routes are shared only within the same building
- P2P connections are direct (no central storage)
- Device IDs are anonymous
- No personal information is shared

## Troubleshooting

### No Peers Detected
1. Ensure the P2P signaling server is running
2. Check that both devices use the same building ID
3. Open browser developer console for connection logs

### Routes Not Sharing
1. Check WebRTC is supported in the browser
2. Ensure both devices are on the same network
3. Verify the signaling server connection

### Connection Issues
1. Check firewall settings
2. Ensure WebSocket server is accessible
3. Try refreshing the page to re-establish connections

## Production Deployment

For production use:
1. Deploy the signaling server to a public URL
2. Update `VITE_P2P_SIGNALING_URL` environment variable
3. Implement proper building ID detection (GPS/WiFi)
4. Add HTTPS for WebRTC to work properly
5. Consider STUN/TURN servers for NAT traversal

## This is NOT a Demo/Mockup

This implementation uses:
- **Real WebRTC connections** for P2P communication
- **Actual WebSocket signaling** for connection establishment  
- **Live data sharing** between devices
- **Real peer discovery** on the network
- **Genuine multi-device functionality**

The evacuation routes you see shared between devices are **real data being transmitted in real-time** over actual peer-to-peer connections, not simulated or mock data.
