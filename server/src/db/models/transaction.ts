'use strict';
import { Model } from 'sequelize';

interface transcationAttributes {
  amount: number;
  to: string;
  from: string;
  meta: string;
  status: string;
}

module.exports = (sequelize: any, DataTypes: any) => {
  class Transaction extends Model<transcationAttributes> implements transcationAttributes {
    amount!: number
    to!: string;
    from!: string;
    meta!: string;
    status!: string

    static associate(models: any) {
    Transaction.belongsTo(models.User);
  };
}


  Transaction
    .init(
      {
        amount: {
          type: DataTypes.DECIMAL(),
          allowNull: false,
        },
        to: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        from: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        meta: {
          type: DataTypes.STRING(2000),
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Transaction',
      }
    );
  return Transaction;
}