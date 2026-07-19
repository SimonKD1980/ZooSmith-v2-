// js/engine/systems/UpgradeSystem.js
import { data } from '../data.js';

// Get all active effects from an exhibit's upgrades
export function getExhibitEffects(exhibit) {
    const effects = {
        happiness: 0,
        attraction: 0,
        income: 0,
        visitorCapacity: 0,
        ratingBonus: 0,
        fenceDecayReduction: 1, // 1 = normal decay, 0.5 = half decay
        escapePrevention: 0,
        temperatureControl: null
    };

    if (!exhibit.upgrades || exhibit.upgrades.length === 0) {
        return effects;
    }

    exhibit.upgrades.forEach(upgradeId => {
        const upgradeData = data.upgrades.find(u => u.id === upgradeId);
        if (!upgradeData || !upgradeData.effects) return;

        const e = upgradeData.effects;
        if (e.happiness) effects.happiness += e.happiness;
        if (e.attraction) effects.attraction += e.attraction;
        if (e.income) effects.income += e.income;
        if (e.visitorCapacity) effects.visitorCapacity += e.visitorCapacity;
        if (e.ratingBonus) effects.ratingBonus += e.ratingBonus;
        if (e.fenceDecayReduction) effects.fenceDecayReduction *= e.fenceDecayReduction;
        if (e.escapePrevention) effects.escapePrevention += e.escapePrevention;
        if (e.temperatureControl) effects.temperatureControl = e.temperatureControl;
    });

    return effects;
}

// Check if an upgrade can be installed in a specific exhibit
export function canInstallUpgrade(exhibit, upgradeId) {
    const upgradeData = data.upgrades.find(u => u.id === upgradeId);
    if (!upgradeData) return { allowed: false, reason: 'Upgrade not found' };

    // Already installed?
    if (exhibit.upgrades && exhibit.upgrades.includes(upgradeId)) {
        return { allowed: false, reason: 'Already installed' };
    }

    // Under construction?
    if (exhibit.buildDaysRemaining > 0) {
        return { allowed: false, reason: 'Exhibit under construction' };
    }

    // Compatible type?
    if (upgradeData.compatibleTypes && !upgradeData.compatibleTypes.includes(exhibit.type)) {
        return { allowed: false, reason: 'Incompatible exhibit type' };
    }

    // Compatible size?
    if (upgradeData.compatibleSizes && !upgradeData.compatibleSizes.includes(exhibit.size)) {
        return { allowed: false, reason: 'Exhibit too small' };
    }

    return { allowed: true };
}

// Get upgrades available for a specific exhibit
export function getAvailableUpgrades(exhibit) {
    return data.upgrades.map(upgrade => {
        const check = canInstallUpgrade(exhibit, upgrade.id);
        const installed = exhibit.upgrades?.includes(upgrade.id) || false;
        return {
            ...upgrade,
            available: check.allowed && !installed,
            installed: installed,
            blockedReason: check.reason
        };
    });
}
