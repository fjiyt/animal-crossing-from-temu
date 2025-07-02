const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// 연결된 플레이어들 저장
const players = new Map();

// 캐릭터 이모지 리스트
const characterEmojis = ['🧚‍♀️', '🧚‍♂️', '👨‍🌾', '👩‍🌾', '🧙‍♀️', '🧙‍♂️', '👨‍🎨', '👩‍🎨', '🧝‍♀️', '🧝‍♂️', '👨‍💼', '👩‍💼'];

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log(`사용자 연결: ${socket.id}`);

    // 플레이어 로그인
    socket.on('playerLogin', (playerData) => {
        const player = {
            id: socket.id,
            username: playerData.username,
            emoji: playerData.emoji,
            x: 300,
            y: 300,
            lastUpdate: Date.now()
        };
        
        players.set(socket.id, player);
        
        // 새 플레이어에게 기존 플레이어들 정보 전송
        socket.emit('existingPlayers', Array.from(players.values()));
        
        // 다른 플레이어들에게 새 플레이어 알림
        socket.broadcast.emit('newPlayer', player);
        
        console.log(`플레이어 로그인: ${player.username} (${player.emoji})`);
    });

    // 플레이어 위치 업데이트
    socket.on('playerMove', (moveData) => {
        const player = players.get(socket.id);
        if (player) {
            player.x = moveData.x;
            player.y = moveData.y;
            player.lastUpdate = Date.now();
            
            // 다른 플레이어들에게 위치 업데이트 브로드캐스트
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: player.x,
                y: player.y
            });
        }
    });

    // 채팅 메시지
    socket.on('chatMessage', (messageData) => {
        const player = players.get(socket.id);
        if (player) {
            const chatData = {
                playerId: socket.id,
                username: player.username,
                message: messageData.message,
                timestamp: Date.now()
            };
            
            // 모든 플레이어에게 채팅 메시지 브로드캐스트
            io.emit('newChatMessage', chatData);
            
            console.log(`채팅: ${player.username}: ${messageData.message}`);
        }
    });

    // 플레이어 연결 해제
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`플레이어 연결 해제: ${player.username}`);
            players.delete(socket.id);
            
            // 다른 플레이어들에게 연결 해제 알림
            socket.broadcast.emit('playerDisconnected', socket.id);
        }
    });
});

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 랜덤 캐릭터 이모지 API
app.get('/api/random-character', (req, res) => {
    const randomEmoji = characterEmojis[Math.floor(Math.random() * characterEmojis.length)];
    res.json({ emoji: randomEmoji });
});

// 온라인 플레이어 수 API
app.get('/api/players/count', (req, res) => {
    res.json({ count: players.size });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 Animal Crossing 멀티플레이어 서버가 포트 ${PORT}에서 실행 중입니다!`);
    console.log(`📱 로컬 접속: http://localhost:${PORT}`);
});

// 비활성 플레이어 정리 (5분 간격)
setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5분
    
    for (const [playerId, player] of players.entries()) {
        if (now - player.lastUpdate > timeout) {
            console.log(`비활성 플레이어 제거: ${player.username}`);
            players.delete(playerId);
            io.emit('playerDisconnected', playerId);
        }
    }
}, 5 * 60 * 1000);