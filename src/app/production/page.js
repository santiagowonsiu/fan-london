'use client';

export default function ProductionListPage() {
  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ 
        maxWidth: 600, 
        margin: '100px auto', 
        textAlign: 'center',
        padding: 40,
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🏗️</div>
        <h1 style={{ margin: 0, marginBottom: 16, fontSize: 28 }}>Production List</h1>
        <p style={{ color: '#6b7280', fontSize: 16, lineHeight: 1.6 }}>
          This section for produced goods and recipes is coming soon! 
          It will allow you to manage assembled products, recipes, and track production.
        </p>
        <div style={{ 
          marginTop: 30, 
          padding: 16, 
          background: '#f9fafb', 
          borderRadius: 8,
          textAlign: 'left'
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 500, marginBottom: 8 }}>
            Planned features:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#6b7280' }}>
            <li>Recipe management</li>
            <li>Production tracking</li>
            <li>Ingredient usage calculation</li>
            <li>Cost per recipe analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

