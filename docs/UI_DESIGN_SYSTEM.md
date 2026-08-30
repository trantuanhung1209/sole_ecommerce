# UI DESIGN SYSTEM — WEBSITE BÁN GIÀY DÉP

> Tài liệu chuẩn hóa giao diện cho toàn bộ hệ thống Website bán giày dép trực tuyến.  
> **Bàn giao:** spec [§20](./SHOE_ECOMMERCE_SPECIFICATION.md#20-handover--bàn-giao-khách-hàng) · luồng FE [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md) · chạy demo [`README.md`](../README.md)
> Mục tiêu: đảm bảo các thành viên Frontend triển khai UI đồng nhất về màu sắc, typography, spacing, component, layout và trạng thái giao diện.

---

# 1. Design Direction

## 1.1 Vibe tổng thể

Phong cách chính:

```text
Premium Sneaker Store
Minimal
Modern
Sporty
Clean
High Contrast
```

Cảm giác giao diện cần đạt:

```text
- Sạch
- Hiện đại
- Mạnh mẽ
- Có cảm giác thời trang
- Tập trung vào hình ảnh sản phẩm
- Không quá nhiều màu
- Không dùng gradient quá mức
- Không tạo cảm giác giống dashboard SaaS ở khu vực storefront
```

Nguồn cảm hứng về mặt cảm giác:

```text
Nike
Adidas
New Balance
JD Sports
Sneaker Boutique
Streetwear Store
```

Lưu ý:

```text
Chỉ lấy cảm hứng về bố cục và vibe.
Không sao chép trực tiếp UI của thương hiệu khác.
```

---

# 2. Design Principles

Toàn bộ UI nên tuân thủ các nguyên tắc:

```text
01. Product First
02. Clear Hierarchy
03. Strong CTA
04. Minimal Color Usage
05. Consistent Spacing
06. Responsive First
07. Accessible Interaction
08. Reusable Components
09. Consistent States
10. Mobile Friendly
```

## 2.1 Product First

Ảnh sản phẩm là phần quan trọng nhất.

Ưu tiên:

```text
- Ảnh sản phẩm lớn
- Background sạch
- Ít text không cần thiết
- CTA rõ
- Không che ảnh bằng quá nhiều badge
```

## 2.2 Clear Hierarchy

Người dùng phải nhìn vào giao diện và biết ngay:

```text
Page Title
↓
Main Content
↓
Primary Action
↓
Secondary Information
```

---

# 3. Color System

## 3.1 Main Palette

```css
:root {
  --background: #F7F7F5;
  --surface: #FFFFFF;
  --surface-secondary: #F1F1EF;

  --text-primary: #111111;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;

  --border: #E5E7EB;
  --border-strong: #D1D5DB;

  --primary: #111111;
  --primary-hover: #292929;

  --accent: #E53935;
  --accent-hover: #C62828;

  --success: #16A34A;
  --warning: #F59E0B;
  --danger: #DC2626;
  --info: #2563EB;
}
```

---

# 4. Color Usage

Tỷ lệ màu nên giữ gần:

```text
70% White / Off-white
20% Black / Gray
10% Accent / Status Color
```

## 4.1 Background

Main background:

```text
#F7F7F5
```

Card / Modal:

```text
#FFFFFF
```

Product image background:

```text
#F1F1EF
```

---

## 4.2 Primary Color

Primary:

```text
#111111
```

Dùng cho:

```text
Primary Button
Navigation Active
Heading
Selected Filter
Selected Size
Important CTA
```

---

## 4.3 Accent Color

Accent:

```text
#E53935
```

Chỉ dùng cho:

```text
SALE
Discount
Wishlist Active
Promotion
Danger Attention
Important Highlight
```

Không dùng màu đỏ làm background chính toàn website.

---

# 5. Semantic Colors

## Success

```text
Background: #DCFCE7
Text:       #166534
Main:       #16A34A
```

Dùng cho:

```text
DELIVERED
ACTIVE
Payment Success
Success Toast
```

## Warning

```text
Background: #FEF3C7
Text:       #92400E
Main:       #F59E0B
```

Dùng cho:

```text
PENDING
Low Stock
Awaiting Payment
```

## Danger

```text
Background: #FEE2E2
Text:       #991B1B
Main:       #DC2626
```

Dùng cho:

```text
CANCELLED
DELETE
Out of Stock
Validation Error
```

## Info

```text
Background: #DBEAFE
Text:       #1E40AF
Main:       #2563EB
```

Dùng cho:

```text
CONFIRMED
Information
Processing
```

---

# 6. Typography

## Font Family

Khuyến nghị:

```text
Body:
Inter

Heading:
Inter / Manrope / Poppins
```

Nếu muốn đơn giản:

```css
font-family:
  Inter,
  system-ui,
  -apple-system,
  sans-serif;
```

---

# 7. Typography Scale

```text
Display XL      64px / 72px / 800
Display         48px / 56px / 800
H1              40px / 48px / 700
H2              32px / 40px / 700
H3              24px / 32px / 700
H4              20px / 28px / 600

Body Large      18px / 28px / 400
Body            16px / 24px / 400
Body Small      14px / 20px / 400
Caption         12px / 18px / 500
```

---

# 8. Typography Rules

```text
Hero:
48px - 64px

Page Title:
32px - 40px

Section Title:
24px - 32px

Product Name:
15px - 18px

Body:
14px - 16px

Metadata:
12px - 14px
```

Không nên:

```text
- Dùng quá 2 font-family
- Dùng quá nhiều font-weight
- Dùng text uppercase cho paragraph
```

---

# 9. Spacing System

Sử dụng hệ spacing theo bội số 4.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
80px
96px
```

Token:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

---

# 10. Layout Container

Desktop:

```text
max-width: 1200px - 1280px
```

Khuyến nghị:

```css
.container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 20px;
}
```

Mobile:

```text
padding-left: 12px - 16px
padding-right: 12px - 16px
```

---

# 11. Border Radius

```text
Button          8px
Input           8px
Select          8px
Badge           6px
Card            12px
Product Card    12px - 16px
Modal           16px
Hero Banner     20px - 28px
Drawer          16px
```

Token:

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
```

