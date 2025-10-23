# main.py
from flask import Flask, render_template, send_from_directory
from dotenv import load_dotenv
from photobyapi import api_bp
from flask_cors import CORS
import os

# Tải biến môi trường từ file .env (nếu có)
load_dotenv()

# Khởi tạo Flask, chỉ định thư mục static
# Flask tự động tìm thư mục 'templates'
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# Đăng ký các API routes (ví dụ: /api/photo/upload)
app.register_blueprint(api_bp)

# --- Các Route để phục vụ file HTML ---

# Route cho trang chủ
@app.route('/')
def index():
    return render_template('index.html')

# Route cho trang dashboard
@app.route('/dashboard.html')
def dashboard():
    return render_template('dashboard.html')

# Route cho trang login
@app.route('/login.html')
def login():
    return render_template('login.html')
# --- THÊM ROUTE CHO TRANG BLOG ---
@app.route('/blog_port.html')
def blog_post():
    return render_template('blog_port.html')
# --- THÊM 3 DÒNG SAU ĐỂ CUNG CẤP data.json ---
@app.route('/data.json')
def serve_data_json():
    # Gửi file data.json từ thư mục gốc của project
    return send_from_directory(app.root_path, 'data.json')

# --- Phần chạy server (giữ nguyên cho local testing) ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) # debug=True giúp tự khởi động lại khi sửa code