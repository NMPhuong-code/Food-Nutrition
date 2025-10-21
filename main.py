from flask import Flask, render_template
from photobyapi import api_bp # Import Blueprint
from flask_cors import CORS   # <-- 1. THÊM DÒNG NÀY

# 1. Khởi tạo app MỘT LẦN DUY NHẤT
app = Flask(__name__) 

# 2. Bật CORS cho app đó
CORS(app) 

# 3. Đăng ký các API routes vào app đó
app.register_blueprint(api_bp)
@app.route('/')
def index():
    return render_template('photo_interfaceusers.html')

if __name__ == '__main__':
    # Đọc cổng (port) từ biến môi trường (cần cho triển khai công khai)
    import os
    port = int(os.environ.get('PORT', 5000)) 
    # Chạy trên 0.0.0.0 để lắng nghe tất cả các giao diện
    app.run(host='0.0.0.0', port=port, debug=True)