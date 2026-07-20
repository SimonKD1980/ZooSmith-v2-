// js/ui/NotificationUI.js

export function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
            <span style="font-size: 1.5rem;">
                ${type === 'success' ? '✅' : type === 'error' ? '' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div style="flex: 1;">
                <div style="font-weight: 700; margin-bottom: 4px;">
                    ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">${message}</div>
            </div>
            <button onclick="this.closest('.notification').remove()" 
                style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;">
                ✕
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Expose to window
window.showNotification = showNotification;
