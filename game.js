class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 3;
        this.inventory = {
            fish: 0,
            wood: 0,
            carrot: 0,
            coin: 0,
            apple: 0,
            orange: 0
        };
        this.bankAccount = {
            balance: 0,
            lastInterestTime: Date.now(),
            interestRate: 0.05
        };
    }
    
    update(keys, canvasWidth, canvasHeight, fishingSpots = []) {
        const oldX = this.x;
        const oldY = this.y;
        
        if (keys['w']) this.y -= this.speed;
        if (keys['s']) this.y += this.speed;
        if (keys['a']) this.x -= this.speed;
        if (keys['d']) this.x += this.speed;
        
        // 연못 충돌 확인
        for (let spot of fishingSpots) {
            const dx = (this.x + this.width/2) - spot.x;
            const dy = (this.y + this.height/2) - spot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < spot.radius - 15) {
                this.x = oldX;
                this.y = oldY;
                break;
            }
        }
        
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
        
        this.calculateInterest();
    }
    
    calculateInterest() {
        const currentTime = Date.now();
        const timeElapsed = currentTime - this.bankAccount.lastInterestTime;
        const oneMinute = 60000;
        
        if (timeElapsed >= oneMinute && this.bankAccount.balance > 0) {
            const interest = Math.floor(this.bankAccount.balance * this.bankAccount.interestRate);
            this.bankAccount.balance += interest;
            this.bankAccount.lastInterestTime = currentTime;
        }
    }
    
    draw(ctx, emoji = '🧚‍♀️') {
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(emoji, this.x + this.width/2, this.y + this.height - 5);
    }
}

class Animal {
    constructor(x, y, name, emoji, dialogue) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.name = name;
        this.emoji = emoji;
        this.dialogue = dialogue;
        this.moveTimer = 0;
        this.direction = { x: 0, y: 0 };
    }
    
    update(canvasWidth, canvasHeight) {
        this.moveTimer++;
        if (this.moveTimer > 120) {
            this.direction.x = (Math.random() - 0.5) * 2;
            this.direction.y = (Math.random() - 0.5) * 2;
            this.moveTimer = 0;
        }
        
        this.x += this.direction.x * 0.5;
        this.y += this.direction.y * 0.5;
        
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }
    
    draw(ctx) {
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x + this.width/2, this.y + this.height - 5);
        
        ctx.fillStyle = '#8B4513';
        ctx.font = '12px Arial';
        ctx.fillText(this.name, this.x + this.width/2, this.y - 5);
    }
    
    isNearPlayer(player) {
        const distance = Math.sqrt(
            Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2)
        );
        return distance < 60;
    }
}

class FishingSpot {
    constructor(x, y, radius = 80) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.ripplePhase = 0;
    }
    
    update() {
        this.ripplePhase += 0.1;
    }
    
    draw(ctx) {
        // 연못
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 물결
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7 + Math.sin(this.ripplePhase) * 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // 물고기 추가
        const fishCount = 3;
        for (let i = 0; i < fishCount; i++) {
            const angle = (this.ripplePhase + i * 2) * 0.5;
            const fishX = this.x + Math.cos(angle) * (this.radius * 0.4);
            const fishY = this.y + Math.sin(angle) * (this.radius * 0.4);
            
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🐟', fishX, fishY);
        }
    }
    
    isNearPlayer(player) {
        const distance = Math.sqrt(
            Math.pow(this.x - (player.x + player.width/2), 2) + 
            Math.pow(this.y - (player.y + player.height/2), 2)
        );
        return distance < this.radius + 30;
    }
}

class BuildingSpot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 60;
        this.hasBuilding = false;
        this.buildingType = null;
    }
    
    draw(ctx) {
        if (this.hasBuilding) {
            if (this.buildingType === 'small') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, this.y + 20, this.width, this.height - 20);
                ctx.fillStyle = '#DC143C';
                ctx.fillRect(this.x - 10, this.y, this.width + 20, 30);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 30, this.y + 30, 20, 30);
            } else if (this.buildingType === 'big') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 20, this.y + 20, this.width + 40, this.height);
                ctx.fillStyle = '#DC143C';
                ctx.fillRect(this.x - 30, this.y, this.width + 60, 30);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 20, this.y + 30, 20, 30);
                ctx.fillRect(this.x + 50, this.y + 35, 15, 15);
            }
        } else {
            ctx.strokeStyle = '#8B4513';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#8B4513';
            ctx.font = '14px Arial';
            ctx.fillText('건설 가능', this.x + 10, this.y + 35);
        }
    }
    
    isNearPlayer(player) {
        return player.x < this.x + this.width + 20 &&
               player.x + player.width > this.x - 20 &&
               player.y < this.y + this.height + 20 &&
               player.y + player.height > this.y - 20;
    }
}

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.isChopped = false;
        this.hasFruit = Math.random() < 0.6;
        this.fruitType = Math.random() < 0.5 ? 'apple' : 'orange';
        this.fruitCount = this.hasFruit ? Math.floor(Math.random() * 3) + 1 : 0;
    }
    
    draw(ctx) {
        if (!this.isChopped) {
            // 나무 기둥
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 15, this.y + 30, 10, 30);
            
            // 나무 잎
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 20, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // 열매
            if (this.hasFruit && this.fruitCount > 0) {
                ctx.font = '16px Arial';
                const fruit = this.fruitType === 'apple' ? '🍎' : '🍊';
                for (let i = 0; i < this.fruitCount; i++) {
                    const angle = (i / this.fruitCount) * Math.PI * 2;
                    const fruitX = this.x + 20 + Math.cos(angle) * 15;
                    const fruitY = this.y + 20 + Math.sin(angle) * 15;
                    ctx.fillText(fruit, fruitX - 8, fruitY + 8);
                }
            }
        } else {
            // 베인 나무 그루터기
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 10, this.y + 45, 20, 15);
        }
    }
    
    isNearPlayer(player) {
        const distance = Math.sqrt(
            Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2)
        );
        return distance < 70;
    }
    
    chopDown() {
        if (!this.isChopped) {
            this.isChopped = true;
            this.hasFruit = false;
            this.fruitCount = 0;
            return 2;
        }
        return 0;
    }
    
    harvestFruit() {
        if (this.hasFruit && this.fruitCount > 0) {
            const harvested = this.fruitCount;
            this.fruitCount = 0;
            this.hasFruit = false;
            return { count: harvested, type: this.fruitType };
        }
        return { count: 0, type: null };
    }
}

