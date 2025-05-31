// Seed default subscription types
// TODO Substitue %$ with variable defined in config
exports.initSubscriptions = async (SubscriptionModel) => {
  const defaultSubscriptions = [
    {
      type: "FREE",
      description: "Free subscription%$Suscripción gratuita",
      base_price_in_eur_cents: 0,
      name: "Free%$Gratis",
      description_internal: "Free subscription for selected people",
    },
    {
      type: "FREE_TRIAL",
      description:
        "Free trial subscription. Includes everything during a limited time%$Prueba gratuita. Incluye todo durante un tiempo limitado.",
      base_price_in_eur_cents: 0,
      name: "Free trial%$Prueba gratuita",
      description_internal:
        "First subscription that an account is attached to. This is the lead magnet.",
    },
    {
      type: "PAID",
      description:
        "Paid subscription. Includes everything.%$Suscripción de pago. Incluye todo.",
      base_price_in_eur_cents: 100,
      name: "Paid%$Pagada",
      description_internal: "Normal, paid subscription.",
    }, // 1 euro
    {
      type: "EXPIRED",
      description: "Expired subscription%$Suscripción caducada",
      base_price_in_eur_cents: 0,
      name: "Expired%$Caducada",
      description_internal: "Expired subscription",
    },
  ];

  for (const subscription of defaultSubscriptions) {
    await SubscriptionModel.findOrCreate({
      where: { type: subscription.type },
      defaults: subscription,
    });
  }
};
