-- IMPORTANT: EVERY TIME A NEW SUBSCRIPTION TYPE IS ADDED, IT MUST BE INSERTED ALSO IN THR
-- truncateTable in subscriptions.js db file
INSERT INTO subscriptions (type, description, base_price_in_eur_cents)
VALUES ('FREE', 'Free subscription', 0)
ON CONFLICT (type) DO NOTHING;

INSERT INTO subscriptions (type, description, base_price_in_eur_cents)
VALUES ('FREE_TRIAL', 'Free trial subscription', 0)
ON CONFLICT (type) DO NOTHING;