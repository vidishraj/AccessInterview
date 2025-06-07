import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from .models import db, User, Document

api = Blueprint('api', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(username=data['username']).first()
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    
    if user and user.check_password(data.get('password')):
        token = jwt.encode({
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'])
        return jsonify({'token': token})
    
    return jsonify({'message': 'Invalid credentials'}), 401

@api.route('/documents', methods=['GET'])
def get_documents():
    docs = Document.query.order_by(Document.created_at.desc()).all()
    return jsonify([{
        'id': doc.id,
        'title': doc.title,
        'filename': doc.filename,
        'tags': doc.tags.split(',') if doc.tags else [],
        'created_at': doc.created_at.isoformat()
    } for doc in docs])

@api.route('/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    return jsonify({
        'id': doc.id,
        'title': doc.title,
        'content': doc.content,
        'filename': doc.filename,
        'tags': doc.tags.split(',') if doc.tags else [],
        'created_at': doc.created_at.isoformat()
    })

@api.route('/documents', methods=['POST'])
@token_required
def upload_document(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    title = request.form.get('title')
    tags = request.form.get('tags')
    
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    if not file.filename.endswith('.md'):
        return jsonify({'message': 'Only markdown files are allowed'}), 400
    
    if not title:
        return jsonify({'message': 'Title is required'}), 400
    
    # Always save files in lowercase for cross-platform compatibility
    filename = secure_filename(file.filename).lower()
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # Also save to Astro content folder
    astro_content_dir = os.path.abspath(os.path.join(current_app.root_path, '../../src/content/docs'))
    os.makedirs(astro_content_dir, exist_ok=True)
    astro_filepath = os.path.join(astro_content_dir, filename)
    with open(filepath, 'rb') as src, open(astro_filepath, 'wb') as dst:
        dst.write(src.read())
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    doc = Document(
        title=title,
        content=content,
        filename=filename,
        tags=tags
    )
    db.session.add(doc)
    db.session.commit()
    
    return jsonify({
        'id': doc.id,
        'title': doc.title,
        'filename': doc.filename,
        'tags': doc.tags.split(',') if doc.tags else [],
        'created_at': doc.created_at.isoformat(),
        'message': 'File uploaded successfully. All files are saved in lowercase for compatibility.'
    }), 201

@api.route('/documents/<int:doc_id>', methods=['DELETE'])
@token_required
def delete_document(current_user, doc_id):
    doc = Document.query.get_or_404(doc_id)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], doc.filename)
    
    # Delete from uploads folder
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Also delete from Astro content folder
    astro_content_dir = os.path.abspath(os.path.join(current_app.root_path, '../../src/content/docs'))
    astro_filepath = os.path.join(astro_content_dir, doc.filename)
    if os.path.exists(astro_filepath):
        os.remove(astro_filepath)
    
    db.session.delete(doc)
    db.session.commit()
    return '', 204

@api.route('/search', methods=['GET'])
def search_documents():
    query = request.args.get('q', '').lower()
    tag_filter = request.args.get('tag', '').lower()
    
    if not query and not tag_filter:
        return jsonify([])
    
    base_query = Document.query
    
    if query:
        base_query = base_query.filter(
            db.or_(
                Document.title.ilike(f'%{query}%'),
                Document.content.ilike(f'%{query}%'),
                Document.tags.ilike(f'%{query}%')
            )
        )
    
    if tag_filter:
        base_query = base_query.filter(Document.tags.ilike(f'%{tag_filter}%'))
    
    docs = base_query.all()
    
    return jsonify([{
        'id': doc.id,
        'title': doc.title,
        'filename': doc.filename,
        'tags': doc.tags.split(',') if doc.tags else [],
        'created_at': doc.created_at.isoformat()
    } for doc in docs])
