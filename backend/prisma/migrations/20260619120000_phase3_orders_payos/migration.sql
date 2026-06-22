-- Phase 3: bổ sung phương thức thanh toán PayOS + các trường thanh toán online

-- Thêm giá trị enum PAYOS cho PaymentMethod
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'PAYOS';

-- Bổ sung trường cho bảng payments
ALTER TABLE "payments" ADD COLUMN "payosOrderCode" INTEGER;
ALTER TABLE "payments" ADD COLUMN "checkoutUrl" TEXT;

-- Ràng buộc duy nhất cho payosOrderCode
CREATE UNIQUE INDEX "payments_payosOrderCode_key" ON "payments"("payosOrderCode");
