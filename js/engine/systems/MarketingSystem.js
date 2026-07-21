// js/engine/systems/MarketingSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processMarketing() {
    const weeklyBudget = state.marketing?.weeklyBudget || 0;
    
    // Deduct weekly budget (every 7 days)
    if (state.day % 7 === 1 && weeklyBudget > 0) {
        state.money -= weeklyBudget;
        state.marketing.totalSpent = (state.marketing?.totalSpent || 0) + weeklyBudget;
        
        eventBus.emit('MARKETING_EXPENSE', { amount: weeklyBudget, week: Math.ceil(state.day / 7) });
    }
    
    // Calculate online reach
    const baseReach = calculateBaseReach();
    const ratingBonus = (state.zooRating || 0) * 10;
    const campaignBonus = calculateCampaignBonus();
    
    state.marketing.onlineReach = Math.floor(baseReach + ratingBonus + campaignBonus);
    
    // Calculate social media followers
    const followerGrowth = Math.floor((state.marketing.onlineReach / 100) * (1 + (state.zooRating / 100)));
    state.marketing.socialMediaFollowers = (state.marketing?.socialMediaFollowers || 0) + followerGrowth;
    
    // Calculate brand awareness
    state.marketing.brandAwareness = Math.min(100, Math.floor((state.marketing.onlineReach / 100000) * 100));
}

function calculateBaseReach() {
    const weeklyBudget = state.marketing?.weeklyBudget || 0;
    const tier = data.marketingData.weeklyTiers.find(t => t.weeklyCost === weeklyBudget) || data.marketingData.weeklyTiers[0];
    return 1000 * (tier?.reachMultiplier || 1);
}

function calculateCampaignBonus() {
    const campaigns = state.marketing?.activeCampaigns || [];
    let bonus = 0;
    
    campaigns.forEach(campaign => {
        if (campaign.daysRemaining > 0) {
            bonus += campaign.reachBonus || 5000;
            campaign.daysRemaining--;
        }
    });
    
    state.marketing.activeCampaigns = campaigns.filter(c => c.daysRemaining > 0);
    return bonus;
}

export function setWeeklyBudget(amount) {
    const budget = parseInt(amount) || 0;
    // Ensure the budget matches a valid tier
    const validTier = data.marketingData.weeklyTiers.find(t => t.weeklyCost === budget);
    
    if (!validTier) {
        // If they pick a number not in the JSON, find the closest lower tier
        const closest = data.marketingData.weeklyTiers.filter(t => t.weeklyCost <= budget).sort((a,b) => b.weeklyCost - a.weeklyCost)[0];
        state.marketing.weeklyBudget = closest ? closest.weeklyCost : 0;
    } else {
        state.marketing.weeklyBudget = budget;
    }
    
    eventBus.emit('MARKETING_BUDGET_CHANGED', { budget: state.marketing.weeklyBudget });
    return true;
}

export function launchCampaign(campaignId) {
    const campaignData = data.marketingData.campaigns.find(c => c.id === campaignId);
    if (!campaignData) return false;
    
    // Check research lock
    if (campaignData.requiredResearch && !state.researchCompleted.includes(campaignData.requiredResearch)) {
        alert("This campaign is locked! Complete the required research first.");
        return false;
    }

    if (state.money < campaignData.cost) {
        alert(`Not enough money! Need $${campaignData.cost}`);
        return false;
    }
    
    state.money -= campaignData.cost;
    
    state.marketing.activeCampaigns.push({
        id: campaignData.id,
        name: campaignData.name,
        daysRemaining: campaignData.duration,
        reachBonus: 5000,
        visitorMultiplier: campaignData.visitorMultiplier,
        ratingBonus: campaignData.ratingBonus || 0
    });
    
    eventBus.emit('MARKETING_CAMPAIGN_LAUNCHED', { campaign: campaignData.name, cost: campaignData.cost });
    return true;
}

export function getMarketingMultiplier() {
    const campaigns = state.marketing?.activeCampaigns || [];
    let multiplier = 1.0;
    campaigns.forEach(campaign => {
        if (campaign.daysRemaining > 0 && campaign.visitorMultiplier) {
            multiplier *= campaign.visitorMultiplier;
        }
    });
    return multiplier;
}

// Helper to check if a feature is unlocked
export function isMarketingFeatureUnlocked(requiredResearch) {
    if (!requiredResearch) return true;
    return state.researchCompleted.includes(requiredResearch);
}
