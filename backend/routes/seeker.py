import os
from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory, current_app
from flask_login import login_required, current_user
from datetime import datetime
from werkzeug.utils import secure_filename
from models import JobPosting, Application, SavedJob, Resume
from extensions import db
from utils import calculate_distance, role_required

seeker_bp = Blueprint('seeker', __name__)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@seeker_bp.route('/job-seeker/dashboard')
@login_required
@role_required('job_seeker')
def job_seeker_dashboard():
    applications = Application.query.filter_by(applicant_id=current_user.id).order_by(Application.submitted_at.desc()).all()
    saved_jobs = SavedJob.query.filter_by(user_id=current_user.id).order_by(SavedJob.saved_at.desc()).all()
    now = datetime.now()
    
    # Calculate applications submitted in the last 7 days
    from datetime import timedelta
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    recent_apps_count = sum(1 for app in applications if app.submitted_at >= one_week_ago)
    
    return render_template('job_seeker_dashboard.html', 
                           applications=applications, 
                           saved_jobs=saved_jobs, 
                           now=now,
                           recent_apps_count=recent_apps_count)

@seeker_bp.route('/jobs/search')
@login_required
@role_required('job_seeker')
def search_jobs():
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', '')
    radius = float(request.args.get('radius', 25))
    
    query = JobPosting.query.filter_by(status='active')
    
    if keyword:
        query = query.filter(
            db.or_(
                JobPosting.title.ilike(f'%{keyword}%'),
                JobPosting.description.ilike(f'%{keyword}%')
            )
        )
    
    if category:
        query = query.filter_by(category=category)
    
    jobs = query.all()
    
    jobs_with_distance = []
    for job in jobs:
        distance = calculate_distance(
            current_user.latitude,
            current_user.longitude,
            job.latitude,
            job.longitude
        )
        
        if distance <= radius:
            jobs_with_distance.append({
                'job': job,
                'distance': round(distance, 2)
            })
    
    jobs_with_distance.sort(key=lambda x: x['distance'])
    
    return render_template('search_jobs.html', jobs_with_distance=jobs_with_distance, keyword=keyword, category=category, radius=radius)

@seeker_bp.route('/jobs/<int:job_id>')
@login_required
def view_job(job_id):
    job = JobPosting.query.get_or_404(job_id)
    
    distance = None
    if current_user.role == 'job_seeker':
        distance = round(calculate_distance(
            current_user.latitude,
            current_user.longitude,
            job.latitude,
            job.longitude
        ), 2)
    
    already_applied = Application.query.filter_by(
        job_id=job_id,
        applicant_id=current_user.id
    ).first() if current_user.role == 'job_seeker' else None
    
    is_saved = SavedJob.query.filter_by(
        job_id=job_id,
        user_id=current_user.id
    ).first() if current_user.role == 'job_seeker' else None
    
    return render_template('view_job.html', job=job, distance=distance, already_applied=already_applied, is_saved=is_saved)

@seeker_bp.route('/jobs/<int:job_id>/apply', methods=['GET', 'POST'])
@login_required
@role_required('job_seeker')
def apply_job(job_id):
    job = JobPosting.query.get_or_404(job_id)
    
    existing_application = Application.query.filter_by(
        job_id=job_id,
        applicant_id=current_user.id
    ).first()
    
    if existing_application:
        flash('You have already applied to this job!', 'warning')
        return redirect(url_for('seeker.view_job', job_id=job_id))
    
    if request.method == 'POST':
        resume_id = request.form.get('resume_id')
        cover_letter = request.form.get('cover_letter')
        
        application = Application(
            job_id=job_id,
            applicant_id=current_user.id,
            resume_id=resume_id if resume_id else None,
            cover_letter=cover_letter
        )
        
        db.session.add(application)
        db.session.commit()
        
        flash('Application submitted successfully!', 'success')
        return redirect(url_for('seeker.job_seeker_dashboard'))
    
    resumes = Resume.query.filter_by(user_id=current_user.id).all()
    return render_template('apply_job.html', job=job, resumes=resumes)

@seeker_bp.route('/resumes/upload', methods=['POST'])
@login_required
@role_required('job_seeker')
def upload_resume():
    resume_count = Resume.query.filter_by(user_id=current_user.id).count()
    if resume_count >= 3:
        flash('You can only upload up to 3 resumes. Please delete one first.', 'warning')
        return redirect(url_for('seeker.job_seeker_dashboard'))
    
    if 'resume' not in request.files:
        flash('No file selected!', 'error')
        return redirect(url_for('seeker.job_seeker_dashboard'))
    
    file = request.files['resume']
    
    if file.filename == '':
        flash('No file selected!', 'error')
        return redirect(url_for('seeker.job_seeker_dashboard'))
    
    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        filename = f"{current_user.id}_{datetime.utcnow().timestamp()}_{original_filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
        
        resume = Resume(
            user_id=current_user.id,
            filename=filename,
            original_filename=original_filename
        )
        db.session.add(resume)
        db.session.commit()
        
        flash('Resume uploaded successfully!', 'success')
    else:
        flash('Only PDF files are allowed!', 'error')
    
    return redirect(url_for('seeker.job_seeker_dashboard'))

@seeker_bp.route('/resumes/<int:resume_id>/delete', methods=['POST'])
@login_required
@role_required('job_seeker')
def delete_resume(resume_id):
    resume = Resume.query.get_or_404(resume_id)
    
    if resume.user_id != current_user.id:
        flash('Access denied!', 'error')
        return redirect(url_for('seeker.job_seeker_dashboard'))
    
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], resume.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    db.session.delete(resume)
    db.session.commit()
    
    flash('Resume deleted successfully!', 'success')
    return redirect(url_for('seeker.job_seeker_dashboard'))

@seeker_bp.route('/jobs/<int:job_id>/save', methods=['POST'])
@login_required
@role_required('job_seeker')
def save_job(job_id):
    existing = SavedJob.query.filter_by(user_id=current_user.id, job_id=job_id).first()
    
    if existing:
        flash('Job already in your watch list!', 'warning')
    else:
        saved_job = SavedJob(user_id=current_user.id, job_id=job_id)
        db.session.add(saved_job)
        db.session.commit()
        flash('Job added to watch list!', 'success')
    
    return redirect(url_for('seeker.view_job', job_id=job_id))

@seeker_bp.route('/jobs/<int:job_id>/unsave', methods=['POST'])
@login_required
@role_required('job_seeker')
def unsave_job(job_id):
    saved_job = SavedJob.query.filter_by(user_id=current_user.id, job_id=job_id).first()
    
    if saved_job:
        db.session.delete(saved_job)
        db.session.commit()
        flash('Job removed from watch list!', 'success')
    
    return redirect(url_for('seeker.job_seeker_dashboard'))
