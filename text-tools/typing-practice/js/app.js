// ===================== MAIN APP LOGIC =====================
const App = {
    mode: 'time',
    subMode: '60',
    punctuation: false,
    numbers: false,
    customText: '',
    quoteSize: 'medium',
    settings: { darkMode: true, caretStyle: 'bar', soundOnError: false, blindMode: false },
    currentUser: null,

    async init() {
        await DB.init();
        await this.loadSettings();
        this.applySettings();
        const session = Auth.getSession();
        if (session) {
            this.currentUser = await Auth.getCurrentUser();
            if (this.currentUser) this.updateAuthUI();
        }
        this.loadText();
        this.bindEvents();
        this.loadLeaderboard();
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    },

    async loadSettings() {
        try {
            const s = await DB.get('settings', 1);
            if (s) this.settings = { ...this.settings, ...s };
        } catch { }
    },

    async saveSettings() {
        await DB.update('settings', { id: 1, ...this.settings });
        this.applySettings();
    },

    applySettings() {
        const html = document.documentElement;
        if (this.settings.darkMode) html.classList.add('dark'); else html.classList.remove('dark');
        const caret = document.getElementById('typingCaret');
        if (caret) {
            caret.className = 'typing-caret';
            if (this.settings.caretStyle === 'block') caret.classList.add('caret-block');
            if (this.settings.caretStyle === 'underline') caret.classList.add('caret-underline');
        }
        // Update settings checkboxes
        const dm = document.getElementById('settingDarkMode');
        if (dm) dm.checked = this.settings.darkMode;
        const cs = document.getElementById('settingCaret');
        if (cs) cs.value = this.settings.caretStyle;
        const se = document.getElementById('settingSoundError');
        if (se) se.checked = this.settings.soundOnError;
        const bm = document.getElementById('settingBlindMode');
        if (bm) bm.checked = this.settings.blindMode;
    },

    loadText() {
        const text = TextGenerator.generate(this.mode, this.subMode, {
            punctuation: this.punctuation,
            numbers: this.numbers,
            customText: this.customText,
            quoteSize: this.quoteSize
        });
        const dur = this.mode === 'time' ? parseInt(this.subMode) || 60 : 999999;
        engine.init(text, this.mode, dur);
        this.hideResults();
    },

    showResults(stats) {
        document.getElementById('testArea').classList.add('hidden');
        const res = document.getElementById('resultsArea');
        res.classList.remove('hidden');

        document.getElementById('resWpm').textContent = stats.wpm;
        document.getElementById('resAccuracy').textContent = stats.accuracy + '%';
        document.getElementById('resRawWpm').textContent = stats.rawWpm;
        document.getElementById('resChars').textContent = `${stats.correctChars}/${stats.totalChars}`;
        document.getElementById('resErrors').textContent = stats.errors;
        document.getElementById('resTime').textContent = stats.elapsed + 's';
        document.getElementById('resConsistency').textContent = stats.consistency + '%';

        this.renderChart(stats.wpmHistory);

        if (this.currentUser) {
            Auth.saveTestResult(stats, this.mode, this.subMode).then(result => {
                if (result) {
                    const badge = document.getElementById('xpBadge');
                    if (badge) { badge.textContent = `+${result.xpGained} XP`; badge.classList.remove('hidden'); }

                    this.currentUser = null;
                    Auth.getCurrentUser().then(u => { this.currentUser = u; this.updateAuthUI(); });
                }
                this.loadLeaderboard();
            });
        }
    },

    renderChart(history) {
        const svg = document.getElementById('wpmChart');
        if (!svg || !history.length) return;
        const w = svg.clientWidth || 500, h = 80;
        const max = Math.max(...history, 1);
        const pts = history.map((v, i) => {
            const x = (i / Math.max(history.length - 1, 1)) * w;
            const y = h - (v / max) * h;
            return `${x},${y}`;
        }).join(' ');
        svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="#e2a613" stroke-width="2" stroke-linejoin="round"/>
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e2a613" stop-opacity="0.3"/><stop offset="100%" stop-color="#e2a613" stop-opacity="0"/></linearGradient></defs>
      <polygon points="0,${h} ${pts} ${w},${h}" fill="url(#g)"/>`;
    },

    hideResults() {
        document.getElementById('testArea').classList.remove('hidden');
        document.getElementById('resultsArea').classList.add('hidden');
        const badge = document.getElementById('xpBadge');
        if (badge) badge.classList.add('hidden');
    },

    restart() { this.loadText(); document.getElementById('wordDisplayWrapper').focus(); },

    bindEvents() {
        // Mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mode = btn.dataset.mode;
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('mode-active'));
                btn.classList.add('mode-active');
                this.updateSubModes();
                this.loadText();
                document.getElementById('wordDisplayWrapper').focus();
            });
        });

        // Submode buttons
        document.getElementById('subModeBar').addEventListener('click', e => {
            const btn = e.target.closest('[data-sub]');
            if (!btn) return;
            this.subMode = btn.dataset.sub;
            document.querySelectorAll('[data-sub]').forEach(b => b.classList.remove('sub-active'));
            btn.classList.add('sub-active');
            this.loadText();
            document.getElementById('wordDisplayWrapper').focus();
        });

        // Custom time/words input
        document.getElementById('customSubInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const val = parseInt(e.target.value);
                if (val > 0) { this.subMode = val.toString(); this.loadText(); }
            }
        });

        // Toggles
        ['btnPunct', 'btnNums'].forEach(id => {
            document.getElementById(id).addEventListener('click', () => {
                const btn = document.getElementById(id);
                if (id === 'btnPunct') { this.punctuation = !this.punctuation; btn.classList.toggle('toggle-active', this.punctuation); }
                else { this.numbers = !this.numbers; btn.classList.toggle('toggle-active', this.numbers); }
                this.loadText();
            });
        });

        // Quote size
        document.getElementById('quoteSizeBar')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-qsize]');
            if (!btn) return;
            this.quoteSize = btn.dataset.qsize;
            this.subMode = this.quoteSize;
            document.querySelectorAll('[data-qsize]').forEach(b => b.classList.remove('sub-active'));
            btn.classList.add('sub-active');
            this.loadText();
        });

        // Custom text
        document.getElementById('customTextInput')?.addEventListener('input', e => {
            this.customText = e.target.value;
        });
        document.getElementById('customApplyBtn')?.addEventListener('click', () => { this.loadText(); document.getElementById('wordDisplayWrapper').focus(); });

        // Typing area focus
        const wrapper = document.getElementById('wordDisplayWrapper');
        wrapper.addEventListener('click', () => wrapper.focus());
        wrapper.addEventListener('focus', () => { wrapper.classList.remove('unfocused'); });
        wrapper.addEventListener('blur', () => {
            if (engine.state === 'idle') wrapper.classList.add('unfocused');
        });

        // Keyboard input
        wrapper.addEventListener('keydown', e => {
            const key = e.key;
            if (key === 'Tab') { e.preventDefault(); this.restart(); return; }
            if (key === 'Escape') { e.preventDefault(); this.restart(); return; }
            if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key)) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            e.preventDefault();
            engine.handleKey(key);
            if (this.settings.soundOnError && engine.errors > 0) { /* optional beep */ }
        });

        // Mobile input fallback
        const mobileInput = document.getElementById('mobileInput');
        if (mobileInput) {
            mobileInput.addEventListener('input', e => {
                const val = e.target.value;
                e.target.value = '';
                for (const ch of val) engine.handleKey(ch);
            });
            mobileInput.addEventListener('keydown', e => {
                if (e.key === 'Backspace') engine.handleKey('Backspace');
                if (e.key === ' ') { e.preventDefault(); engine.handleKey(' '); }
            });
            wrapper.addEventListener('focus', () => { if (window.innerWidth < 768) mobileInput.focus(); });
        }

        // Results buttons
        document.getElementById('btnRestart')?.addEventListener('click', () => this.restart());
        document.getElementById('btnNextTest')?.addEventListener('click', () => this.restart());

        // Auth
        document.getElementById('btnSignIn')?.addEventListener('click', () => this.showModal('auth'));
        document.getElementById('btnRegisterNav')?.addEventListener('click', () => { this.showModal('auth'); this.switchAuthTab('register'); });
        document.getElementById('btnSignOut')?.addEventListener('click', () => { Auth.logout(); this.currentUser = null; this.updateAuthUI(); });
        document.getElementById('btnProfile')?.addEventListener('click', () => this.showModal('profile'));
        document.getElementById('tabLogin')?.addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('tabRegister')?.addEventListener('click', () => this.switchAuthTab('register'));
        document.getElementById('loginForm')?.addEventListener('submit', e => { e.preventDefault(); this.doLogin(); });
        document.getElementById('registerForm')?.addEventListener('submit', e => { e.preventDefault(); this.doRegister(); });

        // Settings
        document.getElementById('btnSettings')?.addEventListener('click', () => this.showModal('settings'));
        document.getElementById('settingDarkMode')?.addEventListener('change', e => { this.settings.darkMode = e.target.checked; this.saveSettings(); });
        document.getElementById('settingCaret')?.addEventListener('change', e => { this.settings.caretStyle = e.target.value; this.saveSettings(); });
        document.getElementById('settingSoundError')?.addEventListener('change', e => { this.settings.soundOnError = e.target.checked; this.saveSettings(); });
        document.getElementById('settingBlindMode')?.addEventListener('change', e => { this.settings.blindMode = e.target.checked; this.saveSettings(); });

        // Modal close
        document.querySelectorAll('.modal-close, .modal-overlay-bg').forEach(el => {
            el.addEventListener('click', () => this.closeModal());
        });

        // Leaderboard tabs
        document.getElementById('leaderboardTabs')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-lbtab]');
            if (!btn) return;
            document.querySelectorAll('[data-lbtab]').forEach(b => b.classList.remove('lb-tab-active'));
            btn.classList.add('lb-tab-active');
            this.loadLeaderboard(btn.dataset.lbtab);
        });

        // Mobile menu
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            document.getElementById('mobileMenu')?.classList.toggle('open');
        });

        // FAQ
        document.querySelectorAll('.faq-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const content = btn.nextElementSibling;
                const icon = btn.querySelector('.faq-icon');
                content.classList.toggle('open');
                icon?.classList.toggle('open');
            });
        });
    },

    updateSubModes() {
        const bar = document.getElementById('subModeBar');
        const quoteBar = document.getElementById('quoteSizeBar');
        const customArea = document.getElementById('customArea');
        const subInput = document.getElementById('customSubInputWrap');
        bar.classList.remove('hidden');
        quoteBar?.classList.add('hidden');
        customArea?.classList.add('hidden');
        subInput?.classList.add('hidden');

        bar.innerHTML = '';
        let subs = [];
        if (this.mode === 'time') subs = [{ v: '15', l: '15' }, { v: '30', l: '30' }, { v: '60', l: '60' }, { v: '120', l: '120' }, { v: '300', l: '300' }];
        else if (this.mode === 'words') subs = [{ v: '10', l: '10' }, { v: '25', l: '25' }, { v: '50', l: '50' }, { v: '100', l: '100' }, { v: '200', l: '200' }];
        else if (this.mode === 'quote') {
            bar.classList.add('hidden');
            quoteBar?.classList.remove('hidden');
            return;
        } else if (this.mode === 'custom') {
            bar.classList.add('hidden');
            customArea?.classList.remove('hidden');
            return;
        }

        subs.forEach(({ v, l }, i) => {
            const btn = document.createElement('button');
            btn.dataset.sub = v;
            btn.textContent = l;
            btn.className = 'sub-btn' + (i === 2 ? ' sub-active' : '');
            bar.appendChild(btn);
        });
        // Custom input
        const custom = document.createElement('button');
        custom.dataset.sub = 'custom';
        custom.textContent = '✎';
        custom.title = 'Custom value';
        custom.className = 'sub-btn';
        custom.addEventListener('click', () => { subInput?.classList.toggle('hidden'); });
        bar.appendChild(custom);

        if (this.mode === 'time') this.subMode = '60'; else this.subMode = '50';
        document.querySelectorAll('[data-sub]').forEach(b => {
            if (b.dataset.sub === this.subMode) b.classList.add('sub-active');
        });
    },

    async doLogin() {
        const userVal = document.getElementById('loginUsername').value.trim();
        const pass = document.getElementById('loginPassword').value;
        const errEl = document.getElementById('loginError');
        try {
            this.currentUser = await Auth.login(userVal, pass);
            this.updateAuthUI();
            this.closeModal();
        } catch (e) {
            errEl.textContent = e.message;
            errEl.classList.remove('hidden');
        }
    },

    async doRegister() {
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const pass = document.getElementById('regPassword').value;
        const pass2 = document.getElementById('regPassword2').value;
        const errEl = document.getElementById('registerError');
        if (pass !== pass2) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); return; }
        try {
            this.currentUser = await Auth.register(username, email, pass);
            this.updateAuthUI();
            this.closeModal();
        } catch (e) {
            errEl.textContent = e.message;
            errEl.classList.remove('hidden');
        }
    },

    updateAuthUI() {
        const signInBtn = document.getElementById('btnSignIn');
        const userMenu = document.getElementById('userMenu');
        const userDisplay = document.getElementById('userDisplay');
        if (this.currentUser) {
            signInBtn?.classList.add('hidden');
            userMenu?.classList.remove('hidden');
            const lvl = Auth.getLevel(this.currentUser.xp || 0);
            if (userDisplay) userDisplay.innerHTML = `<span class="level-badge mr-1">${lvl.name}</span><span class="text-sm">${this.currentUser.displayName}</span>`;
        } else {
            signInBtn?.classList.remove('hidden');
            userMenu?.classList.add('hidden');
        }
    },

    showModal(type) {
        const overlay = document.getElementById('modalOverlay');
        overlay.style.display = 'flex';
        ['authModal', 'profileModal', 'settingsModal'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
        if (type === 'auth') {
            document.getElementById('authModal').classList.remove('hidden');
            this.switchAuthTab('login');
        } else if (type === 'profile') {
            document.getElementById('profileModal').classList.remove('hidden');
            this.loadProfile();
        } else if (type === 'settings') {
            document.getElementById('settingsModal').classList.remove('hidden');
        }
    },

    closeModal() {
        document.getElementById('modalOverlay').style.display = 'none';
    },

    switchAuthTab(tab) {
        document.getElementById('loginPanel')?.classList.toggle('hidden', tab !== 'login');
        document.getElementById('registerPanel')?.classList.toggle('hidden', tab !== 'register');
        document.getElementById('tabLogin')?.classList.toggle('auth-tab-active', tab === 'login');
        document.getElementById('tabRegister')?.classList.toggle('auth-tab-active', tab === 'register');
        document.getElementById('loginError')?.classList.add('hidden');
        document.getElementById('registerError')?.classList.add('hidden');
    },

    async loadProfile() {
        if (!this.currentUser) return;
        const user = await Auth.getCurrentUser();
        if (!user) return;
        const lvl = Auth.getLevel(user.xp || 0);
        const el = id => document.getElementById(id);

        if (el('profUsername')) el('profUsername').textContent = user.displayName;
        if (el('profLevelName')) el('profLevelName').textContent = lvl.name;
        if (el('profLevel')) el('profLevel').textContent = 'Level ' + lvl.level;
        if (el('profJoinDate')) el('profJoinDate').textContent = new Date(user.joinDate).toLocaleDateString();
        if (el('profXP')) el('profXP').textContent = (user.xp || 0) + ' XP';
        if (el('profTests')) el('profTests').textContent = user.totalTests || 0;
        if (el('profBestWPM')) el('profBestWPM').textContent = user.bestWPM || 0;
        if (el('profAvgWPM')) el('profAvgWPM').textContent = user.avgWPM || 0;
        if (el('profAvgAcc')) el('profAvgAcc').textContent = (user.avgAccuracy || 100) + '%';
        if (el('profXpBar')) el('profXpBar').style.width = lvl.progress + '%';
        if (el('profNextLevel')) {
            el('profNextLevel').textContent = lvl.next ? `${user.xp || 0} / ${lvl.next.min} XP to ${lvl.next.name}` : 'Max Level!';
        }

        const history = await DB.getAllByIndex('history', 'userId', user.id);
        const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
        const tbody = el('historyTable');
        if (tbody) {
            tbody.innerHTML = sorted.length ? sorted.map(h => `
        <tr class="border-t border-white/5">
          <td class="py-1.5 px-2 text-xs text-gray-400">${h.mode} ${h.subMode}</td>
          <td class="py-1.5 px-2 text-xs font-medium text-yellow-400">${h.wpm}</td>
          <td class="py-1.5 px-2 text-xs text-gray-300">${h.accuracy}%</td>
          <td class="py-1.5 px-2 text-xs text-gray-500">${h.elapsed}s</td>
          <td class="py-1.5 px-2 text-xs text-gray-600">${new Date(h.date).toLocaleDateString()}</td>
        </tr>`).join('') : '<tr><td colspan="5" class="py-4 text-center text-gray-600 text-xs">No history yet. Complete a test to see results.</td></tr>';
        }
    },

    async loadLeaderboard(category = 'time_60') {
        const all = await DB.getAllByIndex('leaderboard', 'category', category);
        const sorted = all.sort((a, b) => b.wpm - a.wpm).slice(0, 10);
        const tbody = document.getElementById('leaderboardTable');
        if (!tbody) return;
        tbody.innerHTML = sorted.length ? sorted.map((e, i) => `
      <tr class="border-t border-white/5 ${i === 0 ? 'bg-yellow-400/5' : ''}">
        <td class="py-2 px-3 text-xs text-gray-400">${i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</td>
        <td class="py-2 px-3 text-sm font-medium text-gray-200">${e.username}</td>
        <td class="py-2 px-3 text-sm font-bold text-yellow-400">${e.wpm}</td>
        <td class="py-2 px-3 text-xs text-gray-400">${e.accuracy}%</td>
        <td class="py-2 px-3 text-xs text-gray-600">${new Date(e.date).toLocaleDateString()}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="py-6 text-center text-gray-600 text-sm">No scores yet. Be the first!</td></tr>';
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
