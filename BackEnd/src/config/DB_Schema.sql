CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

LOCK TABLE users IN ACCESS EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS students (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cafeteria_staff (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);


DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users' AND column_name = 'role'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM users
            WHERE role IS NULL
               OR role NOT IN ('student', 'customer', 'staff', 'cafeteria_staff')
        ) THEN
            RAISE EXCEPTION 'Unknown account roles: migration stopped without removing role';
        END IF;

        INSERT INTO students (user_id)
        SELECT id FROM users WHERE role IN ('student', 'customer')
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO staff (user_id)
        SELECT id FROM users WHERE role = 'staff'
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO cafeteria_staff (user_id)
        SELECT id FROM users WHERE role = 'cafeteria_staff'
        ON CONFLICT (user_id) DO NOTHING;

        ALTER TABLE users DROP COLUMN role;
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS menu_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_items_category_id_idx
    ON menu_items (category_id);


CREATE TABLE IF NOT EXISTS daily_queue_counters (
    order_date DATE PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number INTEGER NOT NULL CHECK (queue_number > 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'preparing', 'ready', 'picked_up')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_date, queue_number)
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx
    ON orders (user_id);

CREATE INDEX IF NOT EXISTS orders_date_status_idx
    ON orders (order_date, status);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    UNIQUE (order_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS order_items_menu_item_id_idx
    ON order_items (menu_item_id);


CREATE OR REPLACE FUNCTION assign_daily_queue_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO daily_queue_counters (order_date, last_number)
    VALUES (NEW.order_date, 1)
    ON CONFLICT (order_date)
    DO UPDATE SET last_number = daily_queue_counters.last_number + 1
    RETURNING last_number INTO NEW.queue_number;

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS orders_assign_daily_queue_number ON orders;

CREATE TRIGGER orders_assign_daily_queue_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION assign_daily_queue_number();

