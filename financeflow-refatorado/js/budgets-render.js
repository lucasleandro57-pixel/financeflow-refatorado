// RENDERIZAÇÃO - ORÇAMENTO

function renderBudgets() {
            const budgetsList = document.getElementById('budgetsList');
            const currentMonthTransactions = getMonthTransactions(getCurrentMonthKey());

            let html = '';
            app.data.budgets.forEach(budget => {
                const spent = currentMonthTransactions
                    .filter(t => t.type === 'expense' && t.category === budget.category && t.status === 'paid')
                    .reduce((sum, t) => sum + t.value, 0);

                const percentage = (spent / budget.limit) * 100;
                const isOverBudget = spent > budget.limit;

                html += `
                    <div style="margin-bottom: 24px; padding: 16px; background: rgba(18, 18, 18, 0.8); border: 1px solid var(--border-color); border-radius: 12px; backdrop-filter: blur(10px);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div>
                                <div style="font-weight: 600; font-size: 14px;">${budget.category}</div>
                                <div style="font-size: 12px; color: var(--text-tertiary);">${formatCurrency(spent)} de ${formatCurrency(budget.limit)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; font-size: 18px; color: ${isOverBudget ? 'var(--accent-tertiary)' : 'var(--accent-secondary)'};">${percentage.toFixed(0)}%</div>
                                <button class="btn btn-sm btn-secondary" onclick="editBudget(${budget.id})">Editar</button>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${isOverBudget ? 'danger' : percentage > 70 ? 'warning' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        ${isOverBudget ? `<div style="margin-top: 12px; padding: 8px 12px; background: rgba(255, 0, 110, 0.1); border: 1px solid rgba(255, 0, 110, 0.2); border-radius: 8px; color: var(--accent-tertiary); font-size: 12px;">⚠️ Orçamento ultrapassado em ${formatCurrency(spent - budget.limit)}</div>` : ''}
                    </div>
                `;
            });

            budgetsList.innerHTML = html;
        }
