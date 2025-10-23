# DÁN TOÀN BỘ KHỐI NÀY VÀO ĐẦU FILE
import json, os, requests 
from difflib import get_close_matches

# Khóa API sẽ được đọc từ Biến Môi trường của hệ thống
EDAMAM_APP_ID = os.environ.get("EDAMAM_ID")
EDAMAM_APP_KEY = os.environ.get("EDAMAM_KEY")
OFF_USER_AGENT = "NutriApp/1.0" 

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data.json')

# Khối code khởi tạo biến toàn cục
try:
    with open(DATA_PATH, encoding='utf-8') as f:
        data = json.load(f)

    # Lấy ra list các "giá trị" từ mỗi dictionary
    dishes_list = list(data.get('dishes', {}).values())
    ingredients_list = list(data.get('ingredients', {}).values())
    FOODS = dishes_list + ingredients_list

    BY_ID = {item['id']: item for item in FOODS if 'id' in item}
    BY_NAME = {item['name'].lower(): item for item in FOODS if 'name' in item}
except (FileNotFoundError, json.JSONDecodeError):
    # Nếu file data.json có vấn đề, khởi tạo các biến rỗng để chương trình không bị crash
    FOODS = []
    BY_ID = {}
    BY_NAME = {}

# --- LOGIC CACHING VÀ GỌI API BÊN NGOÀI ---

# --- LOGIC CACHING VÀ GỌI API BÊN NGOÀI ---

# THAY BẰNG HÀM NÀY
def save_data_to_cache(new_data_item):
    """Lưu dữ liệu món ăn mới vào data.json."""
    global FOODS, BY_ID, BY_NAME

    # Đọc lại toàn bộ cấu trúc dictionary từ file
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        full_data = json.load(f)

    # Thêm món ăn mới vào danh sách 'dishes'
    # Nếu chưa có 'dishes', tạo mới
    if 'dishes' not in full_data:
        full_data['dishes'] = []
    # full_data['dishes'].append(new_data_item)
    full_data['dishes'][new_data_item['id']] = new_data_item

    # Cập nhật lại các biến trong bộ nhớ
    FOODS.append(new_data_item)
    BY_ID[new_data_item['id']] = new_data_item
    BY_NAME[new_data_item['name'].lower()] = new_data_item

    # Lưu lại toàn bộ cấu trúc dictionary
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(full_data, f, ensure_ascii=False, indent=2)
# def fetch_nutrition_from_edamam(query):
#     """Gọi Edamam API (Chính)."""
#     if not EDAMAM_APP_ID or not EDAMAM_APP_KEY: return None
    
#     url = f"https://api.edamam.com/api/nutrition-data?app_id={EDAMAM_APP_ID}&app_key={EDAMAM_APP_KEY}&ingr={query}"
#     try:
#         response = requests.get(url)
#         response.raise_for_status() 
#         data = response.json()
        
#         if 'calories' in data and data['calories'] > 0:
#             return {
#                 "id": query.replace(' ', '_').lower(), "name": query,
#                 "serving_default": 100, "serving_unit": "g",
#                 "kcal_per_serving": data.get('calories', 0),
#                 "protein_g": data['totalNutrients'].get('PROCNT', {}).get('quantity', 0),
#                 "carbs_g": data['totalNutrients'].get('CHOCDF', {}).get('quantity', 0),
#                 "fat_g": data['totalNutrients'].get('FAT', {}).get('quantity', 0),
#                 "source": "Edamam"
#             }
#         return None
#     except requests.exceptions.RequestException:
#         return None

# Trong file: nutrition_lookup.py

def fetch_nutrition_from_edamam(query):
    """Gọi Edamam API (Chính)."""
    if not EDAMAM_APP_ID or not EDAMAM_APP_KEY:
        # Dòng 1: In ra nếu không tìm thấy key
        print("LỖI NGHIÊM TRỌNG: Không tìm thấy EDAMAM_ID hoặc EDAMAM_KEY trong file .env!") 
        return None
    
    url = f"https://api.edamam.com/api/nutrition-data?app_id={EDAMAM_APP_ID}&app_key={EDAMAM_APP_KEY}&ingr={query}"
    
    try:
        # Thêm timeout=10 (cho phép đợi 10 giây)
        response = requests.get(url, timeout=10) 
        response.raise_for_status() 
        data = response.json()
        
        if 'calories' in data and data['calories'] > 0:
            print(f"THÀNH CÔNG: Edamam đã tìm thấy dữ liệu cho '{query}'.") # Báo thành công
            return {
                "id": query.replace(' ', '_').lower(), "name": query,
                "serving_default": 100, "serving_unit": "g",
                "kcal_per_serving": data.get('calories', 0),
                "protein_g": data['totalNutrients'].get('PROCNT', {}).get('quantity', 0),
                "carbs_g": data['totalNutrients'].get('CHOCDF', {}).get('quantity', 0),
                "fat_g": data['totalNutrients'].get('FAT', {}).get('quantity', 0),
                "source": "Edamam"
            }
        print(f"CẢNH BÁO: Edamam không tìm thấy calo cho '{query}', chuyển qua OpenFoodFacts.")
        return None
    except requests.exceptions.RequestException as e:
        # Dòng 2: Đây là dòng quan trọng nhất, nó sẽ in ra LÝ DO THẤT BẠI
        print(f"LỖI KHI GỌI EDAMAM: {e}") 
        return None
