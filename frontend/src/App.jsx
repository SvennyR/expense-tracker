import { useState, useEffect } from 'react';
import API from './api';
import ExpenseChart from './ExpenseChart';
import { LogOut, PlusCircle, Trash2, LogIn, UserPlus, CheckCircle } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state for new transaction
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [categoryId, setCategoryId] = useState('1'); // Default category ID
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSummary();
      fetchTransactions();
      fetchCategories();
    }
  }, [token]);

  const handleAuth = async (isLogin) => {
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/login' : '/register';
    try {
      // Sending 'username' instead of 'email'
      const res = await API.post(endpoint, { username, password });
      if (isLogin) {
        localStorage.setItem('token', res.data.access_token);
        setToken(res.data.access_token);
      } else {
        alert('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await API.get('/summary');
      setSummary(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await API.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };
  const fetchCategories = async () => {
  try {
    const res = await API.get('/categories');
    setCategories(res.data);
    if (res.data.length > 0) {
      setCategoryId(res.data[0].id.toString());
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
};

  const handleCategorySelect = (e) => {
  const value = e.target.value;
  if (value === 'NEW') {
    setIsCreatingCategory(true);
  } else {
    setIsCreatingCategory(false);
    setCategoryId(value);
  }
};

const handleCreateCategory = async () => {
  if (!newCategoryName.trim()) return;
  try {
    const res = await API.post('/categories', { name: newCategoryName });
    setCategories([...categories, res.data]); // Update dropdown list
    setCategoryId(res.data.id.toString());    // Auto-select new category
    setNewCategoryName('');
    setIsCreatingCategory(false);
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to add category');
  }
};

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await API.post('/transactions', {
        amount: Number.parseFloat(amount),
        type,
        category_id: Number.parseInt(categoryId),
        date: new Date().toISOString().split('T')[0],
        description,
      });
      setDescription('');
      setAmount('');
      fetchSummary();
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (Id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await API.delete(`/transactions/${Id}`);
      // Refresh the summary and transactions after deletion
      fetchSummary();
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete transaction');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setSummary(null);
  };

if (!token) {
    return (
      <div className="dark app-container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
        <div className="card">
          <h2>Financial Tracker</h2>
          {error && <p style={{ color: 'var(--destructive)', marginBottom: '1rem' }}>{error}</p>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '1.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleAuth(true)}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1 }}
            >
              <LogIn size={16} /> Login
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => handleAuth(false)}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1 }}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark app-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Financial Dashboard</h2>
        <button
          type="button"
          className="btn-danger"
          onClick={handleLogout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="card summary-grid">
          <div className="summary-item">
            <span>Total Income</span>
            <strong style={{ color: 'var(--success)' }}>€{summary.total_income}</strong>
          </div>
          <div className="summary-item">
            <span>Total Expense</span>
            <strong style={{ color: 'var(--danger)' }}>- €{summary.total_expense}</strong>
          </div>
          <div className="summary-item">
            <span>Net Balance</span>
            <strong>€{summary.net_balance}</strong>
          </div>
        </div>
      )}

      {/* Chart Card */}
      <div className="card">
        <h3>Expense Breakdown</h3>
        <ExpenseChart transactions={transactions} />
      </div>

      {/* Add Transaction Card */}
      <div className="card">
        <h3>Add New Transaction</h3>
        <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>

          <select value={isCreatingCategory ? 'NEW' : categoryId} onChange={handleCategorySelect} required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            <option value="NEW">+ Add Custom Category...</option>
          </select>

          {isCreatingCategory && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
              >
                <CheckCircle size={16} /> Save Category
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <button
            type="submit"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={16} /> Submit Transaction
          </button>
        </form>
      </div>

      {/* History Card */}
      <div className="card">
        <h3>Transaction History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.description}</td>
                <td style={{ color: t.type === 'INCOME' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {t.type}
                </td>
                <td>€{Number.parseFloat(t.amount).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDeleteTransaction(t.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}