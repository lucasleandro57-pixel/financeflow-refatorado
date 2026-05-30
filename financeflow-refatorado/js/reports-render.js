// RENDERIZAÇÃO - RELATÓRIOS

function renderReports() {
            renderCategoryReport();
            renderAccountReport();
        }

        function renderCategoryReport() {
            const transactions = getMonthTransactions(getCurrentMonthKey());
            const byCategory = {};

            transactions.forEach(t => {
                if (!byCategory[t.category]) {
                    byCategory[t.category] = { income: 0, expense: 0, investment: 0 };
                }
                if (t.status === 'paid') {
                    byCategory[t.category][t.type] += t.value;
                }
            });

            let html = '<div class="table-responsive"><table><thead><tr><th>Categoria</th><th>Receita</th><th>Despesa</th><th>Investimento</th><th>Saldo</th></tr></thead><tbody>';

            Object.entries(byCategory).forEach(([category, values]) => {
                const balance = values.income - values.expense - values.investment;
                html += `
                    <tr>
                        <td>${category}</td>
                        <td style="color: var(--accent-secondary);">${formatCurrency(values.income)}</td>
                        <td style="color: var(--accent-tertiary);">${formatCurrency(values.expense)}</td>
                        <td style="color: var(--accent-primary);">${formatCurrency(values.investment)}</td>
                        <td style="font-weight: 600; color: ${balance >= 0 ? 'var(--accent-secondary)' : 'var(--accent-tertiary)'};">${formatCurrency(balance)}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            document.getElementById('categoryReport').innerHTML = html;
        }

        function renderAccountReport() {
            let html = '<div class="table-responsive"><table><thead><tr><th>Conta</th><th>Saldo Inicial</th><th>Saldo Atual</th><th>Variação</th></tr></thead><tbody>';

            app.data.accounts.forEach(account => {
                const change = account.balance - account.initialBalance;
                html += `
                    <tr>
                        <td>${account.name}</td>
                        <td>${formatCurrency(account.initialBalance)}</td>
                        <td style="font-weight: 600;">${formatCurrency(account.balance)}</td>
                        <td style="color: ${change >= 0 ? 'var(--accent-secondary)' : 'var(--accent-tertiary)'}; font-weight: 600;">${change >= 0 ? '+' : ''}${formatCurrency(change)}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            document.getElementById('accountReport').innerHTML = html;
        }
