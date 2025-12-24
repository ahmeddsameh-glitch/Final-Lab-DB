-- Migration: Add reviews table
-- Date: 2025-12-24
-- Description: Allows customers to rate and review books

USE bookstore;

CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL,
    customer_id BIGINT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_reviews_isbn (isbn),
    KEY idx_reviews_customer (customer_id),
    UNIQUE KEY unique_customer_book_review (customer_id, isbn),
    CONSTRAINT fk_reviews_book FOREIGN KEY (isbn) 
        REFERENCES books(isbn) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
