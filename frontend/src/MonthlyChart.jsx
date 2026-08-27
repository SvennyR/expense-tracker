import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonthlyChart({ transactions , currencySymbol = '€'}) {

    const processMonthlyData = () => {
        const monthlyTotals = {};

        transactions.forEach((tx) => {
            if (!tx.date) return; // Skip transactions without a date

            const monthKey = tx.date.substring(0, 7); // Extract YYYY-MM from the date
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = {month: monthKey, income: 0, expense: 0};
            }

            const amount = Number.parseFloat(tx.amount) || 0; // Ensure amount is a number
            if (tx.type === 'INCOME') {
                monthlyTotals[monthKey].income += amount;
            } else if (tx.type === 'EXPENSE') {
                monthlyTotals[monthKey].expense += amount;
            }
        });

        return Object.values(monthlyTotals).sort((a, b) => new Date(a.month) - new Date(b.month)); // Sort by month
    };

    const chartData = processMonthlyData();

    if (chartData.length === 0) {
        return (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Monthly Overview</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>No transaction data available for charts yet.</p>
            </div>
        );
    }

    return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Monthly Overview</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" tickFormatter={(value) => `${currencySymbol}${value}`} />
            <Tooltip
              formatter={(value) => [`${currencySymbol}${Number(value).toFixed(2)}`, '']}
              contentStyle={{ backgroundColor: '#1e293b', borderColor: 'var(--border)', color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}