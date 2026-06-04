ALTER TABLE items ADD COLUMN IF NOT EXISTS map_x NUMERIC(8,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS map_y NUMERIC(8,2) DEFAULT 0;

UPDATE items SET map_x = 120, map_y = 120 WHERE name = 'Домик №1';
UPDATE items SET map_x = 180, map_y = 140 WHERE name = 'Домик №2';
UPDATE items SET map_x = 240, map_y = 160 WHERE name = 'Домик №3';
UPDATE items SET map_x = 300, map_y = 140 WHERE name = 'Домик №4';
UPDATE items SET map_x = 120, map_y = 200 WHERE name = 'Домик №5';
UPDATE items SET map_x = 180, map_y = 220 WHERE name = 'Домик №6';
UPDATE items SET map_x = 240, map_y = 240 WHERE name = 'Домик №7';
UPDATE items SET map_x = 300, map_y = 220 WHERE name = 'Домик №8';
UPDATE items SET map_x = 380, map_y = 180 WHERE name = 'Баня на берегу';
UPDATE items SET map_x = 420, map_y = 120 WHERE name = 'Купель';
