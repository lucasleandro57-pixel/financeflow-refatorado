// RENDERIZAÇÃO - CONTAS

function renderAccounts() {
            const accountsList = document.getElementById('accountsList');

            let html = '';
            let totalBalance = 0;

            app.data.accounts.forEach(account => {
                totalBalance += account.balance;
                html += `
                    <div style="margin-bottom: 16px; padding: 16px; background: rgba(18, 18, 18, 0.8); border: 1px solid var(--border-color); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(10px);">
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">${account.name}</div>
                            <div style="font-size: 12px; color: var(--text-tertiary);">Inicial: ${formatCurrency(account.initialBalance)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; font-size: 16px; color: var(--accent-primary);">${formatCurrency(account.balance)}</div>
                            <button class="btn btn-sm btn-secondary" onclick="editAccount(${account.id})">Editar</button>
                        </div>
                    </div>
                `;
            });

            html = `
                <div style="margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%); border: 1px solid rgba(157, 78, 221, 0.2); border-radius: 12px; backdrop-filter: blur(10px);">
                    <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Saldo Total</div>
                    <div style="font-weight: 700; font-size: 28px; color: var(--accent-primary);">${formatCurrency(totalBalance)}</div>
                </div>
            ` + html;

            accountsList.innerHTML = html;
        }
