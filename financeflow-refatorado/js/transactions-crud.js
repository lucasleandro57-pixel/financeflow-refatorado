// TRANSA??ES - CRUD

function parseMoneyInput(value) {
            const text = String(value || '').trim();
            if (!text) return 0;
            const normalized = text
                .replace(/[^\d,.-]/g, '')
                .replace(/\.(?=\d{3}(?:\D|$))/g, '')
                .replace(',', '.');
            return parseFloat(normalized) || 0;
        }

        function formatInputCurrency(value) {
            return Number(value || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

function openTransactionModal(id = null) {
            app.editingTransactionId = id;
            const form = document.getElementById('transactionForm');
            const title = document.getElementById('transactionModalTitle');

            if (id) {
                const transaction = app.data.transactions.find(t => t.id === id);
                title.textContent = 'Editar Transação';
                document.getElementById('transactionType').value = transaction.type;
                updateTransactionCategories();
                updateTransactionAccounts();
                document.getElementById('transactionDescription').value = transaction.description;
                document.getElementById('transactionValue').value = formatInputCurrency(transaction.value);
                document.getElementById('transactionCategory').value = transaction.category;
                document.getElementById('transactionAccount').value = transaction.account;
                document.getElementById('transactionDate').value = transaction.date;
                document.getElementById('transactionStatus').value = transaction.status;
                document.getElementById('transactionNote').value = transaction.note || '';
            } else {
                title.textContent = 'Nova Transação';
                form.reset();
                document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
                updateTransactionCategories();
                updateTransactionAccounts();
            }

            openModal('transactionModal');
        }

        function updateTransactionCategories() {
            const type = document.getElementById('transactionType').value;
            const select = document.getElementById('transactionCategory');
            const categories = app.data.categories[type] || [];

            select.innerHTML = '';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
        }

        function updateTransactionAccounts() {
            const select = document.getElementById('transactionAccount');
            select.innerHTML = '';
            app.data.accounts.forEach(account => {
                select.innerHTML += `<option value="${account.id}">${account.name}</option>`;
            });
        }

        function saveTransaction(e) {
            e.preventDefault();

            const transaction = {
                id: app.editingTransactionId || generateId(),
                type: document.getElementById('transactionType').value,
                description: document.getElementById('transactionDescription').value,
                value: parseMoneyInput(document.getElementById('transactionValue').value),
                category: document.getElementById('transactionCategory').value,
                account: parseInt(document.getElementById('transactionAccount').value),
                date: document.getElementById('transactionDate').value,
                status: document.getElementById('transactionStatus').value,
                source: document.getElementById('transactionDescription').value,
                note: document.getElementById('transactionNote').value
            };

            if (app.editingTransactionId) {
                const index = app.data.transactions.findIndex(t => t.id === app.editingTransactionId);
                app.data.transactions[index] = transaction;
                showNotification('Transação atualizada com sucesso!');
            } else {
                app.data.transactions.push(transaction);
                showNotification('Transação adicionada com sucesso!');
            }

            updateAccountBalances();
            saveData();
            closeModal('transactionModal');
            refreshFinancialViews();
        }

        function editTransaction(id) {
            openTransactionModal(id);
        }

        function deleteTransaction(id) {
            if (confirm('Tem certeza que deseja deletar esta transação?')) {
                app.data.transactions = app.data.transactions.filter(t => t.id !== id);
                updateAccountBalances();
                saveData();
                refreshFinancialViews();
                showNotification('Transação deletada com sucesso!');
            }
        }

        function updateQuickTransactionCategories() {
            const type = document.getElementById('quickTransactionType').value;
            const select = document.getElementById('quickTransactionCategory');
            const categories = app.data.categories[type] || [];

            select.innerHTML = '';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
        }

        function saveQuickTransaction(e) {
            e.preventDefault();

            const source = document.getElementById('quickTransactionSource').value.trim();
            const classified = classifyManualTransaction(source, document.getElementById('quickTransactionType').value, document.getElementById('quickTransactionCategory').value);
            const transaction = {
                id: generateId(),
                type: classified.type,
                description: source,
                source,
                value: parseMoneyInput(document.getElementById('quickTransactionValue').value),
                category: classified.category,
                account: app.data.accounts[0]?.id || null,
                date: document.getElementById('quickTransactionDate').value,
                status: 'paid',
                note: classified.note
            };

            app.data.transactions.push(transaction);
            updateAccountBalances();
            saveData();
            e.target.reset();
            document.getElementById('quickTransactionDate').value = new Date().toISOString().split('T')[0];
            updateQuickTransactionCategories();
            refreshFinancialViews();
            showNotification('Lancamento manual adicionado!');
        }

        function classifyManualTransaction(source, type, category) {
            const text = source
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

            if (['imposto', 'das', 'irpj', 'csll', 'iss', 'inss', 'tributo', 'simples nacional'].some(term => text.includes(term))) {
                return { type: 'expense', category: 'Impostos', note: 'lancamento manual rapido - classificado como imposto' };
            }

            if (['aluguel', 'internet', 'energia', 'luz', 'telefone', 'condominio', 'mensalidade', 'assinatura'].some(term => text.includes(term))) {
                return { type: 'expense', category: 'Gasto Fixo', note: 'lancamento manual rapido - classificado como gasto fixo' };
            }

            if (['cartao', 'fatura'].some(term => text.includes(term))) {
                return { type: 'expense', category: 'Cartão de Crédito', note: 'lancamento manual rapido - classificado como cartao' };
            }

            if (['nota fiscal', 'notafiscal', 'nf-e', 'nfe', 'nfse', 'cliente'].some(term => text.includes(term))) {
                return { type: 'income', category: 'Nota Fiscal Emitida', note: 'lancamento manual rapido - classificado como receita' };
            }

            return { type, category, note: 'lancamento manual rapido' };
        }

        function updateAccountBalances() {
            app.data.accounts.forEach(account => {
                account.balance = account.initialBalance;
            });

            app.data.transactions.forEach(t => {
                if (t.status === 'paid') {
                    const account = app.data.accounts.find(a => a.id === t.account);
                    if (account) {
                        if (t.type === 'income') {
                            account.balance += t.value;
                        } else {
                            account.balance -= t.value;
                        }
                    }
                }
            });
        }
