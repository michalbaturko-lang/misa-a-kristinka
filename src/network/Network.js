import { io } from 'socket.io-client';
import { EVENTS } from '../utils/constants.js';

/**
 * Network - Socket.io client for multiplayer
 */
export class Network {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.roomCode = null;
    this.callbacks = new Map();
    this.lastSendTime = 0;
    this.sendInterval = 50; // ms between position updates
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        reject(err);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
      });

      // Setup all event listeners
      this.setupListeners();
    });
  }

  setupListeners() {
    const events = [
      'room:created', 'room:state', 'room:error',
      'game:start', 'player:move', 'player:leave',
      'world:change', 'puzzle:start', 'puzzle:progress',
      'puzzle:complete', 'block:change', 'interact',
      'celebration',
    ];

    for (const event of events) {
      this.socket.on(event, (data) => {
        const callback = this.callbacks.get(event);
        if (callback) callback(data);
      });
    }
  }

  on(event, callback) {
    this.callbacks.set(event, callback);
  }

  createRoom(role, playerName) {
    this.socket.emit(EVENTS.ROOM_CREATE, { role, playerName });
  }

  joinRoom(roomCode, role, playerName) {
    this.socket.emit(EVENTS.ROOM_JOIN, { roomCode: roomCode.toUpperCase(), role, playerName });
  }

  sendPosition(position, rotation) {
    const now = performance.now();
    if (now - this.lastSendTime < this.sendInterval) return;
    this.lastSendTime = now;

    this.socket.emit(EVENTS.PLAYER_MOVE, { position, rotation });
  }

  sendWorldChange(world) {
    this.socket.emit(EVENTS.WORLD_CHANGE, { world });
  }

  sendPuzzleStart(puzzleId) {
    this.socket.emit(EVENTS.PUZZLE_START, { puzzleId });
  }

  sendPuzzleProgress(puzzleId, progress, role) {
    this.socket.emit(EVENTS.PUZZLE_PROGRESS, { puzzleId, progress, role });
  }

  sendPuzzleComplete(puzzleId) {
    this.socket.emit(EVENTS.PUZZLE_COMPLETE, { puzzleId });
  }

  sendBlockChange(position, blockType) {
    this.socket.emit(EVENTS.BLOCK_CHANGE, { position, blockType });
  }

  sendInteract(objectId, data) {
    this.socket.emit(EVENTS.INTERACT, { objectId, data });
  }

  getSocketId() {
    return this.socket?.id;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
