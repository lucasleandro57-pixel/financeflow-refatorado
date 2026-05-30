// RENDERIZACAO - DASHBOARD

function renderDashboard() {
    const metrics = calculateMetrics(getCurrentMonthKey());
    const control = calculateControlSummary();
    const investments = calculateInvestmentsSummary();
    const totalInvested = investments.current || metrics.investment;
    const available = control.netIncome
        ? control.available
        : metrics.income - metrics.expense - metrics.investment;

    const cards = [
        {
            label: 'Líquido recebido',
            value: control.netIncome || metrics.income,
            tone: 'positive'
        },
        {
            label: 'Investido',
            value: totalInvested,
            tone: 'primary'
        },
        {
            label: 'Gastos totais',
            value: metrics.expense,
            tone: 'negative'
        },
        {
            label: 'Gastos fixos',
            value: control.fixedTotal,
            tone: 'warning'
        },
        {
            label: 'Cartão de crédito',
            value: control.cardTotal,
            tone: 'negative'
        },
        {
            label: 'Impostos pagos',
            value: control.taxesPaid,
            tone: 'warning'
        },
        {
            label: 'Livre no mês',
            value: available,
            tone: available >= 0 ? 'positive' : 'negative'
        }
    ];

    document.getElementById('metricsGrid').innerHTML = cards.map(card => `
        <div class="metric-card dashboard-value-card ${card.tone}">
            <div class="metric-label">${card.label}</div>
            <div class="metric-value">${formatCurrency(card.value)}</div>
        </div>
    `).join('');
}
