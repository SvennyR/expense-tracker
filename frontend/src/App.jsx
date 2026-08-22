import { useState, useEffect } from 'react';
import API from './api';

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
  const [categoryId, setCategoryId] = useState('1');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (token) {
      fetchSummary();
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
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add transaction');
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
        <button onClick={() => handleAuth(true)} disabled={loading} style={{ marginRight: '1rem' }}>
          Login
        </button>
        <button onClick={() => handleAuth(false)} disabled={loading}>
          Register
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {summary && (
        <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <p><strong>Total Income:</strong> €{summary.total_income}</p>
          <p><strong>Total Expense:</strong> €{summary.total_expense}</p>
          <p><strong>Net Balance:</strong> €{summary.net_balance}</p>
        </div>
      )}

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
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Submit Transaction</button>
      </form>
    </div>
  );
}