window.dxball = {
    animationId: null,
    gameOverFlag: false,
    blockSpeed: 0.2, // how fast blocks fall (pixels per frame)

    setup: function () {
        const canvas = document.getElementById("dxCanvas");
        if (!canvas) return console.warn("Canvas not found");

        this.ctx = canvas.getContext("2d");

        // Game objects
        this.ball = { x: 300, y: 350, dx: 2, dy: -2, radius: 8 };
        this.paddle = { x: 250, width: 100, height: 10 };
        this.rightPressed = false;
        this.leftPressed = false;
        this.blocks = [];
        this.score = 0;

        // Create blocks
        const rows = 5, cols = 8;
        const blockWidth = 60, blockHeight = 20, padding = 10;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.blocks.push({
                    x: c * (blockWidth + padding) + 35,
                    y: r * (blockHeight + padding) + 20,
                    width: blockWidth,
                    height: blockHeight,
                    active: true
                });
            }
        }

        const self = this;

        // Paddle control
        document.addEventListener("keydown", e => {
            if (e.key === "Right" || e.key === "ArrowRight") self.rightPressed = true;
            else if (e.key === "Left" || e.key === "ArrowLeft") self.leftPressed = true;
        });

        document.addEventListener("keyup", e => {
            if (e.key === "Right" || e.key === "ArrowRight") self.rightPressed = false;
            else if (e.key === "Left" || e.key === "ArrowLeft") self.leftPressed = false;
        });
    },

    start: function () {
        if (this.animationId) return;
        this.gameOverFlag = false;
        const self = this;

        function update() {
            const ctx = self.ctx;
            const ball = self.ball;
            const paddle = self.paddle;

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Move blocks down slowly
            self.blocks.forEach(block => {
                if (block.active) {
                    block.y += self.blockSpeed;
                    // If any block touches bottom, game over
                    if (block.y + block.height >= ctx.canvas.height) {
                        if (!self.gameOverFlag) {
                            self.gameOverFlag = true;
                            alert("💥 Game Over! Blocks reached the bottom!");
                            self.stop();
                        }
                    }
                }
            });

            // Draw blocks
            self.blocks.forEach(block => {
                if (block.active) {
                    ctx.fillStyle = "#ff5722";
                    ctx.fillRect(block.x, block.y, block.width, block.height);
                }
            });

            // Draw ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.closePath();

            // Draw paddle
            ctx.fillStyle = "#4caf50";
            ctx.fillRect(paddle.x, ctx.canvas.height - paddle.height - 10, paddle.width, paddle.height);

            // Move ball
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Ball collision with walls
            if (ball.x + ball.dx > ctx.canvas.width - ball.radius || ball.x + ball.dx < ball.radius) ball.dx = -ball.dx;
            if (ball.y + ball.dy < ball.radius) ball.dy = -ball.dy;

            // Ball collision with paddle / bottom
            else if (ball.y + ball.dy > ctx.canvas.height - paddle.height - 10 - ball.radius) {
                if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                    ball.dy = -ball.dy;
                    const hitSound = document.getElementById("hitSound");
                    if (hitSound && hitSound.readyState >= 2) hitSound.play();
                } else {
                    if (!self.gameOverFlag) {
                        self.gameOverFlag = true;
                        alert("💥 Game Over!");
                        self.stop();
                    }
                }
            }

            // Ball collision with blocks
            self.blocks.forEach(block => {
                if (block.active) {
                    const hitFromLeftOrRight = ball.x + ball.radius > block.x && ball.x - ball.radius < block.x + block.width;
                    const hitFromTopOrBottom = ball.y + ball.radius > block.y && ball.y - ball.radius < block.y + block.height;

                    if (hitFromLeftOrRight && hitFromTopOrBottom) {
                        const prevBallX = ball.x - ball.dx;
                        const prevBallY = ball.y - ball.dy;

                        // Horizontal collision
                        if (prevBallX + ball.radius <= block.x || prevBallX - ball.radius >= block.x + block.width) {
                            ball.dx = -ball.dx;
                        }
                        // Vertical collision
                        else {
                            ball.dy = -ball.dy;
                        }

                        // Block hit
                        block.active = false;
                        self.score += 10;

                        const blockSound = document.getElementById("blockSound");
                        if (blockSound && blockSound.readyState >= 2) blockSound.play();

                        // Update Razor UI score live
                        DotNet.invokeMethodAsync('YourProjectNamespace', 'UpdateScore', self.score);
                    }
                }
            });

            // Paddle movement
            if (self.rightPressed && paddle.x < ctx.canvas.width - paddle.width) paddle.x += 5;
            else if (self.leftPressed && paddle.x > 0) paddle.x -= 5;

            self.animationId = requestAnimationFrame(update);
        }

        update();
    },

    stop: function () {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    reset: function () {
        this.stop(); // Stop the game immediately
        this.gameOverFlag = false;

        // Reset ball and paddle
        this.ball.x = 300;
        this.ball.y = 350;
        this.ball.dx = 2;
        this.ball.dy = -2;
        this.paddle.x = 250;

        // Reset blocks
        this.blocks.forEach(block => {
            block.active = true;
            block.y = block.y % 100; // reset to starting height
        });

        // Reset score
        this.score = 0;

        // Update Razor UI score immediately
        DotNet.invokeMethodAsync('YourProjectNamespace', 'UpdateScore', this.score);
    }
};
