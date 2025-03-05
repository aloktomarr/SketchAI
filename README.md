# Sketch + Skribble

A real-time collaborative drawing platform word-guessing game mode. Inspired by Excalidraw and Skribble.io, this full-stack application demonstrates advanced WebSocket implementation, real-time data synchronization, and interactive canvas manipulation.

## 🌟 Live Demo

Experience the application live: [SketchSkribble on Vercel](https://sketchskribb.vercel.app)

## 📓 Features 

### Drawing Tools
- 🖌️ Real-time collaborative drawing with synchronized canvas
- 🎨 Multiple color options and adjustable brush sizes
- ↩️ Undo/Redo functionality with state management
- 📷 Export creations in multiple formats (PNG, JPEG)

### Multiplayer Collaboration
- 👥 WebSocket-powered room creation and joining system
- 💬 Real-time chat with message synchronization
- 👁️ Live cursor tracking and drawing visualization
- 🔒 Room-based isolation for multiple concurrent sessions

### Skribble Game Mode
- 🎮 Turn-based word-guessing gameplay similar to Pictionary
- 🎯 Role-based mechanics (drawer vs. guessers)
- 🏆 Real-time scoring system with progressive points
- 🔤 Difficulty-based word selection
- 💡 Timed hint system with progressive word reveals

### Technical Implementation
- 📱 Responsive design with mobile and desktop support
- 🚀 Optimized WebSocket connections with fallback mechanisms
- 🌈 Clean, intuitive UI with accessibility considerations
- 🔄 Efficient state synchronization across clients

## 💻 Tech Stack 

### Frontend
- **Framework**: Next.js with React
- **State Management**: Redux Toolkit
- **Canvas Manipulation**: HTML5 Canvas API
- **Styling**: CSS Modules with responsive design
- **Real-time Communication**: Socket.IO client

### Backend
- **Server**: Node.js with Express
- **WebSocket Implementation**: Socket.IO
- **Deployment**: Serverless architecture on Render
- **Game Logic**: Custom state machine implementation

### DevOps
- **CI/CD**: Automated deployment via GitHub integration
- **Frontend Hosting**: Vercel with serverless functions
- **Backend Hosting**: Render with auto-scaling
- **Environment Management**: Cross-environment configuration

## 🎮 How to Play

1. **Create or Join a Room**: Enter your name and either create a new room or join an existing one
2. **Invite Friends**: Share the generated room link with friends
3. **Start the Game**: Once all players have joined, click "Start Game"
4. **Drawing Phase**: 
   - The selected player chooses a word from three difficulty levels
   - They have limited time to draw the word
   - Other players try to guess the word in the chat
5. **Guessing Phase**:
   - Type guesses in the chat
   - Earn points for correct guesses (faster guesses = more points)
   - Word hints are revealed as time passes
6. **Rounds**: Each player gets a turn to draw
7. **Winner**: The player with the most points at the end wins!

## ⚙️ Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/SketchSkribble.git

# Navigate to the project directory
cd SketchSkribble

# Install dependencies
npm install

# Create a .env.local file with:
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Start the development server
npm run dev

# In a separate terminal, start the backend server
node server.js

# Open http://localhost:3000 in your browser
```

## 🏗️ Architecture

The application follows a client-server architecture with real-time communication:

```
┌─────────────┐       WebSockets       ┌─────────────┐
│             │◄────────────────────►  │             │
│  Next.js    │                        │  Node.js    │
│  Frontend   │      HTTP/REST         │  Backend    │
│             │◄────────────────────►  │             │
└─────────────┘                        └─────────────┘
       ▲                                      ▲
       │                                      │
       │                                      │
       ▼                                      ▼
┌─────────────┐                        ┌─────────────┐
│  Browser    │                        │  In-Memory  │
│  Canvas API │                        │  Data Store │
└─────────────┘                        └─────────────┘
```

## 🚀 Deployment

The application is deployed using a modern cloud architecture:

- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Render (Node.js service)
- **Communication**: WebSockets with fallback to HTTP long-polling
- **Scaling**: Auto-scaling based on demand

## 🧠 Technical Challenges Solved

- **Real-time Synchronization**: Implemented efficient drawing data transmission to minimize latency
- **State Management**: Created a robust state machine for game progression
- **Canvas Performance**: Optimized rendering for smooth drawing experience
- **Cross-Browser Compatibility**: Ensured consistent behavior across different browsers
- **Mobile Support**: Adapted canvas interactions for touch devices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


