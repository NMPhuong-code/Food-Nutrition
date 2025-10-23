# Nutrition App - Ứng dụng Theo dõi Dinh dưỡng 

Ứng dụng web giúp người dùng theo dõi lượng calo hàng ngày, tính toán BMI, phân tích dinh dưỡng món ăn qua hình ảnh hoặc công thức, và lên kế hoạch bữa ăn.

---

## Các Tính năng chính

* **Tính toán BMI:** Ước tính chỉ số khối cơ thể và lượng calo mục tiêu hàng ngày.
* **Phân tích Ảnh:** Nhận diện món ăn qua ảnh và gợi ý thông tin dinh dưỡng (sử dụng AI Clarifai).
* **Phân tích Công thức:** Nhập thủ công các nguyên liệu và khối lượng để tính tổng dinh dưỡng.
* **Kế hoạch Bữa ăn:** Tham khảo thực đơn mẫu, tự tạo kế hoạch 7 ngày và lưu trữ cục bộ.
* **Lịch sử & Log:** Ghi lại các bữa ăn đã phân tích và theo dõi lượng calo hàng ngày.
* **Tìm kiếm Món ăn:** Tra cứu thông tin dinh dưỡng (tích hợp API Edamam & OpenFoodFacts).
* **Giao diện Guest & User:** Cho phép khách truy cập xem BMI, Admin có thể tùy chỉnh giao diện.

---

##  Công nghệ sử dụng

* **Backend:** Python, Flask
* **Frontend:** HTML, CSS, JavaScript (với Chart.js)
* **APIs:**
    * Clarifai (Nhận diện ảnh)
    * Edamam (Dữ liệu dinh dưỡng)
    * OpenFoodFacts (Dữ liệu dinh dưỡng dự phòng)
* **Deployment:** Docker

---

##  Hướng dẫn Cài đặt & Chạy (Docker)

Ứng dụng này được đóng gói bằng Docker để đảm bảo chạy nhất quán trên mọi môi trường.

### Yêu cầu cài đặt

* **Docker Desktop**: Đảm bảo bạn đã cài đặt Docker Desktop. Tải về tại [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).

### Các bước chạy

1.  **Clone Repository:**
    Sao chép mã nguồn từ GitHub về máy của bạn:
    ```bash
    git clone https://github.com/NMPhuong-code/Food-Nutrition-project.git
    ```

2.  **Cấu hình file `.env`:**
    **Quan trọng:** File `.env` đã có sẵn trong thư mục gốc. 
3.  **Build Docker Image:**
    Mở terminal trong thư mục gốc của dự án (nơi có file `Dockerfile`) và chạy lệnh:
    ```bash
    docker build -t nutrition-app .
    ```
    *(Lưu ý: Quá trình này có thể mất vài phút lần đầu tiên).*

4.  **Run Docker Container:**
    Sau khi build xong, chạy lệnh để khởi động container (lệnh này sẽ **tự động đọc file `.env`** bạn đã cấu hình):
    ```bash
    docker run -p 5000:5000 --env-file .env --name my-nutrition-container -d nutrition-app
    ```
    * `-p 5000:5000`: Ánh xạ cổng 5000 của máy bạn vào cổng 5000 bên trong container.
    * `--env-file .env`: **Đọc các biến môi trường từ file `.env`**.
    * `-d`: Chạy container ở chế độ nền.

5.  **Truy cập ứng dụng:**
    Mở trình duyệt web và truy cập vào địa chỉ:
    `http://localhost:5000`

### Dừng Container (Tùy chọn)

Để dừng container đang chạy, sử dụng lệnh:
```bash
docker stop my-nutrition-container