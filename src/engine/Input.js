export const Input = {
    keys: {},
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, left: false, right: false },
    init(canvas, camera) {
        if (window.__inputInitialized) return;
        window.__inputInitialized = true;

        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
        window.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - r.left;
            this.mouse.y = e.clientY - r.top;
        });
        window.addEventListener('mousedown', e => { 
            if (e.button === 0) this.mouse.left = true; 
            if (e.button === 2) this.mouse.right = true;
        });
        window.addEventListener('mouseup', e => { 
            if (e.button === 0) this.mouse.left = false; 
            if (e.button === 2) this.mouse.right = false;
        });
        window.addEventListener('contextmenu', e => e.preventDefault());
    },
    update(camera) {
        this.mouse.worldX = (this.mouse.x / camera.zoom) + camera.x;
        this.mouse.worldY = (this.mouse.y / camera.zoom) + camera.y;
    }
};
