// js/main.js
import { state, getSeason } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';
import { loadAllData, data } from './engine/data.js';
import { FOOD_TYPES } from './engine/constants.js';
import { 
    getKeeperCapacity, 
    getKeeperDemand, 
    getCleanerCapacity, 
    getCleanerDemand,
    isUnderstaffed 
} from './engine/systems/StaffSystem.js';
import { RATING_TIERS, getTier } from './engine/systems/RatingSystem.js';
import { renderShop } from './ui/ShopUI.js';
import { renderSupplies } from './ui/SuppliesUI.js';
import { renderStaff } from './ui/StaffUI.js';
import { renderAmenities } from './ui/AmenitiesUI.js';
import { renderExhibits } from './ui/ExhibitsUI.js';
import { 
    saveGame, 
    loadGame, 
    getSaveSlots, 
    deleteSave, 
    exportSave, 
    importSave 
} from './engine/SaveSystem.js';
import { renderReports } from './ui/ReportsUI.js';
import { renderResearch } from './ui/ResearchUI.js';
import { startResearch } from './engine/systems/ResearchSystem.js';

// =====================================================================
// UI REFERENCES
// =====================================================================
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const seasonEl = document.getElementById('season'); // 🔥 NEW
const ratingEl = document.getElementById('rating');
const satisfactionEl = document.getElementById('satisfaction');
const zooNameEl = document.getElementById('zooName');
const endDayBtn = document.getElementById('endDayBtn');
const buildExhibitBtn = document.getElementById('buildExhibitBtn');

console.log('🚀 main.js loaded!');

// =====================================================================
// LOG STORAGE
// =====================================================================
const logMessages = [];
const MAX_LOG_MESSAGES = 500;

// =====================================================================
// TAB NAVIGATION
// =====================================================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sectionId = btn.dataset.section;
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
        
        // Render the appropriate tab
        if (sectionId === 'shop') renderShop();
        else if (sectionId === 'supplies') renderSupplies();
        else if (sectionId === 'staff') renderStaff();
        else if (sectionId === 'amenities') renderAmenities();
        else if (sectionId === 'exhibits') renderExhibits();
        else if (sectionId === 'visitors') renderVisitorsTab();
        else if (sectionId === 'saves') renderSavesTab();
        else if (sectionId === 'reports') renderReports();
        else if (sectionId === 'research') renderResearch();
        else if (sectionId === 'log') renderLogTab();
    });
});

// =====================================================================
// MAIN UI UPDATE
// =====================================================================
function updateUI() {
    if (typeof state.money !== 'number' || isNaN(state.money)) {
        console.error('❌ state.money is invalid:', state.money);
        state.money = 0;
    }
    
    if (moneyEl) moneyEl.textContent = `$${state.money.toLocaleString()}`;
    
    // 🔥 NEW: Date and Season
    if (dayEl) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dayEl.textContent = `${monthNames[state.month - 1]} ${state.day}, Y${state.year}`;
    }
    if (seasonEl) {
        const seasonNames = {
            winter: '❄️ Winter',
            spring: '🌸 Spring',
            summer: '☀️ Summer',
            fall: '🍂 Fall'
        };
        seasonEl.textContent = seasonNames[getSeason()];
    }
    
    const tier = getTier(state.zooRating || 0);
    if (ratingEl) ratingEl.textContent = `${tier.emoji} ${state.zooRating}`;
    if (satisfactionEl) satisfactionEl.textContent = `${state.visitorSatisfaction}%`;
    if (zooNameEl) zooNameEl.textContent = state.zooName || 'My Zoo';
}

