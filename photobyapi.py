from flask import Blueprint, request, jsonify
from clarifai.client.model import Model 
from clarifai.client.user import User # Thư viện để tạo Auth Helper
from clarifai.errors import ApiError as ClarifaiApiError # Thư viện để bắt lỗi API
import base64 
import nutrition_lookup as nl
import os

api_bp = Blueprint('api', __name__) 

# Khởi tạo Model ID
CLARIFAI_FOOD_MODEL_ID = 'food-item-recognition'

@api_bp.route('/api/photo/upload', methods=['POST'])
def upload_photo():
    f = request.files.get('photo')
    if not f:
        return jsonify({"error":"no file uploaded"}), 400
    
    # 1. Lấy Khóa PAT từ Biến Môi trường
    clarifai_pat_key = os.environ.get("CLARIFAI_PAT")
    if not clarifai_pat_key:
        return jsonify({"error":"CLARIFAI_PAT not set in environment variables."}), 500
    
    try:
        # 2. ĐỌC ẢNH VÀ CHUẨN BỊ GỌI API
        f.seek(0) 
        image_content = f.read() 

        # 3. GỌI CLARIFAI API SỬ DỤNG PHƯƠNG PHÁP XÁC THỰC CHUẨN
        
        # Khởi tạo User với PAT (Tạo Auth Helper)
        user = User(user_id="me", pat=clarifai_pat_key)
        
        # Khởi tạo Model với Auth Helper (Không truyền 'pat' trong hàm predict)
        clarifai_model = Model(
            url=f'https://clarifai.com/clarifai/main/models/{CLARIFAI_FOOD_MODEL_ID}', 
            auth_helper=user.auth_helper
        )

        response = clarifai_model.predict_by_bytes(
            input_bytes=image_content, # FIX: Sử dụng tham số input_bytes
            input_type="image",
        )
        
    except ClarifaiApiError as e:
        # Bắt lỗi kết nối/xác thực Clarifai cụ thể
        return jsonify({"error": f"LỖI CLARIFAI API: {str(e)}"}), 500
    except Exception as e:
        # Bắt lỗi logic khác
        return jsonify({"error": f"LỖI LOGIC KHÁC: {str(e)}"}), 500

    # 4. KIỂM TRA VÀ XỬ LÝ NHÃN
    labels = []
    # Mã 10000 là thành công trong Clarifai
    if response.status.code == 10000: 
        for concept in response.outputs[0].data.concepts:
            # Thu thập nhãn có độ tin cậy > 30%
            if concept.value > 0.3: 
                labels.append({
                    "description": concept.name, 
                    "score": concept.value
                })
    else:
        # Lỗi trả về từ API (ví dụ: lỗi khóa, mã lỗi khác 10000)
        return jsonify({"error": f"Clarifai API failed: {response.status.description}"}), 500
        
    # 5. TRA CỨU VÀ TẠO SUGGESTIONS (Logic Edamam/OFF của bạn)
    suggestions = []
    for l in labels:
        # Nới lỏng yêu cầu khớp từ khóa (cutoff=0.3)
        matches = nl.fuzzy_find(l['description'], n=1, cutoff=0.3) 
        for m in matches:
            suggestions.append({
                "food_id": m['id'], "name": m['name'],
                "match_label": l['description'], "label_score": l['score']
            })
            
    # 6. Xử lý dự phòng 
    if not suggestions and nl.FOODS:
        suggestions.append({
            "food_id": nl.FOODS[0]['id'], "name": nl.FOODS[0]['name'],
            "match_label": "Không tìm thấy món ăn cụ thể", "label_score": 0.5 
        })

    return jsonify({"labels": labels, "suggestions": suggestions})

@api_bp.route('/api/photo/confirm', methods=['POST'])
def confirm():
    data = request.get_json() or {}
    food_id = data.get('food_id')
    portion_g = data.get('portion_g')
    if not food_id or not portion_g:
        return jsonify({"error":"food_id and portion_g required"}), 400
    item = next((x for x in nl.FOODS if x['id'] == food_id), None)
    if not item:
        return jsonify({"error":"food not found"}), 404
        
    result = nl.compute_scaled(item, float(portion_g))
    
    # THÊM CÁC TRƯỜNG GỢI Ý VÀO KẾT QUẢ TRẢ VỀ
    result['description'] = item.get('description', 'Không có thông tin chi tiết về món ăn này.')
    result['advice'] = item.get('advice', 'Tập trung vào cân bằng các nhóm chất cơ bản.')
    
    return jsonify({"result": result})