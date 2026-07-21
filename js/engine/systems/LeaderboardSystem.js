// js/engine/systems/LeaderboardSystem.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔥 Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZRRK6LopojbwniZ9iWQzmyiHdwu84Dcs",
    authDomain: "zoo-tycoon-leaderboard.firebaseapp.com",
    projectId: "zoo-tycoon-leaderboard",
    storageBucket: "zoo-tycoon-leaderboard.firebasestorage.app",
    messagingSenderId: "784281338962",
    appId: "1:784281338962:web:485d7f315ead583bcfcb8b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Player Identity Management
export function getPlayerId() {
    let id = localStorage.getItem('zooPlayerId');
    if (!id) {
        id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('zooPlayerId', id);
    }
    return id;
}

export function getPlayerName() {
    return localStorage.getItem('zooPlayerName') || 'Anonymous Zookeeper';
}

export function setPlayerName(name) {
    localStorage.setItem('zooPlayerName', name);
}

// Security helper to prevent XSS attacks from player names
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Submit Score to Firebase
export async function submitScore(state, getAllAnimals) {
    try {
        const playerId = getPlayerId();
        const ref = doc(db, 'leaderboard', playerId);
        const snap = await getDoc(ref);
        
        const stats = {
            name: getPlayerName(),
            zooName: state.zooName || "Unnamed Zoo",
            zooRating: state.zooRating || 0,
            money: state.money,
            animals: getAllAnimals().length,
            achievements: Object.keys(state.achievements || {}).length,
            daysPlayed: (state.year - 1) * 360 + (state.month - 1) * 30 + state.day,
            visitors: state.dailyVisitors,
            lastUpdated: new Date().toISOString()
        };

        if (snap.exists()) {
            const existing = snap.data();
            // Keep the highest values for competitive stats
            stats.money = Math.max(stats.money, existing.money || 0);
            stats.animals = Math.max(stats.animals, existing.animals || 0);
            stats.achievements = Math.max(stats.achievements, existing.achievements || 0);
            stats.daysPlayed = Math.max(stats.daysPlayed, existing.daysPlayed || 0);
            stats.zooRating = Math.max(stats.zooRating, existing.zooRating || 0);
            await setDoc(ref, stats, { merge: true });
        } else {
            await setDoc(ref, stats);
        }
    } catch (e) {
        console.error("Leaderboard submit error:", e);
    }
}

// Fetch Leaderboard Data
export async function fetchLeaderboard(category = 'money', limitCount = 20) {
    try {
        const q = query(collection(db, 'leaderboard'), orderBy(category, 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc, index) => ({
            rank: index + 1,
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Leaderboard fetch error:", e);
        return [];
    }
}

// Get Player's Personal Rank
export async function getPlayerRank(category = 'money') {
    const playerId = getPlayerId();
    try {
        const q = query(collection(db, 'leaderboard'), orderBy(category, 'desc'));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;
        const myIndex = docs.findIndex(d => d.id === playerId);
        if (myIndex === -1) return null;
        return { rank: myIndex + 1, total: docs.length, data: docs[myIndex].data() };
    } catch (e) {
        console.error("Rank fetch error:", e);
        return null;
    }
}