class Game {
    constructor() {
        this.player = new Player(100, 400);
        
        // 멀티플레이어 관련 변수
        this.otherPlayers = new Map();
        this.currentPlayer = null;
        this.socket = null;
        this.lastPositionUpdate = 0;
        this.animals = [
            new Animal(300, 300, '강아지', '🐕', [
                '멍멍! 반가워!',
                '산책하기 좋은 날이야!',
                '공 던져줄래?',
                '주인님 어디 갔을까...',
                '수학 문제를 풀어볼까? 나무를 줄게!'
            ]),
            new Animal(500, 350, '고양이', '🐱', [
                '야옹~ 안녕!',
                '나는 햇볕 쬐는 걸 좋아해',
                '생선이 먹고 싶다냥...',
                '같이 놀까냥?',
                '상식 문제를 풀어볼까냥? 생선을 줄게!'
            ]),
            new Animal(700, 400, '토끼', '🐰', [
                '안녕! 나는 토끼야!',
                '오늘 날씨가 정말 좋지 않니?',
                '낚시를 해봤니? 정말 재미있어!',
                '우리 마을에 온 걸 환영해!',
                '과학 퀴즈를 풀어볼까? 당근을 줄게!'
            ]),
            new Animal(900, 300, '여우', '🦊', [
                '안녕! 나는 물물교환 상인이야!',
                '뭔가 바꾸고 싶은 게 있니?',
                '좋은 거래를 위해 왔어!',
                '서로 도움이 되는 교환을 해보자!'
            ]),
            new Animal(600, 350, '현자', '🧙‍♂️', [
                '안녕! 나는 지혜로운 현자야!',
                '무엇이든 물어보면 답해줄 수 있어!',
                '궁금한 게 있으면 언제든지 말해!',
                '함께 대화를 나눠보자!'
            ])
        ];
        this.fishingSpots = [
            new FishingSpot(200, 400, 70),
            new FishingSpot(800, 500, 60),
            new FishingSpot(600, 450, 85)
        ];
        this.buildingSpots = [
            new BuildingSpot(400, 500),
            new BuildingSpot(900, 450)
        ];
        this.trees = [
            new Tree(100, 250),
            new Tree(350, 200),
            new Tree(850, 350),
            new Tree(250, 580),
            new Tree(950, 450)
        ];
        this.shops = [
            { x: 1000, y: 250, width: 60, height: 60 }
        ];
        this.banks = [
            { x: 50, y: 300, width: 80, height: 70 }
        ];
        
        this.keys = {};
        this.currentDialog = null;
        this.isFishing = false;
        this.fishingProgress = 0;
        this.fishingTarget = 0;
        this.mathProblem = null;
        this.mathAnswer = 0;
        this.isMathActive = false;
        this.triviaData = null;
        this.isTriviaActive = false;
        this.riddleData = null;
        this.isRiddleActive = false;
        this.isShopActive = false;
        this.isTradeActive = false;
        this.currentTrade = null;
        this.isBankActive = false;
        this.isChatActive = false;
        this.chatHistory = [];
        
        this.setupEventListeners();
        this.initMultiplayerListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
            }
            
            if (this.currentDialog || this.isMathActive || this.isTriviaActive || this.isRiddleActive || this.isShopActive || this.isTradeActive || this.isChatActive) {
                if (e.key === 'Enter' && this.isMathActive) {
                    e.preventDefault();
                    this.checkMathAnswer();
                }
                if (e.key === 'Enter' && this.isRiddleActive) {
                    e.preventDefault();
                    this.checkRiddleAnswer();
                }
                if (e.key === 'Enter' && this.isChatActive) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
                return;
            }
            
