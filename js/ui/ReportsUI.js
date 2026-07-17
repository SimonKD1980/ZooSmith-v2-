// js/ui/ReportsUI.js
import { state } from '../engine/GameState.js';

export function renderReports() {
    const el = document.getElementById('reports');
    if (!el) return;

    const reports = state.dailyReports || [];
    
    // Calculate totals
    const totalIncome = reports.reduce((sum, r) => sum + r.income.total, 0);
    const totalExpenses = reports.reduce((sum, r) => sum + r.expenses.total, 0);
    const totalNetProfit = reports.reduce((sum, r) => sum + r.netProfit, 0);
    const totalVisitors = reports.reduce((sum, r) => sum + r.visitors, 0);
    
    const avgDailyProfit = reports.length > 0 ? totalNetProfit / reports.length : 0;
    const avgDailyVisitors = reports.length > 0 ? totalVisitors / reports.length : 0;
    
    // Get latest report
    const latest = reports[reports.length - 1];
    
    let html = '';
    
    // Summary Cards
    html += `
        <div class="status-panel">
            <h3>📊 Zoo Performance Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                ${renderSummaryCard('💰 Total Income', `$${totalIncome.toLocaleString()}`, '#22c55e')}
                ${renderSummaryCard('💸 Total Expenses', `$${totalExpenses.toLocaleString()}`, '#ef4444')}
                ${renderSummaryCard(' Net Profit', `$${totalNetProfit.toLocaleString()}`, totalNetProfit >= 0 ? '#22c55e' : '#ef4444')}
                ${renderSummaryCard('📅 Days Tracked', `${reports.length}`, '#3b82f6')}
                ${renderSummaryCard('👥 Total Visitors', totalVisitors.toLocaleString(), '#a855f7')}
                ${renderSummaryCard('📊 Avg Daily Profit', `$${Math.round(avgDailyProfit).toLocaleString()}`, avgDailyProfit >= 0 ? '#22c55e' : '#ef4444')}
            </div>
        </div>
    `;
    
    // Latest Day P&L
    if (latest) {
        html += `
            <div class="status-panel" style="border: 2px solid #3b82f6;">
                <h3>📋 Day ${latest.day} - Daily P&L Statement</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Income Section -->
                    <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
                        <h4 style="color: #22c55e; margin: 0 0 15px 0;">💵 INCOME</h4>
                        ${renderLineItem('🎟️ Ticket Sales', `$${latest.income.tickets.toLocaleString()}`)}
                        ${renderLineItem('🏪 Amenity Sales', `$${latest.income.amenities.toLocaleString()}`)}
                        <div style="border-top: 2px solid #334155; margin: 10px 0; padding-top: 10px;">
                            ${renderLineItem('Total Income', `$${latest.income.total.toLocaleString()}`, true)}
                        </div>
                    </div>
                    
                    <!-- Expenses Section -->
                    <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                        <h4 style="color: #ef4444; margin: 0 0 15px 0;">💸 EXPENSES</h4>
                        ${renderLineItem('👷 Staff Salaries', `$${latest.expenses.staff.toLocaleString()}`)}
                        ${renderLineItem('🍖 Food Costs', `$${latest.expenses.food.toLocaleString()}`)}
                        ${renderLineItem('🏛️ Facility Upkeep', `$${latest.expenses.upkeep.toLocaleString()}`)}
                        ${renderLineItem('🔧 Maintenance', `$${latest.expenses.maintenance.toLocaleString()}`)}
                        <div style="border-top: 2px solid #334155; margin: 10px 0; padding-top: 10px;">
                            ${renderLineItem('Total Expenses', `$${latest.expenses.total.toLocaleString()}`, true)}
                        </div>
                    </div>
                </div>
                
                <!-- Net Profit -->
                <div style="margin-top: 20px; padding: 20px; background: ${latest.netProfit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 2px solid ${latest.netProfit >= 0 ? '#22c55e' : '#ef4444'}; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.1rem; color: #9ca3af; margin-bottom: 8px;">NET PROFIT / LOSS</div>
                    <div style="font-size: 2.5rem; font-weight: 800; color: ${latest.netProfit >= 0 ? '#22c55e' : '#ef4444'};">
                        ${latest.netProfit >= 0 ? '+' : ''}$${latest.netProfit.toLocaleString()}
                    </div>
                </div>
                
                <!-- Additional Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 20px;">
                    ${renderStatBox('👥 Visitors', latest.visitors, '#3b82f6')}
                    ${renderStatBox('⭐ Rating', `${latest.rating}/100`, latest.rating >= 60 ? '#22c55e' : '#f59e0b')}
                    ${renderStatBox('🐾 Animals', latest.animalCount, '#a855f7')}
                    ${renderStatBox('👷 Staff', latest.staffCount, '#f59e0b')}
                    ${renderStatBox('🎟️ Ticket Price', `$${latest.ticketPrice}`, '#22c55e')}
                    ${renderStatBox('🏞️ Exhibits', latest.exhibits || 0, '#ec4899')}
                </div>
            </div>
        `;
        
        // Animal Breakdown
        if (latest.animalBreakdown && Object.keys(latest.animalBreakdown).length > 0) {
            html += `
                <div class="status-panel" style="border: 2px solid #a855f7;">
                    <h3>🐾 Animal Population Breakdown</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                        ${Object.entries(latest.animalBreakdown).map(([species, count]) => `
                            <div style="background: #0f172a; padding: 12px; border-radius: 8px; border-left: 4px solid #a855f7;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #e5e7eb; font-weight: 700;">${species}</span>
                                    <span style="color: #a855f7; font-weight: 800; font-size: 1.2rem;">${count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Historical Trends
    if (reports.length > 1) {
        html += `
            <div class="status-panel">
                <h3>📈 Historical Trends (Last ${reports.length} Days)</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: #0f172a;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #334155;">Day</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #334155;">Income</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #334155;">Expenses</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #334155;">Net Profit</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #334155;">Visitors</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #334155;">Animals</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #334155;">Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reports.slice().reverse().map(report => `
                                <tr style="border-bottom: 1px solid #1e293b;">
                                    <td style="padding: 10px; color: #e5e7eb;">${report.day}</td>
                                    <td style="padding: 10px; text-align: right; color: #22c55e;">$${report.income.total.toLocaleString()}</td>
                                    <td style="padding: 10px; text-align: right; color: #ef4444;">$${report.expenses.total.toLocaleString()}</td>
                                    <td style="padding: 10px; text-align: right; font-weight: 700; color: ${report.netProfit >= 0 ? '#22c55e' : '#ef4444'};">
                                        ${report.netProfit >= 0 ? '+' : ''}$${report.netProfit.toLocaleString()}
                                    </td>
                                    <td style="padding: 10px; text-align: right; color: #3b82f6;">${report.visitors}</td>
                                    <td style="padding: 10px; text-align: right; color: #a855f7;">${report.animalCount}</td>
                                    <td style="padding: 10px; text-align: right; color: #ec4899;">${report.rating}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Expense Breakdown
    if (latest) {
        const expenseCategories = [
            { name: 'Staff', value: latest.expenses.staff, color: '#3b82f6' },
            { name: 'Food', value: latest.expenses.food, color: '#22c55e' },
            { name: 'Upkeep', value: latest.expenses.upkeep, color: '#f59e0b' },
            { name: 'Maintenance', value: latest.expenses.maintenance, color: '#ef4444' }
        ];
        
        const totalExp = latest.expenses.total || 1;
        
        html += `
            <div class="status-panel">
                <h3>💸 Expense Breakdown</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    ${expenseCategories.map(cat => {
                        const percentage = Math.round((cat.value / totalExp) * 100);
                        return `
                            <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid ${cat.color};">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="color: #e5e7eb; font-weight: 700;">${cat.name}</span>
                                    <span style="color: ${cat.color}; font-weight: 800;">${percentage}%</span>
                                </div>
                                <div style="height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${percentage}%; background: ${cat.color};"></div>
                                </div>
                                <div style="margin-top: 6px; color: #9ca3af; font-size: 0.85rem;">
                                    $${cat.value.toLocaleString()}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    el.innerHTML = html;
}

function renderSummaryCard(title, value, color) {
    return `
        <div style="background: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};">
            <div style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 6px;">${title}</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: ${color};">${value}</div>
        </div>
    `;
}

function renderLineItem(label, value, isBold = false) {
    return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; ${isBold ? 'font-weight: 700; font-size: 1.1rem;' : ''}">
            <span style="color: #9ca3af;">${label}</span>
            <span style="color: #e5e7eb;">${value}</span>
        </div>
    `;
}

function renderStatBox(label, value, color) {
    return `
        <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
            <div style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 4px;">${label}</div>
            <div style="font-weight: 700; color: ${color}; font-size: 1.1rem;">${value}</div>
        </div>
    `;
}
