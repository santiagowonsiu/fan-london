'use client';

import { useState } from 'react';

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 'items',
      title: '📦 Items & Products',
      icon: '📦',
      questions: [
        {
          q: 'How do I add a new product?',
          a: 'Go to Items → Product List and click the "Add Item" button. Select a type from the dropdown and enter the product name. You can also upload a product image. Note: You must create product types first in the Product Types page before adding products.'
        },
        {
          q: 'What are Product Types and why do I need them?',
          a: 'Product Types are categories that organize your inventory (e.g., Dairy, Seafood, Oils). They help with filtering, reporting, and organization. You MUST create types first in Items → Product Types before you can add products.'
        },
        {
          q: 'Can I create a new product type while adding a product?',
          a: 'No. To maintain consistency and prevent duplicate/misspelled types, you must create all product types in the Items → Product Types page first. This ensures clean data and proper organization.'
        },
        {
          q: 'What happens if I have products without a type assigned?',
          a: 'Products without types will show in a warning box at the top of the Product Types page. You should assign them to a category for proper organization. Click "Assign Type →" next to each unassigned product to fix this.'
        },
        {
          q: 'Can I delete a product type?',
          a: 'You can only delete a product type if no products are currently using it. If products are assigned to that type, you must reassign them first or archive/delete those products.'
        },
        {
          q: 'What is Base Content and Purchase Pack?',
          a: 'Base Content is the individual unit size (e.g., 1 liter bottle). Purchase Pack is how you buy it (e.g., "1 box of 12 bottles"). This helps calculate stock in both individual units and packages.'
        },
        {
          q: 'How do I add a product image?',
          a: 'When adding or editing a product, click "Upload Image" and select a photo. You can crop it to a square format (800x800px). Images are stored in Cloudinary and will be displayed in the product list.'
        },
        {
          q: 'What does "Inactive Products" mean?',
          a: 'Products that haven\'t had any inventory movements (input/output) in the last 30 days. The system suggests you review them and consider archiving to keep your active inventory clean.'
        },
        {
          q: 'Should I delete inactive products or archive them?',
          a: 'Archive them! Archiving preserves historical data and movement records. You can always unarchive later if needed. Deleting removes all history permanently.'
        }
      ]
    },
    {
      id: 'stock',
      title: '📊 Stock Management',
      icon: '📊',
      questions: [
        {
          q: 'How do I record inventory movements?',
          a: 'Go to Stock → Inventory Movements and click "New Movement". Select Input (receiving stock) or Output (using stock), search for the product, enter quantity, take a photo, and add the person\'s name. The photo is mandatory.'
        },
        {
          q: 'Why is a photo required for each movement?',
          a: 'Photos provide visual proof of transactions, help with accountability, and make it easier to verify movements later. They\'re displayed in the movement logs and can be clicked to enlarge.'
        },
        {
          q: 'Can I enter quantity in units or packages?',
          a: 'Both! When recording a movement, you can toggle between "base content" (individual units like liters) or "purchase pack" (packages/boxes). The system automatically converts between them based on your product settings.'
        },
        {
          q: 'What is Current Stock and how is it calculated?',
          a: 'Current Stock shows the real-time inventory level for each product. It\'s calculated by: Starting stock + All inputs - All outputs. You can view it in Stock → Current Stock, with both pack quantities and base units.'
        },
        {
          q: 'What is Min Stock and how do I use it?',
          a: 'Min Stock is the minimum quantity you want to maintain for each product (in pack units). When current stock falls below this level, the system flags it as "needs to buy" in the Current Stock tab.'
        },
        {
          q: 'How do I set or change Min Stock levels?',
          a: 'You can edit Min Stock in Product List (when in Edit Mode) or during a Stock Reconciliation. Simply enter the desired minimum quantity in pack units.'
        },
        {
          q: 'What is Stock Reconciliation?',
          a: 'Stock Reconciliation lets you correct inventory levels based on a physical count. It overrides all past calculations up to the reconciliation date, while preserving movements that occurred after.'
        },
        {
          q: 'How do I perform a Stock Reconciliation?',
          a: '1. Go to Stock → Current Stock and click "📊 Stock Reconciliation". 2. Download the CSV template. 3. Physically count your inventory. 4. Fill in either "Pack Stock" OR "Base Stock" columns. 5. Upload the completed CSV with the count date/time. The system will automatically adjust your stock levels.'
        },
        {
          q: 'Can I edit Min Stock during reconciliation?',
          a: 'Yes! The CSV template includes a "Min Stock (Editable)" column pre-filled with current values. You can change these values, and the system will update them and log all changes in the Activity Log.'
        },
        {
          q: 'What happens to movements after a reconciliation date?',
          a: 'They remain valid! Reconciliation only adjusts stock up to the selected date/time. Any movements recorded after that date will still affect the current stock calculation.'
        },
        {
          q: 'Can I view movement history by order?',
          a: 'Yes! In Inventory Movements, switch to "Order-based" view. This groups all items from the same transaction into one row, showing a single photo per order. Click to expand and see individual items.'
        }
      ]
    },
    {
      id: 'internal-orders',
      title: '🏪 Internal Orders',
      icon: '🏪',
      questions: [
        {
          q: 'What are Internal Orders?',
          a: 'Internal Orders are requests from your departments (Kitchen, Bar, FOH) for products they need. They help you track what needs to be purchased and manage purchasing workflow.'
        },
        {
          q: 'How do I create an Internal Order?',
          a: 'Click "Add Internal Order", select the department, add items with quantities, and submit. The system will check if you have stock or if items need to be purchased.'
        },
        {
          q: 'What do the item status icons mean?',
          a: '• Pending: Not yet assigned to a purchase order\n• Assigned to Order: Added to an external order but not submitted\n• Assigned & Submitted: In an external order that\'s been sent to supplier\n• Rejected: Item request was declined'
        },
        {
          q: 'How do I assign items to a supplier order?',
          a: 'Click the item status icon, select "Assign to Order", choose a supplier, and optionally add notes. The system will either add it to an existing pending order for that supplier or create a new one.'
        },
        {
          q: 'Can I delete an item from an internal order?',
          a: 'Yes, in Edit Mode. Click the delete icon for the item. You\'ll need to confirm and provide a justification. The deletion will be logged in Activity Log.'
        },
        {
          q: 'Can I delete an entire internal order?',
          a: 'Yes, but with caution! Delete buttons appear in Edit Mode. You must confirm and justify the deletion. All items and details will be logged in Activity Log for audit purposes.'
        },
        {
          q: 'What happens when an order is completed?',
          a: 'Completed orders are grayed out in the list. They remain visible for record-keeping but can\'t be edited. You can filter to hide completed orders if desired.'
        },
        {
          q: 'How are orders grouped (Morning/Afternoon/Today)?',
          a: 'Orders are automatically grouped by their creation time: Morning (before 3 PM), Afternoon (3 PM - midnight), and "Today" for the current day\'s group. This helps organize daily order flows.'
        }
      ]
    },
    {
      id: 'purchasing',
      title: '💰 Purchasing',
      icon: '💰',
      questions: [
        {
          q: 'What\'s the difference between External Orders and Direct Purchases?',
          a: 'External Orders are created from Internal Orders and track items ordered from suppliers. Direct Purchases are standalone purchases (not linked to internal requests) like equipment, supplies, or ad-hoc items.'
        },
        {
          q: 'How do External Orders get created?',
          a: 'They\'re created automatically when you assign items from Internal Orders to a supplier. Items for the same supplier (in "pending" status) are grouped into one external order.'
        },
        {
          q: 'What are the External Order statuses?',
          a: '• Pending: Order created but not sent to supplier\n• Submitted: Order sent to supplier, awaiting delivery\n• Received: Items delivered and received\n\nStatus changes are logged in Activity Log.'
        },
        {
          q: 'How do I record costs for External Orders?',
          a: 'Edit the order and enter either: 1) Cost per unit (total calculates automatically), or 2) Total cost (unit cost calculates automatically). All costs should be WITHOUT VAT.'
        },
        {
          q: 'How do I upload invoices or receipts?',
          a: 'Use the "Add Invoice" or "Add Receipt" button. You can upload images (JPG, PNG) or PDFs. The file will be stored in Cloudinary and you can view or download it anytime.'
        },
        {
          q: 'What is Personal Expenses and how is it different?',
          a: 'Personal Expenses track purchases made by employees using personal money, which need reimbursement or payroll deduction. It includes special tracking for VAT, payroll discounts, and reimbursement status.'
        },
        {
          q: 'How do expense types work?',
          a: 'When creating a Personal Expense, select:\n• Reimbursement: Company owes money to employee\n• Payroll Discount: Deduct from employee\'s salary\n• Both: Discount from payroll AND reimburse the difference\n\nThe system shows relevant fields based on your selection.'
        },
        {
          q: 'How do I track VAT in Personal Expenses?',
          a: 'Enter "Total Amount" (with VAT) and "VAT Amount" separately. The system calculates a "Suggested Discount" (Total - VAT) which is typically what\'s deducted from payroll, since VAT stays with the company.'
        },
        {
          q: 'How do I update expense status (paid/discounted)?',
          a: 'Expand the expense card and click "Edit Status". You can update:\n• Payroll Discount Status (with month/year)\n• Reimbursement Status (with date, amount, transaction ID)\n• Upload proof of reimbursement\nAll changes are logged.'
        },
        {
          q: 'What is Purchasing Summary?',
          a: 'A consolidated view of ALL spending: External Orders, Direct Purchases, and Personal Expenses. Filter by date, status, or type to analyze spending patterns and track total costs.'
        }
      ]
    },
    {
      id: 'suppliers',
      title: '🚚 Suppliers',
      icon: '🚚',
      questions: [
        {
          q: 'How do I add a new supplier?',
          a: 'Go to Suppliers and click "Add Supplier". Enter name, email, contact number, and select which product types they supply. You can also mark if they\'re order-related, expense-related, or both.'
        },
        {
          q: 'What\'s the difference between order-related and expense-related suppliers?',
          a: 'Order-related suppliers provide inventory products (linked to external orders). Expense-related suppliers provide services, equipment, or non-inventory items (used in direct purchases). A supplier can be both.'
        },
        {
          q: 'What are Product Types in supplier settings?',
          a: 'Product Types show which categories of products a supplier provides (e.g., "Seafood", "Dairy"). This helps when assigning internal order items to suppliers - the system can suggest appropriate suppliers.'
        },
        {
          q: 'Can I add order notes for suppliers?',
          a: 'Yes! Each supplier has an "Order Notes" field for special instructions like "Call before delivery", "Weekend delivery only", or "Minimum order $100". These notes appear when creating orders.'
        }
      ]
    },
    {
      id: 'activity',
      title: '📝 Activity Log',
      icon: '📝',
      questions: [
        {
          q: 'What is the Activity Log?',
          a: 'A complete audit trail of ALL changes in the system: products added/edited/deleted, transactions modified, internal orders status changes, stock reconciliations, and more. Every significant action is logged with timestamp, user, and details.'
        },
        {
          q: 'Can I filter the Activity Log?',
          a: 'Yes! Filter by:\n• Date range\n• Entity type (Products, Transactions, Internal Orders, etc.)\n• Action type (created, updated, deleted, etc.)\n\nYou can also search by entity name.'
        },
        {
          q: 'Why do some actions require justification?',
          a: 'Sensitive actions like deleting transactions, editing past movements, or removing orders require justification for accountability. This creates a paper trail and helps prevent accidental or unauthorized changes.'
        },
        {
          q: 'How long is activity data kept?',
          a: 'Indefinitely! Activity logs are permanent records for audit and compliance purposes. You can paginate through historical data (25, 50, or 100 entries per page).'
        },
        {
          q: 'What happens when I do a Stock Reconciliation?',
          a: 'The Activity Log shows: 1) Main reconciliation entry with summary stats, 2) Separate entry for Min Stock changes (if any), 3) Link to detailed reconciliation report showing all adjusted/unchanged/invalid items.'
        }
      ]
    },
    {
      id: 'best-practices',
      title: '⭐ Best Practices',
      icon: '⭐',
      questions: [
        {
          q: 'How often should I do Stock Reconciliation?',
          a: 'Recommended: Weekly for high-turnover items, monthly for all items. This catches discrepancies early and maintains accurate inventory levels. Always reconcile after major events (inventory, catering, etc.).'
        },
        {
          q: 'What\'s the best workflow for Internal Orders?',
          a: '1. Departments submit orders daily (morning/afternoon)\n2. Manager reviews and assigns to suppliers\n3. External orders are compiled and sent\n4. When items arrive, mark as "Received"\n5. Record stock Input movement\n\nThis ensures full traceability from request to receipt.'
        },
        {
          q: 'Should I archive or delete products?',
          a: 'ALWAYS archive! Archiving:\n• Preserves historical data\n• Keeps movement records\n• Allows reactivation if needed\n• Maintains reporting accuracy\n\nDelete only duplicate/test entries.'
        },
        {
          q: 'How do I handle seasonal products?',
          a: 'Keep them in the system but set Min Stock to 0 during off-season. When season starts, update Min Stock. The "Inactive Products" notification helps identify seasonal items to review.'
        },
        {
          q: 'What should I photograph for movements?',
          a: 'Photos should show:\n• The actual items (boxes, bottles, etc.)\n• Quantity visible if possible\n• Delivery receipt/invoice (for inputs)\n• Context (location, date note)\n\nGood photos = better accountability and easier auditing.'
        },
        {
          q: 'How do I train new staff on the system?',
          a: '1. Start with Product List (viewing only)\n2. Practice recording movements\n3. Show how to check Current Stock\n4. Explain Min Stock alerts\n5. Teach Internal Order creation\n6. Grant edit access only after proficiency\n\nUse Activity Log to monitor early actions.'
        },
        {
          q: 'What if I make a mistake in a movement?',
          a: 'Use "Edit Mode" in Inventory Movements to modify or delete. You MUST provide justification, which gets logged. Alternatively, create a correcting movement with clear observations.'
        },
        {
          q: 'How do I prepare for a busy service?',
          a: '1. Check Current Stock vs Min Stock\n2. Review pending Internal Orders\n3. Ensure External Orders are received\n4. Have departments submit orders early\n5. Record all prep movements\n6. Brief team on new items/stock levels'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: '🔧 Troubleshooting',
      icon: '🔧',
      questions: [
        {
          q: 'Stock levels don\'t look right. What should I check?',
          a: '1. Review recent movements in Inventory Movements\n2. Check for movements with wrong quantities\n3. Look for duplicate entries\n4. Verify last reconciliation date\n5. Perform a new reconciliation to reset\n\nUse Activity Log to trace changes.'
        },
        {
          q: 'I can\'t add a product - type dropdown is empty',
          a: 'You need to create Product Types first! Go to Items → Product Types and add your categories (e.g., Dairy, Seafood, Oils). Then return to Product List to add products.'
        },
        {
          q: 'Why can\'t I delete a product type?',
          a: 'The type is being used by one or more products. You must first:\n1. Go to Product List\n2. Find products with that type\n3. Either delete/archive them OR reassign to another type\n4. Then you can delete the type'
        },
        {
          q: 'Image upload isn\'t working',
          a: 'Check:\n1. File size (max 10MB)\n2. File format (JPG, PNG, or PDF for documents)\n3. Internet connection\n4. Browser console for errors\n\nIf issues persist, try a different browser or clear cache.'
        },
        {
          q: 'I can\'t see PDF receipts',
          a: 'Click "View Receipt" to open in new tab. If it doesn\'t load, click "Download" instead. PDFs are stored in Cloudinary and should be accessible. Check your popup blocker settings.'
        },
        {
          q: 'Movement photo is showing "Photo unavailable"',
          a: 'This means:\n1. Photo wasn\'t uploaded successfully\n2. Cloudinary link expired (rare)\n3. File was deleted from Cloudinary\n\nFor future movements, ensure good internet connection when uploading.'
        },
        {
          q: 'Excel/Numbers can\'t open my CSV export',
          a: 'CSVs are plain text files. Try:\n1. Right-click → Open With → Numbers/Excel\n2. In Excel: File → Import → CSV\n3. Ensure "Delimiter" is set to "Comma"\n\nFor reconciliation upload, use the exact template downloaded.'
        },
        {
          q: 'Why is my reconciliation showing invalid items?',
          a: 'Common reasons:\n1. Product name doesn\'t match exactly (check spelling/spacing)\n2. Product was archived since template was downloaded\n3. Empty or non-numeric values in stock columns\n\nThe reconciliation report shows all invalid items with reasons.'
        }
      ]
    },
    {
      id: 'limitations',
      title: '⚠️ System Limitations',
      icon: '⚠️',
      questions: [
        {
          q: 'Can I bulk-edit multiple products at once?',
          a: 'Not directly in the UI. You can use Stock Reconciliation CSV to update Min Stock in bulk. For other fields, products must be edited individually to maintain data accuracy.'
        },
        {
          q: 'Can I export all my data?',
          a: 'Currently, you can export:\n• Product List (CSV)\n• Stock Reconciliation template (CSV)\n\nFull database export requires database access. Speak to your system administrator for complete backups.'
        },
        {
          q: 'Is there a mobile app?',
          a: 'Not yet. However, the web app is responsive and works on tablets (iPad). For best experience, use landscape mode on tablets or a desktop browser.'
        },
        {
          q: 'Can I integrate with my POS system?',
          a: 'Not currently. This is a standalone inventory management system. You\'ll need to manually record movements based on POS/prep data.'
        },
        {
          q: 'Can multiple people use the system simultaneously?',
          a: 'Yes! The system supports concurrent users. However, be aware:\n• Stock calculations are real-time\n• Last edit wins (if two people edit the same item)\n• Activity Log tracks who made which changes\n\nCommunicate with team to avoid conflicts.'
        },
        {
          q: 'What happens if internet connection drops?',
          a: 'The system requires internet connection to function. If connection drops:\n• Unsaved changes will be lost\n• Page will show errors\n• Refresh page once connection is restored\n\nAlways ensure stable connection, especially during reconciliation uploads.'
        },
        {
          q: 'Can I undo a reconciliation?',
          a: 'No direct "undo" function. If you need to revert:\n1. Download a new template\n2. Fill with previous/correct values\n3. Upload as a new reconciliation with earlier timestamp\n\nReconciliation history is preserved in Activity Log.'
        },
        {
          q: 'Is there a backup system?',
          a: 'Your data is stored in MongoDB Atlas with automatic backups. However, user-initiated local backups are recommended. Export CSVs periodically and store reconciliation records.'
        }
      ]
    },
    {
      id: 'glossary',
      title: '📖 Glossary',
      icon: '📖',
      questions: [
        {
          q: 'Key Terms Explained',
          a: '• Base Content: Individual unit size (e.g., 1 liter, 500g)\n• Purchase Pack: How items are bought (e.g., 1 box, 1 case)\n• Pack Unit: Unit for purchase packs (e.g., "box", "case")\n• Min Stock: Minimum quantity to keep in stock (in packs)\n• Movement: Any input (receiving) or output (using) of inventory\n• Reconciliation: Physical count to correct inventory levels\n• Internal Order: Department request for items\n• External Order: Purchase order to supplier\n• Direct Purchase: Non-inventory purchase\n• Personal Expense: Employee purchase needing reimbursement\n• Archive: Hide item from active lists (preserves data)\n• Activity Log: Audit trail of all system changes'
        }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    questions: section.questions.filter(q =>
      searchQuery === '' ||
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ margin: 0, marginBottom: 16, fontSize: 32 }}>
          📚 Help Center & Q&A
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          Everything you need to know about managing inventory, orders, and purchases
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 30 }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Search questions... (e.g., 'stock reconciliation', 'archive', 'photo')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', fontSize: 16 }}
        />
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 40
      }}>
        <div style={{ padding: 20, background: '#eff6ff', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 14, color: '#1e40af', fontWeight: 600 }}>Product Management</div>
        </div>
        <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, color: '#15803d', fontWeight: 600 }}>Stock Control</div>
        </div>
        <div style={{ padding: 20, background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>Purchasing</div>
        </div>
        <div style={{ padding: 20, background: '#fce7f3', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
          <div style={{ fontSize: 14, color: '#9f1239', fontWeight: 600 }}>Orders</div>
        </div>
      </div>

      {/* Sections */}
      {filteredSections.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ margin: 0, marginBottom: 8, color: '#374151' }}>No results found</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Try different keywords or browse all sections below
          </p>
        </div>
      ) : (
        filteredSections.map((section) => (
          <div
            key={section.id}
            style={{
              marginBottom: 20,
              background: 'white',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                width: '100%',
                padding: 20,
                background: expandedSection === section.id ? '#f9fafb' : 'white',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 18,
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{section.icon}</span>
                <span>{section.title}</span>
                <span style={{
                  fontSize: 12,
                  background: '#e5e7eb',
                  color: '#374151',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 500
                }}>
                  {section.questions.length} {section.questions.length === 1 ? 'topic' : 'topics'}
                </span>
              </div>
              <span style={{ fontSize: 20, color: '#6b7280' }}>
                {expandedSection === section.id ? '−' : '+'}
              </span>
            </button>

            {expandedSection === section.id && (
              <div style={{ padding: '0 20px 20px 20px' }}>
                {section.questions.map((qa, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      background: '#f9fafb',
                      borderRadius: 6,
                      borderLeft: '3px solid #3b82f6'
                    }}
                  >
                    <h4 style={{
                      margin: 0,
                      marginBottom: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      Q: {qa.q}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: '#475569',
                      whiteSpace: 'pre-line'
                    }}>
                      {qa.a}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Footer */}
      <div style={{
        marginTop: 60,
        padding: 30,
        background: '#f9fafb',
        borderRadius: 8,
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20 }}>Still have questions?</h3>
        <p style={{ margin: 0, color: '#6b7280', marginBottom: 20 }}>
          Contact your system administrator or check the Activity Log for detailed operation history.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/activity"
            className="button"
            style={{ textDecoration: 'none', background: '#3b82f6' }}
          >
            📝 View Activity Log
          </a>
          <a
            href="/products"
            className="button"
            style={{ textDecoration: 'none', background: '#10b981' }}
          >
            📦 Go to Product List
          </a>
        </div>
      </div>
    </div>
  );
}

