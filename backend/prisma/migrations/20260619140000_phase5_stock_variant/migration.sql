-- Phase 5: nhập kho theo biến thể — thêm size/color cho chi tiết phiếu nhập
ALTER TABLE "stock_receipt_items" ADD COLUMN "size" TEXT;
ALTER TABLE "stock_receipt_items" ADD COLUMN "color" TEXT;