---

# 12. Shadow

Không dùng shadow quá mạnh.

Default Card:

```css
box-shadow:
  0 4px 20px rgba(0, 0, 0, 0.05);
```

Hover:

```css
box-shadow:
  0 10px 30px rgba(0, 0, 0, 0.10);
```

Modal:

```css
box-shadow:
  0 24px 60px rgba(0, 0, 0, 0.18);
```

---

# 13. Border

Default:

```text
1px solid #E5E7EB
```

Hover:

```text
#D1D5DB
```

Focus:

```text
#111111
```

---

# 14. Button System

## 14.1 Primary Button

```text
Background: #111111
Text:       #FFFFFF
Height:     44px - 48px
Radius:     8px
```

Ví dụ:

```text
ADD TO CART
CHECKOUT
SAVE
CREATE PRODUCT
```

Hover:

```text
background: #292929
```

---

## 14.2 Accent Button

```text
Background: #E53935
Text:       #FFFFFF
```

Chỉ dùng cho CTA đặc biệt:

```text
SHOP SALE
BUY NOW
PROMOTION
```

---

## 14.3 Secondary Button

```text
Background: #FFFFFF
Text:       #111111
Border:     #D1D5DB
```

---

## 14.4 Ghost Button

```text
Background: transparent
Text: #111111
```

Dùng cho:

```text
Cancel
View Details
Back
Secondary Navigation
```

---

## 14.5 Danger Button

```text
Background: #DC2626
Text: #FFFFFF
```

Dùng cho:

```text
Delete
Cancel Order khi cần cảnh báo
```

---

# 15. Button Sizes

```text
Small:
height 36px
padding 0 12px

Medium:
height 44px
padding 0 16px

Large:
height 52px
padding 0 24px
```

---

# 16. Button State

Tất cả Button phải có:

```text
Default
Hover
Active
Focus
Disabled
Loading
```

Disabled:

```css
opacity: 0.45;
cursor: not-allowed;
```

---

# 17. Input System

Input cơ bản:

```text
Height: 44px
Radius: 8px
Border: #D1D5DB
Background: #FFFFFF
Padding: 12px
```

Focus:

```text
Border: #111111
Ring: rgba(17,17,17,0.1)
```

Error:

```text
Border: #DC2626
Message: #DC2626
```

---

# 18. Input Layout

```text
Label
Input
Helper / Error Message
```

Ví dụ:

```text
Email

[ example@gmail.com           ]

Email không hợp lệ
```

---

# 19. Select

Select phải cùng chiều cao với Input:

```text
44px
```

Dùng cho:

```text
Sort
Province
District
Category
Brand
Order Status
```

---

# 20. Checkbox

Dùng cho:

```text
Filter
Remember Me
Terms
Bulk Select Admin
```

Selected:

```text
Background #111111
Check white
```

---

