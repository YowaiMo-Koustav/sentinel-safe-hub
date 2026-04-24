# Project Sentinel Hackathon Demo Guide

## Overview
This guide demonstrates the complete Project Sentinel ecosystem with all core features implemented according to the directive:
- **Edge AI Detection**: Computer vision, thermal imaging, acoustic detection
- **Self-Healing Mesh Network**: Peer-to-peer communication without internet
- **Dynamic Spatial Routing**: Real-time evacuation path updates
- **First Responder Intelligence**: Automated incident creation and tracking

## Demo Setup Instructions

### 1. Launch the Application
```bash
npm run dev
```
Navigate to: `http://localhost:8080`

### 2. Login as Staff
- Use any credentials (username/password)
- Select "Staff" role to access the full dashboard

## Core Feature Demonstrations

### Feature 1: Edge AI Detection (The Eyes and Ears)

**Objective**: Show AI recognizing threats via webcam and microphone.

**Steps**:
1. **Navigate to Staff Dashboard** - You'll see the enhanced Sentinel interface
2. **Start AI Monitoring** - Click "Start Monitoring" in the AI Detection panel
3. **Grant Permissions** - Allow camera and microphone access
4. **Simulate Threats**:
   - **Visual**: Show fire/smoke images or bright objects to camera
   - **Acoustic**: Make loud noises (clap, shatter glass sound)
5. **Observe Results**:
   - Real-time threat detection alerts
   - Confidence percentages
   - Automatic incident creation in the system

**Expected Results**:
- Visual threats appear as red "Visual Threat!" alerts
- Acoustic threats appear as yellow "Acoustic Threat!" alerts
- Incidents automatically appear in the incident list below
- AI model status shows "Active"

### Feature 2: Self-Healing Mesh Network (The Spinal Cord)

**Objective**: Demonstrate peer-to-peer communication without internet.

**Steps**:
1. **Open Two Browser Tabs** - Both with the Sentinel dashboard
2. **Create Peer Connection**:
   - In Tab 1: Click "Create Peer" 
   - Copy the signal data that appears
3. **Connect Peers**:
   - In Tab 2: Paste the signal data and click "Connect"
4. **Test Communication**:
   - Send test messages between tabs
   - Click "Test SOS" to simulate emergency
5. **Observe Results**:
   - Messages appear in both tabs
   - SOS creates incidents automatically
   - Network status shows "Connected" with peer count

**Expected Results**:
- Peer connections established without central server
- Messages route through mesh network
- SOS signals trigger automatic incident creation
- Network resilience demonstrated

### Feature 3: Dynamic Spatial Routing (The Reflexes)

**Objective**: Show evacuation routes updating based on threats.

**Steps**:
1. **Trigger an Incident**:
   - Use AI detection to create a fire incident
   - Or use sensor simulation "Fire Test" button
2. **Observe Route Changes**:
   - Navigate to Dynamic Routing panel
   - Select the affected zone (e.g., "Tower A · Lobby")
3. **Analyze Route Updates**:
   - Routes through danger zones show "Dangerous" status
   - Alternative safe routes are highlighted
   - Safety scores update in real-time

**Expected Results**:
- Routes through incident zones marked as unsafe
- Alternative paths automatically recommended
- Safety scores reflect current threat levels
- Estimated times adjust for hazards

### Feature 4: First Responder Intelligence (The Command Center)

**Objective**: Demonstrate automated incident management and tracking.

**Steps**:
1. **Create Multiple Incidents**:
   - AI detection creates visual incidents
   - Sensor simulation creates fire incidents  
   - Mesh network creates SOS incidents
2. **Monitor Incident Dashboard**:
   - Watch incidents appear in real-time
   - Observe automatic severity assignment
   - Track incident status progression
3. **Test Response Workflow**:
   - Click "Acknowledge" on new incidents
   - Click "Take ownership" to assign
   - Click "Resolve" to close incidents

**Expected Results**:
- All incident sources (AI, sensors, mesh) create unified incidents
- Automatic severity based on confidence levels
- Complete incident lifecycle management
- Real-time updates across all connected users

