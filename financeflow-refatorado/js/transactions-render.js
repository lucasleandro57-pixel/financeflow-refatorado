// RENDERIZAÇÃO - TRANSAÇÕES

function renderTransactions() {
            if (typeof renderImportPreview === 'function') {
                renderImportPreview();
            }

            const period = document.getElementById('filterPeriod').value;
            const type = document.getElementById('filterType').value;
            const category = document.getElementById('filterCategory').value;
            const status = document.getElementById('filterStatus').value;
            const search = document.getElementById('searchInput').value.toLowerCase();

            let transactions = app.data.transactions;

            if (period === 'month') {
                const monthKey = getCurrentMonthKey();
                transactions = transactions.filter(t => getTransactionMonthKey(t.date) === monthKey);
            } else if (period === 'quarter') {
                const monthKey = getCurrentMonthKey();
                const [year, month] = monthKey.split('-').map(Number);
                const quarter = Math.floor((month - 1) / 3);
                transactions = transactions.filter(t => {
                    const [tYear, tMonth] = getTransactionMonthKey(t.date).split('-').map(Number);
                    return tYear === year && Math.floor((tMonth - 1) / 3) === quarter;
                });
            } else if (period === 'year') {
                const year = app.currentMonth.getFullYear();
                transactions = transactions.filter(t => new Date(t.date).getFullYear() === year);
            }

            if (type) transactions = transactions.filter(t => t.type === type);
            if (category) transactions = transactions.filter(t => t.category === category);
            if (status) transactions = transactions.filter(t => t.status === status);
            if (search) {
                transactions = transactions.filter(t =>
                    (t.description || '').toLowerCase().includes(search) ||
                    (t.source || '').toLowerCase().includes(search) ||
                    (t.category || '').toLowerCase().includes(search) ||
                    (t.note || '').toLowerCase().includes(search)
                );
            }

            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            const tbody = document.getElementById('transactionsBody');
            const empty = document.getElementById('transactionsEmpty');

            if (transactions.length === 0) {
                tbody.innerHTML = '';
                empty.style.display = 'block';
                return;
            }

            empty.style.display = 'none';
            tbody.innerHTML = transactions.map(t => `
                <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.description}</td>
                    <td>${t.source || '-'}</td>
                    <td>${t.category}</td>
                    <td>${app.data.accounts.find(a => a.id === t.account)?.name || 'N/A'}</td>
                    <td>
                        <span class="badge ${t.type === 'income' ? 'badge-success' : t.type === 'expense' ? 'badge-danger' : 'badge-primary'}">
                            ${t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Investimento'}
                        </span>
                    </td>
                    <td style="font-weight: 600; color: ${t.type === 'income' ? 'var(--accent-secondary)' : 'var(--accent-tertiary)'};">
                        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.value)}
                    </td>
                    <td>
                        <span class="badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}">
                            ${t.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editTransaction(${t.id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${t.id})">Deletar</button>
                    </td>
                </tr>
            `).join('');
        }

        function updateCategoryFilter() {
            const type = document.getElementById('filterType').value;
            const select = document.getElementById('filterCategory');
            const categories = type ? app.data.categories[type] : [];

            select.innerHTML = '<option value="">Todas</option>';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
        }