# 21. Radio

Dùng cho:

```text
Payment Method
Shipping Method
```

Không dùng Checkbox khi chỉ được chọn một lựa chọn.

---

# 22. Badge

## Product Badge

```text
NEW
BESTSELLER
SALE
-20%
```

Style:

```text
Font: 10px - 12px
Weight: 700
Radius: 6px
Padding: 6px 8px
```

---

# 23. Status Badge

## ACTIVE

```text
Background: #DCFCE7
Text: #166534
```

## INACTIVE

```text
Background: #F3F4F6
Text: #4B5563
```

## PENDING

```text
Background: #FEF3C7
Text: #92400E
```

## CONFIRMED

```text
Background: #DBEAFE
Text: #1E40AF
```

## SHIPPING

```text
Background: #EDE9FE
Text: #5B21B6
```

## DELIVERED

```text
Background: #DCFCE7
Text: #166534
```

## CANCELLED

```text
Background: #FEE2E2
Text: #991B1B
```

---

# 24. Header

Desktop Header:

```text
┌─────────────────────────────────────────────────────────────┐
│ LOGO      NEW  MEN  WOMEN  SNEAKERS  SALE     🔍 ♡ 👤 🛒 │
└─────────────────────────────────────────────────────────────┘
```

Config:

```text
Height: 72px - 76px
Position: sticky
Top: 0
Background: white/off-white
Border-bottom: 1px solid
```

Navigation:

```text
Font: 14px
Weight: 600
Gap: 24px - 32px
```

---

# 25. Mobile Header

```text
┌────────────────────────────┐
│ ☰     SOLE.        🔍 🛒  │
└────────────────────────────┘
```

Không hiển thị toàn bộ menu desktop trên mobile.

Menu mở bằng Drawer.

---

# 26. Hero Section

Hero có thể dùng:

```text
70vh - 85vh desktop
```

Layout:

```text
Text 50%
Image 50%
```

Ví dụ:

```text
NEW SEASON

MOVE WITH CONFIDENCE.

Premium sneakers built
for everyday motion.

[ SHOP NOW ] [ EXPLORE ]
```

Hero title:

```text
48px - 72px
```

---

# 27. Section Layout

Mỗi section:

```text
Section Label
Section Title
Optional Action
Content
```

Khoảng cách section:

```text
Desktop: 64px - 96px
Mobile: 40px - 56px
```

---

# 28. Product Card

Product Card là component quan trọng nhất.

Structure:

```text
┌────────────────────────┐
│ NEW                ♡   │
│                        │
│      PRODUCT IMAGE     │
│                        │
├────────────────────────┤
│ NIKE                   │
│ Air Max 90             │
│ Men's Shoes            │
│                        │
│ 3,290,000 ₫        [+] │
└────────────────────────┘
```

---

# 29. Product Card Image

```text
Aspect Ratio: 1:1
Background: #F1F1EF
Object-fit: cover hoặc contain
```

Hover:

```text
scale: 1.03 - 1.05
duration: 200ms - 350ms
```

---

# 30. Product Card Content

```text
Brand:
12px
uppercase
muted

Product Name:
15px - 17px
600/700

Description:
12px - 14px
muted

Price:
14px - 16px
700
```

Sale:

```text
Current Price: bold
Old Price: line-through
Discount Badge: accent
```

---

# 31. Product Grid

Desktop:

```text
4 columns
```

Tablet:

```text
3 columns
```

Mobile:

```text
2 columns
```

Gap:

```text
Desktop: 16px - 24px
Mobile: 8px - 12px
```

---

# 32. Product Listing Page

Desktop:

```text
┌──────── FILTER ────────┬────────── PRODUCTS ──────────┐
│ Category               │ 128 Products      Sort ▼    │
│ Brand                  │                             │
│ Price                  │ [ ] [ ] [ ] [ ]             │
│ Size                   │                             │
│ Color                  │ [ ] [ ] [ ] [ ]             │
└────────────────────────┴──────────────────────────────┘
```

Filter sidebar:

```text
240px - 280px
```

Product area:

```text
remaining width
```

---

# 33. Filter Component

Filter groups:

```text
Category
Brand
Price
Size
Color
Availability
```

Mỗi group:

```text
Title
Options
```

Cho phép Collapse nếu danh sách dài.

---

# 34. Size Selector

```text
[ 38 ] [ 39 ] [ 40 ]
[ 41 ] [ 42 ] [ 43 ]
```

Default:

```text
White background
Gray border
```

Selected:

```text
Black background
White text
```

