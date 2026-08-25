import { useState, useEffect } from 'react';
import API from './api';
import ExpenseChart from './ExpenseChart';
import { LogOut, PlusCircle, Trash2, LogIn, UserPlus, CheckCircle, Pencil } from 'lucide-react';

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
  const [currency, setCurrency] = useState('EUR');
  const [deleteId, setDeleteId] = useState(null);
  const [editTx, setEditTx] = useState(null);

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
      setCurrency(res.data.currency || 'EUR'); // Update currency state
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

  const openDeleteModal = (id) => {
  setDeleteId(id);
};

  const handleDeleteTransaction = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/transactions/${deleteId}`);
      fetchSummary();
      fetchTransactions();
      } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete transaction');
  } finally {
    setDeleteId(null);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setSummary(null);
  };

  const getCurrencySymbol = (code) => {
    const symbols ={ USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$' };
    return symbols[code] || code || '€';
};

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency); // Optimistic UI update
    try {
      const res = await API.put('/user/currency', { currency: newCurrency });
      if (summary) {
        setSummary((prev) => ({ ...prev, currency: res.data.currency }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update currency');
      fetchSummary(); // Rollback on error
    }
  };
    const openEditModal = (tx) => {
      setDeleteId(null);
      setEditTx({
        id: tx.id,
        amount: tx.amount || '',
        type: tx.type || 'EXPENSE',
        category_id: tx.category_id ? String(tx.category_id) : (categories[0]?.id ? String(categories[0].id) : '1'),
        currency: tx.currency || currency || 'EUR',
        description: tx.description || ''
      });
    };

    const handleEditTransaction = async (e) => {
      e.preventDefault();
      if (!editTx) return;

      try {
        await API.put(`/transactions/${editTx.id}`, {
          amount: Number.parseFloat(editTx.amount),
          type: editTx.type,
          category_id: Number.parseInt(editTx.category_id),
          description: editTx.description,
          currency: editTx.currency,
        });
        setEditTx(null);
        fetchSummary();
        fetchTransactions();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to update transaction');
      }
    };
   /* HTML STUFF */

if (!token) {
    return (
      <div className="dark app-container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
      <div className="card">
      <h2>Financial Tracker</h2>
      {error && <p style={{ color: 'var(--destructive)', marginBottom: '1rem' }}>{error}</p>}
      <input type="text" placeholder="Username" value={username} onChange={(e)=> setUsername(e.target.value)}
      style={{ marginBottom: '1rem' }}
      />
      <input type="password" placeholder="Password" value={password} onChange={(e)=> setPassword(e.target.value)}
      style={{ marginBottom: '1.5rem' }}
      />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
      <button type="button" onClick={()=> handleAuth(true)}
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1 }}
      >
      <LogIn size={16} /> Login
      </button>
      <button type="button" className="btn-danger" onClick={()=> handleAuth(false)}
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
      <select value={currency} onChange={handleCurrencyChange} style={{ width: 'auto' }}>
      <option value="EUR">EUR (€)</option>
      <option value="USD">USD ($)</option>
      <option value="GBP">GBP (£)</option>
      <option value="JPY">JPY (¥)</option>
      </select>
      <button type="button" className="btn-danger" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <LogOut size={16} /> Logout
      </button>
      </div>
      {/* Summary Card */}
      {summary && (
      <div className="card summary-grid">
      <div className="summary-item">
      <span>Total Income</span>
      <strong style={{ color: 'var(--success)' }}>{getCurrencySymbol(currency)}{summary.total_income}</strong>
      </div>
      <div className="summary-item">
      <span>Total Expense</span>
      <strong style={{ color: 'var(--danger)' }}>- {getCurrencySymbol(currency)}{summary.total_expense}</strong>
      </div>
      <div className="summary-item">
      <span>Net Balance</span>
      <strong>{getCurrencySymbol(currency)}{summary.net_balance}</strong>
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
      <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e)=> setAmount(e.target.value)}
      required
      />
      <select value={type} onChange={(e)=> setType(e.target.value)}>
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
      <input type="text" placeholder="New Category Name" value={newCategoryName} onChange={(e)=> setNewCategoryName(e.target.value)}
      />
      <button type="button" onClick={handleCreateCategory} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
      <CheckCircle size={16} /> Save Category
      </button>
      </div>
      )}
      <input type="text" placeholder="Description" value={description} onChange={(e)=> setDescription(e.target.value)}
      required
      />
      <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
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
      <td style={{ color: t.type==='INCOME' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
      {t.type}
      </td>
      <td>{getCurrencySymbol(currency)}{Number.parseFloat(t.amount).toFixed(2)}</td>
      <td>
      <button type="button" className="btn-danger" onClick={()=> openDeleteModal(t.id)}
      style={{
      padding: '0.25rem 0.5rem',
      fontSize: '0.85rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      }}>
      <Trash2 size={14} /> Delete
      </button>
      <button type="button" onClick={()=> openEditModal(t)}
      style={{
      padding: '0.25rem 0.5rem',
      fontSize: '0.85rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      marginRight: '0.5rem',
      paddingLeft: '0.5rem',
      }}>
      <Pencil size={14} /> Edit
      </button>
      </td>
      </tr>
      ))}
      </tbody>
      </table>
      </div>
      {/* Delete Modal popup */}
      {deleteId && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
      Are you sure you want to delete this transaction?
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
      <button type="button" onClick={()=> setDeleteId(null)}
      style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
      Cancel
      </button>
      <button type="button" className="btn-danger" onClick={handleDeleteTransaction}>
      Delete
      </button>
      </div>
      </div>
      </div>
      )}
      {/* Edit Modal popup */}
      {editTx && (
      <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ maxWidth: '450px', width: '90%', padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Edit Transaction</h3>
      <form onSubmit={handleEditTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input type="number" step="0.01" placeholder="Amount" value={editTx.amount} onChange={(e)=> setEditTx({ ...editTx, amount: e.target.value })}
      required
      />
      <select value={editTx.type} onChange={(e)=> setEditTx({ ...editTx, type: e.target.value })}
      >
      <option value="EXPENSE">Expense</option>
      <option value="INCOME">Income</option>
      </select>
      <select value={editTx.category_id} onChange={(e)=> setEditTx({ ...editTx, category_id: e.target.value })}
      required
      >
      {categories.map((cat) => (
      <option key={cat.id} value={cat.id}>
      {cat.name}
      </option>
      ))}
      </select>
      <select value={editTx.currency || currency} onChange={(e)=> setEditTx({ ...editTx, currency: e.target.value })}
      >
      <option value="EUR">EUR (€)</option>
      <option value="USD">USD ($)</option>
      <option value="GBP">GBP (£)</option>
      <option value="JPY">JPY (¥)</option>
      <option value="CAD">CAD (CA$)</option>
      </select>
      <input type="text" placeholder="Description" value={editTx.description} onChange={(e)=> setEditTx({ ...editTx, description: e.target.value })}
      required
      />
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
      <button type="button" onClick={()=> setEditTx(null)}
      style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
      Cancel
      </button>
      <button type="submit">Save Changes
      </button>
      </div>
      </form>
      </div>
      </div>
      )}
      </div>
);
}