ALTER TABLE salons
ADD COLUMN salon_image_url TEXT,
ADD COLUMN stripe_customer_id VARCHAR(255),
ADD COLUMN subscription_status VARCHAR(50);