Unavailable:

```text
Opacity 0.35
Disabled
Optional line-through
```

---

# 35. Color Selector

Dùng hình tròn:

```text
● ● ● ●
```

Kích thước:

```text
24px - 30px
```

Selected:

```text
outer ring
```

Có tooltip hoặc label để tránh khó hiểu.

---

# 36. Product Detail Page

Desktop:

```text
┌─────────────────────────────┬─────────────────────────┐
│                             │ Brand                   │
│        IMAGE GRID           │ Product Name            │
│                             │ Rating                  │
│ [ image ] [ image ]         │ Price                   │
│                             │                         │
│ [ image ] [ image ]         │ Color                   │
│                             │ ● ● ●                   │
│                             │                         │
│                             │ Select Size             │
│                             │ [39][40][41][42]        │
│                             │                         │
│                             │ [ ADD TO CART ]         │
│                             │                         │
│                             │ ♡ Wishlist              │
└─────────────────────────────┴─────────────────────────┘
```

Tỷ lệ:

```text
Image: 60%
Info: 40%
```

---

# 37. Product Detail Sticky Info

Desktop:

```css
position: sticky;
top: 100px;
```

Thông tin sản phẩm không cần scroll khỏi màn hình quá nhanh.

---

# 38. Product Detail Sections

Sau phần chính:

```text
Description
Product Details
Size Guide
Reviews
Related Products
Recently Viewed
```

---

# 39. Cart Page

Layout desktop:

```text
┌───────────────────────────────┬──────────────────┐
│ CART ITEMS                    │ ORDER SUMMARY    │
│                               │                  │
│ Product 1                     │ Subtotal         │
│ Product 2                     │ Discount         │
│ Product 3                     │ Shipping         │
│                               │                  │
│                               │ Total            │
│                               │                  │
│                               │ [ CHECKOUT ]     │
└───────────────────────────────┴──────────────────┘
```

Ratio:

```text
65% / 35%
```

Order Summary nên sticky.

---

# 40. Cart Item

```text
[IMAGE]

Product Name
Color / Size
Price

[-] 1 [+]

Remove
```

Không để quá nhiều button trong một Cart Item.

---

# 41. Empty Cart

Không để màn hình trắng.

Ví dụ:

```text
Your cart is empty.

Looks like you haven't added
anything yet.

[ CONTINUE SHOPPING ]
```

Có thể thêm icon/cart illustration đơn giản.

---

# 42. Checkout Page

Checkout nên tối giản hơn storefront.

Header:

```text
LOGO                          Secure Checkout 🔒
```

Không cần navigation chính.

Layout:

```text
LEFT
Shipping Address
Payment Method

RIGHT
Order Summary
```

---

# 43. Checkout Steps

Có thể dùng:

```text
1 Shipping
2 Payment
3 Review
```

Hoặc single-page checkout nếu muốn đơn giản.

---

# 44. Order Success Page

```text
✓

Order placed successfully

Order #SO-2026-000123

[ VIEW ORDER ]
[ CONTINUE SHOPPING ]
```

Không hiển thị quá nhiều thông tin.

---

# 45. Order History

Card hoặc table.

Desktop có thể dùng table:

```text
Order Code
Date
Total
Payment
Status
Action
```

Mobile:

```text
Order Card
```

---

# 46. Order Timeline

```text
●────────●────────○────────○
Ordered  Confirmed Shipping Delivered
```

Cancelled:

```text
Timeline dừng
+
Cancelled Badge
```

---

# 47. Wishlist Page

Grid tương tự Product Listing.

Cho phép:

```text
Remove Wishlist
View Product
Add to Cart / Quick Add
```

---

# 48. Login Page

Khuyến nghị:

```text
Split Layout
```

Desktop:

```text
┌─────────────────────┬───────────────────────┐
│                     │                       │
│   PRODUCT IMAGE     │ Welcome Back          │
│                     │                       │
│                     │ Email                 │
│                     │ Password              │
│                     │                       │
│                     │ [ LOGIN ]             │
└─────────────────────┴───────────────────────┘
```

Mobile:

```text
Form only
```

---

# 49. Register Page

Fields:

```text
Full Name
Email
Phone
Password
Confirm Password
```

Hiển thị validation ngay bên dưới field.

---

# 50. Profile Layout

Desktop:

```text
┌───────────────┬───────────────────────────────┐
│ Profile       │ Personal Information          │
│ Addresses     │                               │
│ Orders        │ Full Name                     │
│ Wishlist      │ Email                         │
│ Security      │ Phone                         │
│ Logout        │                               │
│               │ [ SAVE CHANGES ]              │
└───────────────┴───────────────────────────────┘
```

