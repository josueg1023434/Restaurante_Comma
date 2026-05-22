// Tasks + Payroll + Staff pages (Schedules is in schedules.jsx)
const { useState: useStateP } = React;

/* ---------- Tasks (Kanban) ---------- */
function TasksPage() {
  const [tasks, setTasks] = useStateP(TASKS_INITIAL);
  const [dragInfo, setDragInfo] = useStateP(null);

  const cols = [
    { id: 'todo',     title: 'Por hacer',    color: '#8A8A82' },
    { id: 'progress', title: 'En progreso',  color: '#B58A3C' },
    { id: 'review',   title: 'En revisión',  color: '#4A3F8C' },
    { id: 'done',     title: 'Completado',   color: '#0F6B4E' },
  ];

  const move = (taskId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    setTasks(t => {
      const next = { ...t };
      const task = next[fromCol].find(x => x.id === taskId);
      next[fromCol] = next[fromCol].filter(x => x.id !== taskId);
      next[toCol] = [task, ...next[toCol]];
      return next;
    });
  };

  const totalCount = Object.values(tasks).reduce((a, c) => a + c.length, 0);

  return (
    <div data-screen-label="Tasks">
      <div className="between mb-3">
        <div>
          <div style={{fontSize: 13, color: 'var(--muted)'}}>Jueves 22 mayo · turno tarde</div>
          <div style={{fontSize: 13, marginTop: 4}}>
            <span style={{fontWeight: 600}}>{totalCount} tareas activas</span>
            <span style={{color: 'var(--muted)'}}> · arrastra entre columnas para cambiar de estado</span>
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn"><window.Icons.Filter size={13}/> Filtrar</button>
          <button className="btn btn-emerald"><window.Icons.Plus size={13}/> Nueva tarea</button>
        </div>
      </div>

      <div className="kanban">
        {cols.map(col => (
          <div
            key={col.id}
            className="kanban-col"
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragInfo) move(dragInfo.id, dragInfo.from, col.id); setDragInfo(null); }}
          >
            <div className="kanban-head">
              <div className="kanban-title">
                <span className="kanban-dot" style={{background: col.color}}></span>
                {col.title}
              </div>
              <span className="kanban-count">{tasks[col.id].length}</span>
            </div>
            {tasks[col.id].map(task => {
              const emp = EMPLOYEES.find(e => e.id === task.assignee);
              if (!emp) return null;
              return (
                <div
                  key={task.id}
                  className={`task-card ${dragInfo?.id === task.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragInfo({ id: task.id, from: col.id })}
                  onDragEnd={() => setDragInfo(null)}
                >
                  <div className="task-title">{task.title}</div>
                  <div className="task-desc">{task.desc}</div>
                  <div className="task-foot">
                    <div className="task-assignee">
                      <div className="mini-avatar" style={{background: emp.color}}>{emp.initials}</div>
                      <span>{emp.name}</span>
                    </div>
                    <span className={`task-tag ${task.tag}`}>{task.tag === 'prep' ? 'Prep' : task.tag === 'clean' ? 'Limpieza' : task.tag === 'close' ? 'Cierre' : 'Operación'}</span>
                  </div>
                </div>
              );
            })}
            <button className="task-card" style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--muted)', fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px dashed var(--line-2)'}}>
              <window.Icons.Plus size={12}/> Agregar tarea
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Payroll ---------- */
const HOURLY_RATE = {
  'Servicios': 4.50,
  'Bartender': 5.25,
  'Jefe de Cocina': 8.50,
  'Jefe Suplente de Cocina': 7.00,
  'Auxiliar de Cocina': 5.00,
  'Cajera': 4.75,
};

function PayrollPage() {
  // compute from real schedule
  const rows = EMPLOYEES.map(emp => {
    const hours = WEEK_DAYS.reduce((a, d) => a + shiftHours(SCHEDULE[emp.id]?.[d.key]), 0);
    const rate = HOURLY_RATE[emp.role] || 5.00;
    const overtime = Math.max(0, hours - 44);
    const regular = hours - overtime;
    const gross = +(regular * rate + overtime * rate * 1.5).toFixed(2);
    const deductions = +(gross * 0.085).toFixed(2);
    const total = +(gross - deductions).toFixed(2);
    return { ...emp, hours, rate, overtime, gross, deductions, total };
  });
  const totals = rows.reduce((a, p) => ({
    hours: a.hours + p.hours,
    overtime: a.overtime + p.overtime,
    gross: a.gross + p.gross,
    deductions: a.deductions + p.deductions,
    total: a.total + p.total,
  }), { hours: 0, overtime: 0, gross: 0, deductions: 0, total: 0 });
  const fmt = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div data-screen-label="Payroll">
      <div className="between mb-3">
        <div>
          <div style={{fontSize: 13, color: 'var(--muted)'}}>Periodo de pago · semana 21 · 19–25 mayo 2026</div>
          <div style={{fontSize: 13, marginTop: 4}}>
            <span style={{fontWeight: 600}}>Total a pagar:</span>
            <span className="mono" style={{marginLeft: 8, fontSize: 16, fontWeight: 700}}>{fmt(totals.total)} USD</span>
            <span style={{color: 'var(--muted)', marginLeft: 8}}>· cierre lunes 25</span>
          </div>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className="active">Semanal</button>
            <button>Quincenal</button>
            <button>Mensual</button>
          </div>
          <button className="btn"><window.Icons.Download size={13}/> Exportar CSV</button>
          <button className="btn btn-primary"><window.Icons.Check size={13}/> Aprobar nómina</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Área · Rol</th>
              <th style={{textAlign: 'right'}}>Tarifa/h</th>
              <th style={{textAlign: 'right'}}>Horas</th>
              <th style={{textAlign: 'right'}}>Extras</th>
              <th style={{textAlign: 'right'}}>Bruto</th>
              <th style={{textAlign: 'right'}}>Deducciones</th>
              <th style={{textAlign: 'right'}}>Total a pagar</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="row-name">
                    <div className="shift-avatar" style={{background: p.color, width: 30, height: 30, fontSize: 11}}>{p.initials}</div>
                    <div>
                      <div style={{fontSize: 13, fontWeight: 600}}>{p.name}</div>
                      <div style={{fontSize: 11, color: 'var(--muted)'}}>#EMP-{String(p.id).padStart(4, '0')}</div>
                    </div>
                  </div>
                </td>
                <td style={{color: 'var(--ink-2)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <span className="area-dot" style={{background: AREA_COLOR[p.area]}}></span>
                    <span style={{fontSize: 12.5}}>{p.role}</span>
                  </div>
                </td>
                <td className="num" style={{textAlign: 'right'}}>{fmt(p.rate)}</td>
                <td className="num" style={{textAlign: 'right'}}>{fmtHours(p.hours)}</td>
                <td className="num" style={{textAlign: 'right', color: p.overtime > 0 ? 'var(--terracotta)' : 'var(--muted)'}}>
                  {p.overtime > 0 ? fmtHours(p.overtime) : '—'}
                </td>
                <td className="num" style={{textAlign: 'right'}}>{fmt(p.gross)}</td>
                <td className="num" style={{textAlign: 'right', color: 'var(--muted)'}}>−{fmt(p.deductions)}</td>
                <td className="num total" style={{textAlign: 'right'}}>{fmt(p.total)}</td>
                <td style={{textAlign: 'right'}}>
                  <button className="icon-btn" style={{width: 28, height: 28}}><window.Icons.MoreH size={13}/></button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background: 'var(--bg)', fontWeight: 700}}>
              <td colSpan="3" style={{padding: '14px 16px', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Totales · {rows.length} empleados</td>
              <td className="num" style={{padding: '14px 16px', textAlign: 'right'}}>{fmtHours(totals.hours)}</td>
              <td className="num" style={{padding: '14px 16px', textAlign: 'right'}}>{fmtHours(totals.overtime)}</td>
              <td className="num" style={{padding: '14px 16px', textAlign: 'right'}}>{fmt(totals.gross)}</td>
              <td className="num" style={{padding: '14px 16px', textAlign: 'right', color: 'var(--muted)'}}>−{fmt(totals.deductions)}</td>
              <td className="num" style={{padding: '14px 16px', textAlign: 'right', fontSize: 14}}>{fmt(totals.total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------- Staff Directory ---------- */
function StaffPage() {
  const [filter, setFilter] = useStateP('all');
  const insights = window.useInsights ? window.useInsights() : null;
  const meseroLookup = {};
  if (insights) insights.byMesero.forEach(m => { meseroLookup[m.name.toUpperCase()] = m; });

  const enriched = EMPLOYEES.map(e => ({
    ...e,
    status: liveStatus(e),
    todayShift: SCHEDULE[e.id][TODAY_KEY],
    weekHours: WEEK_DAYS.reduce((a, d) => a + shiftHours(SCHEDULE[e.id]?.[d.key]), 0),
    sales: meseroLookup[e.name.toUpperCase()] || null,
  }));
  const filtered = filter === 'all' ? enriched : enriched.filter(e => e.area === filter);

  const fmtK = (n) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : '$' + Math.round(n);

  return (
    <div data-screen-label="Staff">
      <div className="between mb-3">
        <div>
          <div style={{fontSize: 13, color: 'var(--muted)'}}>Directorio · sucursal centro</div>
          <div style={{fontSize: 13, marginTop: 4, fontWeight: 600}}>{filtered.length} colaboradores</div>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button>
            {AREAS.map(a => (
              <button key={a} className={filter === a ? 'active' : ''} onClick={() => setFilter(a)}>{a}</button>
            ))}
          </div>
          <button className="btn btn-emerald"><window.Icons.Plus size={13}/> Nuevo colaborador</button>
        </div>
      </div>

      <div className="staff-grid">
        {filtered.map(e => (
          <div className="staff-card" key={e.id}>
            <span className={`status-chip ${e.status === 'on' ? '' : e.status === 'upcoming' ? 'break' : 'off'}`}>
              {STATUS_LABEL[e.status]}
            </span>
            <div className="avatar-lg" style={{background: e.color}}>{e.initials}</div>
            <div className="staff-name">{e.name}</div>
            <div className="staff-role">
              <span className="area-dot" style={{background: AREA_COLOR[e.area], display: 'inline-block', verticalAlign: 'middle', marginRight: 6}}></span>
              {e.role}
            </div>

            {e.sales && (
              <div style={{
                marginTop: 14,
                background: 'var(--surface-2)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 11.5,
              }}>
                <div className="between" style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
                    Ventas atribuidas
                  </span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>5 meses</span>
                </div>
                <div className="between">
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: AREA_COLOR[e.area] }}>
                    {fmtK(e.sales.revenue)}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {e.sales.tickets} fact · ${(e.sales.revenue / e.sales.tickets).toFixed(2)} avg
                  </span>
                </div>
              </div>
            )}

            <div className="divider"></div>
            <div className="staff-meta">
              <window.Icons.Clock size={12}/>
              <span>
                {e.todayShift ? `Hoy ${e.todayShift.in}–${e.todayShift.out}` : 'Descanso hoy'} · {fmtHours(e.weekHours)} h sem.
              </span>
            </div>
            <div className="staff-meta" style={{marginTop: 6}}>
              <window.Icons.Phone size={12}/>
              <span>{e.phone}</span>
            </div>
            <div className="staff-meta" style={{marginTop: 6}}>
              <window.Icons.Bell size={12}/>
              <span style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 11}}>{e.email}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Placeholder generic ---------- */
function PlaceholderPage({ title, sub }) {
  return (
    <div data-screen-label={title}>
      <div className="card" style={{padding: 60, textAlign: 'center'}}>
        <div className="serif" style={{fontSize: 28, marginBottom: 8}}>{title}</div>
        <div style={{color: 'var(--muted)', fontSize: 13}}>{sub}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TasksPage, PayrollPage, StaffPage, PlaceholderPage });
