from flask import Flask, render_template
from photobyapi import api_bp # Import Blueprint

app = Flask(__name__) 
app.register_blueprint(api_bp) # Đăng ký các API routes

@app.route('/')
def index():
    return render_template('photo_interfaceusers.html')

if __name__ == '__main__':
    # Đọc cổng (port) từ biến môi trường (cần cho triển khai công khai)
    import os
    port = int(os.environ.get('PORT', 5000)) 
    # Chạy trên 0.0.0.0 để lắng nghe tất cả các giao diện
    app.run(host='0.0.0.0', port=port, debug=True)