## Advanced Demonstration Scenarios

### Scenario 1: Complete Crisis Response Flow

**Objective**: Show end-to-end crisis response from detection to resolution.

**Steps**:
1. **Detection Phase**:
   - Start AI monitoring
   - Simulate fire with bright light/loud noise
   - Observe automatic incident creation
2. **Network Communication**:
   - Send SOS through mesh network
   - Verify message routing to all peers
3. **Dynamic Response**:
   - Check evacuation routing updates
   - Verify unsafe path blocking
4. **Resolution**:
   - Assign incident to responder
   - Mark as resolved
   - Observe route restoration

### Scenario 2: Multi-Device Coordination

**Objective**: Demonstrate system working across multiple devices.

**Setup**:
- 3+ browser tabs or devices
- All logged into Sentinel dashboard

**Steps**:
1. **Establish Mesh Network** between all devices
2. **Create Incident** on one device
3. **Observe Synchronization** across all devices
4. **Test Collaborative Response**:
   - Different users handle different incidents
   - Real-time status updates
   - Coordinated evacuation routing

## Technical Validation Points

### Edge AI Validation
- [x] TensorFlow.js model loads successfully
- [x] Real-time video analysis working
- [x] Acoustic frequency detection active
- [x] Thermal simulation functional
- [x] Automatic incident creation from detections

### Mesh Network Validation  
- [x] WebRTC peer connections established
- [x] Message routing without central server
- [x] SOS signal propagation
- [x] Network resilience testing
- [x] Multi-hop message forwarding

### Dynamic Routing Validation
- [x] Real-time hazard zone calculation
- [x] Safety score algorithm working
- [x] Route blocking based on incidents
- [x] Alternative path generation
- [x] Time estimation adjustments

### System Integration Validation
- [x] All components integrated in dashboard
- [x] Real-time data synchronization
- [x] Cross-component communication
- [x] End-to-end workflow testing
- [x] Multi-user coordination

## Hackathon Presentation Tips

### Key Demo Points to Emphasize
1. **Autonomous Detection**: No human intervention required
2. **Offline Capability**: Works without internet infrastructure
3. **Real-time Adaptation**: System responds instantly to changing conditions
4. **Scalable Architecture**: Can handle venue of any size
5. **Privacy Protection**: All processing happens locally

### Technical Innovation Highlights
- **Edge Computing**: AI runs on device, not in cloud
- **Self-Healing Network**: No single point of failure
- **Dynamic Routing**: Algorithms optimize for safety, not just distance
- **Multi-Modal Detection**: Combines visual, acoustic, and thermal data
- **Automated Response**: Reduces human response time from minutes to seconds

### Real-World Impact
- **Saves Lives**: Faster detection and response
- **Reduces Panic**: Clear, intelligent guidance
- **Protects First Responders**: Better situational awareness
- **Minimizes Disruption**: Targeted, efficient evacuations
- **Scales Globally**: Works in any venue worldwide

## Troubleshooting Common Issues

### Camera/Microphone Access
- Ensure browser permissions granted
- Use HTTPS for camera access
- Check device settings

### Mesh Network Connection
- Copy/paste signal data exactly
- Ensure both tabs have network access
- Try refreshing if connection fails

### AI Model Loading
- Wait for model to fully load
- Check browser console for errors
- Refresh page if needed

### Dynamic Routing Updates
- Ensure incidents are created first
- Check zone selection matches incident location
- Verify sensor simulation is running

## Success Metrics for Demo

### Technical Metrics
- AI detection latency: < 3 seconds
- Mesh network setup: < 30 seconds  
- Route calculation: < 1 second
- Incident creation: < 2 seconds

### User Experience Metrics
- Intuitive interface requiring minimal training
- Clear visual feedback for all actions
- Seamless multi-device coordination
- Reliable offline functionality

### Innovation Metrics
- Demonstrates clear advancement over traditional systems
- Shows practical application of cutting-edge technology
- Provides compelling solution to real-world problem
- Exhibits potential for global scalability

---

**Remember**: The goal is to show a complete, working ecosystem that transforms a passive venue into an active, living nervous system that saves lives.
