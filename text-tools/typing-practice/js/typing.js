// ===================== TYPING ENGINE =====================
class TypingEngine {
    constructor() {
        this.words = [];
        this.wordEls = [];
        this.currentWord = 0;
        this.currentChar = 0;
        this.state = 'idle';
        this.startTime = null;
        this.timerInterval = null;
        this.correctChars = 0;
        this.totalChars = 0;
        this.errors = 0;
        this.wpmHistory = [];
        this.caretEl = document.createElement('span');
        this.caretEl.id = 'typingCaret';
        this.mode = 'time';
        this.duration = 60;
        this.lastSecond = 0;
    }

    init(text, mode = 'time', duration = 60) {
        this.words = text.split(' ').filter(w => w.length > 0);
        this.currentWord = 0;
        this.currentChar = 0;
        this.state = 'idle';
        this.startTime = null;
        this.correctChars = 0;
        this.totalChars = 0;
        this.errors = 0;
        this.wpmHistory = [];
        this.lastSecond = 0;
        this.mode = mode;
        this.duration = duration;
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
        this.renderWords();
    }

    renderWords() {
        const display = document.getElementById('wordDisplay');
        if (!display) return;
        display.innerHTML = '';
        display.scrollTop = 0;
        this.wordEls = [];

        this.words.forEach((word, idx) => {
            const wordEl = document.createElement('span');
            wordEl.className = 'word';
            wordEl.dataset.idx = idx;
            word.split('').forEach(char => {
                const charEl = document.createElement('span');
                charEl.className = 'letter';
                charEl.textContent = char;
                wordEl.appendChild(charEl);
            });
            display.appendChild(wordEl);
            display.appendChild(document.createTextNode(' '));
            this.wordEls.push(wordEl);
        });

        this.updateCaret();
        this.updateStatsDisplay(0, this.mode === 'time' ? this.duration : 0, 100);
    }

    updateCaret() {
        if (this.caretEl.parentNode) this.caretEl.parentNode.removeChild(this.caretEl);
        const wordEl = this.wordEls[this.currentWord];
        if (!wordEl) return;
        const letters = wordEl.querySelectorAll('.letter');
        if (this.currentChar < letters.length) {
            wordEl.insertBefore(this.caretEl, letters[this.currentChar]);
        } else {
            wordEl.appendChild(this.caretEl);
        }
        this.scrollIfNeeded();
    }

    scrollIfNeeded() {
        const display = document.getElementById('wordDisplay');
        const wordEl = this.wordEls[this.currentWord];
        if (!display || !wordEl) return;
        const lineH = 44;
        const relTop = wordEl.offsetTop - display.scrollTop;
        if (relTop >= lineH * 2) display.scrollTop += lineH;
    }

    handleKey(key) {
        if (this.state === 'finished') return;
        if (key === 'Backspace') { this.handleBackspace(); return; }

        if (this.state === 'idle') {
            if (key === ' ' || key.length !== 1) return;
            this.startTimer();
        }
        if (this.state !== 'running') return;

        if (key === ' ') { this.goToNextWord(); }
        else if (key.length === 1) { this.typeChar(key); }
    }

