@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    query     = request.args.get('query', '')
    status    = request.args.get('status', 'open')
    city      = request.args.get('city', '').strip()
    min_b     = request.args.get('min_budget', type=float)
    max_b     = request.args.get('max_budget', type=float)
    cat_id    = request.args.get('category_id', type=int)

    q = Job.query.filter_by(status=status)

    if query:
        q = q.filter((Job.title.contains(query)) | (Job.description.contains(query)))
    if city:
        q = q.filter(Job.location_city.ilike(f'%{city}%'))
    if min_b is not None:
        q = q.filter(Job.budget_amount >= min_b)
    if max_b is not None:
        q = q.filter(Job.budget_amount <= max_b)
    if cat_id:
        q = q.filter(Job.category_id == cat_id)

    jobs = q.order_by(Job.created_at.desc()).all()

    return jsonify({'jobs': [{
        'id': j.id,
        'title': j.title,
        'description': j.description,
        'budget_amount': j.budget_amount,
        'budget_type': j.budget_type,
        'location_city': j.location_city,
        'location_state': j.location_state,
        'status': j.status,
        'is_urgent': j.is_urgent,
        'views_count': j.views_count,
        'created_at': j.created_at.isoformat(),
        'client': {'id': j.client.id, 'username': j.client.username},
        'assigned_freelancer_id': j.assigned_freelancer_id,
        'category': {'id': j.category.id, 'name': j.category.name, 'icon': j.category.icon} if j.category else None,
        'proposal_count': len(j.proposals)
    } for j in jobs]}), 200
