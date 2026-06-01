CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('house', 'sauna', 'tub')),
    price_per_night NUMERIC(10,2) NOT NULL,
    max_guests INTEGER NOT NULL DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    photo_url TEXT
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    total_price NUMERIC(10,2) NOT NULL,
    is_manual_override BOOLEAN DEFAULT FALSE,
    guest_name TEXT,
    guest_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (start_date < end_date)
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    bepaid_uid TEXT UNIQUE,
    tracking_id TEXT,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('successful', 'failed', 'incomplete')),
    payment_type TEXT CHECK (payment_type IN ('card', 'erip')),
    raw_response TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_item_dates ON bookings(item_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_bepaid_uid ON payments(bepaid_uid);

-- Seed data: 8 houses, 1 sauna, 1 tub
INSERT INTO items (name, type, price_per_night, max_guests, description) VALUES
('Домик №1', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №2', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №3', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №4', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №5', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №6', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №7', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Домик №8', 'house', 150.00, 4, 'Уютный деревянный домик с террасой'),
('Баня на берегу', 'sauna', 80.00, 6, 'Русская баня на дровах с выходом к воде'),
('Купель', 'tub', 40.00, 4, 'Одноразовая аренда купели');
