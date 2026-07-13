# PRODUCT REQUIREMENT DOCUMENT (PRD)
# TechRetail Internal Operations System
### Hệ thống Quản lý Vận hành Nội bộ — E-commerce Operations & Management

**Phiên bản:** 2.1 — Cập nhật phân quyền & Cấu trúc phòng ban mới
**Loại dự án:** Đồ án môn học, mô phỏng chuẩn dự án doanh nghiệp thật
**Quy mô hệ thống:** 20 nhân sự, 16 tài khoản người dùng

---

## MỤC LỤC

0. Discovery — Cơ cấu tổ chức & Pain Points
1. Tổng quan dự án
2. Tech Stack & Kiến trúc
3. Design System Tokens
4. Core UI Components
5. User Roles, RBAC & Dashboard Mapping
6. MoSCoW Prioritization
7. Đặc tả trang & Business Logic
8. Database Schema
9. API Contracts
10. Non-Functional & Security Requirements
11. Vận hành & Bảo trì sau Go-live
12. Change Management & Rollout
13. Success Metrics
14. Quản lý dự án (Timeline, Feature Freeze)

---

## 0. DISCOVERY — CƠ CẤU TỔ CHỨC & PAIN POINTS

### 0.1 Cơ cấu phòng ban (20 Nhân sự - 16 Tài khoản)

Hệ thống tập trung vào lõi Vận hành Thương mại điện tử (Kinh doanh, Kho, Kế toán, Marketing và Ban Giám đốc):

| Phòng ban | Số người | Chức danh thực tế | Role hệ thống | Số tài khoản cấp |
| :--- | :---: | :--- | :--- | :---: |
| **Ban Giám đốc (BOD)** | 1 | Giám đốc / CEO | **Admin** | 1 |
| **Kinh doanh (Sales)** | 9 | 1 Trưởng phòng<br>8 Nhân viên Sales | **Manager** (Trưởng phòng)<br>**Sales Staff** (NV) | 7 (1 Manager + 6 NV, 2 NV không dùng hệ thống) |
| **Kho vận (Logistics)** | 6 | 1 Trưởng kho<br>5 Nhân viên kho | **Manager** (Trưởng kho)<br>**Warehouse Staff** (NV) | 6 (1 Manager + 5 NV) |
| **Kế toán (Finance)** | 2 | 1 Kế toán trưởng<br>1 Kế toán viên | **Accountant** | 2 |
| **Marketing** | 2 | Nhân viên Marketing | — | 0 |
| **TỔNG** | **20** | | | **16 tài khoản** |

### 0.2 Pain Points hiện tại → Feature MVP giải quyết

| Hạng mục | Cách làm hiện tại | Pain point | Feature MVP |
|---|---|---|---|
| Xử lý đơn hàng | Excel / ghi tay | Rời rạc, không biết đơn ở bước nào | Order Mgmt (Cấp quyền cả cho Sales & Kho) |
| Tồn kho | Kiểm kho cuối ngày thủ công | Bán vượt số lượng thực tế trong kho | Auto trừ kho Atomic, Kho & Sales cùng theo dõi |
| Báo cáo ca NV | Nhắn tin/Chụp màn hình | Khó đối soát, Kế toán mất công gộp | Nút "Gửi báo cáo doanh thu" (Ngày/Tuần/Tháng/Quý) |
| Phân quyền | Dùng chung 1 file Excel | Lạm quyền, lộ giá vốn/lợi nhuận | RBAC 5 role + Data Masking (Ẩn giá vốn với NV) |
| Tài chính | Cộng tay cuối tháng | Thiếu số liệu realtime | Dashboard + Finance Report + Export CSV |
| Quản lý nhân sự| Tạo thủ công từng người | Mất thời gian, lộ mật khẩu | Bulk Import + Phân quyền Manager theo phòng ban |

---

## 1. TỔNG QUAN DỰ ÁN

- **Tên dự án:** TechRetail Internal Operations System
- **Focus Phase:** MVP — E-commerce Operations & Management
- **Team Size:** 3 thành viên
- **Triết lý thiết kế:** Tối giản giao diện, ưu tiên **tính toàn vẹn dữ liệu (Data Integrity)**. Mọi logic phức tạp/phân quyền được bảo vệ nghiêm ngặt ở Backend.

---

## 2. TECH STACK & KIẾN TRÚC

