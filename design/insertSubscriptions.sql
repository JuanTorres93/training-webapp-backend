-- IMPORTANT: EVERY TIME A NEW SUBSCRIPTION TYPE IS ADDED, IT MUST BE INSERTED ALSO IN THE
-- truncateTable in subscriptions.js db file
INSERT INTO subscriptions (type, description, base_price_in_eur_cents, name, description_internal)
VALUES ('FREE', 'Free subscription%$Suscripción gratuita', 0, 'Free%$Gratis', 'Free subscription for selected people')
ON CONFLICT (type) DO NOTHING;

INSERT INTO subscriptions (type, description, base_price_in_eur_cents, name, description_internal)
VALUES ('FREE_TRIAL', 'Free trial subscription. Includes everything during a limited time%$Prueba gratuita. Incluye todo durante un tiempo limitado.', 0, 'Free trial%$Prueba gratuita', 'First subscription that an account is attached to. This is the lead magnet.')
ON CONFLICT (type) DO NOTHING;

INSERT INTO subscriptions (type, description, base_price_in_eur_cents, name, description_internal)
VALUES ('PAID', 'Paid subscription. Includes everything.%$Suscripción de pago. Incluye todo.', 100, 'Paid%$Pagada', 'Normal, paid subscription.') -- 1 euro
ON CONFLICT (type) DO NOTHING;