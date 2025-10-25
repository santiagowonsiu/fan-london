import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'product_added',
        'product_edited',
        'product_deleted',
        'product_type_updated',
        'product_type_deleted',
        'transaction_edited',
        'transaction_deleted',
        'internal_order_item_status_changed',
        'internal_order_deleted',
        'stock_reconciliation',
        'minstock_bulk_update',
        'user_created',
        'user_updated',
        'user_deleted'
      ],
      required: true
    },
    entityType: {
      type: String,
      enum: ['product', 'products', 'product_type', 'transaction', 'internal_order', 'stock_reconciliation', 'user'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    entityName: String, // Product/item name for easy reference
    details: mongoose.Schema.Types.Mixed, // Store before/after values, etc.
    justification: String, // Required for edits/deletes
    user: String, // Future: add user authentication
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ action: 1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