---

# 51. Address Card

```text
Nguyen Van A
0901234567

12 Nguyen Van Bao,
Go Vap, TP.HCM

[DEFAULT]

Edit    Delete
```

---

# 52. Review Component

Display:

```text
★★★★☆
4.0

Username
Date

Review content...
```

Form:

```text
Rating
Textarea
Submit Review
```

---

# 53. Customer Support UI

Không bắt buộc realtime.

Layout:

```text
┌──────── Conversations ──────┬──────── Messages ────────┐
│ Order #123                  │ Customer message         │
│ Product question            │ Staff message            │
│ Return request              │                          │
│                             │ [ message input ] [Send] │
└─────────────────────────────┴──────────────────────────┘
```

Mobile:

```text
Conversation List
↓
Conversation Detail Page
```

---

# 54. Admin Design Direction

Admin dùng phong cách:

```text
Clean SaaS Dashboard
Neutral
Functional
Compact
Readable
```

Không dùng hero/banner lớn trong Admin.

---

# 55. Admin Layout

```text
┌───────────────┬─────────────────────────────────────┐
│ Sidebar       │ Topbar                              │
│               ├─────────────────────────────────────┤
│ Dashboard     │                                     │
│ Products      │ Main Content                        │
│ Orders        │                                     │
│ Inventory     │                                     │
│ Customers     │                                     │
│ Promotions    │                                     │
│ Reports       │                                     │
└───────────────┴─────────────────────────────────────┘
```

---

# 56. Admin Sidebar

Width:

```text
220px - 250px
```

Background:

```text
#111827
```

Text:

```text
#D1D5DB
```

Active:

```text
Background rgba(255,255,255,.08)
Text white
```

---

# 57. Admin Main Background

```text
#F8FAFC
```

Cards:

```text
#FFFFFF
```

---

# 58. Admin Dashboard Cards

4 primary metrics:

```text
Revenue
Orders
Customers
Products
```

Example:

```text
┌─────────────────────┐
│ Total Revenue       │
│                     │
│ 126,530,000 ₫       │
│ ↑ 12.4%             │
└─────────────────────┘
```

---

# 59. Admin Dashboard Layout

```text
Metric Cards

Revenue Chart

Recent Orders

Best Selling Products

Low Stock Products
```

---

# 60. Admin Table

Structure:

```text
┌──────────────────────────────────────────────────────────┐
│ Search...                Filter       + Add Product     │
├──────────────────────────────────────────────────────────┤
│ Product    SKU      Price      Stock     Status    ...   │
├──────────────────────────────────────────────────────────┤
│ Nike...    AF001    2.5M       15        Active          │
│ Adidas...  AD001    1.9M       4         Active          │
└──────────────────────────────────────────────────────────┘
```

Không dùng border dày quanh từng cell.

Dùng:

```text
row border-bottom
hover state
comfortable padding
```

---

# 61. Admin Form

Desktop:

```text
2 columns khi hợp lý
```

Ví dụ Create Product:

```text
General Information
--------------------------------
Name
Slug
Description

Classification
--------------------------------
Category
Brand

Media
--------------------------------
Images

Variants
--------------------------------
SKU
Size
Color
Price
Stock
```

---

# 62. Modal

Dùng cho:

```text
Confirm Delete
Confirm Cancel Order
Quick Edit
Small Form
```

Không dùng Modal cho form cực dài.

Modal width:

```text
Small: 400px
Medium: 560px
Large: 720px
```

---

# 63. Drawer

Dùng cho:

```text
Mobile Navigation
Mobile Product Filters
Cart Quick View
```

---

# 64. Toast

Position:

```text
Desktop:
bottom-right

Mobile:
bottom-center
```

Types:

```text
Success
Error
Warning
Info
```

Ví dụ:

```text
✓ Added product to cart
```

---

# 65. Skeleton Loading

Dùng cho:

```text
Product Grid
Product Detail
Order Table
Dashboard Card
```

Không nên chỉ hiển thị spinner cho cả trang.

---

# 66. Empty State

Mọi danh sách cần Empty State.

Ví dụ:

```text
No orders yet

Your orders will appear here
after you make a purchase.

[ SHOP NOW ]
```

---

# 67. Error State

Ví dụ:

```text
Something went wrong

We couldn't load products.

[ TRY AGAIN ]
```

---

# 68. Pagination

Desktop:

