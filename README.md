# Sketchbook + Skribble

A dynamic collaborative drawing platform with both free-form sketching and a fun word-guessing game mode, inspired by Excalidraw and Skribble.io.


## 📓 Features 

### Drawing Tools
- 🖌️ Draw lines, make doodles, and erase mistakes
- 🎨 Multiple color options and brush sizes
- ↩️ Undo and Redo support to correct or revert changes effortlessly
- 📷 Export your creations in multiple formats like PNG, JPEG, and more

### Collaboration
- 👥 Create or join rooms for real-time drawing with friends
- 💬 Real-time chat with other participants
- 👁️ See others' drawings as they happen

### Skribble Game Mode
- 🎮 Play a fun word-guessing game similar to Pictionary
- 🎯 Take turns drawing while others guess the word
- 🏆 Score points for correct guesses and successful drawings
- 🔤 Choose from words of varying difficulty
- 💡 Progressive word hints to help guessers

### User Experience
- 📱 Responsive design ensures compatibility with all screen sizes
- 🚀 Fast, real-time updates with minimal latency
- 🌈 Clean, intuitive interface

## 💻 Tech-Stack 
- **Frontend**: Next.js + Redux Toolkit + HTML5 Canvas
- **Real-time Collaboration**: WebSocket & Signaling via Socket.IO
- **Server**: Node.js + Express.js
- **State Management**: Redux for predictable state handling
- **Styling**: CSS Modules for component-scoped styling

## How to Play Skribble Mode

1. **Create or Join a Room**: Enter your name and either create a new room or join an existing one
2. **Start the Game**: Once all players have joined, click "Start Game"
3. **Drawing Phase**: 
   - The selected player chooses a word to draw
   - They have limited time to draw the word
   - Other players try to guess the word in the chat
4. **Guessing Phase**:
   - Type your guesses in the chat
   - Earn points for correct guesses (faster guesses = more points)
   - Word hints are revealed as time passes
5. **Rounds**: Each player gets a turn to draw
6. **Winner**: The player with the most points at the end wins!

## ⚙️ Installation 
To set up the project locally, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/aloktomarr/SketchAI.git
    ```

2. Navigate to the project directory:
    ```bash
    cd SketchAI
    ```

3. Install the required dependencies:
    ```bash
    npm install
    ```

4. Start the application:
    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

NEXT_PUBLIC_SOCKET_URL=https://sketchai-backend.onrender.com
