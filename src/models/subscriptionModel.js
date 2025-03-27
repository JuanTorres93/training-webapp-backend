module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      base_price_in_eur_cents: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "subscriptions", // Explicitly specify the table name
    }
  );

  // Seed default subscription types
  (async () => {
    const defaultSubscriptions = [
      {
        type: "FREE",
        description: "Free subscription",
        base_price_in_eur_cents: 0,
      },
      {
        type: "FREE_TRIAL",
        description: "Free trial subscription",
        base_price_in_eur_cents: 0,
      },
      {
        type: "PAID",
        description: "Paid subscription",
        base_price_in_eur_cents: 100,
      }, // 1 euro
    ];

    for (const subscription of defaultSubscriptions) {
      await Subscription.findOrCreate({
        where: { type: subscription.type },
        defaults: subscription,
      });
    }
  })();

  return Subscription;
};
