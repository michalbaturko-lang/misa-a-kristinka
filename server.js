import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT || 3001;

async function start() {
  const app = express();
  const httpServer = createServer(app);

  // Setup Vite in middleware mode for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Game rooms storage
  const rooms = new Map();

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    let currentRoom = null;

    // Create room
    socket.on('room:create', ({ role, playerName }) => {
      const roomCode = generateRoomCode();
      const room = {
        code: roomCode,
        players: new Map(),
        puzzleStates: new Map(),
        currentWorld: 'hub',
        stars: 0,
        completedPuzzles: new Set(),
      };
      room.players.set(socket.id, {
        id: socket.id,
        role,
        name: playerName,
        position: { x: 0, y: 10, z: 0 },
        rotation: { y: 0 },
        ready: false,
      });
      rooms.set(roomCode, room);
      currentRoom = roomCode;
      socket.join(roomCode);

      socket.emit('room:created', { roomCode });
      console.log(`Room ${roomCode} created by ${playerName} (${role})`);
    });

    // Join room
    socket.on('room:join', ({ roomCode, role, playerName }) => {
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit('room:error', { message: 'Místnost neexistuje' });
        return;
      }
      if (room.players.size >= 2) {
        socket.emit('room:error', { message: 'Místnost je plná' });
        return;
      }
      // Check if role is taken
      for (const [, player] of room.players) {
        if (player.role === role) {
          socket.emit('room:error', { message: `Postava ${role === 'mathematician' ? 'Míša' : 'Kristinka'} je už zabraná. Vyber si druhou!` });
          return;
        }
      }

      room.players.set(socket.id, {
        id: socket.id,
        role,
        name: playerName,
        position: { x: 2, y: 10, z: 0 },
        rotation: { y: 0 },
        ready: false,
      });
      currentRoom = roomCode;
      socket.join(roomCode);

      // Notify all players in room
      const playersArray = Array.from(room.players.values());
      io.to(roomCode).emit('room:state', {
        players: playersArray,
        currentWorld: room.currentWorld,
        stars: room.stars,
      });

      // Auto-start game when 2 players
      if (room.players.size === 2) {
        setTimeout(() => {
          io.to(roomCode).emit('game:start', {
            players: Array.from(room.players.values()),
            world: 'hub',
          });
        }, 1500);
      }

      console.log(`${playerName} (${role}) joined room ${roomCode}`);
    });

    // Player movement
    socket.on('player:move', (data) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (player) {
        player.position = data.position;
        player.rotation = data.rotation;
        socket.to(currentRoom).emit('player:move', {
          id: socket.id,
          position: data.position,
          rotation: data.rotation,
        });
      }
    });

    // World change (through portal)
    socket.on('world:change', ({ world }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      room.currentWorld = world;
      io.to(currentRoom).emit('world:change', { world });
      console.log(`Room ${currentRoom} changed to world: ${world}`);
    });

    // Puzzle interaction
    socket.on('puzzle:start', ({ puzzleId }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('puzzle:start', {
        puzzleId,
        playerId: socket.id,
      });
    });

    socket.on('puzzle:progress', ({ puzzleId, progress, role }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;

      if (!room.puzzleStates.has(puzzleId)) {
        room.puzzleStates.set(puzzleId, {});
      }
      const puzzleState = room.puzzleStates.get(puzzleId);
      puzzleState[role] = progress;

      io.to(currentRoom).emit('puzzle:progress', {
        puzzleId,
        state: puzzleState,
      });
    });

    socket.on('puzzle:complete', ({ puzzleId }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;

      if (!room.completedPuzzles.has(puzzleId)) {
        room.completedPuzzles.add(puzzleId);
        room.stars += 1;
        io.to(currentRoom).emit('puzzle:complete', {
          puzzleId,
          stars: room.stars,
        });
        io.to(currentRoom).emit('celebration', {
          title: 'Skvělá práce!',
          text: 'Vyřešili jste hádanku společně!',
        });
      }
    });

    // Block change (for creative puzzles)
    socket.on('block:change', ({ position, blockType }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('block:change', {
        position,
        blockType,
        playerId: socket.id,
      });
    });

    // Interact with object
    socket.on('interact', ({ objectId, data }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('interact', {
        objectId,
        data,
        playerId: socket.id,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            rooms.delete(currentRoom);
            console.log(`Room ${currentRoom} deleted`);
          } else {
            io.to(currentRoom).emit('player:leave', { id: socket.id });
          }
        }
      }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   Míša & Kristinka - Dobrodruzi          ║
║   Server běží na http://localhost:${PORT}   ║
║                                          ║
║   Otevři na tabletu v prohlížeči!        ║
╚══════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);
