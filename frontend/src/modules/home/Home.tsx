import React from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, ShoppingCart, Receipt, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <ShoppingCart size={22} />,
    title: 'Procurement Operations',
    description: 'Vendors, purchase requests, purchase orders, and contracts — tracked end to end with approvals and expiry alerts.',
  },
  {
    icon: <Receipt size={22} />,
    title: 'Invoicing & Purchases',
    description: 'GST/TDS-aware invoices in your own templates, plus a dedicated ledger for vendor purchases with automatic TDS.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Real-Time Dashboards',
    description: 'Income, GST collected, TDS deducted, and company receivables — always current, exportable to Excel.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Role-Based Access',
    description: 'A single admin account controls who can do what, with full audit logging across every action.',
  },
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--fg)' }}>
      {/* Gradient orbs */}
      <div className="orb-backdrop" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header
        className="relative z-10 flex items-center justify-between px-6 sm:px-10 h-16 backdrop-blur-xl"
        style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--header-bg)' }}
      >
        <div className="flex items-center gap-2">
          <Hexagon size={22} style={{ color: 'var(--fg)' }} />
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
            ProcureFlow
          </span>
        </div>
        <Link to="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
      </header>

      <main className="relative z-10">
        <section className="px-6 sm:px-10 py-20 sm:py-28 max-w-5xl mx-auto text-center">
          <div
            className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--fg-muted)' }}
          >
            Procurement · Finance · Compliance
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>
            Procurement &amp; Invoicing,<br className="hidden sm:block" /> in one platform
          </h1>
          <p className="text-base sm:text-lg mt-5 max-w-2xl mx-auto" style={{ color: 'var(--fg-muted)' }}>
            ProcureFlow brings vendor management, purchase workflows, GST/TDS-compliant invoicing,
            and financial dashboards together — built for how procurement teams actually work.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/login" className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
              Sign In <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="px-6 sm:px-10 pb-24 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="glass-card-hover p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--fg)' }}
                >
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="relative z-10 px-6 sm:px-10 py-6 text-center text-xs"
        style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--fg-faint)' }}
      >
        © {new Date().getFullYear()} ProcureFlow. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
