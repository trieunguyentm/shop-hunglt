-- Tạo database riêng cho Keycloak (app dùng database 'fashion_shop' mặc định).
-- Script này chỉ chạy 1 lần khi volume Postgres được khởi tạo lần đầu.
SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec
