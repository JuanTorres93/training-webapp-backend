const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
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
      name: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      description_internal: {
        type: DataTypes.TEXT,
      },
      // TODO IMPORTANT! Add this field to the PRODUCTION and dev databases
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Default to public
      },
    },
    {
      tableName: "subscriptions", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  Subscription.prototype.toJSON = function () {
    // Exclude sensitive fields from the JSON representation
    // For example, when creating a user. In that case the defaultScope seems not to be applied
    const values = { ...this.get() };
    delete values.is_public;
    delete values.description_internal;
    return values;
  };

  return Subscription;
};
