// Main App
const { useState: useStateApp } = React;

const PAGE_META = {
  overview:  { crumb: 'Inicio · Resumen general', title: 'Dashboard de operación' },
  schedules: { crumb: 'Personal · Horarios',       title: 'Horarios y turnos' },
  tasks:     { crumb: 'Operación · Tareas',         title: 'Gestión de tareas' },
  payroll:   { crumb: 'Personal · Nómina',          title: 'Nómina y pagos' },
  attendance:{ crumb: 'Personal · Asistencia',      title: 'Asistencia · real vs programada' },
  staff:     { crumb: 'Personal · Directorio',      title: 'Directorio de colaboradores' },
  mermas:     { crumb: 'Operación · Mermas',        title: 'Mermas y desperdicios' },
  recipes:    { crumb: 'Operación · Recetario',     title: 'Recetario y food cost' },
  procurement: { crumb: 'Operación · Solicitudes',   title: 'Pedidos por estación' },
  reports:   { crumb: 'Operación · Reportes',       title: 'Reportes' },
  inventory: { crumb: 'Operación · Inventario',     title: 'Inventario' },
  settings:  { crumb: 'Sistema · Ajustes',          title: 'Ajustes' },
};

function App() {
  const [page, setPage] = useStateApp('overview');
  const meta = PAGE_META[page];

  const renderPage = () => {
    switch (page) {
      case 'overview':  return <OverviewPage goTo={setPage} />;
      case 'schedules': return <SchedulesPage />;
      case 'tasks':     return <TasksPage />;
      case 'payroll':   return <PayrollPage />;
      case 'attendance':return <AttendancePage goTo={setPage} />;
      case 'staff':     return <StaffPage />;
      case 'reports':   return <ReportsPage goTo={setPage} />;
      case 'inventory': return <InventoryPage goTo={setPage} />;
      case 'procurement': return <ProcurementPage goTo={setPage} />;
      case 'recipes':   return <RecipesPage goTo={setPage} />;
      case 'mermas':    return <MermasPage goTo={setPage} />;
      case 'settings':  return <PlaceholderPage title="Ajustes" sub="Configuración general del sistema y perfiles de usuario" />;
      default: return null;
    }
  };

  return (
    <div className="app">
      <Sidebar active={page} onChange={setPage} />
      <main className="main">
        <header className="topbar">
          <div>
            <div className="crumb">{meta.crumb}</div>
            <h1 className="page-title">{meta.title}</h1>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <Icons.Search size={14} />
              <input placeholder="Buscar empleado, turno, tarea…" />
              <span className="mono" style={{fontSize: 11, color: 'var(--muted-2)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4}}>⌘K</span>
            </div>
            <button className="icon-btn">
              <Icons.Bell size={15} />
              <span className="dot"></span>
            </button>
            <button className="icon-btn">
              <Icons.Settings size={15} />
            </button>
            <div style={{width: 1, height: 24, background: 'var(--line)'}}></div>
            <button className="btn btn-primary">
              <Icons.Plus size={13} /> Acción rápida
            </button>
          </div>
        </header>
        <div className="content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

window.App = App;
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
