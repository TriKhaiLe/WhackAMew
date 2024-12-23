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
        setInterval(() => this.spawnAnimal(), 1000);
    }

    spawnAnimal() {
        // Chọn ô ngẫu nhiên
        const emptyCells = this.cells.filter(cell => !cell.hasChildNodes());
        if (emptyCells.length === 0) return;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // Chọn con vật ngẫu nhiên dựa trên xác suất
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

        // Tạo và hiển thị con vật
        const img = document.createElement('img');
        img.src = selectedAnimal.image;
        img.className = 'animal';
        img.dataset.points = selectedAnimal.points;
        
        // Xử lý sự kiện hover
        img.addEventListener('mouseover', () => {
            this.score += selectedAnimal.points;
            this.scoreElement.textContent = this.score;
            randomCell.removeChild(img);
        });

        randomCell.appendChild(img);
        
        // Tự động ẩn con vật sau 2 giây
        setTimeout(() => {
            if (randomCell.contains(img)) {
                randomCell.removeChild(img);
            }
        }, 2000);
    }
}

// Khởi tạo game
new Game(); 