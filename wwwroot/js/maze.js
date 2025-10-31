window.maze = {
    init: function () {
        const canvas = document.getElementById("mazeCanvas");
        const ctx = canvas.getContext("2d");

        let player = { x: 0, y: 0, px: 0, py: 0 };
        let goal;
        let maze = [];
        let animating = false;
        let moveCount = 0;
        let startTime = null;
        let timerInterval = null;
        let showSolution = true;
        let cellSize = 20;
        let cols, rows;
        let playerSpeed = 100;
        const keysPressed = {};
        let hoverPath = [];
        let gradientOffset = 0;

        function getDifficultySettings() {
            const level = document.getElementById("difficultySelect").value;
            switch (level) {
                case "easy": return { cols: 20, rows: 12, cellSize: 30, speed: 150, solution: true };
                case "medium": return { cols: 30, rows: 20, cellSize: 20, speed: 100, solution: true };
                case "hard": return { cols: 40, rows: 25, cellSize: 15, speed: 70, solution: false };
                default: return { cols: 30, rows: 20, cellSize: 20, speed: 100, solution: true };
            }
        }

        function applyDifficulty() {
            const settings = getDifficultySettings();
            cols = settings.cols;
            rows = settings.rows;
            cellSize = settings.cellSize;
            playerSpeed = settings.speed;
            showSolution = settings.solution;
            canvas.width = cols * cellSize;
            canvas.height = rows * cellSize;
            goal = { x: cols - 1, y: rows - 1 };
        }

        function createGrid() {
            return Array.from({ length: rows }, () => Array(cols).fill(1));
        }

        function generateMaze() {
            maze = createGrid();
            const stack = [{ x: 0, y: 0 }];
            maze[0][0] = 0;

            while (stack.length) {
                const curr = stack[stack.length - 1];
                const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]].sort(() => Math.random() - 0.5);
                let carved = false;
                for (const [dx, dy] of dirs) {
                    const nx = curr.x + dx * 2, ny = curr.y + dy * 2;
                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 1) {
                        maze[curr.y + dy][curr.x + dx] = 0;
                        maze[ny][nx] = 0;
                        stack.push({ x: nx, y: ny });
                        carved = true;
                        break;
                    }
                }
                if (!carved) stack.pop();
            }

            // Ensure goal is reachable
            maze[goal.y][goal.x] = 0;
            if (maze[goal.y - 1][goal.x] === 1) maze[goal.y - 1][goal.x] = 0;
            if (maze[goal.y][goal.x - 1] === 1) maze[goal.y][goal.x - 1] = 0;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    ctx.fillStyle = maze[y][x] === 1 ? "#333" : "#f5f5f5";
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }

            drawHoverPath();

            // Goal
            ctx.fillStyle = "#4caf50";
            ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);

            // Player
            ctx.fillStyle = "#2196f3";
            ctx.fillRect(player.px, player.py, cellSize, cellSize);
        }

        function drawHoverPath() {
            if (!hoverPath.length) return;
            gradientOffset = (gradientOffset + 1) % hoverPath.length;
            for (let i = 0; i < hoverPath.length; i++) {
                const index = (i + gradientOffset) % hoverPath.length;
                const color = `hsl(${(index / hoverPath.length) * 360}, 100%, 50%)`;
                const cell = hoverPath[index];
                ctx.fillStyle = color;
                ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
            }
        }

        function move(dx, dy) {
            if (animating) return;
            const nx = player.x + dx;
            const ny = player.y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 0) {
                animating = true;
                const startX = player.px, startY = player.py;
                const endX = nx * cellSize, endY = ny * cellSize;
                const startTimeAnim = performance.now();

                function animate(time) {
                    const t = Math.min((time - startTimeAnim) / playerSpeed, 1);
                    player.px = startX + (endX - startX) * t;
                    player.py = startY + (endY - startY) * t;
                    draw();
                    if (t < 1) requestAnimationFrame(animate);
                    else {
                        player.x = nx; player.y = ny;
                        moveCount++;
                        document.getElementById("moveCount").textContent = moveCount;
                        animating = false;
                        if (player.x === goal.x && player.y === goal.y) {
                            showWinMessage();
                            clearInterval(timerInterval);
                            const audio = document.getElementById("winSound");
                            if (audio) audio.play().catch(() => { });
                        }
                    }
                }
                requestAnimationFrame(animate);
            }
        }

        function handleMovement() {
            let dx = 0, dy = 0;
            if (keysPressed["ArrowUp"]) dy -= 1;
            if (keysPressed["ArrowDown"]) dy += 1;
            if (keysPressed["ArrowLeft"]) dx -= 1;
            if (keysPressed["ArrowRight"]) dx += 1;
            if (dx !== 0 || dy !== 0) move(dx, dy);
            requestAnimationFrame(handleMovement);
        }

        function showWinMessage() {
            const msg = document.createElement("div");
            msg.textContent = "🎉 You escaped the maze!";
            msg.style.position = "absolute";
            msg.style.top = "50%";
            msg.style.left = "50%";
            msg.style.transform = "translate(-50%,-50%)";
            msg.style.background = "rgba(255,255,255,0.9)";
            msg.style.padding = "20px";
            msg.style.border = "2px solid #4caf50";
            msg.style.borderRadius = "8px";
            msg.style.fontSize = "20px";
            msg.style.zIndex = 1000;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
        }

        function updateTimer() {
            const elapsed = Math.floor((performance.now() - startTime) / 1000);
            document.getElementById("timer").textContent = elapsed;
        }

        canvas.addEventListener("mousemove", e => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const cx = Math.floor(mx / cellSize);
            const cy = Math.floor(my / cellSize);
            hoverPath = [];
            if (maze[cy] && maze[cy][cx] === 0) {
                hoverPath.push({ x: cx, y: cy });
            }
        });

        canvas.addEventListener("click", e => {
            if (!hoverPath.length) return;
            const target = hoverPath[0];
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            move(dx, dy);
        });

        document.addEventListener("keydown", e => keysPressed[e.key] = true);
        document.addEventListener("keyup", e => keysPressed[e.key] = false);

        window.restartMaze = function () {
            applyDifficulty();
            player = { x: 0, y: 0, px: 0, py: 0 };
            moveCount = 0;
            document.getElementById("moveCount").textContent = moveCount;
            startTime = performance.now();
            clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 1000);
            animating = false;
            generateMaze();
            draw();
        };

        // Initial load
        applyDifficulty();
        generateMaze();
        draw();
        startTime = performance.now();
        timerInterval = setInterval(updateTimer, 1000);
        requestAnimationFrame(handleMovement);
    }
};
