const Modal = {
    alert: function(message, type = 'info') {
        return new Promise((resolve) => {
            const icons = {
                success: '✓',
                error: '✗',
                warning: '⚠',
                info: 'ℹ',
                question: '?'
            };

            const titles = {
                success: 'Успіх',
                error: 'Помилка',
                warning: 'Увага',
                info: 'Інформація',
                question: 'Питання'
            };

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            overlay.innerHTML = `
                <div class="custom-modal">
                    <div class="custom-modal-header">
                        <div class="custom-modal-icon ${type}">${icons[type] || icons.info}</div>
                        <h5 class="custom-modal-title">${titles[type] || titles.info}</h5>
                    </div>
                    <div class="custom-modal-body">
                        ${message}
                    </div>
                    <div class="custom-modal-footer">
                        <button class="custom-modal-button primary" id="modal-ok-btn">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            setTimeout(() => overlay.classList.add('show'), 10);

            const okBtn = overlay.querySelector('#modal-ok-btn');
            okBtn.addEventListener('click', () => {
                this.close(overlay, resolve);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay, resolve);
                }
            });

            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(overlay, resolve);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        });
    },

    confirm: function(message, options = {}) {
        return new Promise((resolve) => {
            const {
                confirmText = 'OK',
                cancelText = 'Cancel',
                confirmClass = 'danger',
                title = 'Підтвердження'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            overlay.innerHTML = `
                <div class="custom-modal">
                    <div class="custom-modal-header">
                        <div class="custom-modal-icon question">?</div>
                        <h5 class="custom-modal-title">${title}</h5>
                    </div>
                    <div class="custom-modal-body">
                        ${message}
                    </div>
                    <div class="custom-modal-footer">
                        <button class="custom-modal-button outline" id="modal-cancel-btn">${cancelText}</button>
                        <button class="custom-modal-button ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            setTimeout(() => overlay.classList.add('show'), 10);

            const confirmBtn = overlay.querySelector('#modal-confirm-btn');
            const cancelBtn = overlay.querySelector('#modal-cancel-btn');

            confirmBtn.addEventListener('click', () => {
                this.close(overlay, () => resolve(true));
            });

            cancelBtn.addEventListener('click', () => {
                this.close(overlay, () => resolve(false));
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay, () => resolve(false));
                }
            });

            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(overlay, () => resolve(false));
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            setTimeout(() => confirmBtn.focus(), 100);
        });
    },

    success: function(message) {
        return this.alert(message, 'success');
    },

    error: function(message) {
        return this.alert(message, 'error');
    },

    warning: function(message) {
        return this.alert(message, 'warning');
    },

    info: function(message) {
        return this.alert(message, 'info');
    },

    close: function(overlay, callback) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    },

    toast: function(message, type = 'info', duration = 3000) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            max-width: 400px;
            border-left: 4px solid ${colors[type] || colors.info};
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s ease;
        `;

        toast.innerHTML = `
            <span style="font-size: 20px; color: ${colors[type] || colors.info}">${icons[type] || icons.info}</span>
            <span style="color: #212529; flex: 1;">${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    }
};

window.Modal = Modal;

