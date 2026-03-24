from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from math import radians, cos, sin, asin, sqrt

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///lancely.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class Contractor(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(100), nullable=False)
    service_area = db.Column(db.String(200))   # city or region label
    latitude     = db.Column(db.Float)
    longitude    = db.Column(db.Float)

    def to_dict(self):
        return {
            "id":           self.id,
            "name":         self.name,
            "service_area": self.service_area,
            "latitude":     self.latitude,
            "longitude":    self.longitude,
        }


# ── Helper func
def haversine(lat1, lon1, lat2, lon2):
    """Return distance in miles between two lat/lon points."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 3956 * 2 * asin(sqrt(a))


# ── Routes

# Contractor: set/update service area
@app.route("/contractor/<int:contractor_id>/location", methods=["PUT"])
def update_location(contractor_id):
    """
    PUT /contractor/<id>/location
    Body: { service_area, latitude, longitude }
    """
    c = Contractor.query.get(contractor_id)
    if not c:
        return jsonify({"error": "Contractor not found"}), 404

    data = request.get_json()
    c.service_area = data.get("service_area", c.service_area)
    c.latitude     = data.get("latitude",     c.latitude)
    c.longitude    = data.get("longitude",    c.longitude)
    db.session.commit()
    return jsonify({"message": "Location updated", "data": c.to_dict()}), 200


# Client: view a contractor's location/service area
@app.route("/contractor/<int:contractor_id>/location", methods=["GET"])
def get_location(contractor_id):
    """GET /contractor/<id>/location"""
    c = Contractor.query.get(contractor_id)
    if not c:
        return jsonify({"error": "Contractor not found"}), 404
    return jsonify(c.to_dict()), 200


# Client: filter contractors by proximity
@app.route("/contractors/nearby", methods=["GET"])
def get_nearby():
    """
    GET /contractors/nearby?lat=<lat>&lon=<lon>&radius=<miles>
    Returns contractors within radius miles of the given location.
    """
    lat    = request.args.get("lat",    type=float)
    lon    = request.args.get("lon",    type=float)
    radius = request.args.get("radius", type=float, default=25)

    if lat is None or lon is None:
        return jsonify({"error": "lat and lon are required"}), 400

    all_contractors = Contractor.query.filter(
        Contractor.latitude  != None,
        Contractor.longitude != None
    ).all()

    nearby = []
    for c in all_contractors:
        dist = haversine(lat, lon, c.latitude, c.longitude)
        if dist <= radius:
            result = c.to_dict()
            result["distance_miles"] = round(dist, 2)
            nearby.append(result)

    nearby.sort(key=lambda x: x["distance_miles"])
    return jsonify(nearby), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
