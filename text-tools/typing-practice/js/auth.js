// ===================== AUTH MODULE =====================
const Auth = {
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'easypro_typing_salt_v1');
        const buffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    getSession() {
        try { return JSON.parse(localStorage.getItem('eptyping_session')); } catch { return null; }
    },

    setSession(user) {
        localStorage.setItem('eptyping_session', JSON.stringify({
            userId: user.id, username: user.username, displayName: user.displayName
        }));
    },

    clearSession() {
        localStorage.removeItem('eptyping_session');
    },

    async register(username, email, password) {
        if (!username || username.length < 3) throw new Error('Username must be at least 3 characters.');
        if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new Error('Username can only contain letters, numbers, and underscores.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const existing = await DB.getByIndex('users', 'username', username.toLowerCase());
        if (existing) throw new Error('Username already taken.');

        const hash = await this.hashPassword(password);
        const user = {
            username: username.toLowerCase(),
            displayName: username,
            email: email ? email.toLowerCase() : '',
            passwordHash: hash,
            joinDate: new Date().toISOString(),
            xp: 0,
            level: 1,
            totalTests: 0,
            bestWPM: 0,
            totalWPM: 0,
            totalAccuracy: 0
        };

        const id = await DB.add('users', user);
        const newUser = { ...user, id };
        this.setSession(newUser);
        return newUser;
    },

    async login(usernameOrEmail, password) {
        if (!usernameOrEmail || !password) throw new Error('Please fill in all fields.');
        const hash = await this.hashPassword(password);

        let user = await DB.getByIndex('users', 'username', usernameOrEmail.toLowerCase());
        if (!user) {
            const all = await DB.getAll('users');
            user = all.find(u => u.email && u.email === usernameOrEmail.toLowerCase());
        }
        if (!user) throw new Error('User not found.');
        if (user.passwordHash !== hash) throw new Error('Incorrect password.');

        this.setSession(user);
        return user;
    },

    logout() {
        this.clearSession();
    },

    async getCurrentUser() {
        const session = this.getSession();
        if (!session) return null;
        try {
            return await DB.get('users', session.userId);
        } catch {
            return null;
        }
    },

    getLevel(xp) {
        const levels = [
            { level: 1, name: 'Novice', min: 0 },
            { level: 2, name: 'Beginner', min: 100 },
            { level: 3, name: 'Apprentice', min: 300 },
            { level: 4, name: 'Intermediate', min: 600 },
            { level: 5, name: 'Proficient', min: 1000 },
            { level: 6, name: 'Advanced', min: 2000 },
            { level: 7, name: 'Expert', min: 4000 },
            { level: 8, name: 'Master', min: 8000 },
            { level: 9, name: 'Grandmaster', min: 16000 },
            { level: 10, name: 'Legend', min: 32000 }
        ];
        let current = levels[0];
        for (const l of levels) { if (xp >= l.min) current = l; }
        const next = levels.find(l => l.min > xp);
        return { ...current, next, progress: next ? Math.round(((xp - current.min) / (next.min - current.min)) * 100) : 100 };
    },

    calcXP(wpm, accuracy) {
        return Math.round(wpm * (accuracy / 100) * 10);
    },

    async saveTestResult(stats, mode, subMode) {
        const session = this.getSession();
        if (!session) return;

        const historyEntry = {
            userId: session.userId,
            mode, subMode,
            wpm: stats.wpm,
            rawWpm: stats.rawWpm,
            accuracy: stats.accuracy,
            correctChars: stats.correctChars,
            errors: stats.errors,
            elapsed: stats.elapsed,
            consistency: stats.consistency,
            date: new Date().toISOString()
        };
        await DB.add('history', historyEntry);

        // Update leaderboard
        const category = `${mode}_${subMode}`;
        const allCat = await DB.getAllByIndex('leaderboard', 'category', category);
        const userEntry = allCat.find(e => e.userId === session.userId);
        if (!userEntry || stats.wpm > userEntry.wpm) {
            if (userEntry) await DB.delete('leaderboard', userEntry.id);
            await DB.add('leaderboard', {
                userId: session.userId,
                username: session.displayName,
                category,
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                date: new Date().toISOString()
            });
        }

        // Update user stats
        const user = await DB.get('users', session.userId);
        const xpGained = this.calcXP(stats.wpm, stats.accuracy);
        const newXP = (user.xp || 0) + xpGained;
        const levelInfo = this.getLevel(newXP);
        const newTotalTests = (user.totalTests || 0) + 1;
        const newTotalWPM = (user.totalWPM || 0) + stats.wpm;
        const newTotalAcc = (user.totalAccuracy || 0) + stats.accuracy;

        await DB.update('users', {
            ...user,
            xp: newXP,
            level: levelInfo.level,
            totalTests: newTotalTests,
            bestWPM: Math.max(user.bestWPM || 0, stats.wpm),
            totalWPM: newTotalWPM,
            totalAccuracy: newTotalAcc,
            avgWPM: Math.round(newTotalWPM / newTotalTests),
            avgAccuracy: Math.round(newTotalAcc / newTotalTests)
        });

        return { xpGained, levelInfo };
    }
};
