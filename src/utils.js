export const Utils = {
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    ang: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    rand: (min, max) => Math.random() * (max - min) + min,
    randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // Simple fast PRNG (Mulberry32)
    mulberry32: (a) => {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    },
    // String hasher to generate a seed number from a string (cyrb53)
    cyrb53: (str, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    },

    lerpColor: (a, b, amount) => {
        const norm = (hex) => {
            hex = (hex || '').replace(/^#/, '');
            if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
            if (hex.length >= 8) hex = hex.substring(0, 6);
            if (hex.length === 0) hex = '000000';
            return hex;
        };
        a = norm(a);
        b = norm(b);

        const ah = parseInt(a, 16) || 0;
        const ar = (ah >> 16) & 255, ag = (ah >> 8) & 255, ab = ah & 255;
        const bh = parseInt(b, 16) || 0;
        const br = (bh >> 16) & 255, bg = (bh >> 8) & 255, bb = bh & 255;

        const step = (start, end) => {
            const diff = end - start;
            if (diff === 0) return start;
            const s = diff * amount;
            return start + (Math.abs(s) < 1 ? Math.sign(s) : Math.round(s));
        };

        const rr = step(ar, br);
        const rg = step(ag, bg);
        const rb = step(ab, bb);

        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
    },

    distToSegment: (px, py, x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) return Utils.dist(px, py, x1, y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        return Utils.dist(px, py, x1 + t * dx, y1 + t * dy);
    }
};
