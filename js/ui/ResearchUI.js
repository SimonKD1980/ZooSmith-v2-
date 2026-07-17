// js/ui/ResearchUI.js
import { state } from '../engine/GameState.js';
import { data } from '../engine/data.js';
import { startResearch, getResearchRequirements } from '../engine/systems/ResearchSystem.js';

export function renderResearch() {
    const el = document.getElementById('research');
    if (!el) return;

    let html = '';

    // Current Research Status
    if (state.researchInProgress) {
        const currentResearch = data.research.find(r => r.id === state.researchInProgress);
        if (currentResearch) {
            const progress = ((currentResearch.researchDays - state.researchDaysRemaining) / currentResearch.researchDays) * 100;
            
            html += `
                <div class="status-panel" style="border: 2px solid #3b82f6;">
                    <h3>🔬 Current Research</h3>
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="font-size: 3rem;">${currentResearch.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; color: #e5e7eb; font-size: 1.2rem;">${currentResearch.name}</div>
                            <div style="color: #9ca3af; font-size: 0.9rem;">${state.researchDaysRemaining} day${state.researchDaysRemaining !== 1 ? 's' : ''} remaining</div>
                        </div>
                    </div>
                    <div style="height: 10px; background: #0f172a; border-radius: 5px; overflow: hidden;">
                        <div style="height: 100%; width: ${progress}%; background: linear-gradient(90deg, #3b82f6, #22c55e); transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        }
    }

    // Research Tree
    html += `
        <div class="status-panel">
            <h3>🔬 Research Tree</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Invest in research to unlock new animals, amenities, and upgrades for your zoo.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
    `;

    data.research.forEach(research => {
        const isCompleted = state.researchCompleted.includes(research.id);
        const isInProgress = state.researchInProgress === research.id;
        const requirements = getResearchRequirements(research.id);
        const canAfford = state.money >= research.cost;
        const prerequisitesMet = requirements.every(r => r.completed);
        const canStart = !isCompleted && !isInProgress && !state.researchInProgress && prerequisitesMet && canAfford;

        let statusBadge = '';
        let borderColor = '#334155';
        let opacity = '1';

        if (isCompleted) {
            statusBadge = '<span style="background: #22c55e; color: #000; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">✅ COMPLETED</span>';
            borderColor = '#22c55e';
        } else if (isInProgress) {
            statusBadge = '<span style="background: #3b82f6; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">🔬 IN PROGRESS</span>';
            borderColor = '#3b82f6';
        } else if (!prerequisitesMet) {
            statusBadge = '<span style="background: #64748b; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">🔒 LOCKED</span>';
            opacity = '0.6';
        }

        html += `
            <div style="background: #0f172a; border: 2px solid ${borderColor}; border-radius: 10px; padding: 15px; opacity: ${opacity};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 2.5rem;">${research.icon}</div>
                        <div>
                            <div style="font-weight: 700; color: #e5e7eb; font-size: 1.1rem;">${research.name}</div>
                            <div style="color: #9ca3af; font-size: 0.8rem; text-transform: uppercase;">${research.category}</div>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                
                <p style="color: #9ca3af; font-size: 0.9rem; margin: 10px 0;">${research.description}</p>
                
                <div style="display: flex; gap: 10px; margin: 10px 0; font-size: 0.85rem;">
                    <div style="background: #1e293b; padding: 6px 10px; border-radius: 6px; color: #fbbf24;">💰 $${research.cost.toLocaleString()}</div>
                    <div style="background: #1e293b; padding: 6px 10px; border-radius: 6px; color: #3b82f6;">📅 ${research.researchDays} days</div>
                </div>
                
                ${requirements.length > 0 ? `
                    <div style="margin: 10px 0; padding: 8px; background: #1e293b; border-radius: 6px; font-size: 0.8rem;">
                        <div style="color: #9ca3af; margin-bottom: 4px;">Requires:</div>
                        ${requirements.map(r => `
                            <div style="color: ${r.completed ? '#22c55e' : '#ef4444'};">
                                ${r.completed ? '✅' : '❌'} ${r.name}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div style="margin: 10px 0; padding: 8px; background: #1e293b; border-radius: 6px; font-size: 0.8rem;">
                    <div style="color: #9ca3af; margin-bottom: 4px;">Unlocks:</div>
                    <div style="color: #e5e7eb;">${research.unlocks.join(', ')}</div>
                </div>
                
                ${!isCompleted && !isInProgress ? `
                    <button onclick="window.startResearch('${research.id}')" 
                        style="width: 100%; padding: 10px; background: ${canStart ? '#22c55e' : '#475569'}; color: ${canStart ? '#000' : '#9ca3af'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${canStart ? 'pointer' : 'not-allowed'}; font-size: 0.95rem; margin-top: 10px;"
                        ${!canStart ? 'disabled' : ''}>
                        ${!prerequisitesMet ? '🔒 Prerequisites Required' : !canAfford ? '💸 Can\'t Afford' : state.researchInProgress ? '🔬 Already Researching' : '🔬 Start Research'}
                    </button>
                ` : ''}
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    // Completed Research Summary
    if (state.researchCompleted.length > 0) {
        html += `
            <div class="status-panel">
                <h3>✅ Completed Research (${state.researchCompleted.length})</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${state.researchCompleted.map(id => {
                        const research = data.research.find(r => r.id === id);
                        return research ? `
                            <div style="background: #0f172a; padding: 8px 12px; border-radius: 6px; border: 1px solid #22c55e; display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 1.2rem;">${research.icon}</span>
                                <span style="color: #e5e7eb; font-size: 0.9rem;">${research.name}</span>
                            </div>
                        ` : '';
                    }).join('')}
                </div>
            </div>
        `;
    }

    el.innerHTML = html;
}

// Expose to window
window.startResearch = startResearch;