            if (this.isFishing) {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.catchFish();
                }
                return;
            }
            
            if (e.key.toLowerCase() === 'e') {
                this.handleInteraction();
            }
            if (e.key.toLowerCase() === 'f') {
                this.harvestNearestTree();
            }
            if (e.key.toLowerCase() === 'c') {
                this.chopNearestTree();
            }
            if (e.key.toLowerCase() === 't') {
                if (typeof toggleMultiplayerChat !== 'undefined') {
                    toggleMultiplayerChat();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    initMultiplayerListeners() {
        // T키로 채팅 토글은 이미 setupEventListeners에서 처리
    }
    
    initMultiplayer() {
        // 멀티플레이어 초기화
        console.log('멀티플레이어 모드 활성화:', this.currentPlayer);
    }
    
    // 다른 플레이어들 업데이트
    updateOtherPlayers(players) {
        this.otherPlayers.clear();
        players.forEach(player => {
            this.otherPlayers.set(player.id, player);
        });
    }
    
    // 새 플레이어 추가
    addOtherPlayer(player) {
        this.otherPlayers.set(player.id, player);
        console.log('새 플레이어 입장:', player.username);
    }
    
    // 다른 플레이어 위치 업데이트
    updateOtherPlayerPosition(moveData) {
        const player = this.otherPlayers.get(moveData.id);
        if (player) {
            player.x = moveData.x;
            player.y = moveData.y;
        }
    }
    
    // 플레이어 제거
    removeOtherPlayer(playerId) {
        const player = this.otherPlayers.get(playerId);
        if (player) {
            console.log('플레이어 나감:', player.username);
            this.otherPlayers.delete(playerId);
        }
    }
    
    // 내 위치를 서버에 전송
    sendMyPosition() {
        if (this.socket && this.currentPlayer) {
            const now = Date.now();
            if (now - this.lastPositionUpdate > 100) { // 100ms마다만 전송
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y
                });
                this.lastPositionUpdate = now;
            }
        }
    }
    
    handleInteraction() {
        for (let animal of this.animals) {
            if (animal.isNearPlayer(this.player)) {
                this.startDialog(animal);
                return;
            }
        }
        
        for (let spot of this.fishingSpots) {
            if (spot.isNearPlayer(this.player)) {
                this.startFishing();
                return;
            }
        }
        
        for (let spot of this.buildingSpots) {
            if (spot.isNearPlayer(this.player) && !spot.hasBuilding) {
                this.showBuildingUI();
                return;
            }
        }
        
        for (let shop of this.shops) {
            if (this.isNearShop(shop)) {
                this.showShopUI();
                return;
            }
        }
        
        for (let bank of this.banks) {
            if (this.isNearBank(bank)) {
                this.showBankUI();
                return;
            }
        }
    }
    
    startDialog(animal) {
        if (animal.name === '강아지' && Math.random() < 0.4) {
            this.startMathProblem();
            return;
        } else if (animal.name === '고양이' && Math.random() < 0.4) {
            this.startTriviaQuiz();
            return;
        } else if (animal.name === '토끼' && Math.random() < 0.4) {
            this.startRiddleQuiz();
            return;
        } else if (animal.name === '여우' && Math.random() < 0.5) {
            this.startTrade();
            return;
        } else if (animal.name === '현자' && Math.random() < 0.6) {
            this.showChatUI();
            return;
        }
        
        this.currentDialog = animal;
        const randomDialogue = animal.dialogue[Math.floor(Math.random() * animal.dialogue.length)];
        
        document.getElementById('dialogText').textContent = `${animal.name}: ${randomDialogue}`;
        
        const optionsDiv = document.getElementById('dialogOptions');
        optionsDiv.innerHTML = '';
        
        let responses = ['좋아!', '정말?', '고마워!', '안녕!'];
        if (animal.name === '강아지') {
            responses.push('수학 문제 내줘!');
        } else if (animal.name === '고양이') {
            responses.push('상식 퀴즈 내줘!');
        } else if (animal.name === '토끼') {
            responses.push('과학 퀴즈 내줘!');
        } else if (animal.name === '여우') {
            responses.push('물물교환 하자!');
        } else if (animal.name === '현자') {
            responses.push('AI와 대화하자!');
        }
        
        responses.forEach(response => {
            const btn = document.createElement('button');
            btn.className = 'dialogBtn';
            btn.textContent = response;
            btn.onclick = () => {
                this.closeDialog();
                if (response === '수학 문제 내줘!') {
                    this.startMathProblem();
                } else if (response === '상식 퀴즈 내줘!') {
                    this.startTriviaQuiz();
                } else if (response === '과학 퀴즈 내줘!') {
                    this.startRiddleQuiz();
                } else if (response === '물물교환 하자!') {
                    this.startTrade();
                } else if (response === 'AI와 대화하자!') {
                    this.showChatUI();
                }
            };
            optionsDiv.appendChild(btn);
        });
        
        document.getElementById('dialogBox').style.display = 'block';
    }
    
    closeDialog() {
        document.getElementById('dialogBox').style.display = 'none';
        this.currentDialog = null;
    }
    
    startMathProblem() {
        this.currentDialog = null;
        this.isMathActive = true;
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const operations = ['+', '-', '*'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        
        let answer;
        switch(op) {
            case '+': answer = a + b; break;
            case '-': answer = a - b; break;
            case '*': answer = a * b; break;
        }
        
        this.mathAnswer = answer;
        document.getElementById('mathQuestion').textContent = `${a} ${op} ${b} = ?`;
        document.getElementById('mathInput').value = '';
        document.getElementById('mathResult').textContent = '';
        document.getElementById('mathUI').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('mathInput').focus();
        }, 100);
    }
    
    checkMathAnswer() {
        const userAnswer = parseInt(document.getElementById('mathInput').value);
        const resultDiv = document.getElementById('mathResult');
        
        if (userAnswer === this.mathAnswer) {
            resultDiv.textContent = '정답입니다! 나무 3개를 받았습니다! 🪵';
            resultDiv.className = 'correct';
            this.player.inventory.wood += 3;
            this.updateInventoryDisplay();
            
            setTimeout(() => {
                this.closeMathUI();
            }, 2000);
        } else {
            resultDiv.textContent = `틀렸습니다. 정답은 ${this.mathAnswer}입니다!`;
            resultDiv.className = 'incorrect';
        }
    }
    
    closeMathUI() {
        this.isMathActive = false;
        document.getElementById('mathUI').style.display = 'none';
    }
    
    startTriviaQuiz() {
        this.currentDialog = null;
        this.isTriviaActive = true;
        
        const triviaQuestions = [
            { question: "지구에서 가장 큰 대륙은?", options: ["아시아", "아프리카", "유럽", "북아메리카"], answer: "아시아" },
            { question: "물의 화학 기호는?", options: ["H2O", "CO2", "NaCl", "O2"], answer: "H2O" },
            { question: "태양계에서 가장 큰 행성은?", options: ["지구", "화성", "목성", "토성"], answer: "목성" }
        ];
        
        this.triviaData = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
        
        document.getElementById('triviaQuestion').textContent = this.triviaData.question;
        
        const optionsDiv = document.getElementById('triviaOptions');
        optionsDiv.innerHTML = '';
        
        this.triviaData.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'mathBtn';
            btn.textContent = option;
            btn.onclick = () => this.checkTriviaAnswer(option);
            optionsDiv.appendChild(btn);
        });
        
        document.getElementById('triviaResult').textContent = '';
        document.getElementById('triviaUI').style.display = 'block';
    }
    
    checkTriviaAnswer(answer) {
        const resultDiv = document.getElementById('triviaResult');
        
        if (answer === this.triviaData.answer) {
            resultDiv.textContent = '정답입니다! 생선 2마리를 받았습니다! 🐟';
            resultDiv.className = 'correct';
            this.player.inventory.fish += 2;
            this.updateInventoryDisplay();
            
            setTimeout(() => {
                this.closeTriviaUI();
            }, 2000);
        } else {
            resultDiv.textContent = `틀렸습니다. 정답은 "${this.triviaData.answer}"입니다!`;
            resultDiv.className = 'incorrect';
        }
    }
    
    closeTriviaUI() {
        this.isTriviaActive = false;
        document.getElementById('triviaUI').style.display = 'none';
        this.triviaData = null;
    }
    
    startRiddleQuiz() {
        this.currentDialog = null;
        this.isRiddleActive = true;
        
        const scienceQuiz = [
            { question: "물의 화학식은 무엇인가요?", answer: "H2O" },
            { question: "태양계에서 가장 큰 행성은?", answer: "목성" },
            { question: "식물이 햇빛을 이용해 양분을 만드는 과정은?", answer: "광합성" },
            { question: "소리의 속도는 초속 몇 미터인가요?", answer: "340" },
            { question: "지구의 대기 중 가장 많은 기체는?", answer: "질소" }
        ];
        
        this.riddleData = scienceQuiz[Math.floor(Math.random() * scienceQuiz.length)];
        
        document.getElementById('riddleQuestion').textContent = this.riddleData.question;
        document.getElementById('riddleInput').value = '';
        document.getElementById('riddleResult').textContent = '';
        document.getElementById('riddleUI').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('riddleInput').focus();
        }, 100);
    }
    
    checkRiddleAnswer() {
        const userAnswer = document.getElementById('riddleInput').value.trim();
        const resultDiv = document.getElementById('riddleResult');
        
        if (userAnswer === this.riddleData.answer) {
            resultDiv.textContent = '정답입니다! 당근 3개를 받았습니다! 🥕';
            resultDiv.className = 'correct';
            this.player.inventory.carrot += 3;
            this.updateInventoryDisplay();
            
            setTimeout(() => {
                this.closeRiddleUI();
            }, 2000);
        } else {
            resultDiv.textContent = `틀렸습니다. 정답은 "${this.riddleData.answer}"입니다!`;
            resultDiv.className = 'incorrect';
        }
    }
    
    closeRiddleUI() {
        this.isRiddleActive = false;
        document.getElementById('riddleUI').style.display = 'none';
        this.riddleData = null;
    }
    
    isNearShop(shop) {
        return this.player.x < shop.x + shop.width + 20 &&
               this.player.x + this.player.width > shop.x - 20 &&
               this.player.y < shop.y + shop.height + 20 &&
               this.player.y + this.player.height > shop.y - 20;
    }
    
    showShopUI() {
        this.currentDialog = null;
        this.isShopActive = true;
        document.getElementById('shopResult').textContent = '';
        document.getElementById('shopUI').style.display = 'block';
    }
    
    closeShopUI() {
        this.isShopActive = false;
        document.getElementById('shopUI').style.display = 'none';
    }
    
    sellItem(itemType) {
        const resultDiv = document.getElementById('shopResult');
        let price = 0;
        let itemName = '';
        
        switch(itemType) {
            case 'fish':
                if (this.player.inventory.fish > 0) {
                    this.player.inventory.fish--;
                    price = 5;
                    itemName = '물고기';
                } else {
                    resultDiv.textContent = '물고기가 없습니다!';
                    resultDiv.className = 'incorrect';
                    return;
                }
                break;
            case 'carrot':
                if (this.player.inventory.carrot > 0) {
                    this.player.inventory.carrot--;
                    price = 3;
                    itemName = '당근';
                } else {
                    resultDiv.textContent = '당근이 없습니다!';
                    resultDiv.className = 'incorrect';
                    return;
                }
                break;
            case 'apple':
                if (this.player.inventory.apple > 0) {
                    this.player.inventory.apple--;
                    price = 4;
                    itemName = '사과';
                } else {
                    resultDiv.textContent = '사과가 없습니다!';
                    resultDiv.className = 'incorrect';
                    return;
                }
                break;
            case 'orange':
                if (this.player.inventory.orange > 0) {
                    this.player.inventory.orange--;
                    price = 4;
                    itemName = '오렌지';
                } else {
                    resultDiv.textContent = '오렌지가 없습니다!';
                    resultDiv.className = 'incorrect';
                    return;
                }
                break;
        }
        
        this.player.inventory.coin += price;
        this.updateInventoryDisplay();
        
        resultDiv.textContent = `${itemName}을(를) ${price} 코인에 팔았습니다!`;
        resultDiv.className = 'correct';
    }
    
    buyItem(itemType) {
        const resultDiv = document.getElementById('shopResult');
        let price = 0;
        let itemName = '';
        
        switch(itemType) {
            case 'wood':
                price = 8;
                itemName = '나무';
                break;
            case 'fish':
                price = 6;
                itemName = '물고기';
                break;
        }
        
        if (this.player.inventory.coin >= price) {
            this.player.inventory.coin -= price;
            this.player.inventory[itemType]++;
            this.updateInventoryDisplay();
            
            resultDiv.textContent = `${itemName}을(를) ${price} 코인에 샀습니다!`;
            resultDiv.className = 'correct';
        } else {
            resultDiv.textContent = `코인이 부족합니다! (필요: ${price} 코인)`;
            resultDiv.className = 'incorrect';
        }
    }
    
    startTrade() {
        this.currentDialog = null;
        this.isTradeActive = true;
        
        const tradeOptions = [
            { wants: { fish: 2 }, offers: { wood: 3 }, wantsText: "물고기 2마리", offersText: "나무 3개" },
            { wants: { carrot: 3 }, offers: { coin: 5 }, wantsText: "당근 3개", offersText: "코인 5개" },
            { wants: { wood: 2 }, offers: { apple: 2, orange: 1 }, wantsText: "나무 2개", offersText: "사과 2개, 오렌지 1개" }
        ];
        
        this.currentTrade = tradeOptions[Math.floor(Math.random() * tradeOptions.length)];
        
        document.getElementById('foxWants').textContent = this.currentTrade.wantsText;
        document.getElementById('foxOffers').textContent = this.currentTrade.offersText;
        document.getElementById('tradeResult').textContent = '';
        document.getElementById('tradeUI').style.display = 'block';
    }
    
    acceptTrade() {
        const resultDiv = document.getElementById('tradeResult');
        let canTrade = true;
        
        for (let item in this.currentTrade.wants) {
            if (this.player.inventory[item] < this.currentTrade.wants[item]) {
                canTrade = false;
                break;
            }
        }
        
        if (canTrade) {
            for (let item in this.currentTrade.wants) {
                this.player.inventory[item] -= this.currentTrade.wants[item];
            }
            
            for (let item in this.currentTrade.offers) {
                this.player.inventory[item] += this.currentTrade.offers[item];
            }
            
            this.updateInventoryDisplay();
            resultDiv.textContent = '교환 완료! 좋은 거래였어!';
            resultDiv.className = 'correct';
            
            setTimeout(() => {
                this.closeTradeUI();
            }, 2000);
        } else {
            resultDiv.textContent = '아이템이 부족해! 나중에 다시 와!';
            resultDiv.className = 'incorrect';
        }
    }
    
    closeTradeUI() {
        this.isTradeActive = false;
        document.getElementById('tradeUI').style.display = 'none';
        this.currentTrade = null;
    }
    
    isNearBank(bank) {
        return this.player.x < bank.x + bank.width + 20 &&
               this.player.x + this.player.width > bank.x - 20 &&
               this.player.y < bank.y + bank.height + 20 &&
               this.player.y + this.player.height > bank.y - 20;
    }
    
    showBankUI() {
        this.currentDialog = null;
        this.isBankActive = true;
        document.getElementById('currentBalance').textContent = this.player.bankAccount.balance;
        document.getElementById('bankBalance').textContent = this.player.bankAccount.balance;
        document.getElementById('bankResult').textContent = '';
        document.getElementById('bankUI').style.display = 'block';
    }
    
    closeBankUI() {
        this.isBankActive = false;
        document.getElementById('bankUI').style.display = 'none';
    }
    
    deposit() {
        const amount = parseInt(document.getElementById('depositAmount').value);
        const resultDiv = document.getElementById('bankResult');
        
        if (isNaN(amount) || amount <= 0) {
            resultDiv.textContent = '올바른 금액을 입력해주세요!';
            resultDiv.className = 'incorrect';
            return;
        }
        
        if (this.player.inventory.coin >= amount) {
            this.player.inventory.coin -= amount;
            this.player.bankAccount.balance += amount;
            this.updateInventoryDisplay();
            
            document.getElementById('currentBalance').textContent = this.player.bankAccount.balance;
            document.getElementById('bankBalance').textContent = this.player.bankAccount.balance;
            
            resultDiv.textContent = `${amount} 코인을 입금했습니다! 💰`;
            resultDiv.className = 'correct';
            
            document.getElementById('depositAmount').value = '';
        } else {
            resultDiv.textContent = `코인이 부족합니다! (보유: ${this.player.inventory.coin} 코인)`;
            resultDiv.className = 'incorrect';
        }
    }
    
    withdraw() {
        const amount = parseInt(document.getElementById('withdrawAmount').value);
        const resultDiv = document.getElementById('bankResult');
        
        if (isNaN(amount) || amount <= 0) {
            resultDiv.textContent = '올바른 금액을 입력해주세요!';
            resultDiv.className = 'incorrect';
            return;
        }
        
        if (this.player.bankAccount.balance >= amount) {
            this.player.bankAccount.balance -= amount;
            this.player.inventory.coin += amount;
            this.updateInventoryDisplay();
            
            document.getElementById('currentBalance').textContent = this.player.bankAccount.balance;
            document.getElementById('bankBalance').textContent = this.player.bankAccount.balance;
            
            resultDiv.textContent = `${amount} 코인을 출금했습니다! 💳`;
            resultDiv.className = 'correct';
            
            document.getElementById('withdrawAmount').value = '';
        } else {
            resultDiv.textContent = `잔액이 부족합니다! (잔고: ${this.player.bankAccount.balance} 코인)`;
            resultDiv.className = 'incorrect';
        }
    }
    
    showChatUI() {
        this.currentDialog = null;
        this.isChatActive = true;
        this.chatHistory = [];
        document.getElementById('chatResult').textContent = '';
        document.getElementById('chatInput').value = '';
        
        const chatHistoryDiv = document.getElementById('chatHistory');
        chatHistoryDiv.innerHTML = '<div style="color: #666; font-style: italic;">현자: 안녕! 무엇이든 물어보세요!</div>';
        
        document.getElementById('chatUI').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 100);
    }
    
    closeChatUI() {
        this.isChatActive = false;
        document.getElementById('chatUI').style.display = 'none';
        this.chatHistory = [];
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage('사용자', message, false);
        input.value = '';
        
        const sendBtn = document.getElementById('chatSendBtn');
        sendBtn.textContent = '전송 중...';
        sendBtn.disabled = true;
        
        try {
            const response = await this.callGeminiAPI(message);
            this.addChatMessage('현자', response, true);
        } catch (error) {
            this.addChatMessage('현자', '죄송합니다. 지금은 대답할 수 없어요.', true);
        }
        
        sendBtn.textContent = '전송';
        sendBtn.disabled = false;
        input.focus();
    }
    
    addChatMessage(sender, message, isAI) {
        const chatHistoryDiv = document.getElementById('chatHistory');
        const messageDiv = document.createElement('div');
        messageDiv.style.margin = '10px 0';
        messageDiv.style.padding = '8px';
        messageDiv.style.borderRadius = '8px';
        
        if (isAI) {
            messageDiv.style.backgroundColor = '#e8f4f8';
            messageDiv.style.color = '#2c5282';
            messageDiv.innerHTML = `<strong>🧙‍♂️ ${sender}:</strong> ${message}`;
        } else {
            messageDiv.style.backgroundColor = '#f0f8e8';
            messageDiv.style.color = '#2d5016';
            messageDiv.innerHTML = `<strong>🧚‍♀️ ${sender}:</strong> ${message}`;
        }
        
        chatHistoryDiv.appendChild(messageDiv);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        
        this.chatHistory.push({ sender, message, isAI });
    }
    
    async callGeminiAPI(message) {
        const responses = {
            '안녕': '안녕하세요! 만나서 반가워요!',
            '이름': '저는 현자라고 불리는 AI예요. 무엇이든 물어보세요!',
            '게임': '이 게임은 동물의 숲 스타일의 교육 게임이에요. 수학, 상식, 과학 퀴즈를 풀고 아이템을 얻을 수 있어요!',
            '수학': '수학은 정말 재미있는 학문이에요! 강아지에게 가서 수학 문제를 풀어보세요.',
            '물고기': '연못에서 낚시를 해보세요! 물고기를 잡으면 상점에서 팔 수 있어요.',
            '은행': '은행에 돈을 저축하면 이자를 받을 수 있어요. 현명한 경제 교육이죠!',
            '안녕히': '안녕히 가세요! 언제든 다시 대화해요!'
        };
        
        for (let keyword in responses) {
            if (message.includes(keyword)) {
                return responses[keyword];
            }
        }
        
        const defaultResponses = [
            '흥미로운 질문이네요! 더 자세히 설명해 주실 수 있나요?',
            '그것에 대해 생각해보니 정말 재미있는 주제인 것 같아요.',
            '좋은 질문이에요! 제가 도움이 될 만한 답변을 해드릴게요.',
            '그런 것을 궁금해하시는군요. 저도 그에 대해 관심이 있어요!'
        ];
        
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    harvestNearestTree() {
        for (let tree of this.trees) {
            if (tree.isNearPlayer(this.player) && !tree.isChopped) {
                const result = tree.harvestFruit();
                if (result.count > 0) {
                    this.player.inventory[result.type] += result.count;
                    this.updateInventoryDisplay();
                    alert(`${result.type === 'apple' ? '사과' : '오렌지'} ${result.count}개를 수확했습니다!`);
                }
                break;
            }
        }
    }
    
    chopNearestTree() {
        for (let tree of this.trees) {
            if (tree.isNearPlayer(this.player) && !tree.isChopped) {
                const woodGained = tree.chopDown();
                if (woodGained > 0) {
                    this.player.inventory.wood += woodGained;
                    this.updateInventoryDisplay();
                    alert(`나무를 베어서 나무 ${woodGained}개를 얻었습니다!`);
                }
                break;
            }
        }
    }
    
    startFishing() {
        this.isFishing = true;
        this.fishingProgress = 0;
        this.fishingTarget = 50 + Math.random() * 50;
        document.getElementById('fishingUI').style.display = 'block';
    }
    
    catchFish() {
        this.fishingProgress += 2;
        document.getElementById('fishingProgress').style.width = (this.fishingProgress / this.fishingTarget) * 100 + '%';
        
        if (this.fishingProgress >= this.fishingTarget) {
            this.player.inventory.fish++;
            this.updateInventoryDisplay();
            this.stopFishing();
            alert('물고기를 잡았다!');
        }
    }
    
    stopFishing() {
        this.isFishing = false;
        document.getElementById('fishingUI').style.display = 'none';
        document.getElementById('fishingProgress').style.width = '0%';
    }
    
    showBuildingUI() {
        document.getElementById('buildingUI').style.display = 'block';
    }
    
    closeBuildingUI() {
        document.getElementById('buildingUI').style.display = 'none';
    }
    
    buildHouse(type) {
        const woodNeeded = type === 'small' ? 5 : 10;
        
        if (this.player.inventory.wood >= woodNeeded) {
            this.player.inventory.wood -= woodNeeded;
            
            for (let spot of this.buildingSpots) {
                if (spot.isNearPlayer(this.player) && !spot.hasBuilding) {
                    spot.hasBuilding = true;
                    spot.buildingType = type;
                    break;
                }
            }
            
            this.updateInventoryDisplay();
            this.closeBuildingUI();
            alert(`${type === 'small' ? '작은' : '큰'} 집을 건설했습니다!`);
        } else {
            alert(`나무가 ${woodNeeded - this.player.inventory.wood}개 더 필요합니다!`);
        }
    }
    
    updateInventoryDisplay() {
        document.getElementById('fishCount').textContent = this.player.inventory.fish;
        document.getElementById('woodCount').textContent = this.player.inventory.wood;
        document.getElementById('carrotCount').textContent = this.player.inventory.carrot;
        document.getElementById('appleCount').textContent = this.player.inventory.apple;
        document.getElementById('orangeCount').textContent = this.player.inventory.orange;
        document.getElementById('coinCount').textContent = this.player.inventory.coin;
        document.getElementById('bankBalance').textContent = this.player.bankAccount.balance;
    }
    
    drawBackground(ctx) {
        // 하늘 그라디언트 (상단 25%만)
        const skyHeight = canvas.height * 0.25;
        const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, skyHeight);
        
        // 잔디밭 그라디언트 (나머지 75%)
        const grassGradient = ctx.createLinearGradient(0, skyHeight, 0, canvas.height);
        grassGradient.addColorStop(0, '#98FB98');
        grassGradient.addColorStop(0.5, '#90EE90');
        grassGradient.addColorStop(1, '#32CD32');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, skyHeight, canvas.width, canvas.height - skyHeight);
        
        // 구름들 (단순하고 깔끔하게)
        this.drawClouds(ctx);
        
        // 원거리 나무들 (반짝임 없이)
        this.drawDistantTrees(ctx);
    }
    
    drawClouds(ctx) {
        const time = Date.now() * 0.0001;
        
        // 큰 구름들 (3개만)
        for (let i = 0; i < 3; i++) {
            const x = (canvas.width * 0.3 * i + time * 30) % (canvas.width + 200) - 100;
            const y = 40 + Math.sin(time + i) * 10;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.arc(x + 20, y, 30, 0, Math.PI * 2);
            ctx.arc(x + 40, y, 25, 0, Math.PI * 2);
            ctx.arc(x + 20, y - 15, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawDistantTrees(ctx) {
        const horizon = canvas.height * 0.25;
        
        // 원거리 산 실루엣 (단순하게)
        ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        for (let x = 0; x <= canvas.width; x += 80) {
            const height = 20 + Math.sin(x * 0.008) * 10;
            ctx.lineTo(x, horizon - height);
        }
        ctx.lineTo(canvas.width, horizon);
        ctx.closePath();
        ctx.fill();
        
        // 원거리 나무들 (반짝임 없이)
        for (let i = 0; i < 12; i++) {
            const x = (canvas.width / 12) * i + Math.sin(i) * 20;
            const treeHeight = 15 + Math.random() * 10;
            
            ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
            ctx.beginPath();
            ctx.arc(x, horizon - treeHeight/2, treeHeight/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.fillRect(x - 1, horizon - 3, 2, 6);
        }
    }
    
    drawShops(ctx) {
        this.shops.forEach(shop => {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(shop.x, shop.y + 20, shop.width, shop.height - 20);
            
            ctx.fillStyle = '#DC143C';
            ctx.fillRect(shop.x - 5, shop.y, shop.width + 10, 25);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(shop.x + 20, shop.y + 25, 20, 20);
            
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏪', shop.x + shop.width/2, shop.y + 15);
        });
    }
    
    drawBanks(ctx) {
        this.banks.forEach(bank => {
            ctx.fillStyle = '#B0C4DE';
            ctx.fillRect(bank.x, bank.y + 25, bank.width, bank.height - 25);
            
            ctx.fillStyle = '#4682B4';
            ctx.fillRect(bank.x - 5, bank.y, bank.width + 10, 30);
            
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(bank.x + 10 + i * 15, bank.y + 25, 8, bank.height - 25);
            }
            
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(bank.x + 30, bank.y + 45, 20, 25);
            
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏦', bank.x + bank.width/2, bank.y + 20);
        });
    }
    
    update() {
        const canMove = !this.currentDialog && !this.isMathActive && !this.isTriviaActive && !this.isRiddleActive && !this.isShopActive && !this.isTradeActive && !this.isBankActive && !this.isChatActive;
        
        if (canMove && canvas.width > 0 && canvas.height > 0) {
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            this.player.update(this.keys, canvas.width, canvas.height, this.fishingSpots);
            
            // 위치가 변경되면 서버에 전송
            if (this.currentPlayer && (oldX !== this.player.x || oldY !== this.player.y)) {
                this.sendMyPosition();
            }
        }
        
        this.animals.forEach(animal => {
            animal.update(canvas.width, canvas.height);
            // 동물들이 하늘 영역(상단 25%)으로 가지 못하게 제한
            const skyLimit = canvas.height * 0.25;
            if (animal.y < skyLimit) {
                animal.y = skyLimit;
                animal.direction.y = Math.abs(animal.direction.y);
            }
        });
        
        this.fishingSpots.forEach(spot => spot.update());
    }
    
    draw(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 배경 그리기
        this.drawBackground(ctx);
        
        this.fishingSpots.forEach(spot => spot.draw(ctx));
        this.buildingSpots.forEach(spot => spot.draw(ctx));
        this.drawShops(ctx);
        this.drawBanks(ctx);
        this.trees.forEach(tree => tree.draw(ctx));
        
        // 다른 플레이어들 그리기
        this.otherPlayers.forEach(otherPlayer => {
            this.drawOtherPlayer(ctx, otherPlayer);
        });
        
        // 내 플레이어 그리기
        const myEmoji = this.currentPlayer ? this.currentPlayer.emoji : '🧚‍♀️';
        this.player.draw(ctx, myEmoji);
        
        this.animals.forEach(animal => animal.draw(ctx));
        
        // 상호작용 안내
        ctx.fillStyle = '#2C3E50';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        
        for (let animal of this.animals) {
            if (animal.isNearPlayer(this.player)) {
                ctx.fillText('E를 눌러 대화하기', animal.x + animal.width/2, animal.y - 15);
                break;
            }
        }
        
        for (let spot of this.fishingSpots) {
            if (spot.isNearPlayer(this.player)) {
                ctx.fillText('E를 눌러 낚시하기', spot.x, spot.y - spot.radius - 20);
                break;
            }
        }
        
        for (let spot of this.buildingSpots) {
            if (spot.isNearPlayer(this.player) && !spot.hasBuilding) {
                ctx.fillText('E를 눌러 건설하기', spot.x + spot.width/2, spot.y - 15);
                break;
            }
        }
        
        for (let shop of this.shops) {
            if (this.isNearShop(shop)) {
                ctx.fillText('E를 눌러 상점 이용하기', shop.x + shop.width/2, shop.y - 15);
                break;
            }
        }
        
        for (let bank of this.banks) {
            if (this.isNearBank(bank)) {
                ctx.fillText('E를 눌러 은행 이용하기', bank.x + bank.width/2, bank.y - 15);
                break;
            }
        }
        
        for (let tree of this.trees) {
            if (tree.isNearPlayer(this.player)) {
                if (tree.isChopped) {
                    break;
                } else if (tree.hasFruit && tree.fruitCount > 0) {
                    ctx.fillText('F를 눌러 열매 수확, C를 눌러 나무 베기', tree.x, tree.y - 15);
                } else {
                    ctx.fillText('C를 눌러 나무 베기', tree.x, tree.y - 15);
                }
                break;
            }
        }
    }
    
    // 다른 플레이어 그리기
    drawOtherPlayer(ctx, otherPlayer) {
        // 플레이어 캐릭터
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(otherPlayer.emoji, otherPlayer.x + 20, otherPlayer.y + 35);
        
        // 플레이어 이름
        ctx.font = '12px Arial';
        ctx.fillStyle = '#2C3E50';
        ctx.fillText(otherPlayer.username, otherPlayer.x + 20, otherPlayer.y - 5);
        
        // 테두리 (선택사항)
        ctx.strokeStyle = '#3498DB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(otherPlayer.x + 20, otherPlayer.y + 20, 25, 0, Math.PI * 2);
        ctx.stroke();
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game();

function gameLoop() {
    game.update();
    game.draw(ctx);
    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameLoop();