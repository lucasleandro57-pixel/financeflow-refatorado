// NAVEGACAO

function switchView(viewName) {
    app.currentView = viewName;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transações',
        control: 'Controle Mensal',
        investments: 'Investimentos',
        imports: 'Upload',
        budget: 'Orçamento',
        goals: 'Metas',
        accounts: 'Contas',
        reports: 'Relatórios',
        settings: 'Configurações'
    };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'FinanceFlow';

    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.style.display = viewName === 'dashboard' ? 'none' : 'inline-flex';
    }

    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });

    const target = document.getElementById(`${viewName}-view`);
    if (target) {
        target.style.display = 'block';
    }

    if (viewName === 'investments') startQuoteAutoRefresh();
    else stopQuoteAutoRefresh();

    if (viewName === 'dashboard') renderDashboard();
    else if (viewName === 'transactions') renderTransactions();
    else if (viewName === 'control') renderControl();
    else if (viewName === 'investments') renderInvestments();
    else if (viewName === 'imports') renderImports();
    else if (viewName === 'budget') renderBudgets();
    else if (viewName === 'goals') renderGoals();
    else if (viewName === 'accounts') renderAccounts();
    else if (viewName === 'reports') renderReports();
}
