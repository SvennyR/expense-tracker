import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from models import db, User, Category, Transaction
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect

load_dotenv('keys.env')  # Load environment variables .env file
app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]  #restricting CORS from frontend
    }})

app.config['WTF_CSRF_ENABLED'] = False
csrf = CSRFProtect(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://devuser:devpassword@localhost:5432/expense_tracker'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
DEBUG_MODE = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
jwt = JWTManager(app)

# --- Database Initialization / Auto-Seeding ---
def init_db():
    with app.app_context():
        db.create_all()
        if not Category.query.first():
            db.session.add(Category(name='General'))
            db.session.commit()

db.init_app(app)
init_db()

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
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    # Only fetch transactions belonging to the logged in user
    transactions = Transaction.query.filter_by(user_id=int(current_user_id)).all()
    output = []
    for t in transactions:
        cat = Category.query.get(t.category_id)
        cat_name = cat.name if cat else 'Uncategorized'
        output.append({
            'id': t.id,
            'user_id': t.user_id,
            'category_id': t.category_id,
            'category_name': cat_name,
            'amount': str(t.amount),
            'type': t.type,
            'date': str(t.date),
            'description': t.description
        })
    return jsonify(output), 200


@app.route('/transactions', methods=['POST'])
@jwt_required()
def add_transaction():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    required = ['category_id', 'amount', 'type', 'date']
    if not all(field in data for field in required):
        return jsonify({'error': f'Missing required fields: {required}'}), 400

    new_tx = Transaction(
        user_id=int(current_user_id), # Automatically assign logged in user ID
        category_id=data['category_id'],
        amount=data['amount'],
        type=data['type'],
        date=data['date'],
        description=data.get('description', '')
    )
    db.session.add(new_tx)
    db.session.commit()
    return jsonify({'message': 'Transaction created', 'id': new_tx.id}), 201

@app.route('/transactions/<int:tx_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(tx_id):
    current_user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=tx_id, user_id=int(current_user_id)).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found or unauthorized'}), 404

    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted'}), 200


# --- Summary Route ---

@app.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    current_user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=int(current_user_id)).all()

    total_income = sum(float(t.amount) for t in transactions if t.type == 'INCOME')
    total_expense = sum(float(t.amount) for t in transactions if t.type == 'EXPENSE')
    net_balance = total_income - total_expense

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

# --- Auth Routes ---

@app.route('/register', methods=['POST'])
@csrf.exempt #can be exempt since i use JWT headers for auth
def register():
    data = request.get_json() or {}
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'User already exists'}), 400

    hashed_pw = generate_password_hash(data['password'])
    new_user = User(username=data['username'], password_hash=hashed_pw)

    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully', 'user_id': new_user.id}), 201


@app.route('/login', methods=['POST'])
@csrf.exempt  #can be exempt since i use JWT headers for auth
def login():
    data = request.get_json() or {}
    user = User.query.filter_by(username=data.get('username')).first()

    if not user or not check_password_hash(user.password_hash, data.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token}), 200

# ALWAYS LEAVE THIS AT THE VERY BOTTOM
if __name__ == '__main__':
    app.run(debug=DEBUG_MODE)