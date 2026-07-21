// js/ui/MarketingUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { setWeeklyBudget, launchCampaign, getMarketingMultiplier, isMarketingFeatureUnlocked } from '../engine/systems/MarketingSystem.js';

export function renderMarketing() {
    const marketing = state.marketing || {};
    const weeklyBudget = marketing.weeklyBudget || 0;
    const multiplier = getMarketingMultiplier();
    
    let html = `
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; margin-bottom:24px;">
            <h3 style="margin:0 0 15px 0; color:#e5e7eb; font-size:1.3rem;"> Marketing Overview</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                <div style="background:#0f172a; padding:15px; border-radius:10px; border-left:4px solid #3b82f6;">
                    <div style="font-size:0.85rem; color:#9ca3af; margin-bottom:5px;"> Online Reach</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#3b82f6;">${(marketing.onlineReach || 0).toLocaleString()}</div>
                </div>
                <div style="background:#0f172a; padding:15px; border-radius:10px; border-left:4px solid #ec4899;">
                    <div style="font-size:0.85rem; color:#9ca3af; margin-bottom:5px;">📱 Social Followers</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#ec4899;">${(marketing.socialMediaFollowers || 0).toLocaleString()}</div>
                </div>
                <div style="background:#0f172a; padding:15px; border-radius:10px; border-left:4px solid #22c55e;">
                    <div style="font-size:0.85rem; color:#9ca3af; margin-bottom:5px;">🌟 Brand Awareness</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#22c55e;">${marketing.brandAwareness || 0}%</div>
                </div>
                <div style="background:#0f172a; padding:15px; border-radius:10px; border-left:4px solid #f59e0b;">
                    <div style="font-size:0.85rem; color:#9ca3af; margin-bottom:5px;">📈 Visitor Multiplier</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#f59e0b;">x${multiplier.toFixed(2)}</div>
                </div>
            </div>
        </div>
        
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; margin-bottom:24px;">
            <h3 style="margin:0 0 15px 0; color:#e5e7eb; font-size:1.3rem;">💰 Weekly Advertising Budget</h3>
            <p style="color:#9ca3af; margin-bottom:20px; font-size:0.95rem;">Set your weekly advertising budget. Deducted every 7 days.</p>
            
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:300px;">
                    <input type="range" id="marketingBudgetSlider" min="0" max="2000" step="100" value="${weeklyBudget}" 
                        style="width:100%; height:8px; border-radius:4px; background:#1e293b; outline:none;"
                        oninput="window.updateMarketingBudget(this.value)">
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#9ca3af;">$</span>
                    <input type="number" id="marketingBudgetInput" value="${weeklyBudget}" min="0" max="10000" step="100" 
                        style="width:100px; padding:10px; font-size:1.2rem; font-weight:700; background:#0f172a; color:#e5e7eb; border:2px solid #3b82f6; border-radius:8px; text-align:center;"
                        onchange="window.updateMarketingBudget(this.value)">
                    <span style="color:#9ca3af;">/week</span>
                </div>
            </div>
            
            <div style="background:#0f172a; padding:15px; border-radius:8px; border-left:4px solid #3b82f6;">
                <div style="font-weight:700; color:#e5e7eb; margin-bottom:8px;">Total Marketing Spend: <span style="color:#22c55e;">$${(marketing.totalSpent || 0).toLocaleString()}</span></div>
            </div>
        </div>
        
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; margin-bottom:24px;">
            <h3 style="margin:0 0 15px 0; color:#e5e7eb; font-size:1.3rem;"> Special Campaigns</h3>
            <p style="color:#9ca3af; margin-bottom:20px; font-size:0.95rem;">Launch time-limited campaigns for extra visibility.</p>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:15px;">
    `;

    //  Render Campaigns from JSON
    data.marketingData.campaigns.forEach(campaign => {
        const isLocked = !isMarketingFeatureUnlocked(campaign.requiredResearch);
        const canAfford = state.money >= campaign.cost;
        
        html += `
            <div style="background:#0f172a; border:1px solid ${isLocked ? '#475569' : '#334155'}; border-radius:12px; padding:15px; position:relative; ${isLocked ? 'opacity:0.7;' : ''}">
                ${isLocked ? `<div style="position:absolute; top:12px; right:12px; background:#ef4444; color:#fff; padding:4px 10px; border-radius:20px; font-weight:700; font-size:0.8rem; z-index:10;">🔒 LOCKED</div>` : ''}
                
                <div style="display:flex; align-items:start; gap:12px; margin-bottom:12px;">
                    <div style="font-size:2rem; ${isLocked ? 'filter:grayscale(100%);' : ''}">${campaign.icon}</div>
                    <div style="flex:1;">
                        <div style="font-weight:700; color:#e5e7eb; font-size:1.1rem; margin-bottom:4px;">${campaign.name}</div>
                        <div style="font-size:0.85rem; color:#9ca3af;">${campaign.duration} days</div>
                    </div>
                </div>
                
                <p style="color:#9ca3af; font-size:0.9rem; margin-bottom:12px; min-height:40px;">${isLocked ? 'Complete the required research to unlock.' : campaign.description}</p>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:1.3rem; font-weight:800; color:${isLocked ? '#64748b' : '#f59e0b'};">💰 $${campaign.cost}</div>
                    <div style="font-size:0.9rem; font-weight:700; color:#22c55e;">x${campaign.visitorMultiplier}</div>
                </div>
                
                <button onclick="window.launchMarketingCampaign('${campaign.id}')" 
                    style="width:100%; padding:10px; background:${isLocked || !canAfford ? '#475569' : '#f59e0b'}; color:${isLocked || !canAfford ? '#9ca3af' : '#000'}; border:none; border-radius:8px; font-weight:700; cursor:${isLocked || !canAfford ? 'not-allowed' : 'pointer'}; font-size:0.95rem;"
                    ${isLocked || !canAfford ? 'disabled' : ''}>
                    ${isLocked ? '🔒 Research Required' : !canAfford ? '💸 Can\'t Afford' : '🚀 Launch Campaign'}
                </button>
            </div>
        `;
    });

    html += `</div></div>`;
    
    // Active Campaigns Section
    if (marketing.activeCampaigns && marketing.activeCampaigns.length > 0) {
        html += `
        <div style="background:#1e293b; border:2px solid #f59e0b; border-radius:12px; padding:20px;">
            <h3 style="margin:0 0 15px 0; color:#e5e7eb; font-size:1.3rem;"> Active Campaigns</h3>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${marketing.activeCampaigns.map(campaign => `
                    <div style="background:#0f172a; padding:12px; border-radius:8px; border-left:4px solid #f59e0b; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:700; color:#e5e7eb;">${campaign.name}</div>
                            <div style="font-size:0.85rem; color:#9ca3af;">${campaign.daysRemaining} days remaining</div>
                        </div>
                        <div style="font-size:1.2rem; font-weight:800; color:#f59e0b;">x${(campaign.visitorMultiplier || 1).toFixed(1)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    }
    
    const el = document.getElementById('marketing');
    if (el) el.innerHTML = html;
}

window.updateMarketingBudget = (value) => {
    const budget = parseInt(value) || 0;
    setWeeklyBudget(budget);
    
    const slider = document.getElementById('marketingBudgetSlider');
    const input = document.getElementById('marketingBudgetInput');
    if (slider) slider.value = state.marketing.weeklyBudget;
    if (input) input.value = state.marketing.weeklyBudget;
    
    renderMarketing();
};

window.launchMarketingCampaign = (campaignId) => {
    const success = launchCampaign(campaignId);
    if (success) renderMarketing();
};
