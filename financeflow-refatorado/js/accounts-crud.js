// CONTAS - CRUD

function openAccountModal(id = null) {
            app.editingAccountId = id;
            const form = document.getElementById('accountForm');

            if (id) {
                const account = app.data.accounts.find(a => a.id === id);
                document.getElementById('accountName').value = account.name;
                document.getElementById('accountBalance').value = account.initialBalance;
            } else {
                form.reset();
            }

            openModal('accountModal');
        }

        function saveAccount(e) {
            e.preventDefault();

            const account = {
                id: app.editingAccountId || generateId(),
                name: document.getElementById('accountName').value,
                balance: parseFloat(document.getElementById('accountBalance').value),
                initialBalance: parseFloat(document.getElementById('accountBalance').value)
            };

            if (app.editingAccountId) {
                const index = app.data.accounts.findIndex(a => a.id === app.editingAccountId);
                app.data.accounts[index] = account;
                showNotification('Conta atualizada com sucesso!');
            } else {
                app.data.accounts.push(account);
                showNotification('Conta adicionada com sucesso!');
            }

            updateAccountBalances();
            saveData();
            closeModal('accountModal');
            renderAccounts();
        }

        function editAccount(id) {
            openAccountModal(id);
        }
