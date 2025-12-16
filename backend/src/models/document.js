import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  owner: {
    type: DataTypes.UUID,
    allowNull: false
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  applicationId: {
    type: DataTypes.UUID
  },
  accessPolicy: {
    type: DataTypes.STRING,
    defaultValue: 'view'
  },
  blockchainTxHash: {
    type: DataTypes.STRING
  },
  aesKey: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'documents',
  timestamps: true
});

export default Document;
