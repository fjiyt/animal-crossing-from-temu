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

    // 플레이어 간 개인 메시지
    socket.on('playerMessage', (messageData) => {
        const sender = players.get(socket.id);
        const recipient = players.get(messageData.targetPlayerId);
        
        if (sender && recipient) {
            // 받는 사람에게만 메시지 전송
            socket.to(messageData.targetPlayerId).emit('playerMessage', {
                senderName: sender.username,
                message: messageData.message,
                isOwn: false
            });
            
            console.log(`개인 메시지: ${sender.username} -> ${recipient.username}: ${messageData.message}`);
        }
    });

    // 선물 전송
    socket.on('sendGift', (giftData) => {
        const sender = players.get(socket.id);
        const recipient = players.get(giftData.targetPlayerId);
        
        if (sender && recipient) {
            const giftId = Date.now() + Math.random();
            
            // 받는 사람에게 선물 알림
            socket.to(giftData.targetPlayerId).emit('giftReceived', {
                giftId: giftId,
                senderId: socket.id,
                senderName: sender.username,
                itemKey: giftData.itemKey,
                itemName: giftData.itemName,
                itemEmoji: giftData.itemEmoji,
                amount: giftData.amount
            });
            
            console.log(`선물: ${sender.username} -> ${recipient.username}: ${giftData.itemName} ${giftData.amount}개`);
        }
    });

    // 선물 수락
    socket.on('acceptGift', (acceptData) => {
        const recipient = players.get(socket.id);
        const sender = players.get(acceptData.senderId);
        
        if (recipient && sender) {
            // 보낸 사람에게 선물이 수락되었음을 알림
            socket.to(acceptData.senderId).emit('giftConfirmed', {
                recipientName: recipient.username,
                itemName: acceptData.itemName || '아이템',
                amount: acceptData.amount || 1
            });
            
            console.log(`선물 수락: ${recipient.username}이 ${sender.username}의 선물을 받았습니다 (${acceptData.itemName} ${acceptData.amount}개)`);
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