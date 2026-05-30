// CONTROLE MENSAL, GASTOS FIXOS E CARTOES

function renderControl() {
    const monthInput = document.getElementById('monthlyRecordMonth');
    monthInput.value = getCurrentMonthKey();
    fillMonthlyRecordForm();
    renderControlMetrics();
    renderFixedExpenses();
    renderCreditCards();
}

function fillMonthlyRecordForm() {
    const month = document.getElementById('monthlyRecordMonth').value || getCurrentMonthKey();
    const record = app.data.monthlyRecords.find(item => item.month === month);
    document.getElementById('monthlyNetIncome').value = record?.netIncome ? formatInputCurrency(record.netIncome) : '';
    document.getElementById('monthlyTaxesPaid').value = record?.taxesPaid ? formatInputCurrency(record.taxesPaid) : '';
    document.getElementById('monthlyNotes').value = record?.notes || '';
}

function parseControlMoney(value) {
    return typeof parseMoneyInput === 'function'
        ? parseMoneyInput(value)
        : parseFloat(String(value || '').replace(',', '.')) || 0;
}

function saveMonthlyRecord(e) {
    e.preventDefault();
    const month = document.getElementById('monthlyRecordMonth').value;
    const netIncome = parseControlMoney(document.getElementById('monthlyNetIncome').value);
    const taxesPaid = parseControlMoney(document.getElementById('monthlyTaxesPaid').value);
    const notes = document.getElementById('monthlyNotes').value;
    let record = app.data.monthlyRecords.find(item => item.month === month);

    if (record) {
        record.netIncome = netIncome;
        record.taxesPaid = taxesPaid;
        record.notes = notes;
    } else {
        record = { id: generateId(), month, netIncome, taxesPaid, notes };
        app.data.monthlyRecords.push(record);
    }

    upsertMonthlyTransaction('income', 'Receita líquida mensal', netIncome, 'Receita Líquida', month, notes);
    upsertMonthlyTransaction('expense', 'Impostos pagos', taxesPaid, 'Impostos', month, notes);
    updateAccountBalances();
    saveData();
    refreshFinancialViews();
    showNotification('Controle mensal salvo com sucesso!');
}

function upsertMonthlyTransaction(type, description, value, category, month, note) {
    const account = app.data.accounts[0]?.id || null;
    const marker = `auto:${category}:${month}`;
    let transaction = app.data.transactions.find(item => item.note && item.note.includes(marker));

    if (!value) {
        if (transaction) {
            app.data.transactions = app.data.transactions.filter(item => item.id !== transaction.id);
        }
        return;
    }

    const data = {
        id: transaction?.id || generateId(),
        type,
        description,
        value,
        category,
        account,
        date: `${month}-01`,
        status: 'paid',
        note: `${note || ''} ${marker}`.trim()
    };

    if (transaction) {
        Object.assign(transaction, data);
    } else {
        app.data.transactions.push(data);
    }
}

function renderControlMetrics() {
    const summary = calculateControlSummary();
    document.getElementById('controlMetrics').innerHTML = `
        <div class="metric-card">
            <div class="metric-label">Entrada Líquida</div>
            <div class="metric-value">${formatCurrency(summary.netIncome)}</div>
            <div class="metric-change positive">Mês atual</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Impostos Pagos</div>
            <div class="metric-value">${formatCurrency(summary.taxesPaid)}</div>
            <div class="metric-change negative">Tributos</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Gastos Fixos</div>
            <div class="metric-value">${formatCurrency(summary.fixedTotal)}</div>
            <div class="metric-change">Recorrentes ativos</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Cartão de Crédito</div>
            <div class="metric-value">${formatCurrency(summary.cardTotal)}</div>
            <div class="metric-change">Faturas atuais</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Livre Após Compromissos</div>
            <div class="metric-value">${formatCurrency(summary.available)}</div>
            <div class="metric-change ${summary.available >= 0 ? 'positive' : 'negative'}">${summary.available >= 0 ? 'Disponível' : 'Atenção'}</div>
        </div>
    `;
}

function openFixedExpenseModal(id = null) {
    app.editingFixedExpenseId = id;
    const item = app.data.fixedExpenses.find(expense => expense.id === id);
    document.getElementById('fixedExpenseModalTitle').textContent = id ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo';
    document.getElementById('fixedExpenseForm').reset();
    populateSelect('fixedExpenseCategory', app.data.categories.expense);
    populateAccountsSelect('fixedExpenseAccount');

    if (item) {
        document.getElementById('fixedExpenseName').value = item.name;
        document.getElementById('fixedExpenseCategory').value = item.category;
        document.getElementById('fixedExpenseAmount').value = formatInputCurrency(item.amount);
        document.getElementById('fixedExpenseDueDay').value = item.dueDay;
        document.getElementById('fixedExpenseAccount').value = item.account;
        document.getElementById('fixedExpenseActive').value = String(item.active);
    }

    openModal('fixedExpenseModal');
}

