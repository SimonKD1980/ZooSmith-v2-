// js/ui/MarketingUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { ADVERTISING_TIERS, setWeeklyBudget, launchCampaign, getMarketingMultiplier } from '../engine/systems/MarketingSystem.js';

export function renderMarketing() {
    const marketing = state.marketing || {};
    const weeklyBudget = marketing.weeklyBudget || 0;
    const multiplier = getMarketingMultiplier();
    
    let html = `
        <div class="status-panel">
            <h3>📊 Marketing Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <div style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 5px;"> Online Reach</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #3b82f6;">${(marketing.onlineReach || 0).toLocaleString()}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">people reached</div>
                </div>
                
                <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #ec4899;">
                    <div style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 5px;"> Social Media Followers</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #ec4899;">${(marketing.socialMediaFollowers || 0).toLocaleString()}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">total followers</div>
                </div>
                
                <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
                    <div style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 5px;">🌟 Brand Awareness</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #22c55e;">${marketing.brandAwareness || 0}%</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">public recognition</div>
                </div>
                
                <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 5px;"> Visitor Multiplier</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #f59e0b;">x${multiplier.toFixed(2)}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">from active campaigns</div>
                </div>
            </div>
        </div>
        
        <div class="status-panel">
            <h3>💰 Weekly Advertising Budget</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Set your weekly advertising budget. This is automatically deducted every 7 days.</p>
            
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <input type="range" id="marketingBudgetSlider" min="0" max="2000" step="100" value="${weeklyBudget}" 
                        style="width: 100%; height: 8px; border-radius: 4px; background: #1e293b; outline: none; -webkit-appearance: none;"
                        oninput="window.updateMarketingBudget(this.value)">
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #9ca3af; font-size: 0.9rem;">$</span>
                    <input type="number" id="marketingBudgetInput" value="${weeklyBudget}" min="0" max="10000" step="100" 
                        style="width: 100px; padding: 10px; font-size: 1.2rem; font-weight: 700; background: #0f172a; color: #e5e7eb; border: 2px solid #3b82f6; border-radius: 8px; text-align: center;"
                        onchange="window.updateMarketingBudget(this.value)">
                    <span style="color: #9ca3af; font-size: 0.9rem;">/week</span>
                </div>
            </div>
            
            <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid ${getBudgetTierColor(weeklyBudget)};">
                <div style="font-weight: 700; color: #e5e7eb; margin-bottom: 8px;">
                    ${getBudgetTierName(weeklyBudget)}
                </div>
                <div style="font-size: 0.9rem; color: #9ca3af;">
                    ${getBudgetTierDescription(weeklyBudget)}
                </div>
                <div style="margin-top: 10px; font-size: 0.85rem; color: #64748b;">
                    Total spent on marketing: <strong style="color: #e5e7eb;">$${(marketing.totalSpent || 0).toLocaleString()}</strong>
                </div>
            </div>
        </div>
        
        <div class="status-panel">
            <h3>🎯 Special Campaigns</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Launch time-limited marketing campaigns for extra visibility and visitors.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
                ${renderCampaignCard('weekend_special', '', 'Weekend Special Event', 300, 3, 'Boost visitors by 30% for 3 days', '#ec4899')}
                ${renderCampaignCard('school_holiday', '🎓', 'School Holiday Promotion', 600, 7, 'Boost visitors by 50% for 7 days', '#3b82f6')}
                ${renderCampaignCard('influencer_visit', '📸', 'Influencer Visit', 1000, 5, 'Boost visitors by 60% for 5 days', '#a855f7')}
                ${renderCampaignCard('conservation_campaign', '🌍', 'Conservation Awareness', 500, 14, 'Boost visitors by 20% +5 rating for 14 days', '#22c55e')}
            </div>
        </div>
        
        ${marketing.activeCampaigns && marketing.activeCampaigns.length > 0 ? `
        <div class="status-panel" style="border: 2px solid #f59e0b;">
            <h3>⚡ Active Campaigns</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${marketing.activeCampaigns.map(campaign => `
                    <div style="background: #0f172a; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; color: #e5e7eb;">${campaign.name}</div>
                            <div style="font-size: 0.85rem; color: #9ca3af;">${campaign.daysRemaining} days remaining</div>
                        </div>
                        <div style="font-size: 1.2rem; font-weight: 800; color: #f59e0b;">
                            x${(campaign.visitorMultiplier || 1).toFixed(1)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
    
    const el = document.getElementById('marketing');
    if (el) el.innerHTML = html;
}

function renderCampaignCard(id, icon, name, cost, duration, description, color) {
    return `
        <div style="background: #0f172a; border: 2px solid ${color}33; border-radius: 12px; padding: 15px; transition: all 0.2s;">
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                <div style="font-size: 2rem;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: #e5e7eb; font-size: 1.1rem; margin-bottom: 4px;">${name}</div>
                    <div style="font-size: 0.85rem; color: #9ca3af;">${duration} days</div>
                </div>
            </div>
            <p style="color: #9ca3af; font-size: 0.9rem; margin-bottom: 12px; min-height: 40px;">${description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-size: 1.3rem; font-weight: 800; color: ${color};">💰 $${cost}</div>
            </div>
            <button onclick="window.launchMarketingCampaign('${id}')" 
                style="width: 100%; padding: 10px; background: ${color}; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem; transition: filter 0.2s;"
                onmouseover="this.style.filter='brightness(1.1)'" 
                onmouseout="this.style.filter='brightness(1)'">
                🚀 Launch Campaign
            </button>
        </div>
    `;
}

function getBudgetTierName(budget) {
    if (budget === 0) return ' No Advertising';
    if (budget <= 200) return ' Local Advertising';
    if (budget <= 500) return '📺 Regional Campaign';
    if (budget <= 800) return '🌟 Viral Social Media';
    if (budget <= 1500) return '📡 National Campaign';
    return '🚀 Maximum Reach';
}

function getBudgetTierDescription(budget) {
    if (budget === 0) return 'Rely on word of mouth only. Minimal visitor attraction.';
    if (budget <= 200) return 'Local newspapers, radio, and community boards. Modest reach.';
    if (budget <= 500) return 'Regional TV, billboards, and online ads. Good visibility.';
    if (budget <= 800) return 'Influencer partnerships and viral content. High engagement.';
    if (budget <= 1500) return 'National TV and major online platforms. Maximum exposure.';
    return 'Full-scale marketing across all channels. Dominant market presence.';
}

function getBudgetTierColor(budget) {
    if (budget === 0) return '#64748b';
    if (budget <= 200) return '#3b82f6';
    if (budget <= 500) return '#8b5cf6';
    if (budget <= 800) return '#ec4899';
    if (budget <= 1500) return '#f59e0b';
    return '#22c55e';
}

window.updateMarketingBudget = (value) => {
    const budget = parseInt(value) || 0;
    setWeeklyBudget(budget);
    
    const slider = document.getElementById('marketingBudgetSlider');
    const input = document.getElementById('marketingBudgetInput');
    if (slider) slider.value = budget;
    if (input) input.value = budget;
    
    renderMarketing();
};

window.launchMarketingCampaign = (campaignType) => {
    const success = launchCampaign(campaignType);
    if (success) {
        renderMarketing();
    }
};
