// UTILITÁRIOS

function formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        }

        function formatDate(dateString) {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('pt-BR');
        }

        function getMonthKey(date) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        function getCurrentMonthKey() {
            return getMonthKey(app.currentMonth);
        }

        function getPreviousMonthKey() {
            const prev = new Date(app.currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            return getMonthKey(prev);
        }

        function getTransactionMonthKey(dateString) {
            const date = new Date(dateString + 'T00:00:00');
            return getMonthKey(date);
        }

        function generateId() {
            return Date.now() + Math.random();
        }

        function showNotification(message, type = 'success') {
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                z-index: 2000;
                animation: slideInUp 0.3s ease;
                backdrop-filter: blur(10px);
                border: 1px solid;
            `;
            
            if (type === 'success') {
                alert.style.cssText += `
                    background: rgba(0, 255, 136, 0.1);
                  color: '#9d4edd';
                    border-color: rgba(0, 255, 136, 0.2);
                `;
            } else {
                alert.style.cssText += `
                    background: rgba(255, 0, 110, 0.1);
                    color: #ff006e;
                    border-color: rgba(255, 0, 110, 0.2);
                `;
            }
            
            alert.textContent = message;
            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 3000);
        }

        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function refreshFinancialViews() {
            if (typeof renderDashboard === 'function') renderDashboard();
            if (app.currentView === 'control' && typeof renderControl === 'function') renderControl();
            if (app.currentView === 'transactions' && typeof renderTransactions === 'function') renderTransactions();
            if (app.currentView === 'investments' && typeof renderInvestments === 'function') renderInvestments();
            if (app.currentView === 'reports' && typeof renderReports === 'function') renderReports();
        }