// =====================================================================
// SAVES TAB
// =====================================================================
function renderSavesTab() {
    const el = document.getElementById('saves');
    if (!el) return;

    const slots = getSaveSlots();

    let html = `
        <div class="status-panel">
            <h3>💾 Save & Load Management</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Your game auto-saves every day. You can also manually save, load, export, or import your zoo.</p>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button onclick="window.manualSave('Slot 1')" style="padding: 10px 20px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">💾 Save to Slot 1</button>
                <button onclick="window.manualSave('Slot 2')" style="padding: 10px 20px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">💾 Save to Slot 2</button>
                <button onclick="window.manualSave('Slot 3')" style="padding: 10px 20px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">💾 Save to Slot 3</button>
                <button onclick="window.exportCurrentSave()" style="padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">📤 Export Save</button>
                <button onclick="document.getElementById('importSaveInput').click()" style="padding: 10px 20px; background: #a855f7; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">📥 Import Save</button>
            </div>

            <h4 style="margin-bottom: 10px; color: #e5e7eb;">Available Saves:</h4>
            <div style="display: grid; gap: 10px;">
    `;

    if (slots.length === 0) {
        html += `<div style="color: #9ca3af; text-align: center; padding: 20px;">No saves found. Play a day to create an autosave!</div>`;
    } else {
        slots.forEach(slot => {
            const dateStr = new Date(slot.date).toLocaleString();
            const isAutosave = slot.slot === 'autosave';
            
            html += `
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <div style="font-weight: 700; color: #e5e7eb; font-size: 1.1rem;">
                            ${isAutosave ? '🔄 ' : ' '}${slot.slot}
                        </div>
                        <div style="font-size: 0.85rem; color: #9ca3af; margin-top: 4px;">
                            📅 Day ${slot.day} • 💰 $${slot.money.toLocaleString()} • ⭐ ${slot.rating}/100 • 🕒 ${dateStr}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.loadSpecificSave('${slot.slot}')" style="padding: 8px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Load</button>
                        ${!isAutosave ? `<button onclick="window.deleteSpecificSave('${slot.slot}')" style="padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Delete</button>` : ''}
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    el.innerHTML = html;
}

// =====================================================================
// VISITORS TAB (with Rating Breakdown)
// =====================================================================
function renderVisitorsTab() {
    const el = document.getElementById('visitors');
    if (!el) return;
    
    let html = renderRatingBreakdown();
    
    const currentPrice = state.ticketPrice || 20;
    html += `
        <div class="status-panel" style="border: 2px solid #3b82f6;">
            <h3>🎟️ Ticket Pricing</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Adjust your ticket prices to balance profit and visitor satisfaction.</p>
            
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <input type="range" id="ticketPriceSlider" min="5" max="50" value="${currentPrice}" 
                        style="width: 100%; height: 8px; border-radius: 4px; background: #1e293b; outline: none; -webkit-appearance: none;"
                        oninput="window.updateTicketPrice(this.value)">
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #9ca3af; font-size: 0.9rem;">$</span>
                    <input type="number" id="ticketPriceInput" value="${currentPrice}" min="5" max="50" 
                        style="width: 80px; padding: 10px; font-size: 1.2rem; font-weight: 700; background: #0f172a; color: #e5e7eb; border: 2px solid #3b82f6; border-radius: 8px; text-align: center;"
                        onchange="window.updateTicketPrice(this.value)">
                </div>
            </div>
            
            <div id="ticketPriceFeedback" style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid ${getPriceFeedbackColor(currentPrice)};">
                ${getTicketPriceFeedback(currentPrice)}
            </div>
        </div>
    `;
    
    html += '<div class="status-panel"><h3>👥 Visitor Summary</h3>';
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Today's Visitors</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6;">${state.dailyVisitors || 0}</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Guest Happiness</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: ${(state.guestHappiness || 50) >= 70 ? '#22c55e' : '#f59e0b'};">${state.guestHappiness || 50}%</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Ticket Revenue</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #22c55e;">$${((state.visitorSpending?.tickets) || 0).toLocaleString()}</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Amenity Revenue</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">$${((state.visitorSpending?.amenities) || 0).toLocaleString()}</div>
            </div>
        </div>
    `;
    
    if (state.visitorComplaints && state.visitorComplaints.length > 0) {
        html += '<div style="margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">';
        html += '<div style="font-size: 0.8rem; color: #fca5a5; margin-bottom: 6px; font-weight: 700;">️ Complaints:</div>';
        state.visitorComplaints.forEach(c => {
            html += `<div style="font-size: 0.85rem; color: #e5e7eb; margin-bottom: 4px;">${c.icon} ${c.text}</div>`;
        });
        html += '</div>';
    }
    html += '</div>';
    
    el.innerHTML = html;
}

function getTicketPriceFeedback(price) {
    price = parseInt(price) || 20;
    let impact = '', color = '', advice = '';
    
    if (price < 10) { impact = ' Very High Visitor Count'; color = '#22c55e'; advice = 'Tickets are very cheap! Consider raising prices to $15-25.'; } 
    else if (price < 15) { impact = ' High Visitor Count'; color = '#22c55e'; advice = 'Good value pricing! Great for building reputation.'; } 
    else if (price <= 25) { impact = '✅ Balanced'; color = '#3b82f6'; advice = 'Optimal pricing! Good balance between profit and satisfaction.'; } 
    else if (price <= 35) { impact = ' Moderate Visitor Count'; color = '#f59e0b'; advice = 'Premium pricing. Make sure your amenities are excellent!'; } 
    else { impact = ' Low Visitor Count'; color = '#ef4444'; advice = 'Very expensive! Consider lowering to $20-30.'; }
    
    return `
        <div style="margin-bottom: 10px;">
            <div style="font-weight: 700; color: ${color}; margin-bottom: 4px;">${impact}</div>
            <div style="font-size: 0.9rem; color: #9ca3af;">${advice}</div>
        </div>
    `;
}

function getPriceFeedbackColor(price) {
    price = parseInt(price) || 20;
    if (price < 15) return '#22c55e';
    if (price <= 25) return '#3b82f6';
    if (price <= 35) return '#f59e0b';
    return '#ef4444';
}

window.updateTicketPrice = (value) => {
    const price = parseInt(value) || 20;
    state.ticketPrice = Math.max(5, Math.min(50, price));
    
    const slider = document.getElementById('ticketPriceSlider');
    const input = document.getElementById('ticketPriceInput');
    if (slider) slider.value = state.ticketPrice;
    if (input) input.value = state.ticketPrice;
    
    const feedbackDiv = document.getElementById('ticketPriceFeedback');
    if (feedbackDiv) {
        feedbackDiv.innerHTML = getTicketPriceFeedback(state.ticketPrice);
        feedbackDiv.style.borderLeftColor = getPriceFeedbackColor(state.ticketPrice);
    }
};

// =====================================================================
// RATING BREAKDOWN RENDERER
// =====================================================================
function renderRatingBreakdown() {
    const breakdown = state.ratingBreakdown;
    if (!breakdown) {
        return '<div class="status-panel"><p style="color: #9ca3af;">Rating not calculated yet. Click "End Day" to start.</p></div>';
    }
    
    const tier = getTier(state.zooRating || 0);
    const d = breakdown.details;
    
    let html = `
        <div class="status-panel" style="border: 2px solid ${tier.color};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3 style="margin: 0;">${tier.emoji} Zoo Rating: ${state.zooRating}/100</h3>
                    <div style="color: ${tier.color}; font-weight: 700; font-size: 1.1rem;">${tier.name}</div>
                </div>
            </div>
            
            <div style="height: 10px; background: #0f172a; border-radius: 5px; overflow: hidden; margin-bottom: 20px;">
                <div style="height: 100%; width: ${state.zooRating}%; background: linear-gradient(90deg, ${tier.color}, ${tier.color}cc); transition: width 0.5s;"></div>
            </div>
            
            <h4 style="color: #22c55e; margin: 0 0 10px 0;">✅ Positive Factors (+${breakdown.positive})</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-bottom: 15px;">
                ${renderFactorCard('🐾 Animal Care', d.animalCare.total, d.animalCare.max, [
                    `❤️ Avg Health: ${d.animalCare.health}% (+${d.animalCare.healthPoints})`,
                    `😊 Avg Happiness: ${d.animalCare.happiness}% (+${d.animalCare.happinessPoints})`
                ], '#22c55e')}
                
                ${renderFactorCard('🏆 Zoo Quality', d.zooQuality.total, d.zooQuality.max, [
                    `🦁 Species: ${d.zooQuality.uniqueSpecies} (+${d.zooQuality.varietyPoints})`,
                    `🍼 Babies Born: ${d.zooQuality.babiesBorn} (+${d.zooQuality.breedingPoints})`
                ], '#3b82f6')}
            </div>
            
            <h4 style="color: #ef4444; margin: 0 0 10px 0;">❌ Negative Factors (-${breakdown.negative})</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
                ${renderFactorCard('💀 Neglect', d.neglect.total, null, [
                    `☠️ Deaths: ${d.neglect.deaths} (-${d.neglect.deathPenalty})`,
                    `😢 Unhappy Animals: ${d.neglect.unhappyCount} (-${d.neglect.unhappyPenalty})`
                ], '#ef4444')}
            </div>
        </div>
    `;
    return html;
}

function renderFactorCard(title, value, max, details, color) {
    const maxText = max !== null ? `/${max}` : '';
    const isNegative = color === '#ef4444' || color === '#f59e0b';
    return `
        <div style="background: #0f172a; border: 1px solid ${color}33; border-left: 4px solid ${color}; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                <div style="font-weight: 700; color: #e5e7eb; font-size: 0.95rem;">${title}</div>
                <div style="font-weight: 800; color: ${isNegative ? '#ef4444' : '#22c55e'}; font-size: 1.1rem;">
                    ${isNegative ? '-' : '+'}${value}${maxText}
                </div>
            </div>
            <div style="font-size: 0.8rem; color: #9ca3af; line-height: 1.6;">
                ${details.join('<br>')}
            </div>
        </div>
    `;
}

// =====================================================================
// LOG HELPER & TAB
// =====================================================================
function logMessage(msg) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { text: msg, time: timestamp };
    
    logMessages.unshift(entry);
    if (logMessages.length > MAX_LOG_MESSAGES) logMessages.pop();
    
    const logContent = document.getElementById('logContent');
    if (logContent) renderLogContent();
}

function renderLogContent() {
    const logContent = document.getElementById('logContent');
    if (!logContent) return;
    
    if (logMessages.length === 0) {
        logContent.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 20px;">No events yet.</div>';
        return;
    }
    
    logContent.innerHTML = logMessages.map(entry => 
        `<div style="padding: 4px 0; border-bottom: 1px solid #1e293b; font-size: 0.9rem;">
            <span style="color: #64748b; font-size: 0.75rem; margin-right: 8px;">${entry.time}</span>
            <span style="color: #e5e7eb;">${entry.text}</span>
        </div>`
    ).join('');
}

function renderLogTab() {
    const el = document.getElementById('log');
    if (!el) return;

    el.innerHTML = `
        <div class="status-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;"> Game Log</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="color: #9ca3af; font-size: 0.85rem;">${logMessages.length} events</span>
                    <button onclick="window.clearLog()" style="padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">🗑️ Clear Log</button>
                </div>
            </div>
            <div id="logContent" style="background: #000; padding: 15px; border-radius: 8px; height: 600px; overflow-y: auto; font-family: monospace;"></div>
        </div>
    `;
    renderLogContent();
}

window.clearLog = () => {
    if (confirm('Clear all log messages?')) {
        logMessages.length = 0;
        renderLogContent();
    }
};

// =====================================================================
// EVENT LISTENERS
// =====================================================================
eventBus.on('DAY_ADVANCED', () => {
    saveGame('autosave');
    updateUI();
    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab) activeTab.click();
    logMessage(`--- Day ${state.day} Complete (Auto-Saved) ---`);
});

eventBus.on('MONTH_ADVANCED', (data) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const seasonNames = { winter: '❄️ Winter', spring: '🌸 Spring', summer: '☀️ Summer', fall: '🍂 Fall' };
    logMessage(`📅 It is now ${monthNames[data.month - 1]}! Welcome to ${seasonNames[data.season]}.`);
});

eventBus.on('YEAR_ADVANCED', (data) => {
    logMessage(`🎉 Happy New Year! Welcome to Year ${data.year}!`);
});

eventBus.on('ECONOMY_PROCESSED', (data) => {
    logMessage(`💰 Economy: Visitors ${data.visitors} | Net Profit $${data.profit}`);
});

eventBus.on('ANIMAL_DIED', (data) => {
    const emoji = data.cause === 'old age' ? '⚰️' : '💀';
    logMessage(`${emoji} ${data.animal.name} died of ${data.cause} in ${data.exhibitName}`);
    
    if (data.cause === 'neglect' && data.fineAmount > 0) {
        state.money -= data.fineAmount;
        logMessage(`💸 NEGLECT FINE: -$${data.fineAmount.toLocaleString()} for ${data.animal.name}'s death`);
        updateUI();
    }
});

eventBus.on('ANIMALS_HUNGRY', (data) => {
    logMessage(`️ HUNGRY: ${data.animals.slice(0, 3).join(', ')}${data.animals.length > 3 ? ` +${data.animals.length - 3} more` : ''}`);
});

eventBus.on('ANIMAL_BORN', (data) => {
    logMessage(`🍼 ${data.baby.name} was born to ${data.mother.name} in ${data.exhibitName}!`);
});

eventBus.on('BABY_NEEDS_NAME', (babyInfo) => {
    import('./ui/ExhibitsUI.js').then(module => {
        module.showBabyNamingModal(babyInfo);
    });
});

eventBus.on('BABY_NAMED', (data) => {
    logMessage(`🏷️ Baby named: ${data.newName}`);
});

eventBus.on('EXHIBIT_COMPLETED', (data) => {
    logMessage(`✅ ${data.name} finished building!`);
});

eventBus.on('ANIMAL_PURCHASED', (data) => {
    logMessage(`🎉 Welcome ${data.animal} the ${data.species}! (Cost: $${data.cost})`);
});

eventBus.on('RESEARCH_STARTED', (data) => {
    logMessage(`🔬 Started researching ${data.icon} ${data.researchName} ($${data.cost}, ${data.days} days)`);
});

eventBus.on('RESEARCH_COMPLETED', (data) => {
    logMessage(`✅ RESEARCH COMPLETE! ${data.icon} ${data.researchName} - Unlocked: ${data.unlocks.join(', ')}`);
    if (document.querySelector('.nav-btn.active')?.dataset.section === 'research') renderResearch();
});

eventBus.on('RESEARCH_PROGRESS', () => {
    if (document.querySelector('.nav-btn.active')?.dataset.section === 'research') renderResearch();
});

eventBus.on('GAME_LOADED', (data) => {
    logMessage(`📂 Loaded save: ${data.slot}`);
});

// =====================================================================
// BUTTON HANDLERS
// =====================================================================
if (endDayBtn) {
    endDayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        advanceDay();
    });
}

