class Game {
    constructor() {
        this.score = 0;
        this.gameBoard = document.querySelector('.game-board');
        this.scoreElement = document.getElementById('score');
        this.cells = [];
        this.animals = [
            { image: 'mouse.png', points: 10, probability: 0.7 },
            { image: 'rabbit.png', points: 20, probability: 0.2 },
            { image: 'snake.png', points: -30, probability: 0.1 }
        ];
        
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
        }, 500);
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
            this.score += selectedAnimal.points;
            this.scoreElement.textContent = this.score;
            randomCell.removeChild(img);
        });

        randomCell.appendChild(img);
        
        // Giảm thời gian tồn tại xuống 1.5 giây (từ 2 giây)
        setTimeout(() => {
            if (randomCell.contains(img)) {
                randomCell.removeChild(img);
            }
        }, 1500);
    }
}

new Game(); 