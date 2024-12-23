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

        this.init();
    }

    init() {
        // Tạo 16 ô (4x4)
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            this.gameBoard.appendChild(cell);
            this.cells.push(cell);
        }

        this.startGame();
    }

    startGame() {
        // Spawn nhiều object hơn bằng cách:
        // 1. Giảm interval xuống 500ms (từ 1000ms)
        // 2. Mỗi lần spawn sẽ tạo 2-3 object
        setInterval(() => {
            const spawnCount = Math.floor(Math.random() * 2) + 2; // Random 2-3 object
            for(let i = 0; i < spawnCount; i++) {
                this.spawnAnimal();
            }
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
                
                const flash = document.createElement('div');
                flash.className = 'red-flash';
                document.body.appendChild(flash);
                
                flash.addEventListener('animationend', () => {
                    document.body.removeChild(flash);
                });

                this.isDisabled = true;
                this.gameBoard.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    this.isDisabled = false;
                    this.gameBoard.style.pointerEvents = 'auto';
                }, 2000);
            } else if (selectedAnimal.image === 'star.png') {
                this.sounds.bonus.currentTime = 0;
                this.sounds.bonus.play();
                
                const flash = document.createElement('div');
                flash.className = 'green-flash';
                document.body.appendChild(flash);
                
                flash.addEventListener('animationend', () => {
                    document.body.removeChild(flash);
                });
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
}

new Game(); 