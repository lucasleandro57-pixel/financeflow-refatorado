// RENDERIZAÇÃO - METAS

function renderGoals() {
            const goalsList = document.getElementById('goalsList');

            let html = '';
            app.data.goals.forEach(goal => {
                const percentage = (goal.current / goal.target) * 100;
                const daysRemaining = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

                html += `
                    <div style="margin-bottom: 24px; padding: 16px; background: rgba(18, 18, 18, 0.8); border: 1px solid var(--border-color); border-radius: 12px; backdrop-filter: blur(10px);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <div>
                                <div style="font-weight: 600; font-size: 14px;">${goal.name}</div>
                                <div style="font-size: 12px; color: var(--text-tertiary);">${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}</div>
                                ${daysRemaining ? `<div style="font-size: 12px; color: var(--text-tertiary);">⏱️ ${daysRemaining} dias</div>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; font-size: 18px; color: var(--accent-primary);">${percentage.toFixed(0)}%</div>
                                <button class="btn btn-sm btn-secondary" onclick="editGoal(${goal.id})">Editar</button>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>
                `;
            });

            goalsList.innerHTML = html;
        }
