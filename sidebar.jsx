// Sidebar component
const { useState } = React;

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { id: 'overview', label: 'Resumen', icon: 'Overview' },
      { id: 'schedules', label: 'Horarios', icon: 'Calendar', count: 12 },
      { id: 'tasks', label: 'Gestión de Tareas', icon: 'Tasks', count: 11 },
    ]
  },
  {
    label: 'Personal',
    items: [
      { id: 'payroll', label: 'Nómina y Pagos', icon: 'Payroll' },
      { id: 'attendance', label: 'Asistencia', icon: 'Clock', count: 'xlsx' },
      { id: 'staff', label: 'Directorio', icon: 'Staff', count: 12 },
    ]
  },
  {
    label: 'Operaciones',
    items: [
      { id: 'reports', label: 'Reportes', icon: 'Reports', count: '5m' },
      { id: 'recipes', label: 'Recetario', icon: 'Coffee', count: 14 },
      { id: 'inventory', label: 'Inventario', icon: 'Inventory', count: '188!' },
      { id: 'procurement', label: 'Solicitudes', icon: 'Tasks', count: 18 },
      { id: 'mermas', label: 'Mermas', icon: 'ArrowDown', count: 20 },
      { id: 'settings', label: 'Ajustes', icon: 'Settings' },
    ]
  }
];

function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="brand">
        <div className="brand-mark">,</div>
        <div>
          <div className="brand-name">Comma</div>
          <div className="brand-sub">Admin · Sucursal Centro</div>
        </div>
      </div>

      {NAV_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="nav-label">{g.label}</div>
          {g.items.map((it) => {
            const IconComp = window.Icons[it.icon];
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onChange(it.id)}
              >
                <span className="nav-icon"><IconComp size={16} /></span>
                <span>{it.label}</span>
                {it.count !== undefined && <span className="nav-count">{it.count}</span>}
              </button>
            );
          })}
        </div>
      ))}

      <div className="sidebar-foot">
        <div className="avatar" style={{background: '#C8623C'}}>SM</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="foot-name">Sofía Mendoza</div>
          <div className="foot-role">Gerente · Centro</div>
        </div>
        <button className="icon-btn" style={{width: 28, height: 28, background: 'transparent', border: 'none', color: '#7A7A72'}}>
          <window.Icons.MoreH size={14} />
        </button>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
window.NAV_GROUPS = NAV_GROUPS;
