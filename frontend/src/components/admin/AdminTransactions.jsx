import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:8000/admin/pending-withdrawals', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setTransactions(data.pending_withdrawals);
            } else {
                setError(data.detail || 'Failed to fetch transactions');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this withdrawal?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`http://localhost:8000/admin/approve-withdrawal/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                fetchTransactions(); // Refresh list
            } else {
                alert(data.detail || 'Approval failed');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (reason === null) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`http://localhost:8000/admin/reject-withdrawal/${id}?rejection_reason=${encodeURIComponent(reason)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                fetchTransactions(); // Refresh list
            } else {
                alert(data.detail || 'Rejection failed');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    return (
        <div className="admin-card">
            <div className="admin-header">
                <h3>Pending Withdrawals</h3>
                <button className="admin-btn-secondary" onClick={fetchTransactions}>Refresh</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="admin-table-container">
                    {transactions.length === 0 ? (
                        <p>No pending withdrawals.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Investor</th>
                                    <th>Amount</th>
                                    <th>Bank Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr key={t.transaction_id}>
                                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td>
                                            {t.investor_name}<br />
                                            <small>{t.investor_email}</small>
                                        </td>
                                        <td>₦{t.amount.toLocaleString()}</td>
                                        <td>
                                            <small>
                                                {t.bank_name}<br />
                                                {t.bank_account_number}<br />
                                                {t.bank_account_name}
                                            </small>
                                        </td>
                                        <td>
                                            <button
                                                className="admin-btn-primary"
                                                style={{ backgroundColor: '#2ecc71', marginRight: '5px' }}
                                                onClick={() => handleApprove(t.transaction_id)}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="admin-btn-primary"
                                                style={{ backgroundColor: '#e74c3c' }}
                                                onClick={() => handleReject(t.transaction_id)}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminTransactions;
