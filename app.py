from flask import Flask, request, jsonify
from models import db, User, Category, Transaction

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://devuser:devpassword@localhost:5432/expense_tracker'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# --- Category Routes ---

@app.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([{'id': c.id, 'name': c.name} for c in categories]), 200

@app.route('/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400

    new_category = Category(name=data['name'])
    db.session.add(new_category)
    db.session.commit()
    return jsonify({'id': new_category.id, 'name': new_category.name}), 201

# --- Transaction Routes ---

@app.route('/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.all()
    output = []
    for t in transactions:
        output.append({
            'id': t.id,
            'user_id': t.user_id,
            'category_id': t.category_id,
            'amount': str(t.amount),
            'type': t.type,
            'date': str(t.date),
            'description': t.description
        })
    return jsonify(output), 200

@app.route('/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    required = ['user_id', 'category_id', 'amount', 'type', 'date']
    if not all(field in data for field in required):
        return jsonify({'error': f'Missing required fields: {required}'}), 400

    new_tx = Transaction(
        user_id=data['user_id'],
        category_id=data['category_id'],
        amount=data['amount'],
        type=data['type'],
        date=data['date'],
        description=data.get('description', '')
    )
    db.session.add(new_tx)
    db.session.commit()
    return jsonify({'message': 'Transaction created', 'id': new_tx.id}), 201

@app.route('/transactions/<int:tx_id>', methods=['PUT'])
def update_transaction(tx_id):
    tx = Transaction.query.get_or_404(tx_id)
    data = request.get_json() or {}

    tx.amount = data.get('amount', tx.amount)
    tx.type = data.get('type', tx.type)
    tx.category_id = data.get('category_id', tx.category_id)
    tx.date = data.get('date', tx.date)
    tx.description = data.get('description', tx.description)

    db.session.commit()
    return jsonify({'message': f'Transaction {tx.id} updated successfully'}), 200

@app.route('/transactions/<int:tx_id>', methods=['DELETE'])
def delete_transaction(tx_id):
    tx = Transaction.query.get_or_404(tx_id)
    db.session.delete(tx)
    db.session.commit()
    return jsonify({'message': f'Transaction {tx_id} deleted successfully'}), 200

# --- Summary & Analytics Route ---

@app.route('/summary', methods=['GET'])
def get_summary():
    user_id = request.args.get('user_id', type=int)
    
    query = Transaction.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    transactions = query.all()

    # Convert t.amount to float before summing
    total_income = sum(float(t.amount) for t in transactions if t.type == 'INCOME')
    total_expense = sum(float(t.amount) for t in transactions if t.type == 'EXPENSE')
    net_balance = total_income - total_expense

    # Safely accumulate category totals using float addition
    category_breakdown = {}
    for t in transactions:
        cat = Category.query.get(t.category_id)
        cat_name = cat.name if cat else 'Uncategorized'
        category_breakdown[cat_name] = category_breakdown.get(cat_name, 0.0) + float(t.amount)

    return jsonify({
        'total_income': round(total_income, 2),
        'total_expense': round(total_expense, 2),
        'net_balance': round(net_balance, 2),
        'category_breakdown': category_breakdown
    }), 200

# ALWAYS LEAVE THIS AT THE VERY BOTTOM
if __name__ == '__main__':
    app.run(debug=True)