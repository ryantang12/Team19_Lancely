from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///chat.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ── Model ────────────────────────────────────────────────────────────────────

class Message(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    job_id      = db.Column(db.Integer, nullable=False)
    sender_id   = db.Column(db.Integer, nullable=False)
    receiver_id = db.Column(db.Integer, nullable=False)
    content     = db.Column(db.Text, nullable=False)
    timestamp   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "job_id":      self.job_id,
            "sender_id":   self.sender_id,
            "receiver_id": self.receiver_id,
            "content":     self.content,
            "timestamp":   self.timestamp.isoformat(),
        }


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/chat/send", methods=["POST"])
def send_message():
    data = request.get_json()
    required = ["job_id", "sender_id", "receiver_id", "content"]

    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
    if not data["content"].strip():
        return jsonify({"error": "Message cannot be empty"}), 400

    msg = Message(
        job_id      = data["job_id"],
        sender_id   = data["sender_id"],
        receiver_id = data["receiver_id"],
        content     = data["content"].strip(),
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Sent", "data": msg.to_dict()}), 201


@app.route("/chat/<int:job_id>", methods=["GET"])
def get_messages(job_id):
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id query param required"}), 400

    msgs = Message.query.filter(
        Message.job_id == job_id,
        db.or_(
            Message.sender_id   == user_id,
            Message.receiver_id == user_id,
        )
    ).order_by(Message.timestamp.asc()).all()

    return jsonify([m.to_dict() for m in msgs]), 200


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
