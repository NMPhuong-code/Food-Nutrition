# Sử dụng một image Python chính thức làm nền
FROM python:3.11-slim

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file requirements vào thư mục làm việc
COPY requirements.txt requirements.txt

# Cài đặt các thư viện cần thiết
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ code của bạn vào thư mục làm việc
COPY . .

# Mở cổng 5000 để bên ngoài có thể truy cập
EXPOSE 5000

# Lệnh để chạy ứng dụng khi container khởi động
# Dùng gunicorn (cần thêm vào requirements.txt) hoặc waitress cho production
# Tạm thời dùng flask run cho testing
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]