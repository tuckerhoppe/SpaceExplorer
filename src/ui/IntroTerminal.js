
export class IntroTerminal {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.container = document.getElementById('intro-terminal');
        this.textElement = document.getElementById('terminal-text');
        this.skipElement = document.getElementById('terminal-skip');
        this.startBtn = document.getElementById('terminal-start-btn');

        this.lines = [
            "THE GALACTIC REACH is a dangerous place, but it contains the most valuable resource in the galaxy: GEMS.",
            "",
            "Gather gems to your cargo hold from DESTROYING asteroids. Then drop them off at any SPACE STATION to empty your cargo and move your gems to the gem vault.",
            "",
            "DISCOVER new regions, planets, nebulas, stars and stations to earn SCIENCE POINTS.",
            "",
            "DIFFERENT REGIONS have more valuable asteroids, but also more dangerous enemies.",
            "You will need to UPGRADE your ship to survive."
        ];

        this.currentLineIndex = 0;
        this.currentCharIndex = 0;
        this.isTyping = false;
        this.isFastForwarded = false;
        this.isComplete = false;
        this.typeSpeed = 30; // ms per char
        this.lineDelay = 700; // ms between lines

        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundStartGame = this.finish.bind(this);
    }

    start() {
        this.container.classList.remove('hidden');
        this.textElement.innerHTML = '';
        this.startBtn.classList.add('hidden');
        this.startBtn.classList.remove('show');
        this.skipElement.classList.remove('hidden');

        this.typeNextChar();

        window.addEventListener('keydown', this.boundHandleKeyDown);
        this.container.addEventListener('click', this.boundHandleKeyDown);
        this.startBtn.addEventListener('click', this.boundStartGame);
    }

    typeNextChar() {
        if (this.isFastForwarded || this.isComplete) return;

        this.isTyping = true;
        const line = this.lines[this.currentLineIndex];

        if (this.currentCharIndex < line.length) {
            const char = line[this.currentCharIndex];
            this.textElement.innerHTML += char === '\n' ? '<br>' : char;
            this.currentCharIndex++;
            setTimeout(() => this.typeNextChar(), this.typeSpeed);
        } else {
            this.isTyping = false;
            this.currentLineIndex++;
            this.currentCharIndex = 0;

            if (this.currentLineIndex < this.lines.length) {
                this.textElement.innerHTML += '<br>';
                setTimeout(() => this.typeNextChar(), this.lineDelay);
            } else {
                this.showStartButton();
            }
        }
    }

    handleKeyDown(e) {
        // If clicking on the button itself, don't trigger fast-forward
        if (e.target === this.startBtn) return;

        if (!this.isFastForwarded) {
            this.fastForward();
        }
    }

    fastForward() {
        this.isFastForwarded = true;
        this.isTyping = false;
        let fullText = "";
        for (let i = 0; i < this.lines.length; i++) {
            fullText += this.lines[i] + "<br>";
        }
        this.textElement.innerHTML = fullText;
        this.showStartButton();
    }

    showStartButton() {
        this.skipElement.classList.add('hidden');
        this.startBtn.classList.remove('hidden');
        setTimeout(() => this.startBtn.classList.add('show'), 50);
    }

    finish(e) {
        if (e) e.stopPropagation();

        this.isComplete = true;
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        this.container.removeEventListener('click', this.boundHandleKeyDown);
        this.startBtn.removeEventListener('click', this.boundStartGame);

        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.8s ease';

        setTimeout(() => {
            this.container.classList.add('hidden');
            if (this.onComplete) this.onComplete();
        }, 800);
    }
}
