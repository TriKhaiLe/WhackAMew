class Game {
    constructor() {
        this.score = 0;
        this.gameBoard = document.querySelector('.game-board');
        this.scoreElement = document.getElementById('score');
        this.cells = [];
        this.animals = [
            { image: 'mouse.png', points: 10, probability: 0.6 },
            { image: 'rabbit.png', points: 20, probability: 0.2 },
            { image: 'snake.png', points: -30, probability: 0.1 },
            { image: 'star.png', points: 0, probability: 0.1 } // Vật phẩm hiếm mới
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

        this.startScreen = document.getElementById('start-screen');
        this.gameBoard.style.display = 'none'; // Ẩn game board ban đầu
        
        document.getElementById('start-button').addEventListener('click', () => {
            // Khởi tạo âm thanh
            Promise.all([
                this.sounds.point.play(),
                this.sounds.damage.play(),
                this.sounds.bonus.play()
            ]).then(() => {
                // Dừng ngay lập tức
                this.sounds.point.pause();
                this.sounds.damage.pause();
                this.sounds.bonus.pause();
                
                // Reset time
                this.sounds.point.currentTime = 0;
                this.sounds.damage.currentTime = 0;
                this.sounds.bonus.currentTime = 0;
                
                // Bắt đầu game
                this.startScreen.classList.add('hidden');
                this.gameBoard.style.display = 'grid';
                this.startGame();
            }).catch(error => {
                console.error('Không thể khởi tạo âm thanh:', error);
            });
        });

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
        // Khởi tạo timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerElement.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        // Spawn animals
        this.gameInterval = setInterval(() => {
            const spawnCount = Math.floor(Math.random() * 2) + 2;
            for(let i = 0; i < spawnCount; i++) {
                this.spawnAnimal();
            }
        }, 800);
    }

    endGame() {
        clearInterval(this.gameInterval);
        clearInterval(this.timerInterval);
        
        // Xóa tất cả animals
        this.cells.forEach(cell => {
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
        });

        // Hiển thị điểm số cuối cùng
        alert(`Trò chơi kết thúc! Điểm của bạn: ${this.score}`);
        
        // Reload trang để chơi lại
        location.reload();
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
        
        img.addEventListener('mouseover', () => {
            if (this.isDisabled) return;

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
        });

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
}

new Game(); 