if (buildExhibitBtn) {
    buildExhibitBtn.addEventListener('click', () => {
        const modal = document.getElementById('buildModal');
        if (modal) modal.classList.add('active');
    });
}

// =====================================================================
// SAVE/LOAD HANDLERS
// =====================================================================
window.manualSave = (slot) => {
    if (saveGame(slot)) {
        alert(`Game saved to "${slot}"!`);
        renderSavesTab();
    }
};

window.loadSpecificSave = (slot) => {
    if (confirm(`Load "${slot}"? Any unsaved progress will be lost.`)) {
        if (loadGame(slot)) {
            updateUI();
            renderShop();
            alert(`Loaded "${slot}" successfully!`);
        }
    }
};

window.deleteSpecificSave = (slot) => {
    deleteSave(slot);
    renderSavesTab();
};

window.exportCurrentSave = () => {
    const slots = getSaveSlots();
    const slotToExport = slots.find(s => s.slot !== 'autosave')?.slot || 'autosave';
    exportSave(slotToExport);
};

const importInput = document.getElementById('importSaveInput');
if (importInput) {
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importSave(file);
            renderSavesTab();
            e.target.value = '';
        }
    });
}

// =====================================================================
// RESEARCH UI WRAPPER
// =====================================================================
window.startResearch = (researchId) => {
    const success = startResearch(researchId);
    if (success) {
        updateUI();
        renderResearch();
    }
};

// =====================================================================
// INITIALIZATION
// =====================================================================
async function init() {
    console.log('🚀 init() function called!');
    
    try {
        await loadAllData();
        console.log('✅ loadAllData() completed!');
        
        updateUI();
        renderShop();
        logMessage("🦁 ZooSmith V2 Engine Initialized!");
        
        // Expose for debugging
        window.state = state;
        window.data = data;
    } catch (error) {
        console.error('❌ ERROR in init():', error);
    }
}

console.log('🚀 About to call init()...');
init();
