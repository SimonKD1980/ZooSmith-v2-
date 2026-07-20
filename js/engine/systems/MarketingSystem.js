// js/engine/systems/MarketingSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

export const ADVERTISING_TIERS = {
    none: {
        id: 'none',
        name: 'No Advertising',
        weeklyCost: 0,
        reachMultiplier: 1.0,
        description: 'Rely on word of mouth only'
    },
    local: {
        id: 'local',
        name: 'Local Advertising',
        weeklyCost: 200,
        reachMultiplier: 1.2,
        description: 'Local newspapers, radio, community boards'
    },
    regional: {
        id: 'regional',
        name: 'Regional Campaign',
        weeklyCost: 500,
        reachMultiplier: 1.5,
        description: 'Regional TV, billboards, online ads'
    },
    national: {
        id: 'national',
        name: 'National Campaign',
        weeklyCost: 1500,
        reachMultiplier: 2.0,
        description: 'National TV, major online platforms'
    },
    viral: {
        id: 'viral',
        name: 'Viral Social Media',
        weeklyCost: 800,
        reachMultiplier: 1.8,
        description: 'Influencer partnerships, viral content'
    }
};

export function processMarketing() {
    // Calculate weekly marketing expenses
    const weeklyBudget = state.marketing?.weeklyBudget || 0;
    
    // Deduct weekly budget (every 7 days)
    if (state.day % 7 === 1) {
        if (weeklyBudget > 0) {
            state.money -= weeklyBudget;
            state.marketing.totalSpent = (state.marketing?.totalSpent || 0) + weeklyBudget;
            
            eventBus.emit('MARKETING_EXPENSE', {
                amount: weeklyBudget,
                week: Math.ceil(state.day / 7)
            });
        }
    }
    
    // Calculate online reach based on budget and zoo rating
    const baseReach = calculateBaseReach();
    const ratingBonus = (state.zooRating || 0) * 10;
    const campaignBonus = calculateCampaignBonus();
    
    state.marketing.onlineReach = Math.floor(baseReach + ratingBonus + campaignBonus);
    
    // Calculate social media followers (grows slowly over time)
    const followerGrowth = Math.floor((state.marketing.onlineReach / 100) * (1 + (state.zooRating / 100)));
    state.marketing.socialMediaFollowers = (state.marketing?.socialMediaFollowers || 0) + followerGrowth;
    
    // Calculate website visitors
    state.marketing.websiteVisitors = Math.floor(state.marketing.onlineReach * 0.3);
    
    // Calculate brand awareness (0-100)
    const maxPossibleReach = 100000;
    state.marketing.brandAwareness = Math.min(100, Math.floor((state.marketing.onlineReach / maxPossibleReach) * 100));
}

function calculateBaseReach() {
    const weeklyBudget = state.marketing?.weeklyBudget || 0;
    
    // Base reach from budget
    if (weeklyBudget === 0) return 1000;
    if (weeklyBudget <= 200) return 5000;
    if (weeklyBudget <= 500) return 15000;
    if (weeklyBudget <= 800) return 30000;
    if (weeklyBudget <= 1500) return 60000;
    return 100000;
}

function calculateCampaignBonus() {
    const campaigns = state.marketing?.activeCampaigns || [];
    let bonus = 0;
    
    campaigns.forEach(campaign => {
        if (campaign.daysRemaining > 0) {
            bonus += campaign.reachBonus;
            campaign.daysRemaining--;
        }
    });
    
    // Remove expired campaigns
    state.marketing.activeCampaigns = campaigns.filter(c => c.daysRemaining > 0);
    
    return bonus;
}

export function setWeeklyBudget(amount) {
    const budget = parseInt(amount) || 0;
    state.marketing.weeklyBudget = Math.max(0, Math.min(10000, budget));
    
    eventBus.emit('MARKETING_BUDGET_CHANGED', {
        budget: state.marketing.weeklyBudget
    });
    
    return true;
}

export function launchCampaign(campaignType) {
    const campaigns = {
        weekend_special: {
            name: 'Weekend Special Event',
            cost: 300,
            duration: 3,
            reachBonus: 5000,
            visitorMultiplier: 1.3
        },
        school_holiday: {
            name: 'School Holiday Promotion',
            cost: 600,
            duration: 7,
            reachBonus: 12000,
            visitorMultiplier: 1.5
        },
        influencer_visit: {
            name: 'Influencer Visit',
            cost: 1000,
            duration: 5,
            reachBonus: 20000,
            visitorMultiplier: 1.6
        },
        conservation_campaign: {
            name: 'Conservation Awareness',
            cost: 500,
            duration: 14,
            reachBonus: 8000,
            visitorMultiplier: 1.2,
            ratingBonus: 5
        }
    };
    
    const campaign = campaigns[campaignType];
    if (!campaign) {
        alert('Invalid campaign type!');
        return false;
    }
    
    if (state.money < campaign.cost) {
        alert(`Not enough money! Need $${campaign.cost}`);
        return false;
    }
    
    state.money -= campaign.cost;
    
    state.marketing.activeCampaigns.push({
        type: campaignType,
        name: campaign.name,
        daysRemaining: campaign.duration,
        reachBonus: campaign.reachBonus,
        visitorMultiplier: campaign.visitorMultiplier,
        ratingBonus: campaign.ratingBonus || 0
    });
    
    state.marketing.campaignHistory.push({
        ...campaign,
        startDate: state.day,
        completed: false
    });
    
    eventBus.emit('MARKETING_CAMPAIGN_LAUNCHED', {
        campaign: campaign.name,
        cost: campaign.cost,
        duration: campaign.duration
    });
    
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
