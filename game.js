class BallBarrierGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.balls = [];
        this.lines = [];
        this.gameStarted = false;
        this.gameTime = 0;
        this.lastTime = 0;
        this.isDrawing = false;
        this.currentLine = null;
        this.currentLinePoints = [];
        this.ballSpeed = 2;
        this.ballCount = 1;
        this.nextBallSpawn = 5; // spawn new ball every 5 seconds
        
        this.worldSize = 10;
        this.boundarySize = this.worldSize * 0.9;
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001122);
        
        // Camera setup (top-down view)
        this.camera = new THREE.OrthographicCamera(
            -this.worldSize/2, this.worldSize/2,
            this.worldSize/2, -this.worldSize/2,
            1, 1000
        );
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        this.scene.add(directionalLight);
        
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x336699 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Boundary walls (invisible collision boxes)
        this.createBoundaryWalls();
        
        this.resize();
    }
    
    createBoundaryWalls() {
        const wallThickness = 0.1;
        const wallHeight = 1;
        const wallMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.3 
        });
        
        const walls = [
            { pos: [0, wallHeight/2, this.boundarySize/2], size: [this.boundarySize, wallHeight, wallThickness] },
            { pos: [0, wallHeight/2, -this.boundarySize/2], size: [this.boundarySize, wallHeight, wallThickness] },
            { pos: [this.boundarySize/2, wallHeight/2, 0], size: [wallThickness, wallHeight, this.boundarySize] },
            { pos: [-this.boundarySize/2, wallHeight/2, 0], size: [wallThickness, wallHeight, this.boundarySize] }
        ];
        
        this.boundaryWalls = walls.map(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.pos);
            mesh.userData.isBoundary = true;
            this.scene.add(mesh);
            return mesh;
        });
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onPointerUp.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.onPointerDown.bind(this));
        this.canvas.addEventListener('touchmove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('touchend', this.onPointerUp.bind(this));
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', e => e.preventDefault());
        this.canvas.addEventListener('touchmove', e => e.preventDefault());
        
        // Window resize
        window.addEventListener('resize', this.resize.bind(this));
        
        // Game controls
        document.getElementById('startButton').addEventListener('click', this.startGame.bind(this));
        document.getElementById('restartButton').addEventListener('click', this.restartGame.bind(this));
    }
    
    getPointerPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (event.type.startsWith('touch')) {
            clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX;
            clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
        
        const worldX = x * this.worldSize / 2;
        const worldZ = -y * this.worldSize / 2;
        
        return { x: worldX, z: worldZ };
    }
    
    onPointerDown(event) {
        if (!this.gameStarted) return;
        
        event.preventDefault();
        this.isDrawing = true;
        
        const pos = this.getPointerPosition(event);
        this.currentLinePoints = [new THREE.Vector3(pos.x, 0.1, pos.z)];
    }
    
    onPointerMove(event) {
        if (!this.gameStarted || !this.isDrawing) return;
        
        event.preventDefault();
        const pos = this.getPointerPosition(event);
        const newPoint = new THREE.Vector3(pos.x, 0.1, pos.z);
        
        // Only add point if it's far enough from the last point
        const lastPoint = this.currentLinePoints[this.currentLinePoints.length - 1];
        if (lastPoint.distanceTo(newPoint) > 0.1) {
            this.currentLinePoints.push(newPoint);
            this.updateCurrentLine();
        }
    }
    
    onPointerUp(event) {
        if (!this.gameStarted || !this.isDrawing) return;
        
        event.preventDefault();
        this.isDrawing = false;
        
        if (this.currentLinePoints.length > 1) {
            this.finalizeLine();
        }
        
        this.currentLinePoints = [];
    }
    
    updateCurrentLine() {
        if (this.currentLine) {
            this.scene.remove(this.currentLine);
        }
        
        if (this.currentLinePoints.length < 2) return;
        
        const geometry = new THREE.BufferGeometry().setFromPoints(this.currentLinePoints);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 3 
        });
        
        this.currentLine = new THREE.Line(geometry, material);
        this.scene.add(this.currentLine);
    }
    
    finalizeLine() {
        if (this.currentLinePoints.length < 2) return;
        
        // Create collision line segments
        const lineSegments = [];
        for (let i = 0; i < this.currentLinePoints.length - 1; i++) {
            lineSegments.push({
                start: this.currentLinePoints[i].clone(),
                end: this.currentLinePoints[i + 1].clone()
            });
        }
        
        // Create visual line with tube geometry for 3D effect
        const curve = new THREE.CatmullRomCurve3(this.currentLinePoints);
        const tubeGeometry = new THREE.TubeGeometry(curve, this.currentLinePoints.length * 2, 0.05, 8, false);
        const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tubeMesh.castShadow = true;
        tubeMesh.receiveShadow = true;
        
        this.scene.add(tubeMesh);
        
        this.lines.push({
            mesh: tubeMesh,
            segments: lineSegments
        });
        
        // Remove current drawing line
        if (this.currentLine) {
            this.scene.remove(this.currentLine);
            this.currentLine = null;
        }
        
        // Check if line goes out of bounds
        this.checkLineOutOfBounds();
    }
    
    checkLineOutOfBounds() {
        for (const line of this.lines) {
            for (const segment of line.segments) {
                if (Math.abs(segment.start.x) > this.boundarySize/2 || 
                    Math.abs(segment.start.z) > this.boundarySize/2 ||
                    Math.abs(segment.end.x) > this.boundarySize/2 || 
                    Math.abs(segment.end.z) > this.boundarySize/2) {
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    spawnBall() {
        const ballGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const ballMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6) 
        });
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        
        ballMesh.position.set(0, 0.15, 0);
        ballMesh.castShadow = true;
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * this.ballSpeed,
            0,
            Math.sin(angle) * this.ballSpeed
        );
        
        this.scene.add(ballMesh);
        
        this.balls.push({
            mesh: ballMesh,
            velocity: velocity,
            radius: 0.15
        });
    }
    
    updateBalls(deltaTime) {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            
            // Move ball
            ball.mesh.position.add(ball.velocity.clone().multiplyScalar(deltaTime));
            
            // Check boundary collision
            if (Math.abs(ball.mesh.position.x) > this.boundarySize/2 - ball.radius ||
                Math.abs(ball.mesh.position.z) > this.boundarySize/2 - ball.radius) {
                this.gameOver();
                return;
            }
            
            // Check line collision
            this.checkBallLineCollision(ball);
        }
    }
    
    checkBallLineCollision(ball) {
        for (const line of this.lines) {
            for (const segment of line.segments) {
                if (this.pointToLineDistance(ball.mesh.position, segment.start, segment.end) < ball.radius) {
                    // Simple reflection
                    const lineDirection = segment.end.clone().sub(segment.start).normalize();
                    const normal = new THREE.Vector3(-lineDirection.z, 0, lineDirection.x);
                    
                    const dot = ball.velocity.dot(normal);
                    ball.velocity.sub(normal.multiplyScalar(2 * dot));
                    
                    // Move ball away from line to prevent sticking
                    const toBall = ball.mesh.position.clone().sub(segment.start);
                    const projection = toBall.dot(lineDirection);
                    const closestPoint = segment.start.clone().add(lineDirection.multiplyScalar(projection));
                    const pushDirection = ball.mesh.position.clone().sub(closestPoint).normalize();
                    ball.mesh.position.add(pushDirection.multiplyScalar(ball.radius - this.pointToLineDistance(ball.mesh.position, segment.start, segment.end) + 0.01));
                }
            }
        }
    }
    
    pointToLineDistance(point, lineStart, lineEnd) {
        const line = lineEnd.clone().sub(lineStart);
        const pointToStart = point.clone().sub(lineStart);
        const t = Math.max(0, Math.min(1, pointToStart.dot(line) / line.lengthSq()));
        const projection = lineStart.clone().add(line.multiplyScalar(t));
        return point.distanceTo(projection);
    }
    
    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        this.gameStarted = true;
        this.gameTime = 0;
        this.ballSpeed = 2;
        this.ballCount = 1;
        this.nextBallSpawn = 5;
        
        // Clear any existing balls and lines
        this.balls.forEach(ball => this.scene.remove(ball.mesh));
        this.lines.forEach(line => this.scene.remove(line.mesh));
        this.balls = [];
        this.lines = [];
        
        // Spawn first ball
        this.spawnBall();
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    restartGame() {
        document.getElementById('gameOver').style.display = 'none';
        this.startGame();
    }
    
    gameOver() {
        this.gameStarted = false;
        document.getElementById('finalTime').textContent = this.gameTime.toFixed(1);
        document.getElementById('gameOver').style.display = 'block';
    }
    
    gameLoop() {
        if (!this.gameStarted) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.gameTime += deltaTime;
        
        // Update UI
        document.getElementById('timer').textContent = this.gameTime.toFixed(1);
        document.getElementById('ballCount').textContent = this.balls.length;
        
        // Increase difficulty over time
        this.ballSpeed = 2 + this.gameTime * 0.1;
        
        // Spawn new balls
        if (this.gameTime > this.nextBallSpawn) {
            this.spawnBall();
            this.nextBallSpawn += Math.max(3, 8 - this.gameTime * 0.1); // Spawn faster over time
        }
        
        // Update balls
        this.updateBalls(deltaTime);
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        // Adjust camera aspect ratio while maintaining top-down view
        const aspect = width / height;
        if (aspect > 1) {
            // Landscape
            this.camera.left = -this.worldSize/2 * aspect;
            this.camera.right = this.worldSize/2 * aspect;
            this.camera.top = this.worldSize/2;
            this.camera.bottom = -this.worldSize/2;
        } else {
            // Portrait
            this.camera.left = -this.worldSize/2;
            this.camera.right = this.worldSize/2;
            this.camera.top = this.worldSize/2 / aspect;
            this.camera.bottom = -this.worldSize/2 / aspect;
        }
        
        this.camera.updateProjectionMatrix();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new BallBarrierGame();
});