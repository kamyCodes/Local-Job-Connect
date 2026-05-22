import os
from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory, current_app
from flask_login import login_required, current_user
from datetime import datetime
from werkzeug.utils import secure_filename
from models import JobPosting, Application, SavedJob, Resume
from extensions import db, cache

from sqlalchemy.orm import joinedload

@cache.cached(timeout=300, key_prefix='active_job_postings')
def get_cached_active_jobs():
    return JobPosting.query.options(joinedload(JobPosting.employer)).filter_by(status='active').all()


from utils import calculate_distance, role_required, get_user_greeting
from sqlalchemy import func

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
    
    # Timezone-aware greeting
    greeting = get_user_greeting(current_user)
    
    # Dynamic calculation of overall most popular active job
    popular_job_query = db.session.query(
        Application.job_id, func.count(Application.id).label('app_count')
    ).join(JobPosting).filter(JobPosting.status == 'active').group_by(Application.job_id).order_by(db.text('app_count DESC')).first()
    
    most_popular_job = None
    if popular_job_query and popular_job_query[1] >= 10:
        most_popular_job = JobPosting.query.get(popular_job_query[0])
        most_popular_job.application_count = popular_job_query[1]
            
    return render_template('job_seeker_dashboard.html', 
                           applications=applications, 
                           saved_jobs=saved_jobs, 
                           now=now,
                           recent_apps_count=recent_apps_count,
                           greeting=greeting,
                           most_popular_job=most_popular_job)

@seeker_bp.route('/jobs/search')
@login_required
@role_required('job_seeker')
def search_jobs():
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', '')
    radius = float(request.args.get('radius', 25))
    
    # Retrieve active job postings from the high-speed in-memory cache
    jobs = get_cached_active_jobs()
    
    # Filter in-memory to prevent multiple sequential database queries and minimize roundtrips
    if keyword:
        keyword_lower = keyword.lower()
        jobs = [j for j in jobs if keyword_lower in j.title.lower() or keyword_lower in j.description.lower()]
        
    if category:
        jobs = [j for j in jobs if j.category == category]
        
    jobs_with_distance = []
    for job in jobs:
        distance = calculate_distance(
            current_user.latitude,
            current_user.longitude,
            job.latitude,
            job.longitude
        )
        
        if distance <= radius:
            match_pct, matched_skills, missing_skills = calculate_skills_match(
                current_user.skills,
                job.skills_required
            )
            jobs_with_distance.append({
                'job': job,
                'distance': round(distance, 2),
                'match_percentage': match_pct,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills
            })
            
    jobs_with_distance.sort(key=lambda x: x['distance'])
    
    return render_template('search_jobs.html', jobs_with_distance=jobs_with_distance, keyword=keyword, category=category, radius=radius)

@seeker_bp.route('/jobs/map')
@login_required
@role_required('job_seeker')
def map_jobs():
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', '')
    radius = float(request.args.get('radius', 50))  # Default 50km for map view
    
    # Retrieve active job postings from the high-speed in-memory cache
    jobs = get_cached_active_jobs()
    
    # Filter in-memory
    if keyword:
        keyword_lower = keyword.lower()
        jobs = [j for j in jobs if keyword_lower in j.title.lower() or keyword_lower in j.description.lower()]
        
    if category:
        jobs = [j for j in jobs if j.category == category]
        
    jobs_with_distance = []
    for job in jobs:
        distance = calculate_distance(
            current_user.latitude,
            current_user.longitude,
            job.latitude,
            job.longitude
        )
        
        if distance <= radius:
            match_pct, matched_skills, missing_skills = calculate_skills_match(
                current_user.skills,
                job.skills_required
            )
            jobs_with_distance.append({
                'job': job,
                'distance': round(distance, 2),
                'match_percentage': match_pct,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills
            })
            
    jobs_with_distance.sort(key=lambda x: x['distance'])
    
    return render_template('map_jobs.html', jobs_with_distance=jobs_with_distance, keyword=keyword, category=category, radius=radius)

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
    
    match_percentage = None
    matched_skills = []
    missing_skills = []
    if current_user.role == 'job_seeker':
        match_percentage, matched_skills, missing_skills = calculate_skills_match(
            current_user.skills,
            job.skills_required
        )
        
    return render_template('view_job.html', job=job, distance=distance, already_applied=already_applied, is_saved=is_saved, match_percentage=match_percentage, matched_skills=matched_skills, missing_skills=missing_skills)

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


def calculate_skills_match(seeker_skills_str, job_skills_str):
    if not job_skills_str or not job_skills_str.strip():
        return 100, [], []
    if not seeker_skills_str or not seeker_skills_str.strip():
        job_skills = [s.strip() for s in job_skills_str.split(',') if s.strip()]
        return 0, [], job_skills
        
    seeker_skills = set(s.strip().lower() for s in seeker_skills_str.split(',') if s.strip())
    job_skills_list = [s.strip() for s in job_skills_str.split(',') if s.strip()]
    
    matched = []
    missing = []
    
    for s in job_skills_list:
        if s.lower() in seeker_skills:
            matched.append(s)
        else:
            missing.append(s)
            
    total = len(job_skills_list)
    match_percentage = int((len(matched) / total) * 100) if total > 0 else 100
    
    return match_percentage, matched, missing


@seeker_bp.route('/api/jobs/geocoded')
@login_required
@role_required('job_seeker')
def get_geocoded_jobs():
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', '')
    radius = float(request.args.get('radius', 25))
    
    jobs = get_cached_active_jobs()
    
    if keyword:
        keyword_lower = keyword.lower()
        jobs = [j for j in jobs if keyword_lower in j.title.lower() or keyword_lower in j.description.lower()]
        
    if category:
        jobs = [j for j in jobs if j.category == category]
        
    jobs_data = []
    for job in jobs:
        distance = calculate_distance(
            current_user.latitude,
            current_user.longitude,
            job.latitude,
            job.longitude
        )
        
        if distance <= radius:
            match_pct, matched_skills, missing_skills = calculate_skills_match(
                current_user.skills,
                job.skills_required
            )
            
            jobs_data.append({
                'id': job.id,
                'title': job.title,
                'company_name': job.employer.company_name,
                'company_logo': job.employer.company_logo or None,
                'category': job.category,
                'employment_type': job.employment_type,
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'city': job.city,
                'latitude': job.latitude,
                'longitude': job.longitude,
                'distance': round(distance, 2),
                'match_percentage': match_pct,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills
            })
            
    jobs_data.sort(key=lambda x: x['distance'])
    
    return {
        'jobs': jobs_data,
        'user': {
            'latitude': current_user.latitude,
            'longitude': current_user.longitude,
            'full_name': current_user.full_name,
            'skills': current_user.skills
        }
    }