    startTimer() {
        this.state = 'running';
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.tick(), 100);
    }

    typeChar(char) {
        const wordEl = this.wordEls[this.currentWord];
        if (!wordEl) return;
        const letters = wordEl.querySelectorAll('.letter');
        this.totalChars++;

        if (this.currentChar < this.words[this.currentWord].length) {
            const expected = this.words[this.currentWord][this.currentChar];
            if (char === expected) {
                letters[this.currentChar].className = 'letter correct';
                this.correctChars++;
            } else {
                letters[this.currentChar].className = 'letter incorrect';
                this.errors++;
            }
        } else {
            const extra = document.createElement('span');
            extra.className = 'letter extra';
            extra.textContent = char;
            wordEl.appendChild(extra);
            this.errors++;
        }
        this.currentChar++;
        this.updateCaret();
    }

    handleBackspace() {
        if (this.currentChar === 0) return;
        this.currentChar--;
        this.totalChars = Math.max(0, this.totalChars - 1);
        const wordEl = this.wordEls[this.currentWord];
        const letters = wordEl.querySelectorAll('.letter');
        const extras = wordEl.querySelectorAll('.extra');

        if (this.currentChar >= this.words[this.currentWord].length && extras.length > 0) {
            extras[extras.length - 1].remove();
        } else if (this.currentChar < letters.length) {
            const cls = letters[this.currentChar].className;
            if (cls.includes('incorrect')) this.errors = Math.max(0, this.errors - 1);
            else this.correctChars = Math.max(0, this.correctChars - 1);
            letters[this.currentChar].className = 'letter';
        }
        this.updateCaret();
    }

    goToNextWord() {
        if (this.currentChar === 0) return;
        const wordEl = this.wordEls[this.currentWord];
        const letters = wordEl.querySelectorAll('.letter');
        const extras = wordEl.querySelectorAll('.extra');
        const allCorrect = this.currentChar === this.words[this.currentWord].length &&
            extras.length === 0 &&
            Array.from(letters).every(l => l.className === 'letter correct');

        wordEl.classList.add(allCorrect ? 'word-correct' : 'word-error');
        this.currentWord++;
        this.currentChar = 0;

        if (this.currentWord >= this.words.length) { this.finish(); return; }
        this.updateCaret();
    }

    tick() {
        if (!this.startTime) return;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const wpm = elapsed > 0 ? Math.round((this.correctChars / 5) / (elapsed / 60)) : 0;
        const sec = Math.floor(elapsed);
        if (sec > this.lastSecond) { this.wpmHistory.push(wpm); this.lastSecond = sec; }

        if (this.mode === 'time') {
            const remaining = Math.max(0, this.duration - elapsed);
            this.updateStatsDisplay(wpm, Math.ceil(remaining), this.getAccuracy(), elapsed / this.duration);
            if (remaining <= 0) { this.finish(); return; }
        } else {
            const progress = this.currentWord / this.words.length;
            this.updateStatsDisplay(wpm, Math.floor(elapsed), this.getAccuracy(), progress);
        }
    }

    updateStatsDisplay(wpm, timer, accuracy, progress = 0) {
        const el = id => document.getElementById(id);
        if (el('liveWpm')) el('liveWpm').textContent = wpm;
        if (el('liveAccuracy')) el('liveAccuracy').textContent = accuracy;
        if (el('timerDisplay')) {
            el('timerDisplay').textContent = timer;
            el('timerDisplay').className = this.mode === 'time' && timer <= 10 ? 'text-red-400 text-2xl font-bold font-mono tabular-nums' : 'text-gray-200 text-2xl font-bold font-mono tabular-nums';
        }
        if (el('progressBar')) el('progressBar').style.width = (Math.min(progress, 1) * 100) + '%';
    }

    getAccuracy() {
        if (this.totalChars === 0) return 100;
        return Math.round((this.correctChars / this.totalChars) * 100);
    }

    getStats() {
        const elapsed = Math.max(1, (Date.now() - this.startTime) / 1000);
        const wpm = Math.max(0, Math.round((this.correctChars / 5) / (elapsed / 60)));
        const rawWpm = Math.max(0, Math.round((this.totalChars / 5) / (elapsed / 60)));
        const accuracy = this.getAccuracy();
        const avg = this.wpmHistory.length ? this.wpmHistory.reduce((a, b) => a + b, 0) / this.wpmHistory.length : wpm;
        const variance = this.wpmHistory.length ? this.wpmHistory.reduce((a, v) => a + (v - avg) ** 2, 0) / this.wpmHistory.length : 0;
        const consistency = avg > 0 ? Math.max(0, Math.round(100 - (Math.sqrt(variance) / avg) * 100)) : 100;
        return { wpm, rawWpm, accuracy, correctChars: this.correctChars, totalChars: this.totalChars, errors: this.errors, elapsed: Math.round(elapsed), consistency, wpmHistory: this.wpmHistory };
    }

    finish() {
        if (this.state === 'finished') return;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.state = 'finished';
        const stats = this.getStats();
        if (window.App) window.App.showResults(stats);
    }

    reset() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.state = 'idle';
        this.startTime = null;
        this.correctChars = 0;
        this.totalChars = 0;
        this.errors = 0;
        this.wpmHistory = [];
        this.lastSecond = 0;
        this.currentWord = 0;
        this.currentChar = 0;
        if (this.caretEl.parentNode) this.caretEl.parentNode.removeChild(this.caretEl);
        this.renderWords();
    }
}

const engine = new TypingEngine();