```text
← 1 2 3 4 5 →
```

Mobile:

```text
← Previous   Next →
```

---

# 69. Breadcrumb

Ví dụ:

```text
Home / Sneakers / Nike / Air Max 90
```

Font:

```text
12px - 14px
```

Color:

```text
Muted gray
```

---

# 70. Tabs

Dùng cho:

```text
Product Description
Reviews
Order Detail
Profile Sections
```

Active:

```text
Black text
Bottom border black
```

---

# 71. Responsive Breakpoints

Khuyến nghị:

```css
Mobile:
< 768px

Tablet:
768px - 1199px

Desktop:
>= 1200px
```

Nếu dùng Tailwind:

```text
sm
md
lg
xl
2xl
```

---

# 72. Mobile Rules

Mobile phải ưu tiên:

```text
Tap target >= 44px
Text >= 14px
Button full width khi cần
Không sidebar cố định
Không table quá rộng
```

---

# 73. Mobile Product Listing

```text
Header

Product Count

[ FILTER ] [ SORT ]

2 Column Product Grid
```

Filter mở Drawer.

---

# 74. Mobile Product Detail

```text
Images
↓
Product Name
↓
Price
↓
Color
↓
Size
↓
Description
```

CTA có thể sticky bottom:

```text
Price        [ ADD TO CART ]
```

---

# 75. Mobile Cart

```text
Cart Items
↓
Promotion
↓
Order Summary
↓
Checkout Button
```

Checkout button có thể sticky dưới màn hình.

---

# 76. Animation

Duration:

```text
Fast:
150ms

Normal:
200ms - 250ms

Slow:
300ms - 400ms
```

Ease:

```css
ease
ease-out
```

---

# 77. Animation Rules

Nên animation cho:

```text
Button Hover
Product Card Hover
Product Image Hover
Modal
Drawer
Dropdown
Wishlist
Toast
```

Không dùng animation quá nhiều cho:

```text
Page Title
Paragraph
Table Row
Form Field
```

---

# 78. Icon System

Chỉ dùng một icon library.

Khuyến nghị nếu React:

```text
Lucide React
```

Ví dụ:

```text
Search
Heart
ShoppingCart
User
Menu
ChevronDown
ChevronRight
Plus
Minus
Trash
Package
Truck
Check
X
```

Không trộn nhiều bộ icon khác style.

---

# 79. Image Guidelines

Product Image:

```text
Ratio: 1:1
High resolution
Same style
Consistent background
```

Hero:

```text
16:9
3:2
hoặc custom responsive
```

Không dùng ảnh quá nén hoặc watermark.

---

# 80. Accessibility

Tối thiểu:

```text
- Button phải có label
- Image phải có alt
- Form phải có label
- Không dùng màu làm tín hiệu duy nhất
- Contrast đủ rõ
- Focus state phải nhìn thấy
- Keyboard navigation cho form/modal
```

---

# 81. Cursor

Clickable:

```css
cursor: pointer;
```

Disabled:

```css
cursor: not-allowed;
```

---

# 82. Z-Index System

```text
Base          0
Dropdown      20
Sticky Header 40
Drawer        60
Modal         80
Toast         100
```

Không tự tạo:

```text
z-index: 999999
```

nếu không cần.

---

# 83. Component Folder Structure

Nếu dùng React:

```text
src/
├── components/
│   ├── ui/
│   │   ├── Button
│   │   ├── Input
│   │   ├── Select
│   │   ├── Badge
│   │   ├── Modal
│   │   ├── Drawer
│   │   ├── Toast
│   │   ├── Pagination
│   │   └── Skeleton
│   │
│   ├── product/
│   │   ├── ProductCard
│   │   ├── ProductGrid
│   │   ├── ProductFilter
│   │   ├── SizeSelector
│   │   └── ColorSelector
│   │
│   ├── cart/
│   │   ├── CartItem
│   │   └── CartSummary
│   │
│   ├── order/
│   │   ├── OrderCard
│   │   ├── OrderStatus
│   │   └── OrderTimeline
│   │
│   └── layout/
│       ├── Header
│       ├── Footer
│       ├── Sidebar
│       └── Container
```

---

# 84. Page Structure

```text
pages/
├── Home
├── ProductList
├── ProductDetail
├── Cart
├── Checkout
├── Login
├── Register
├── Profile
├── Address
├── Wishlist
├── OrderHistory
├── OrderDetail
├── Support
│
└── admin/
    ├── Dashboard
    ├── Products
    ├── ProductForm
    ├── Categories
    ├── Brands
    ├── Orders
    ├── Inventory
    ├── Customers
    ├── Promotions
    └── Reports
```