def fetch_nutrition_from_openfoodfacts(query):
    """Gọi OpenFoodFacts API (Dự phòng)."""
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1"
    headers = {'User-Agent': OFF_USER_AGENT}
    try:
        # Thêm timeout (ví dụ: 10 giây)
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        for product in data.get('products', []):
            if 'nutriments' in product and 'energy-kcal_100g' in product['nutriments']:
                nutr = product['nutriments']
                print(f"THÀNH CÔNG: OpenFoodFacts đã tìm thấy '{product.get('product_name', query)}'.") # Báo thành công
                return {
                    "id": query.replace(' ', '_').lower(), "name": product.get('product_name', query),
                    "serving_default": 100, "serving_unit": "g",
                    "kcal_per_serving": nutr.get('energy-kcal_100g', 0),
                    "protein_g": nutr.get('proteins_100g', 0),
                    "carbs_g": nutr.get('carbohydrates_100g', 0),
                    "fat_g": nutr.get('fat_100g', 0),
                    "source": "OpenFoodFacts"
                }
        print(f"CẢNH BÁO: OpenFoodFacts cũng không tìm thấy calo cho '{query}'.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"LỖI KHI GỌI OPENFOODFACTS: {e}")
        return None
    
# Trong file: nutrition_lookup.py

def fuzzy_find(label, n=3, cutoff=0.5):
    """Tìm kiếm phân cấp MỚI: Edamam -> OpenFoodFacts -> Cache."""

    # 1. Ưu tiên gọi Edamam (Chính)
    print(f"Đang tìm '{label}' trên Edamam...") # Thêm log để theo dõi
    new_item = fetch_nutrition_from_edamam(label)
    if new_item:
        save_data_to_cache(new_item) # Lưu vào cache nếu thành công
        return [new_item]

    # 2. Nếu Edamam không có, gọi OpenFoodFacts (Dự phòng 1)
    print(f"Không thấy trên Edamam, đang tìm '{label}' trên OpenFoodFacts...") # Thêm log
    new_item = fetch_nutrition_from_openfoodfacts(label)
    if new_item:
        save_data_to_cache(new_item) # Lưu vào cache nếu thành công
        return [new_item]

    # 3. Nếu cả 2 API đều không có, MỚI tìm trong Cache (data.json - Dự phòng 2)
    print(f"Không thấy trên API, đang tìm '{label}' trong cache (data.json)...") # Thêm log
    keys = list(BY_NAME.keys()) + list(BY_ID.keys())
    # Dùng cutoff chặt hơn (0.6) khi tìm trong cache để tránh khớp nhầm
    matches = get_close_matches(label.lower(), keys, n=n, cutoff=0.6)

    results = []
    for m in matches:
        if m in BY_ID: results.append(BY_ID[m])
        elif m in BY_NAME: results.append(BY_NAME[m])

    if results:
        print(f"Đã tìm thấy '{label}' trong cache.") # Thêm log
        return results

    # Không tìm thấy ở đâu cả
    print(f"Không tìm thấy '{label}' ở đâu cả.") # Thêm log
    return []
# Dán hàm này vào cuối file nutrition_lookup.py

def compute_scaled(item, portion_g):
    """Tính toán lại dinh dưỡng theo khẩu phần (ĐÃ SỬA LỖI CHIA CHO 0)."""
    # Lấy serving_default, mặc định là 100 nếu không có hoặc không hợp lệ
    try:
        serving = float(item.get('serving_default', 100))
        if serving <= 0: # Kiểm tra nếu serving là 0 hoặc số âm
             print(f"CẢNH BÁO: 'serving_default' không hợp lệ ({serving}) cho item '{item.get('id', 'N/A')}'. Sử dụng mặc định 100g.")
             serving = 100.0 # Đặt lại giá trị mặc định an toàn
    except (ValueError, TypeError):
         print(f"CẢNH BÁO: 'serving_default' không phải là số cho item '{item.get('id', 'N/A')}'. Sử dụng mặc định 100g.")
         serving = 100.0 # Đặt lại giá trị mặc định an toàn

    # Tính factor một cách an toàn
    # Chuyển portion_g thành float trước khi chia
    try:
        portion_float = float(portion_g)
    except (ValueError, TypeError):
        print(f"CẢNH BÁO: 'portion_g' không hợp lệ ({portion_g}). Sử dụng giá trị 0.")
        portion_float = 0.0 # Đặt giá trị mặc định an toàn nếu portion_g không hợp lệ

    factor = portion_float / serving

    return {
        "id": item.get('id', 'N/A'),
        "name": item.get('name', 'N/A'),
        "portion_g": portion_float, # Trả về giá trị float đã chuyển đổi
        "kcal": round(item.get('kcal_per_serving', 0) * factor, 1),
        "protein_g": round(item.get('protein_g', 0) * factor, 1),
        "carbs_g": round(item.get('carbs_g', 0) * factor, 1),
        "fat_g": round(item.get('fat_g', 0) * factor, 1),
        "is_estimate": item.get('is_estimate', True)
    }