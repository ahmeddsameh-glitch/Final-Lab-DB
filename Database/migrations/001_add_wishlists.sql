-- Migration: Add wishlists table
-- Date: 2025-12-24
-- Description: Allows customers to save books for later

USE bookstore;

CREATE TABLE IF NOT EXISTS wishlists (
    customer_id BIGINT NOT NULL,
    isbn CHAR(13) NOT NULL,
    added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, isbn),
    KEY fk_wishlists_isbn (isbn),
    CONSTRAINT fk_wishlists_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_book FOREIGN KEY (isbn) 
        REFERENCES books(isbn) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
