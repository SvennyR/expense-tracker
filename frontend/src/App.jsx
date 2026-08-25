import { useState, useEffect } from 'react';
import API from './api';
import ExpenseChart from './ExpenseChart';

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
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '400px', margin: 'auto' }}>
        <h2>Financial Tracker</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
        />
        <button type="button" onClick={() => handleAuth(true)} disabled={loading} style={{ marginRight: '1rem' }}>
          Login
        </button>
        <button type="button" onClick={() => handleAuth(false)} disabled={loading}>
          Register
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {summary && (
        <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <p><strong>Total Income:</strong> €{summary.total_income}</p>
          <p><strong>Total Expense:</strong> €{summary.total_expense}</p>
          <p><strong>Net Balance:</strong> €{summary.net_balance}</p>
        </div>
      )}

      {/* --- Expense Chart --- */}
      <ExpenseChart transactions={transactions} />

      <h3>Add New Transaction</h3>
      <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

        {/* --- Dyanmic Category Dropdown --- */}
        <select value={isCreatingCategory ? 'NEW' : categoryId} onChange={handleCategorySelect} required>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          <option value="NEW">+ Add Custom Category...</option>
        </select>

        {/* --- Inline Creation Input (Only appears when "+ Add Custom Category..." is selected) --- */}
        {isCreatingCategory && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="New Category Name (e.g., Gym)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleCreateCategory}>
              Save Category
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
        <button type="submit">Submit Transaction</button>
      </form>

      {/* --- Transaction History --- */}
      <h3 style={{ marginTop: '2rem' }}>Transaction History</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '8px' }}>Date</th>
            <th style={{ padding: '8px' }}>Description</th>
            <th style={{ padding: '8px' }}>Type</th>
            <th style={{ padding: '8px' }}>Amount</th>
            <th style={{ padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{t.date}</td>
              <td style={{ padding: '8px' }}>{t.description}</td>
              <td style={{ padding: '8px', color: t.type === 'INCOME' ? 'green' : 'red' }}>
                {t.type}
              </td>
              <td style={{ padding: '8px' }}>
                €{Number.parseFloat(t.amount).toFixed(2)}
              </td>
              <td style={{ padding: '8px' }}>
                <button 
                  type="button"
                  onClick={() => handleDeleteTransaction(t.id)}
                  style={{ 
                    color: 'white', 
                    backgroundColor: '#dc3545', 
                    border: 'none', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    cursor: 'pointer' 
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}