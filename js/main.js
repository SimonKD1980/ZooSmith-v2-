// js/main.js
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';
import { loadAllData } from './engine/data.js';
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

// =====================================================================
// UI REFERENCES
// =====================================================================
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const ratingEl = document.getElementById('rating');
const satisfactionEl = document.getElementById('satisfaction');
const zooNameEl = document.getElementById('zooName');
const endDayBtn = document.getElementById('endDayBtn');
const buildExhibitBtn = document.getElementById('buildExhibitBtn');
const logEl = document.getElementById('log');

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
    
    if (moneyEl) moneyEl.textContent = state.money.toLocaleString();
    if (dayEl) dayEl.textContent = state.day;
    
    // Show rating with tier emoji
    const tier = getTier(state.zooRating || 0);
    if (ratingEl) ratingEl.textContent = `${tier.emoji} ${state.zooRating}`;
    if (satisfactionEl) satisfactionEl.textContent = state.visitorSatisfaction;
    if (zooNameEl) zooNameEl.textContent = state.zooName || 'My Zoo';
}

// =====================================================================
// VISITORS TAB (with Rating Breakdown)
// =====================================================================
function renderVisitorsTab() {
    const el = document.getElementById('visitors');
    if (!el) return;
    
    let html = renderRatingBreakdown();
    
    html += '<div class="status-panel"><h3>👥 Visitor Summary</h3>';
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Today's Visitors</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6;">${state.dailyVisitors}</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Guest Happiness</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: ${(state.guestHappiness || 50) >= 70 ? '#22c55e' : '#f59e0b'};">${state.guestHappiness || 50}%</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Amenity Revenue</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">$${(state.visitorSpending?.total || 0).toLocaleString()}</div>
            </div>
        </div>
    `;
    
    if (state.visitorComplaints && state.visitorComplaints.length > 0) {
        html += '<div style="margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">';
        html += '<div style="font-size: 0.8rem; color: #fca5a5; margin-bottom: 6px; font-weight: 700;">⚠️ Complaints:</div>';
        state.visitorComplaints.forEach(c => {
            html += `<div style="font-size: 0.85rem; color: #e5e7eb; margin-bottom: 4px;">${c.icon} ${c.text}</div>`;
        });
        html += '</div>';
    }
    html += '</div>';
    
    el.innerHTML = html;
}

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
                <div style="text-align: right;">
                    <div style="font-size: 0.85rem; color: #9ca3af;">Next Tier Bonus</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #22c55e;">
                        ${getNextTierBonus()}
                    </div>
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
                
                ${renderFactorCard('🎟️ Visitor Experience', d.visitorExperience.total, d.visitorExperience.max, [
                    `😊 Satisfaction: ${d.visitorExperience.satisfaction}% (+${d.visitorExperience.satisfactionPoints})`,
                    `🏪 Amenities: ${d.visitorExperience.presentAmenities}/${d.visitorExperience.totalEssential} (+${d.visitorExperience.amenityPoints})`
                ], '#a855f7')}
            </div>
            
            <h4 style="color: #ef4444; margin: 0 0 10px 0;">❌ Negative Factors (-${breakdown.negative})</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
                ${renderFactorCard('💀 Neglect', d.neglect.total, null, [
                    `☠️ Deaths: ${d.neglect.deaths} (-${d.neglect.deathPenalty})`,
                    `😢 Unhappy Animals: ${d.neglect.unhappyCount} (-${d.neglect.unhappyPenalty})`
                ], '#ef4444')}
                
                ${renderFactorCard('🏚️ Poor Facilities', d.poorFacilities.total, null, [
                    `🧹 Dirty Exhibits: ${d.poorFacilities.dirtyExhibits} (-${d.poorFacilities.dirtyExhibits * 3})`,
                    `🗑️ Dirty Amenities: ${d.poorFacilities.dirtyAmenities} (-${d.poorFacilities.dirtyAmenities * 3})`,
                    `❌ Missing Essentials: ${d.poorFacilities.missingEssentials} (-${d.poorFacilities.missingEssentials * 5})`
                ], '#f59e0b')}
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

function getNextTierBonus() {
    const currentTier = getTier(state.zooRating || 0);
    const nextTier = RATING_TIERS.find(t => t.min > currentTier.min);
    if (!nextTier) return '🏆 MAX TIER!';
    return `$${nextTier.bonus.toLocaleString()} at ${nextTier.min} pts`;
}

// =====================================================================
// EVENT LISTENERS
// =====================================================================
eventBus.on('DAY_ADVANCED', () => {
    updateUI();
    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab) activeTab.click();
    logMessage(`--- Day ${state.day} Complete ---`);
});

eventBus.on('ECONOMY_PROCESSED', (data) => {
    logMessage(`💰 Economy: Visitors ${data.visitors} | Net Profit $${data.profit}`);
});

eventBus.on('ANIMAL_DIED', (data) => {
    const emoji = data.cause === 'old age' ? '⚰️' : '💀';
    logMessage(`${emoji} ${data.animal.name} died of ${data.cause} in ${data.exhibitName}`);
});

eventBus.on('ANIMALS_HUNGRY', (data) => {
    logMessage(`⚠️ HUNGRY: ${data.animals.slice(0, 3).join(', ')}${data.animals.length > 3 ? ` +${data.animals.length - 3} more` : ''}`);
});

eventBus.on('ANIMAL_SICK', (data) => {
    logMessage(`🤒 ${data.animal.name} has fallen ill in ${data.exhibitName}!`);
});

eventBus.on('ANIMAL_RECOVERED', (data) => {
    logMessage(`💚 ${data.animal.name} has recovered!`);
});

eventBus.on('PREGNANCY_STARTED', (data) => {
    logMessage(`🤰 ${data.mother.name} is pregnant! Baby due in ${data.gestationDays} days (father: ${data.father})`);
});

eventBus.on('ANIMAL_BORN', (data) => {
    logMessage(`🍼 ${data.baby.name} was born to ${data.mother.name} in ${data.exhibitName}!`);
});

eventBus.on('LIFE_STAGE', (data) => {
    const stageEmoji = { baby: '🍼', juvenile: '🐾', adult: '🦁', senior: '👴' };
    logMessage(`${stageEmoji[data.stage]} ${data.animal.name} is now a ${data.stage}!`);
});

eventBus.on('EXHIBIT_COMPLETED', (data) => {
    logMessage(`✅ ${data.name} finished building!`);
});

eventBus.on('MAINTENANCE_COST', (data) => {
    logMessage(`🧹 Maintenance cost: -$${data.amount}`);
});

eventBus.on('UPKEEP_COST', (data) => {
    logMessage(`🧾 Facility upkeep: -$${data.amount}`);
});

eventBus.on('ANIMAL_ESCAPED', (data) => {
    logMessage(`🚨 ${data.animal.name} escaped from ${data.exhibitName}!`);
});

eventBus.on('VISITORS_PROCESSED', (data) => {
    logMessage(`👥 Visitors: ${data.visitors} | Spending: $${data.spending.total}`);
});

eventBus.on('STAFF_EXPENSE', (data) => {
    logMessage(`💰 Staff salaries: -$${data.amount}`);
});

eventBus.on('UNDERSTAFFED', (data) => {
    logMessage(`⚠️ UNDERSTAFFED! Keepers: ${data.keeperCapacity}/${data.keeperDemand} | Cleaners: ${data.cleanerCapacity}/${data.cleanerDemand}`);
});

eventBus.on('ANIMAL_PURCHASED', (data) => {
    logMessage(`🎉 Purchased ${data.animal} for $${data.cost} (placed in ${data.exhibit})`);
});

eventBus.on('FOOD_PURCHASED', (data) => {
    const food = FOOD_TYPES[data.foodType];
    logMessage(`🍽️ Bought ${data.amount} ${food.name} for $${data.cost}`);
});

eventBus.on('STAFF_HIRED', (data) => {
    logMessage(`✅ Hired ${data.staffName} for $${data.cost}`);
});

eventBus.on('STAFF_FIRED', (data) => {
    logMessage(`❌ Fired ${data.staffName} (severance: $${data.refund})`);
});

eventBus.on('AMENITY_BUILT', (data) => {
    logMessage(`🏪 Built ${data.amenityName} for $${data.cost}`);
});

eventBus.on('EXHIBIT_BUILD_STARTED', (data) => {
    logMessage(`🏗️ Started building ${data.name} (${data.size}) for $${data.cost} - ${data.days} days`);
});

eventBus.on('FENCE_REPAIRED', (data) => {
    logMessage(`🔧 Repaired fence at ${data.exhibitName} for $${data.cost}`);
});

eventBus.on('RATING_UPDATED', (data) => {
    console.log(`⭐ Rating: ${data.score}/100 (${data.tier.name})`);
});

eventBus.on('TIER_UPGRADED', (data) => {
    logMessage(`🎉 TIER UPGRADED! ${data.emoji} ${data.tier}! Bonus: +$${data.bonus.toLocaleString()}`);
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
// LOG HELPER
// =====================================================================
function logMessage(msg) {
    if (!logEl) return;
    const p = document.createElement('div');
    p.textContent = msg;
    logEl.prepend(p);
    while (logEl.children.length > 100) {
        logEl.removeChild(logEl.lastChild);
    }
}

// =====================================================================
// INITIALIZATION
// =====================================================================
async function init() {
    await loadAllData();
    updateUI();
    renderShop();
    logMessage("🦁 ZooSmith V2 Engine Initialized!");
    logMessage("💡 Tip: Click the 👥 Visitors tab to see your zoo rating breakdown.");
}

init
