// js/ui/LeaderboardUI.js
import { state } from '../engine/GameState.js';
import { getPlayerId, getPlayerName, setPlayerName, fetchLeaderboard, getPlayerRank, escapeHtml } from '../engine/systems/LeaderboardSystem.js';

let currentCategory = 'zooRating';

export function renderLeaderboard() {
    const box = document.getElementById('leaderboard');
    if (!box) return;

    const hasName = localStorage.getItem('zooPlayerName');
    let namePromptHTML = '';
    
    if (!hasName) {
        namePromptHTML = `
            <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:30px; text-align:center; margin-bottom:24px;">
                <h3 style="margin:0 0 10px 0; color:#e5e7eb;">👋 Welcome to the Global Leaderboard!</h3>
                <p style="color:#9ca3af; margin-bottom:20px;">Choose a name to compete with zookeepers worldwide.</p>
                <div style="display:flex; gap:10px; justify-content:center; max-width:400px; margin:0 auto;">
                    <input type="text" id="playerNameInput" placeholder="Your zookeeper name..." maxlength="20" 
                        style="flex:1; padding:12px; background:#0f172a; color:#e5e7eb; border:2px solid #334155; border-radius:8px; font-size:1rem; outline:none;">
                    <button onclick="window.saveLeaderboardName()" 
                        style="padding:12px 24px; background:#22c55e; color:#000; border:none; border-radius:8px; font-weight:700; cursor:pointer;">Save</button>
                </div>
            </div>
        `;
    }

    const categories = [
        { id: 'zooRating', label: '🏞️ Best Zoos' },
        { id: 'money', label: '💰 Richest' },
        { id: 'animals', label: '🦁 Most Animals' },
        { id: 'achievements', label: '🏆 Achievements' },
        { id: 'daysPlayed', label: '📅 Longest Played' }
    ];

    box.innerHTML = `
        ${namePromptHTML}
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
            ${categories.map(cat => `
                <button onclick="window.changeLeaderboardCategory('${cat.id}')" 
                    style="padding:10px 20px; background:${currentCategory === cat.id ? '#22c55e' : '#1e293b'}; color:${currentCategory === cat.id ? '#000' : '#e5e7eb'}; border:1px solid ${currentCategory === cat.id ? '#22c55e' : '#334155'}; border-radius:8px; cursor:pointer; font-weight:600; transition:all 0.2s;">
                    ${cat.label}
                </button>
            `).join('')}
        </div>
        <div id="leaderboardContent" style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; min-height:300px;">
            <div style="text-align:center; padding:40px; color:#9ca3af;">🔄 Loading leaderboard data...</div>
        </div>
    `;

    updateLeaderboardContent();
}

async function updateLeaderboardContent() {
    const content = document.getElementById('leaderboardContent');
    if (!content) return;

    const players = await fetchLeaderboard(currentCategory, 20);
    const myRank = await getPlayerRank(currentCategory);

    const categoryLabels = {
        zooRating: { label: 'Zoo Rating', format: v => v + '%' },
        money: { label: 'Net Worth', format: v => '$' + v.toLocaleString() },
        animals: { label: 'Animals', format: v => v.toLocaleString() },
        achievements: { label: 'Achievements', format: v => v.toLocaleString() },
        daysPlayed: { label: 'Days', format: v => v.toLocaleString() }
    };

    const cat = categoryLabels[currentCategory];
    const myPlayerId = getPlayerId();

    let yourRankHTML = '';
    if (myRank) {
        yourRankHTML = `
            <div style="background:rgba(34, 197, 94, 0.1); border:1px solid #22c55e; border-radius:10px; padding:15px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.85rem; color:#9ca3af;">🎯 Your Global Rank</div>
                    <div style="font-size:1.5rem; font-weight:800; color:#22c55e;">#${myRank.rank}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.85rem; color:#9ca3af;">Out of ${myRank.total} zookeepers</div>
                    <div style="font-weight:700; color:#e5e7eb;">${cat.format(myRank.data[currentCategory] || 0)}</div>
                </div>
            </div>
        `;
    }

    let rowsHTML = '';
    if (players.length === 0) {
        rowsHTML = `<div style="text-align:center; padding:40px; color:#9ca3af;"><h3>🏁 Be the First!</h3><p>No players yet. Play the game and submit your score to claim the top spot!</p></div>`;
    } else {
        rowsHTML = `
            <div style="display:grid; grid-template-columns: 60px 1fr 120px; gap:10px; padding:10px; border-bottom:2px solid #334155; font-weight:700; color:#9ca3af; font-size:0.85rem; text-transform:uppercase;">
                <div>Rank</div><div>Player / Zoo</div><div style="text-align:right;">${cat.label}</div>
            </div>
        `;
        
        players.forEach(player => {
            const isYou = player.id === myPlayerId;
            const rankEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`;
            const isZooView = currentCategory === 'zooRating';
            
            const mainName = isZooView ? escapeHtml(player.zooName || 'Unnamed Zoo') : escapeHtml(player.name || 'Anonymous');
            const subInfo = isZooView ? `<div style="font-size:0.8rem; color:#9ca3af;">by ${escapeHtml(player.name || 'Anonymous')}</div>` : `<div style="font-size:0.8rem; color:#9ca3af;">Day ${player.daysPlayed || 0} • ${player.animals || 0} animals</div>`;
            
            rowsHTML += `
                <div style="display:grid; grid-template-columns: 60px 1fr 120px; gap:10px; padding:12px 10px; border-bottom:1px solid #1e293b; align-items:center; background:${isYou ? 'rgba(34, 197, 94, 0.05)' : 'transparent'}; border-radius:6px;">
                    <div style="font-size:1.2rem; font-weight:800; color:${player.rank <= 3 ? '#fbbf24' : '#e5e7eb'};">${rankEmoji}</div>
                    <div>
                        <div style="font-weight:700; color:${isZooView ? '#fbbf24' : '#e5e7eb'}; font-size:1.05rem;">${mainName}</div>
                        ${subInfo}
                    </div>
                    <div style="text-align:right; font-weight:800; color:#22c55e; font-size:1.1rem;">${cat.format(player[currentCategory] || 0)}</div>
                </div>
            `;
        });
    }

    content.innerHTML = yourRankHTML + `<div>${rowsHTML}</div><div style="text-align:center; margin-top:20px; color:#64748b; font-size:0.85rem;">🔄 Leaderboard updates automatically as you play</div>`;
}

window.changeLeaderboardCategory = (category) => {
    currentCategory = category;
    renderLeaderboard();
};

window.saveLeaderboardName = () => {
    const input = document.getElementById('playerNameInput');
    const name = input.value.trim();
    if (name.length < 2) {
        alert("Name must be at least 2 characters");
        return;
    }
    setPlayerName(name);
    renderLeaderboard();
    // Import submitScore dynamically to save immediately
    import('../engine/systems/LeaderboardSystem.js').then(module => {
        module.submitScore(state, () => Object.values(state.exhibits).flatMap(ex => ex.animals || []));
    });
};