---

# 85. CSS Variables Baseline

```css
:root {
  --background: #F7F7F5;
  --surface: #FFFFFF;
  --surface-secondary: #F1F1EF;

  --text-primary: #111111;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;

  --border: #E5E7EB;
  --border-strong: #D1D5DB;

  --primary: #111111;
  --primary-hover: #292929;

  --accent: #E53935;
  --accent-hover: #C62828;

  --success: #16A34A;
  --warning: #F59E0B;
  --danger: #DC2626;
  --info: #2563EB;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;

  --shadow-sm: 0 4px 20px rgba(0,0,0,.05);
  --shadow-md: 0 10px 30px rgba(0,0,0,.10);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

# 86. UI State Requirements

Mỗi component quan trọng phải thiết kế đủ state.

Ví dụ Button:

```text
default
hover
focus
active
disabled
loading
```

Input:

```text
default
hover
focus
filled
error
disabled
```

Product:

```text
available
low stock
out of stock
inactive
sale
new
```

Order:

```text
pending
confirmed
shipping
delivered
cancelled
```

---

# 87. Page State Requirements

Mỗi page có data phải xử lý:

```text
Loading
Success
Empty
Error
Unauthorized
Forbidden nếu cần
```

Ví dụ Product Listing:

```text
Loading:
Skeleton cards

Empty:
No products found

Error:
Retry button
```

---

# 88. Storefront vs Admin

Storefront:

```text
Image-heavy
Fashion-oriented
More whitespace
Large typography
Editorial feel
```

Admin:

```text
Compact
Information-heavy
Functional
Tables
Charts
Forms
```

Không dùng cùng một layout cho cả hai.

---

# 89. UI Naming Convention

Component:

```text
PascalCase
```

Ví dụ:

```text
ProductCard
OrderStatusBadge
SizeSelector
CartSummary
```

CSS class nếu dùng CSS module:

```text
camelCase
```

Nếu dùng CSS thuần:

```text
kebab-case
```

Ví dụ:

```text
product-card
product-card__image
product-card__title
```

---

# 90. UX Rules cho E-commerce

## Product Price

Luôn hiển thị rõ:

```text
2,990,000 ₫
```

Sale:

```text
2,390,000 ₫
2,990,000 ₫
-20%
```

---

## Stock

Không cần hiển thị:

```text
Stock = 137
```

cho user.

Có thể dùng:

```text
In Stock
Only 3 left
Out of Stock
```

---

## Add To Cart

Nếu sản phẩm có variant:

```text
Không Add To Cart khi chưa chọn Size.
```

Nếu size không khả dụng:

```text
Disable
```

---

# 91. Checkout UX Rules

Checkout phải:

```text
- Hiển thị địa chỉ
- Hiển thị item
- Hiển thị giá
- Hiển thị voucher
- Hiển thị payment method
- Hiển thị total
```

Trước khi đặt:

```text
PLACE ORDER
```

phải là CTA rõ nhất.

---

# 92. Order UX Rules

Không dùng status code kỹ thuật như:

```text
PENDING_CONFIRMATION
SHIP_PROCESSING
```

cho khách hàng.

Hiển thị:

```text
Chờ xác nhận
Đã xác nhận
Đang giao
Đã giao
Đã hủy
```

---

# 93. Admin UX Rules

Hành động nguy hiểm:

```text
Delete
Cancel Order
Lock User
```

phải có Confirm Dialog.

Ví dụ:

```text
Bạn có chắc muốn khóa tài khoản này?

[Cancel] [Lock Account]
```

---

# 94. Table Action

Không để 5 button có text trong một row.

Dùng:

```text
View
Edit
...
```

hoặc menu:

```text
⋮
```

---

# 95. Search

Search bar:

```text
Icon Search
Placeholder
Clear Button nếu có text
```

Ví dụ:

```text
Search products...
```

---

# 96. Filter UX

Desktop:

```text
Sidebar Filter
```

Mobile:

```text
Filter Button
↓
Bottom Sheet / Drawer
```

Có:

```text
Clear All
Apply Filters
```

---

# 97. Loading Interaction

Khi submit:

```text
Disable button
Show loading state
Prevent duplicate submit
```

Ví dụ:

```text
[ Creating Order... ]
```

---

# 98. Toast Convention

Success:

```text
Đã thêm sản phẩm vào giỏ hàng.
```

Error:

```text
Không thể thêm sản phẩm. Vui lòng thử lại.
```

Không dùng message quá kỹ thuật.

---

# 99. Form Error Convention

Sai:

```text
InvalidInputException
```

Đúng:

```text
Vui lòng nhập email hợp lệ.
```

---

# 100. Recommended Core Components

Dự án nên có ít nhất:

```text
Button
Input
Textarea
Select
Checkbox
Radio
Badge
Card
ProductCard
Modal
Drawer
Table
Pagination
Breadcrumb
Tabs
Toast
Skeleton
EmptyState
ErrorState
LoadingButton
SizeSelector
ColorSelector
PriceDisplay
OrderStatusBadge
OrderTimeline
```

---

# 101. Homepage Baseline

```text
Header

