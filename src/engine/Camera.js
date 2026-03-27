export class Camera {
    constructor(canvas) {
        this.x = 0; this.y = 0;
        this.w = canvas.width; this.h = canvas.height;
        this.zoom = 1.0;
        this.viewW = canvas.width;
        this.viewH = canvas.height;
    }
    follow(target, smooth = 0.1) {
        this.viewW = this.w / this.zoom;
        this.viewH = this.h / this.zoom;
        this.x += (target.x - this.viewW / 2 - this.x) * smooth;
        this.y += (target.y - this.viewH / 2 - this.y) * smooth;
    }
}
