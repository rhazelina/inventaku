
import React from 'react';

export default function DesignSystemTest() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-text-primary">
      <h1 className="text-3xl font-bold">Design System Test</h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-background border border-border rounded">Background</div>
          <div className="p-4 bg-surface border border-border rounded shadow-sm">Surface</div>
          <div className="p-4 bg-card border border-border rounded">Card</div>
          <div className="p-4 bg-sidebar text-white rounded">Sidebar</div>
          <div className="p-4 bg-primary text-white rounded">Primary</div>
          <div className="p-4 bg-primary-hover text-white rounded">Primary Hover</div>
          <div className="p-4 bg-status-success text-white rounded">Success</div>
          <div className="p-4 bg-status-warning text-black rounded">Warning</div>
          <div className="p-4 bg-status-error text-white rounded">Error</div>
          <div className="p-4 bg-status-info text-white rounded">Info</div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Typography (Inter)</h2>
        <p className="text-4xl font-bold">Heading 1 (Bold)</p>
        <p className="text-2xl font-semibold">Heading 2 (Semibold)</p>
        <p className="text-base text-text-primary">Body text primary color.</p>
        <p className="text-sm text-text-secondary">Caption text secondary color.</p>
      </section>
    </div>
  );
}
