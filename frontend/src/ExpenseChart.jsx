import {Chart as ChartJS, ArcElement, Tooltip, Legend} from 'chart.js';
import {Pie} from 'react-chartjs-2';

// Register the necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpensesChart({ transactions }) {
  // Filter only expense transactions
  const expense = transactions.filter((t) => t.type === 'EXPENSE');

    // Aggregate expenses by category
    const categoryTotatls = expense.reduce((acc, t) => {
        const category = t.category_name || 'Uncategorized';
        const amount = Number.parseFloat(t.amount) || 0;
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {});

    const data = {
        labels: Object.keys(categoryTotatls),
        datasets: [
            {
                label: 'Expenses (€)',
                data: Object.values(categoryTotatls),
                backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (expense.length === 0) {
   return <p style={{ color: '#888', textAlign: 'center' }}>No expenses recorded yet to display chart.</p>;
  }

  return (
    <div style={{ maxWidth: '300px', margin: '2rem auto' }}>
      <h4 style={{ textAlign: 'center' }}>Expense Breakdown</h4>
      <Pie data={data} />
    </div>
  );
}