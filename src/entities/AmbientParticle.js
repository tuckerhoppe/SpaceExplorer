import { Utils } from '../utils.js';

export class AmbientParticle {
    constructor(camera, type) {
        this.type = type;
        this.camera = camera;
        this.reset(true);
    }

    reset(initialSpawn = false) {
        // Spawn randomly within or just outside the camera viewport
        const pad = initialSpawn ? 0 : 200;
        this.x = this.camera.x + Utils.rand(-pad, this.camera.viewW + pad);
        this.y = this.camera.y + Utils.rand(-pad, this.camera.viewH + pad);

        this.life = Utils.rand(300, 800); // 5-13 seconds roughly
        this.maxLife = this.life;
        this.tick = Utils.randInt(0, 1000);

        // Assign visual/motion properties based on region type
        switch (this.type) {
            case 'dust':
                this.size = Utils.rand(2, 6);
                this.vx = Utils.rand(-0.5, 0.5);
                this.vy = Utils.rand(0.5, 1.5); // drifting down
                this.color = `rgba(180, 100, 40, ${Utils.rand(0.1, 0.5)})`;
                this.parallax = Utils.rand(0.8, 1.2);
                break;
            case 'spore':
                this.size = Utils.rand(1, 4);
                this.vx = Utils.rand(-0.2, 0.2);
                this.vy = Utils.rand(-0.5, 0.1); // drifting up slowly
                this.color = Utils.rand() > 0.5 ? '#00ffa0' : '#40ff40';
                this.parallax = Utils.rand(0.7, 1.3);
                break;
            case 'ember':
                this.size = Utils.rand(1, 3);
                this.vx = Utils.rand(-1, 1);
                this.vy = Utils.rand(-1, 1);
                this.color = Utils.rand() > 0.7 ? '#ffaa00' : '#ff3300';
                this.parallax = Utils.rand(0.9, 1.5);
                break;
            case 'rift':
                this.size = Utils.rand(4, 12);
                this.vx = Utils.rand(-0.1, 0.1);
                this.vy = Utils.rand(-0.1, 0.1);
                this.color = Utils.rand() > 0.7 ? '#e397efff' : '#fb51fbff';
                this.parallax = Utils.rand(0.5, 0.8); // deep background
                break;
            case 'spectral':
                this.size = Utils.rand(5, 15);
                this.vx = Utils.rand(-0.2, 0.2);
                this.vy = Utils.rand(-0.2, 0.2);
                this.color = Utils.rand() > 0.5 ? '#ffffff' : '#d0d0ff';
                this.parallax = Utils.rand(0.6, 1.1);
                break;
            default:
                this.size = 1; this.vx = 0; this.vy = 0;
                this.color = '#fff'; this.parallax = 1;
        }
    }

    update() {
        this.life--;
        this.tick++;

        // Add some sine wave wobble to movement
        const wobble = Math.sin(this.tick * 0.05) * 0.2;

        if (this.type === 'spore') {
            this.x += this.vx + wobble;
            this.y += this.vy;
        } else if (this.type === 'ember') {
            this.x += this.vx;
            this.y += this.vy + (Math.random() - 0.5) * 0.5; // jitter
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }

        // Wrapping logic: if particle wanders too far offscreen, wrap it around to maintain density
        const pad = 200;
        if (this.x < this.camera.x - pad) this.x = this.camera.x + this.camera.viewW + pad;
        if (this.x > this.camera.x + this.camera.viewW + pad) this.x = this.camera.x - pad;
        if (this.y < this.camera.y - pad) this.y = this.camera.y + this.camera.viewH + pad;
        if (this.y > this.camera.y + this.camera.viewH + pad) this.y = this.camera.y - pad;
    }

    draw(ctx) {
        // Fade in and out at start and end of life
        let alphaMod = 1;
        if (this.life < 60) alphaMod = this.life / 60;
        else if (this.maxLife - this.life < 60) alphaMod = (this.maxLife - this.life) / 60;

        ctx.save();
        ctx.globalAlpha = alphaMod;

        // Apply parallax offset relative to camera
        const px = this.x - this.camera.x * this.parallax;
        const py = this.y - this.camera.y * this.parallax;

        ctx.translate(px, py);

        if (this.type === 'dust') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 'spore') {
            // Glowing orb
            const pulse = 1 + Math.sin(this.tick * 0.1) * 0.3;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, this.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ember') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'rift') {
            // Soft atmospheric patch
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 2, this.size, Math.sin(this.tick * 0.02), 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spectral') {
            // Soft, ghostly wisp
            const pulse = 1 + Math.sin(this.tick * 0.04) * 0.2;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
            grad.addColorStop(0, this.color);
            grad.addColorStop(0.5, this.color + '44'); // semi-transparent
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            // Irregular shape for spookiness
            const offset = Math.sin(this.tick * 0.1) * 5;
            ctx.arc(offset, 0, this.size * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
