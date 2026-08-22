# Plan: Thay thế Code Evaluation bằng Secure Parser trong Form Engine

Thay thế `new Function()` bằng một parser AST giới hạn để ngăn chặn tấn công thực thi mã từ xa (RCE) qua các công thức biểu mẫu.

## User Review Required

> [!IMPORTANT]
> Việc thay thế này sẽ loại bỏ hoàn toàn khả năng thực thi code JavaScript tùy ý trong các công thức. Chỉ các biểu thức toán học và logic cơ bản được hỗ trợ.

- **Các biểu thức được hỗ trợ:** `+`, `-`, `*`, `/`, `( )`, `<` `<=`, `>`, `>=`, `==`, `!=`, `&&`, `||`, `!`, `true`, `false`, `null`, số, chuỗi, và tham chiếu `{field_key}`.
- **Bị cấm:** Truy cập thuộc tính (`obj.prop`), gọi hàm (`func()`), gán giá trị, truy cập global (`window`, `process`).

## Proposed Changes

### 1. Tạo Parser An Toàn (`src/lib/mirats/expression-parser.ts`)
- Triển khai một parser đơn giản hoặc dùng thư viện nhỏ (như `jsep` hoặc parser thủ công) để chuyển biểu thức thành AST.
- Thực thi AST (evaluate) với context là `values` của form.
- Giới hạn độ sâu của cây (tránh stack overflow) và số lượng node (tránh DoS).

### 2. Cập nhật `src/lib/mirats/form-visibility.ts`
- Loại bỏ `new Function()` trong `evalFormula` và `evalPredicate`.
- Sử dụng `evaluateExpression` từ parser mới.
- Đảm bảo tính tương thích với các công thức hiện tại.

### 3. Verification & Guardrails
- **Kiểm tra Payload độc hại:** Viết test suite thử nghiệm các chuỗi thoát hiểm, truy cập constructor, global objects.
- **Kiểm tra Edge cases:** Chia cho 0, field thiếu, chuỗi Unicode, thứ tự ưu tiên toán tử (precedence).
- **Kiểm tra tính tương thích:** Đảm bảo các công thức nghiệp vụ hiện tại vẫn hoạt động đúng.

## Technical Details

- **Grammar hữu hạn:**
    - Literal: `123`, `true`, `false`, `"string"`, `null`.
    - References: `{key}` sẽ được thay thế bởi giá trị từ form.
    - Toán tử toán học: `+`, `-`, `*`, `/`.
    - Toán tử so sánh: `==`, `!=`, `<`, `<=`, `>`, `>=`.
    - Toán tử logic: `&&`, `||`, `!`.
- **Giới hạn an toàn:**
    - `MAX_EXPRESSION_LENGTH = 1000` ký tự.
    - `MAX_AST_NODES = 100`.
    - `MAX_NESTING_DEPTH = 10`.
- **Fail-safe:** Mọi lỗi parse hoặc execute đều trả về `null` (không hợp lệ) thay vì throw hoặc thực thi fallback nguy hiểm.

## Trình tự thực hiện
1. Viết Integration Test (RED) mô phỏng các đợt tấn công qua công thức.
2. Xây dựng bộ Parser & Evaluator thuần túy trong `expression-parser.ts`.
3. Thay thế logic trong `form-visibility.ts`.
4. Chạy lại toàn bộ test suite để đạt GREEN.
