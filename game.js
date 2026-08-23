class Game {
    constructor() {
        this.score = 0;
        this.gameBoard = document.querySelector('.game-board');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.durationInput = document.getElementById('duration-input');
        this.infiniteInput = document.getElementById('infinite-input');
        this.cells = [];
        this.highScore = Number(localStorage.getItem('whackAMewHighScore')) || 0;
        this.animals = [
            { image: 'mouse.png', points: 10, probability: 0.6 },
            { image: 'rabbit.png', points: 20, probability: 0.2 },
            { image: 'snake.png', points: -30, probability: 0.1 },
            { image: 'star.png', points: 30, probability: 0.1 } // Vật phẩm hiếm mới
                ];

        this.sounds = {
            point: new Audio('sounds/point.mp3'),
            damage: new Audio('sounds/damage.mp3'),
            bonus: new Audio('sounds/point.mp3') // Thêm âm thanh mới
                 };
        
        // Điều chỉnh âm lượng
        this.sounds.point.volume = 0.0;
        this.sounds.bonus.volume = 0.4;
        this.sounds.damage.volume = 0.4;

        this.isDisabled = false;
        this.isRunning = false;
        this.isPaused = false;
        this.isSwiping = false;
        this.highScoreElement.textContent = this.highScore;

        this.startScreen = document.getElementById('start-screen');
        this.pauseButton = document.getElementById('pause-button');
        this.gameBoard.style.display = 'none'; // Ẩn game board ban đầu
        this.pauseButton.style.display = 'none';
        document.getElementById('quit-button').style.display = 'none';
        this.gameBoard.addEventListener('pointerdown', event => {
            this.isSwiping = event.pointerType === 'touch';
            if (this.isSwiping) this.createTrail(event.clientX, event.clientY);
            this.hitAnimalAt(event.clientX, event.clientY);
        });
        this.gameBoard.addEventListener('pointermove', event => {
            if (!this.isSwiping) return;
            this.createTrail(event.clientX, event.clientY);
            this.hitAnimalAt(event.clientX, event.clientY);
        });
        this.gameBoard.addEventListener('pointerup', () => { this.isSwiping = false; });
        this.gameBoard.addEventListener('pointercancel', () => { this.isSwiping = false; });
        
        document.getElementById('start-button').addEventListener('click', () => {
            this.startScreen.classList.add('hidden');
            this.gameBoard.style.display = 'grid';
            this.pauseButton.style.display = 'inline-block';
            document.getElementById('quit-button').style.display = 'inline-block';
            this.startGame();
        });
        this.pauseButton.addEventListener('click', () => this.togglePause());
        document.getElementById('quit-button').addEventListener('click', () => this.quitGame());

        this.init();

        this.timeLeft = 15;
        this.timerElement = document.getElementById('time');
        this.gameInterval = null;
        this.timerInterval = null;
    }

    init() {
        // Tạo 16 ô (4x4)
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            this.gameBoard.appendChild(cell);
            this.cells.push(cell);
        }
    }

    startGame() {
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.isRunning = true;
        this.isPaused = false;
        this.isDisabled = false;
        this.pauseButton.textContent = 'Tạm dừng';
        this.timeLeft = this.infiniteInput.checked ? Infinity : Math.max(15, Number(this.durationInput.value) || 15);
        this.durationInput.value = this.timeLeft === Infinity ? 15 : this.timeLeft;
        this.timerElement.textContent = this.timeLeft === Infinity ? '∞' : this.timeLeft;

        this.startIntervals();
    }

    endGame(showAlert = true) {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.gameInterval);
        clearInterval(this.timerInterval);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('whackAMewHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
        
        // Xóa tất cả animals
        this.cells.forEach(cell => {
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
        });

        // Hiển thị điểm số cuối cùng
        if (showAlert) {
            alert(`Trò chơi kết thúc! Điểm của bạn: ${this.score}. Kỷ lục: ${this.highScore}`);
        }
        this.startScreen.classList.remove('hidden');
        this.gameBoard.style.display = 'none';
        this.timerElement.textContent = '15';
        this.pauseButton.textContent = 'Tạm dừng';
        this.pauseButton.style.display = 'none';
        document.getElementById('quit-button').style.display = 'none';
        this.gameBoard.classList.remove('paused');
    }

    togglePause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            clearInterval(this.gameInterval);
            clearInterval(this.timerInterval);
            this.pauseButton.textContent = 'Tiếp tục';
            this.gameBoard.classList.add('paused');
        } else {
            this.pauseButton.textContent = 'Tạm dừng';
            this.gameBoard.classList.remove('paused');
            this.startIntervals();
        }
    }

    quitGame() {
        if (!this.isRunning) return;
        this.endGame(false);
    }

    startIntervals() {
        if (this.timeLeft !== Infinity) {
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                this.timerElement.textContent = this.timeLeft;
                if (this.timeLeft <= 0) this.endGame();
            }, 1000);
        }

        this.gameInterval = setInterval(() => {
            const spawnCount = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < spawnCount; i++) this.spawnAnimal();
        }, 800);
    }

    spawnAnimal() {
        const emptyCells = this.cells.filter(cell => !cell.hasChildNodes());
        if (emptyCells.length === 0) return;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        const random = Math.random();
        let selectedAnimal = this.animals[0];
        let probabilitySum = 0;
        
        for (const animal of this.animals) {
            probabilitySum += animal.probability;
            if (random <= probabilitySum) {
                selectedAnimal = animal;
                break;
            }
        }

        const img = document.createElement('img');
        img.src = selectedAnimal.image;
        img.className = 'animal';
        img.dataset.points = selectedAnimal.points;
        const hit = () => {
            if (this.isDisabled || !this.isRunning || this.isPaused || img.dataset.hit) return;
            img.dataset.hit = 'true';

            img.classList.add('disappear');
            
            img.addEventListener('animationend', () => {
                if (randomCell.contains(img)) {
                    randomCell.removeChild(img);
                }
            });

            this.score += selectedAnimal.points;
            this.scoreElement.textContent = this.score;
            
            if (selectedAnimal.image === 'snake.png') {
                this.sounds.damage.currentTime = 0;
                this.sounds.damage.play();
                this.createFlash('red-flash');
                
                this.isDisabled = true;
                this.gameBoard.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    this.isDisabled = false;
                    this.gameBoard.style.pointerEvents = 'auto';
                }, 2000);
            } else if (selectedAnimal.image === 'star.png') {
                this.sounds.bonus.currentTime = 0;
                this.sounds.bonus.play();
                this.createFlash('green-flash');
            } else {
                this.sounds.point.currentTime = 0;
                this.sounds.point.play();
            }
        };

        img.addEventListener('pointerenter', hit);
        img.addEventListener('pointerdown', hit);
        img.hitAnimal = hit;

        randomCell.appendChild(img);
        
        setTimeout(() => {
            if (randomCell.contains(img)) {
                img.classList.add('disappear');
                img.addEventListener('animationend', () => {
                    if (randomCell.contains(img)) {
                        randomCell.removeChild(img);
                    }
                });
            }
        }, 1500);
    }

    createFlash(className) {
        // Xóa flash cũ nếu có
        const oldFlash = document.querySelector('.' + className);
        if (oldFlash) {
            document.body.removeChild(oldFlash);
        }
        
        // Tạo flash mới
        const flash = document.createElement('div');
        flash.className = className;
        document.body.appendChild(flash);
        
        flash.addEventListener('animationend', () => {
            if (document.body.contains(flash)) {
                document.body.removeChild(flash);
            }
        });
    }

    hitAnimalAt(x, y) {
        if (this.isDisabled || !this.isRunning || this.isPaused) return;
        const element = document.elementFromPoint(x, y);
        if (element && element.classList.contains('animal') && element.hitAnimal) {
            element.hitAnimal();
        }
    }

    createTrail(x, y) {
        const trail = document.createElement('span');
        trail.className = 'touch-trail';
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        document.body.appendChild(trail);
        trail.addEventListener('animationend', () => trail.remove());
    }
}

new Game(); 