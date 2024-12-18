INSERT INTO subscriptions (type, description, base_price_in_eur_cents)
VALUES ('FREE', 'Free subscription', 0)
ON CONFLICT (type) DO NOTHING;