(function () {
    const STORAGE_KEY = 'wamLoggedUser';

    class ProfileIntegration {
        constructor(options = {}) {
            this.apiBase = 'https://dprojectsserver.azurewebsites.net';
            // this.apiBase = 'https://localhost:7195';
            this.onServerHighScoreLoaded = options.onServerHighScoreLoaded || (() => {});
            this.onAuthChanged = options.onAuthChanged || (() => {});
            this.currentUser = this.readStoredUser();

            this.authToggleButton = document.getElementById('account-toggle-button');
            this.authModal = document.getElementById('auth-modal');
            this.authCloseButton = document.getElementById('auth-close-button');
            this.authForm = document.getElementById('auth-form');
            this.usernameInput = document.getElementById('auth-username');
            this.passwordInput = document.getElementById('auth-password');
            this.authFeedback = document.getElementById('auth-feedback');
            this.logoutButton = document.getElementById('logout-button');
            this.userBadge = document.getElementById('user-badge');

            this.leaderboardToggleButton = document.getElementById('leaderboard-toggle-button');
            this.leaderboardModal = document.getElementById('leaderboard-modal');
            this.leaderboardCloseButton = document.getElementById('leaderboard-close-button');
            this.leaderboardRefreshButton = document.getElementById('leaderboard-refresh-button');
            this.leaderboardList = document.getElementById('leaderboard-list');

            this.bindEvents();
            this.updateAuthUi();
            this.onAuthChanged(this.currentUser);

            if (this.currentUser) {
                this.loadServerHighScoreForCurrentUser();
            }
        }

        bindEvents() {
            if (this.authToggleButton) {
                this.authToggleButton.addEventListener('click', () => this.openModal(this.authModal));
            }

            if (this.authCloseButton) {
                this.authCloseButton.addEventListener('click', () => this.closeModal(this.authModal));
            }

            if (this.authModal) {
                this.authModal.addEventListener('click', (event) => {
                    if (event.target === this.authModal) this.closeModal(this.authModal);
                });
            }

            if (this.authForm) {
                this.authForm.addEventListener('submit', (event) => this.handleAuthSubmit(event));
            }

            if (this.logoutButton) {
                this.logoutButton.addEventListener('click', () => this.logout());
            }

            if (this.leaderboardToggleButton) {
                this.leaderboardToggleButton.addEventListener('click', async () => {
                    this.openModal(this.leaderboardModal);
                    await this.renderLeaderboard();
                });
            }

            if (this.leaderboardCloseButton) {
                this.leaderboardCloseButton.addEventListener('click', () => this.closeModal(this.leaderboardModal));
            }

            if (this.leaderboardModal) {
                this.leaderboardModal.addEventListener('click', (event) => {
                    if (event.target === this.leaderboardModal) this.closeModal(this.leaderboardModal);
                });
            }

            if (this.leaderboardRefreshButton) {
                this.leaderboardRefreshButton.addEventListener('click', async () => {
                    await this.renderLeaderboard();
                });
            }
        }

        openModal(modal) {
            if (!modal) return;
            modal.classList.remove('hidden');
        }

        closeModal(modal) {
            if (!modal) return;
            modal.classList.add('hidden');
        }

        readStoredUser() {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch {
                sessionStorage.removeItem(STORAGE_KEY);
                return null;
            }
        }

        storeUser(user) {
            this.currentUser = user;
            if (user) {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
            }
            this.updateAuthUi();
            this.onAuthChanged(this.currentUser);
        }

        updateAuthUi() {
            const username = this.currentUser?.username;
            if (this.authToggleButton) {
                this.authToggleButton.textContent = username ? `@${username}` : 'Dang nhap';
            }

            if (this.userBadge) {
                this.userBadge.textContent = username ? `Da dang nhap: ${username}` : 'Chua dang nhap';
            }

            if (this.logoutButton) {
                this.logoutButton.classList.toggle('hidden', !username);
            }
        }

        setAuthFeedback(message, isError = false) {
            if (!this.authFeedback) return;
            this.authFeedback.textContent = message;
            this.authFeedback.classList.toggle('error', isError);
        }

        async handleAuthSubmit(event) {
            event.preventDefault();
            const username = (this.usernameInput?.value || '').trim();
            const password = (this.passwordInput?.value || '').trim();

            if (!username || !password) {
                this.setAuthFeedback('Vui long nhap day du username va password.', true);
                return;
            }

            const submitButton = this.authForm?.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            this.setAuthFeedback('Dang xu ly...');

            try {
                const result = await this.loginOrSignup(username, password);
                this.storeUser({ username, password, userId: result.userId || null });
                this.setAuthFeedback('Dang nhap thanh cong.');
                this.passwordInput.value = '';
                await this.loadServerHighScoreForCurrentUser();
                this.closeModal(this.authModal);
            } catch (error) {
                this.setAuthFeedback(error.message || 'Khong the dang nhap.', true);
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        }

        logout() {
            this.storeUser(null);
            this.setAuthFeedback('Da dang xuat.');
        }

        async apiRequest(path, options = {}) {
            const response = await fetch(`${this.apiBase}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch {
                payload = null;
            }

            if (!response.ok) {
                const message = payload?.error?.message || 'Request failed.';
                throw new Error(message);
            }

            return payload;
        }

        async loginOrSignup(username, password) {
            return this.apiRequest('/api/profile/login-or-signup', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
        }

        parseHighScorePackage(rawPackage) {
            if (!rawPackage) return { highScore: 0, timeSpan: 0 };

            const normalize = (value) => {
                const highScore = Number(value?.highScore ?? value?.HighScore ?? 0);
                const timeSpan = Number(value?.timeSpan ?? value?.TimeSpan ?? 0);
                return {
                    highScore: Number.isFinite(highScore) ? highScore : 0,
                    timeSpan: Number.isFinite(timeSpan) ? timeSpan : 0
                };
            };

            if (typeof rawPackage === 'string') {
                try {
                    const parsed = JSON.parse(rawPackage);
                    return normalize(parsed);
                } catch {
                    return { highScore: 0, timeSpan: 0 };
                }
            }

            return normalize(rawPackage);
        }

        async getLeaderboard() {
            const payload = await this.apiRequest('/api/profile/get-leaderboard', {
                method: 'GET'
            });

            if (!Array.isArray(payload)) return [];

            return payload.map((entry) => ({
                username: entry?.username || entry?.Username || 'Unknown',
                package: this.parseHighScorePackage(entry?.highScorePackage || entry?.HighScorePackage)
            }));
        }

        async loadServerHighScoreForCurrentUser() {
            if (!this.currentUser) return;

            try {
                const leaderboard = await this.getLeaderboard();
                const me = leaderboard.find((entry) => entry.username === this.currentUser.username);
                this.onServerHighScoreLoaded(me?.package || { highScore: 0, timeSpan: 0 });
            } catch {
                // Keep gameplay usable even when leaderboard API is down.
            }
        }

        async updateHighScore(highScore, timeSpan) {
            if (!this.currentUser) return null;

            return this.apiRequest('/api/profile/update-high-score', {
                method: 'PUT',
                body: JSON.stringify({
                    username: this.currentUser.username,
                    password: this.currentUser.password,
                    newHighScore: {
                        highScore,
                        timeSpan
                    }
                })
            });
        }

        async renderLeaderboard() {
            if (!this.leaderboardList) return;

            this.leaderboardList.innerHTML = '<li>Dang tai bang xep hang...</li>';

            try {
                const leaderboard = await this.getLeaderboard();
                if (leaderboard.length === 0) {
                    this.leaderboardList.innerHTML = '<li>Chua co du lieu.</li>';
                    return;
                }

                const topPlayers = leaderboard.slice(0, 20);
                this.leaderboardList.innerHTML = topPlayers.map((entry, index) => {
                    const isMe = this.currentUser && entry.username === this.currentUser.username;
                    const className = isMe ? 'leaderboard-row me' : 'leaderboard-row';
                    return `<li class="${className}"><span>#${index + 1} ${entry.username}</span><strong>${entry.package.highScore}</strong></li>`;
                }).join('');
            } catch (error) {
                this.leaderboardList.innerHTML = `<li>${error.message || 'Khong tai duoc bang xep hang.'}</li>`;
            }
        }
    }

    window.ProfileIntegration = ProfileIntegration;
})();
