from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Message, User, Application, JobPosting
from extensions import db
from datetime import datetime
from sqlalchemy import or_, and_

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/messages/unread', methods=['GET'])
@login_required
def get_unread_count():
    count = Message.query.filter_by(recipient_id=current_user.id, is_read=False).count()
    return jsonify({'unread_count': count})

@chat_bp.route('/api/messages/contacts', methods=['GET'])
@login_required
def get_contacts():
    # Find all users current_user has messaged or received messages from
    sent_recipient_ids = db.session.query(Message.recipient_id).filter_by(sender_id=current_user.id).distinct().all()
    received_sender_ids = db.session.query(Message.sender_id).filter_by(recipient_id=current_user.id).distinct().all()
    
    chat_user_ids = set([r[0] for r in sent_recipient_ids] + [s[0] for s in received_sender_ids])
    
    # Also automatically resolve structural context contacts (applied seekers for employers, or applied employers for seekers)
    if current_user.role == 'employer':
        # Get all seekers who have applied to jobs posted by this employer
        applicants = db.session.query(Application.applicant_id).join(JobPosting).filter(JobPosting.employer_id == current_user.id).distinct().all()
        for app in applicants:
            chat_user_ids.add(app[0])
    elif current_user.role == 'job_seeker':
        # Get all employers of jobs this seeker applied to
        employers = db.session.query(JobPosting.employer_id).join(Application).filter(Application.applicant_id == current_user.id).distinct().all()
        for emp in employers:
            chat_user_ids.add(emp[0])
            
    # Query details of all these resolved contacts
    if not chat_user_ids:
        return jsonify({'contacts': []})
        
    contacts = User.query.filter(User.id.in_(chat_user_ids)).all()
    
    contacts_data = []
    for c in contacts:
        # Calculate dynamic last message timestamp if available for chronological sorting
        last_msg = Message.query.filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == c.id),
                and_(Message.sender_id == c.id, Message.recipient_id == current_user.id)
            )
        ).order_by(Message.timestamp.desc()).first()
        
        # Calculate unread count specifically from this contact
        contact_unread = Message.query.filter_by(sender_id=c.id, recipient_id=current_user.id, is_read=False).count()
        
        contacts_data.append({
            'id': c.id,
            'full_name': c.full_name,
            'company_name': c.company_name or None,
            'role': c.role,
            'company_logo': c.company_logo or None,
            'last_message': last_msg.content if last_msg else '',
            'last_timestamp': last_msg.timestamp.isoformat() if last_msg else '',
            'unread_count': contact_unread
        })
        
    # Sort contacts by last message timestamp (most recent first)
    contacts_data.sort(key=lambda x: x['last_timestamp'] or '1970-01-01T00:00:00', reverse=True)
    return jsonify({'contacts': contacts_data})

@chat_bp.route('/api/messages/<int:recipient_id>', methods=['GET'])
@login_required
def get_message_history(recipient_id):
    # Fetch thread history
    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == recipient_id),
            and_(Message.sender_id == recipient_id, Message.recipient_id == current_user.id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    # Mark messages received from this sender as read
    unread_messages = Message.query.filter_by(sender_id=recipient_id, recipient_id=current_user.id, is_read=False).all()
    if unread_messages:
        for msg in unread_messages:
            msg.is_read = True
        db.session.commit()
        
    recipient = User.query.get_or_404(recipient_id)
    
    messages_data = [{
        'id': m.id,
        'sender_id': m.sender_id,
        'recipient_id': m.recipient_id,
        'content': m.content,
        'timestamp': m.timestamp.isoformat(),
        'is_read': m.is_read
    } for m in messages]
    
    return jsonify({
        'messages': messages_data,
        'recipient': {
            'id': recipient.id,
            'full_name': recipient.full_name,
            'company_name': recipient.company_name or None,
            'role': recipient.role
        }
    })

@chat_bp.route('/api/messages/send', methods=['POST'])
@login_required
def send_message():
    data = request.get_json() or {}
    recipient_id = data.get('recipient_id')
    content = data.get('content')
    job_id = data.get('job_id')
    
    if not recipient_id or not content or not content.strip():
        return jsonify({'error': 'Recipient and content are required.'}), 400
        
    recipient = User.query.get(recipient_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found.'}), 404
        
    message = Message(
        sender_id=current_user.id,
        recipient_id=recipient_id,
        content=content.strip(),
        job_id=job_id
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': {
            'id': message.id,
            'sender_id': message.sender_id,
            'recipient_id': message.recipient_id,
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'is_read': message.is_read
        }
    })