- **Frontend:** React 18, Zustand, React Hook Form + Zod, Tailwind CSS.
- **Backend:** .NET Core Web API (C#), Clean Architecture.
- **Database:** PostgreSQL hoặc SQL Server, Entity Framework Core.
- **Real-time:** Polling API mỗi 30 giây cho Dashboard.

---

## 3. DESIGN SYSTEM TOKENS (Tailwind)

- **Colors:** Primary `indigo-600` | Background `slate-50` | Card `white`.
- **Soft-Delete UX:** User/Product nào có `IsActive=0` hoặc `IsDeleted=1` xuất hiện trong lịch sử **bắt buộc kèm Badge [Ngưng hoạt động]** màu đỏ-xám.

---

## 4. CORE UI COMPONENTS

- **Button:** Primary, Outline, Ghost, **Danger** (chỉ dành cho xóa/hủy).
- **Status Badge:** Emerald (Thành công), Amber (Đang xử lý), Red (Hủy), Slate (Mới tạo).
- **Data Table:** Bắt buộc có Pagination, Sort, Filter.

---

## 5. USER ROLES, RBAC & DASHBOARD MAPPING

### 5.1 Logic hiển thị Dashboard (Dynamic Routing)

- **Admin & Manager:** Hiển thị Dashboard tổng quan. Admin xem toàn cảnh tài chính (Cost/Profit). Manager xem theo phạm vi phòng ban quản lý (chỉ xem Revenue, Order Trend, Stock).
- **Accountant, Sales Staff, Warehouse Staff:** **Ẩn Dashboard tổng.** Đăng nhập xong tự động điều hướng (Redirect):
  - *Sales Staff* → `/orders` (Đơn hàng).
  - *Warehouse Staff* → `/inventory` (Kho hàng).
  - *Accountant* → `/reports/finance` (Báo cáo Kế toán).

### 5.2 Ma trận phân quyền mới (Hybrid Operations)

| Role | Khả năng tiếp cận Dashboard | Order Mgmt (Đơn hàng) | Inventory (Kho hàng) | Finance & Sales Report | Employee Mgmt (Nhân sự) |
|---|---|---|---|---|---|
| **Admin** | Toàn cảnh (Cost/Profit) | Full | Full | Full Tài chính + Export | Full (Mọi phòng ban) |
| **Manager** | Theo phòng ban (Sales/Logistics)| Full | Full | Doanh thu (Ẩn lợi nhuận) | Chỉ NV thuộc bộ phận mình |
| **Accountant**| Ẩn (Vào thẳng Báo cáo) | View | View (Ẩn giá vốn) | Full Tài chính + Export CSV| Không |
| **Sales Staff**| Ẩn (Vào thẳng Đơn hàng) | **View + Tạo + Update**| **View (Ẩn giá vốn)** | **Xem & Gửi BC Doanh thu** | Không |
| **Warehouse** | Ẩn (Vào thẳng Kho hàng) | **View + Tạo + Update**| **View + Adjust (Ẩn giá)** | **Xem & Gửi BC Doanh thu** | Không |

### 5.3 Data Masking (Bảo vệ dữ liệu nhạy cảm)

- **Warehouse Staff & Sales Staff:** Bị **ẩn hoàn toàn** các trường `CostPrice` (Giá vốn), `UnitCost`, và `TotalProfit`.
- Trong Báo cáo của nhân viên chỉ hiển thị: `TotalRevenue`, `OrderCount`, và `AverageOrderValue`.

---

## 6. MOSCOW PRIORITIZATION

**Must Have:**
- RBAC 5 role, Data Masking, Dynamic Routing.
- Quản lý Đơn hàng (Cả Sales và Kho đều có thể tạo và xử lý đơn).
- Quản lý Kho (Auto trừ kho Atomic Update).
- Báo cáo ca cho Nhân viên (Ngày/Tuần/Tháng/Quý) + Gửi báo cáo.
- Quản lý Nhân viên: Bulk Import CSV, Phân quyền Manager theo Department.

**Should Have:**
- Audit Log (SystemLogs) cho Admin.
- Advanced Filter/Search.

---

## 7. ĐẶC TẢ TRANG & BUSINESS LOGIC

### 7.1 Authentication & Security
- Khóa tài khoản 15 phút sau 5 lần đăng nhập sai.
- Mật khẩu tạm (do Manager/Admin tạo) hết hạn sau 24h. Bắt buộc đổi ở lần đăng nhập đầu.

### 7.2 Order Workflow
- Sales Staff và Warehouse Staff đều có quyền tạo đơn.
- **Trạng thái:** Pending → Confirmed (Trừ kho) → Shipped → Delivered. Hủy (Cancelled).
- Admin ép lùi trạng thái phải nhập lý do → Ghi SystemLogs.

### 7.3 Inventory & Atomic Update
- Lệnh trừ kho phải bọc trong Transaction. Cả Sales và Kho đều có thể xem số lượng tồn kho theo thời gian thực để chốt đơn.
- Warehouse có quyền Điều chỉnh kho thủ công (lưu vào `StockAdjustments`).

### 7.4 Employee Management & Role Hierarchy
- **Admin:** Thêm/sửa mọi user.
- **Manager (Trưởng phòng Sales):** Chỉ thêm/sửa/khóa user có `Role = SalesStaff` và `Department = Sales`.
- **Manager (Trưởng kho):** Chỉ thêm/sửa/khóa user có `Role = WarehouseStaff` và `Department = Logistics`.
- **Bulk Import CSV:** Bắt buộc dùng đúng template. Các phòng ban hợp lệ: `Sales`, `Logistics`, `Finance`, `Board of Directors`.
- Self-lock prevention: Không ai được tự khóa tài khoản của chính mình.

### 7.5 Phân hệ Báo cáo Doanh thu cho Nhân viên (`/reports/sales-summary`)
- Dành cho Sales Staff và Warehouse Staff chốt ca.
- **Bộ lọc:** Ngày (TODAY), Tuần, Tháng, Quý.
- **Dữ liệu hiển thị:** Tính từ các đơn `Confirmed`, `Shipped`, `Delivered`. Tuyệt đối không hiển thị giá vốn.
- **Tính năng Submit:** Nút "Gửi báo cáo doanh thu" → Ghi log hệ thống `SEND_REPORT` kèm timestamp để quản lý đối soát. Hiển thị Toast thông báo thành công.

---

## 8. DATABASE SCHEMA (Khởi tạo lõi)

```sql
-- Seed Roles Data để đảm bảo tính chuẩn xác
-- 1: Admin, 2: Manager, 3: Staff/Accountant
INSERT INTO Roles (RoleName, HierarchyLevel, Description) VALUES 
('Admin', 1, 'Ban Giám đốc - Toàn quyền hệ thống'),
('Manager', 2, 'Cấp Quản lý - Trưởng phòng Kinh doanh / Trưởng Kho'),
('Accountant', 3, 'Phòng Kế toán - Đối soát tài chính'),
('SalesStaff', 3, 'Phòng Kinh doanh - Nhân viên xử lý đơn hàng'),
('WarehouseStaff', 3, 'Phòng Kho vận - Nhân viên điều phối kho');
```

---

## 9. API CONTRACTS

### Báo cáo Nhân viên (New)

- `GET /api/reports/staff-sales?period={day|week|month|quarter}`
  - Response (Masked): Chỉ trả về Doanh thu, số đơn. Không trả lợi nhuận.
- `POST /api/reports/staff-sales/submit`
  - Body: `{ period: "day", note: "Báo cáo cuối ca" }` → Sinh SystemLog.

### Nhân viên (Employee)

- `GET /api/users` — Phải truyền RoleId người gọi để Backend chặn bớt dữ liệu (VD: Sales Manager không thấy nhân viên Logistic).
- `POST /api/users/bulk-import` — Template mới.

> Các API CRUD Orders, Products giữ nguyên, bổ sung policy check cho role.

---

## 10. NON-FUNCTIONAL & SECURITY REQUIREMENTS

- Chỉ cho phép JWT sống 8-12 tiếng.
- Role Hierarchy, Data Masking, Department Scoping bắt buộc validate ở Backend, Frontend chỉ dùng để ẩn UI.

---

## 11-14. DỰ ÁN & VẬN HÀNH

- **Week 1-2:** Setup Database + System Auth + Phân quyền Dashboard + Nhân sự (Cập nhật Hierarchy theo phòng ban).
- **Week 3-4:** Orders (Sales & Warehouse) + Inventory (Atomic Update).
- **Week 5:** Reports & Cấu trúc Báo cáo ca nhân viên (Masking Data).
- **Week 6:** Kiểm thử chặn quyền Backend (Race condition, Security). Go-live.

---

## TÓM TẮT CÁC ĐIỂM CẬP NHẬT SO VỚI PHIÊN BẢN TRƯỚC

1. **Cơ cấu tổ chức (20 nhân sự / 16 tài khoản):** Phân bổ lại chính xác số lượng tài khoản (Ban Giám đốc: 1, Sales: 7, Kho: 6, Kế toán: 2, Marketing: không dùng).
2. **Quyền hạn Dashboard (Dynamic Routing):** Nhân viên (Sales, Kho, Kế toán) bị ẩn giao diện tổng quan và được điều hướng thẳng vào màn hình làm việc tương ứng ngay sau khi đăng nhập.
3. **Quyền hạn Sales Staff & Warehouse Staff (Hybrid Operations):** Cả 2 nhóm đều có quyền tạo đơn, cập nhật trạng thái đơn hàng và kiểm tra tồn kho; đồng thời bị ẩn hoàn toàn giá vốn (Cost Price) và lợi nhuận (Profit).
4. **Phân hệ Báo cáo Doanh thu Nhân viên:** Bổ sung nghiệp vụ theo dõi doanh thu cá nhân/nhóm theo bộ lọc (Ngày/Tuần/Tháng/Quý) kèm nút gửi báo cáo để chốt ca, lưu vết vào `SystemLogs`.
5. **Role Hierarchy theo phòng ban:** Trưởng phòng Sales chỉ quản lý nhân viên Sales; Trưởng kho chỉ quản lý nhân viên Kho.