Hero

Shop By Category

New Arrivals

Featured Products

Brand Section

Promotion Banner

Best Sellers

Service Features

Footer
```

---

# 102. Product Page Baseline

```text
Breadcrumb

Product Image Gallery

Product Info

Price

Color Selector

Size Selector

Quantity

Add To Cart

Wishlist

Description

Reviews

Related Products
```

---

# 103. Cart Baseline

```text
Page Title

Cart Items

Promotion Code

Order Summary

Subtotal
Discount
Shipping
Total

Checkout
```

---

# 104. Checkout Baseline

```text
Shipping Address

Order Items

Promotion

Payment Method

Summary

Place Order
```

---

# 105. Admin Dashboard Baseline

```text
Sidebar
Topbar

Page Header

Metric Cards

Revenue Chart

Recent Orders

Best Sellers

Low Stock
```

---

# 106. Final Theme Baseline

```text
STYLE
Premium Sneaker Store

PRIMARY
#111111

BACKGROUND
#F7F7F5

SURFACE
#FFFFFF

ACCENT
#E53935

FONT
Inter

HEADING
Inter / Manrope / Poppins

RADIUS
8px - 16px

PRODUCT IMAGE BACKGROUND
#F1F1EF

STOREFRONT
Minimal + Fashion + Premium

ADMIN
Clean SaaS Dashboard
```

---

# 107. Definition of Done cho UI Component

Một UI component được xem là hoàn thành khi có:

```text
1. Default State
2. Hover State
3. Focus State
4. Disabled State nếu cần
5. Loading State nếu cần
6. Error State nếu có dữ liệu
7. Responsive Desktop
8. Responsive Tablet
9. Responsive Mobile
10. Không lệch design token
11. Không hard-code màu tùy tiện
12. Có accessibility cơ bản
```

---

# 108. Quy tắc dành cho thành viên Frontend

```text
- Không tự thêm màu mới nếu chưa thống nhất.
- Không tạo Button style riêng cho từng page.
- Không hard-code spacing ngẫu nhiên.
- Ưu tiên dùng component đã tồn tại.
- Không dùng nhiều icon library.
- Không dùng quá nhiều shadow.
- Không dùng gradient nếu không có lý do.
- Không để layout desktop bị vỡ trên mobile.
- Product image phải đồng nhất ratio.
- Status phải dùng đúng semantic color.
- Admin và Storefront phải giữ đúng phong cách riêng.
```

---

# 109. Checklist Review UI trước khi Merge

```text
[ ] Đúng màu Design System
[ ] Đúng font
[ ] Đúng spacing
[ ] Button đúng variant
[ ] Input đúng state
[ ] Responsive desktop
[ ] Responsive mobile
[ ] Không overflow
[ ] Không text quá nhỏ
[ ] Có loading state
[ ] Có empty state
[ ] Có error state
[ ] Có hover/focus state
[ ] Icon đồng nhất
[ ] Không duplicate component
[ ] Không hard-code giá trị style không cần thiết
```

---

# 110. Kết luận

UI của dự án được định hướng theo phong cách:

```text
Premium
Minimal
Modern
Sneaker / Streetwear
```

Storefront ưu tiên:

```text
Ảnh sản phẩm
Khoảng trắng
Typography lớn
CTA rõ
Black / White / Red Accent
```

Admin ưu tiên:

```text
Khả năng đọc
Quản lý dữ liệu
Table
Form
Dashboard
Trạng thái rõ ràng
```

Tài liệu này là baseline chung để toàn bộ thành viên Frontend phát triển UI đồng nhất và có thể dùng trực tiếp khi triển khai:

```text
Homepage
Product Listing
Product Detail
Cart
Checkout
Account
Orders
Wishlist
Support
Admin Dashboard
Admin CRUD Pages
```