function saveFixedExpense(e) {
    e.preventDefault();
    const item = {
        id: app.editingFixedExpenseId || generateId(),
        name: document.getElementById('fixedExpenseName').value,
        category: document.getElementById('fixedExpenseCategory').value,
        amount: parseControlMoney(document.getElementById('fixedExpenseAmount').value),
        dueDay: parseInt(document.getElementById('fixedExpenseDueDay').value, 10),
        account: parseInt(document.getElementById('fixedExpenseAccount').value, 10),
        active: document.getElementById('fixedExpenseActive').value === 'true'
    };

    if (app.editingFixedExpenseId) {
        const index = app.data.fixedExpenses.findIndex(expense => expense.id === app.editingFixedExpenseId);
        app.data.fixedExpenses[index] = item;
    } else {
        app.data.fixedExpenses.push(item);
    }

    saveData();
    closeModal('fixedExpenseModal');
    refreshFinancialViews();
    showNotification('Gasto fixo salvo!');
}

function renderFixedExpenses() {
    const list = document.getElementById('fixedExpensesList');
    if (!app.data.fixedExpenses.length) {
        list.innerHTML = '<p class="muted-text">Nenhum gasto fixo cadastrado.</p>';
        return;
    }

    list.innerHTML = app.data.fixedExpenses.map(item => `
        <div class="finance-row">
            <div>
                <div class="finance-row-title">${item.name}</div>
                <div class="finance-row-meta">${item.category} · vence dia ${item.dueDay} · ${item.active ? 'ativo' : 'pausado'}</div>
            </div>
            <div class="finance-row-value">${formatCurrency(item.amount)}</div>
            <button class="btn btn-sm btn-secondary" onclick="openFixedExpenseModal(${item.id})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteFixedExpense(${item.id})">Excluir</button>
        </div>
    `).join('');
}

function deleteFixedExpense(id) {
    if (!confirm('Excluir este gasto fixo?')) return;
    app.data.fixedExpenses = app.data.fixedExpenses.filter(item => item.id !== id);
    saveData();
    refreshFinancialViews();
}

function openCreditCardModal(id = null) {
    app.editingCreditCardId = id;
    const card = app.data.creditCards.find(item => item.id === id);
    document.getElementById('creditCardModalTitle').textContent = id ? 'Editar Cartão' : 'Novo Cartão';
    document.getElementById('creditCardForm').reset();

    if (card) {
        document.getElementById('creditCardName').value = card.name;
        document.getElementById('creditCardLimit').value = formatInputCurrency(card.limit);
        document.getElementById('creditCardClosingDay').value = card.closingDay;
        document.getElementById('creditCardDueDay').value = card.dueDay;
        document.getElementById('creditCardCurrentBill').value = formatInputCurrency(card.currentBill);
        document.getElementById('creditCardPaidAmount').value = formatInputCurrency(card.paidAmount);
    }

    openModal('creditCardModal');
}

function saveCreditCard(e) {
    e.preventDefault();
    const card = {
        id: app.editingCreditCardId || generateId(),
        name: document.getElementById('creditCardName').value,
        limit: parseControlMoney(document.getElementById('creditCardLimit').value),
        closingDay: parseInt(document.getElementById('creditCardClosingDay').value, 10),
        dueDay: parseInt(document.getElementById('creditCardDueDay').value, 10),
        currentBill: parseControlMoney(document.getElementById('creditCardCurrentBill').value),
        paidAmount: parseControlMoney(document.getElementById('creditCardPaidAmount').value)
    };

    if (app.editingCreditCardId) {
        const index = app.data.creditCards.findIndex(item => item.id === app.editingCreditCardId);
        app.data.creditCards[index] = card;
    } else {
        app.data.creditCards.push(card);
    }

    saveData();
    closeModal('creditCardModal');
    refreshFinancialViews();
    showNotification('Cartão salvo!');
}

function renderCreditCards() {
    const list = document.getElementById('creditCardsList');
    if (!app.data.creditCards.length) {
        list.innerHTML = '<p class="muted-text">Nenhum cartão cadastrado.</p>';
        return;
    }

    list.innerHTML = app.data.creditCards.map(card => {
        const usage = card.limit > 0 ? (card.currentBill / card.limit) * 100 : 0;
        return `
            <div class="finance-row">
                <div>
                    <div class="finance-row-title">${card.name}</div>
                    <div class="finance-row-meta">fecha dia ${card.closingDay} · vence dia ${card.dueDay} · ${usage.toFixed(1)}% do limite</div>
                </div>
                <div class="finance-row-value">${formatCurrency(card.currentBill)}</div>
                <button class="btn btn-sm btn-secondary" onclick="openCreditCardModal(${card.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCreditCard(${card.id})">Excluir</button>
            </div>
        `;
    }).join('');
}

function deleteCreditCard(id) {
    if (!confirm('Excluir este cartão?')) return;
    app.data.creditCards = app.data.creditCards.filter(item => item.id !== id);
    saveData();
    refreshFinancialViews();
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    options.forEach(option => {
        select.innerHTML += `<option value="${option}">${option}</option>`;
    });
}

function populateAccountsSelect(id) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    app.data.accounts.forEach(account => {
        select.innerHTML += `<option value="${account.id}">${account.name}</option>`;
    });
}
