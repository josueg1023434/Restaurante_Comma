// Asistencia — upload Excel, compare actual vs scheduled, feed payroll
const { useState: useStateAT, useMemo: useMemoAT, useRef: useRefAT } = React;

// Seed attendance — actual clock-in/out vs scheduled
// Status derived: on_time, late, very_late, early_leave, absent, no_clock_out, extra_hours
function toMin(s) {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
function fromMin(n) {
  if (n == null) return null;
  return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
}

// Generate realistic attendance with some delays/issues based on SCHEDULE
function buildAttendance() {
  const out = [];
  // delay patterns per employee for the demo (some on-time, some chronic late)
  const patterns = {
    1: 'none',         // Karen (no schedule anyway)
    2: 'on_time',      // Erick — top mesero, on time
    3: 'small_late',   // Josué — sometimes 5-10 min
    4: 'on_time',      // André
    5: 'chronic_late', // José — chronic late
    6: 'on_time',      // Melanie
    7: 'on_time',      // Nayeli
    8: 'extra',        // Ericar (chef) tends to stay later
    9: 'small_late',   // Juan
    10:'one_absent',   // Willian — 1 absent day
    11:'on_time',      // Paola
    12:'incapacidad',  // Liss — incapacidad Friday
  };
  const rng = (seed) => {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  };

  for (const emp of EMPLOYEES) {
    for (const day of WEEK_DAYS) {
      const sched = SCHEDULE[emp.id]?.[day.key];
      if (!sched) continue;
      const r = rng(emp.id * 17 + day.key.charCodeAt(0) * 31);
      const pat = patterns[emp.id];

      let actualIn = toMin(sched.in);
      let actualOut = toMin(sched.out);
      let status = 'on_time';
      let delayMin = 0, earlyMin = 0;

      if (emp.id === 12 && day.key === 'vie') {
        // Liss incapacidad
        out.push({
          empId: emp.id, day: day.key,
          scheduledIn: sched.in, scheduledOut: sched.out,
          actualIn: null, actualOut: null,
          status: 'incapacidad', delayMin: 0, earlyMin: 0,
          scheduledMin: toMin(sched.out) - toMin(sched.in),
          actualMin: 0,
        });
        continue;
      }
      if (pat === 'one_absent' && day.key === 'mie') {
        out.push({
          empId: emp.id, day: day.key,
          scheduledIn: sched.in, scheduledOut: sched.out,
          actualIn: null, actualOut: null,
          status: 'absent', delayMin: 0, earlyMin: 0,
          scheduledMin: toMin(sched.out) - toMin(sched.in),
          actualMin: 0,
        });
        continue;
      }

      // Apply patterns
      if (pat === 'small_late') {
        delayMin = Math.floor(r() * 12) + 2; // 2-14 min
      } else if (pat === 'chronic_late') {
        delayMin = Math.floor(r() * 25) + 8; // 8-33 min
      } else if (pat === 'extra') {
        // arrived early or stayed late
        actualIn = toMin(sched.in) - Math.floor(r() * 20); // up to 20 min early
        actualOut = toMin(sched.out) + Math.floor(r() * 30); // up to 30 min over
        status = 'extra_hours';
      }

      if (delayMin > 0) {
        actualIn = toMin(sched.in) + delayMin;
        status = delayMin >= 20 ? 'very_late' : 'late';
      }

      // small chance of early leave (5%)
      if (r() < 0.06 && status === 'on_time') {
        earlyMin = Math.floor(r() * 18) + 5;
        actualOut = toMin(sched.out) - earlyMin;
        status = 'early_leave';
      }

      // Liss thursday — sample no_clock_out
      if (emp.id === 12 && day.key === 'jue') {
        actualOut = null;
        status = 'no_clock_out';
      }

      const scheduledMin = toMin(sched.out) - toMin(sched.in);
      const actualMin = (actualOut != null && actualIn != null) ? actualOut - actualIn : 0;

      out.push({
        empId: emp.id, day: day.key,
        scheduledIn: sched.in, scheduledOut: sched.out,
        actualIn: fromMin(actualIn), actualOut: fromMin(actualOut),
        status, delayMin, earlyMin,
        scheduledMin, actualMin,
      });
    }
  }
  return out;
}

const STATUS_AT = {
  on_time:      { label: 'A tiempo',     color: 'var(--emerald)',   bg: 'var(--emerald-soft)' },
  late:         { label: 'Atraso leve',  color: 'var(--gold)',      bg: 'var(--gold-soft)' },
  very_late:    { label: 'Atraso grave', color: 'var(--terracotta)',bg: 'var(--terracotta-soft)' },
  early_leave:  { label: 'Salida ant.',  color: '#B58A3C',          bg: 'var(--gold-soft)' },
  absent:       { label: 'Falta',        color: 'var(--danger)',    bg: '#FBE3E3' },
  incapacidad:  { label: 'Incapacidad',  color: '#4A3F8C',          bg: '#E8E5F3' },
  extra_hours:  { label: 'Hrs extra',    color: '#2E5C8A',          bg: '#E6EFF7' },
  no_clock_out: { label: 'Sin marca salida', color: 'var(--muted)', bg: 'var(--surface-2)' },
};

function AttendancePage({ goTo }) {
  const [records, setRecords] = useStateAT(buildAttendance());
  const [importOpen, setImportOpen] = useStateAT(false);
  const [importedAt, setImportedAt] = useStateAT('Hoy 14:32');
  const [detail, setDetail] = useStateAT(null);

  const stats = useMemoAT(() => {
    const total = records.length;
    const onTime = records.filter(r => r.status === 'on_time' || r.status === 'extra_hours').length;
    const late = records.filter(r => r.status === 'late' || r.status === 'very_late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const earlyLeave = records.filter(r => r.status === 'early_leave').length;
    const totalScheduled = records.reduce((a, r) => a + r.scheduledMin, 0);
    const totalActual = records.reduce((a, r) => a + r.actualMin, 0);
    const totalDelay = records.reduce((a, r) => a + r.delayMin, 0);
    const totalEarly = records.reduce((a, r) => a + r.earlyMin, 0);
    return {
      total, onTime, late, absent, earlyLeave,
      attendancePct: ((total - absent) / total) * 100,
      onTimePct: (onTime / total) * 100,
      totalScheduledH: totalScheduled / 60,
      totalActualH: totalActual / 60,
      totalDelayH: totalDelay / 60,
      diffH: (totalActual - totalScheduled) / 60,
    };
  }, [records]);

  // Per-employee summary
  const byEmployee = useMemoAT(() => {
    return EMPLOYEES.map(emp => {
      const empRecs = records.filter(r => r.empId === emp.id);
      const scheduled = empRecs.reduce((a, r) => a + r.scheduledMin, 0) / 60;
      const actual = empRecs.reduce((a, r) => a + r.actualMin, 0) / 60;
      const delay = empRecs.reduce((a, r) => a + r.delayMin, 0);
      const incidents = empRecs.filter(r => ['late','very_late','absent','early_leave','no_clock_out'].includes(r.status)).length;
      const diff = actual - scheduled;
      return { emp, empRecs, scheduled, actual, delay, incidents, diff };
    }).filter(x => x.empRecs.length > 0)
      .sort((a, b) => b.incidents - a.incidents || b.delay - a.delay);
  }, [records]);

  const handleImport = () => {
    setImportedAt('Ahora');
    setImportOpen(false);
  };

  return (
    <div data-screen-label="Attendance">
      <div className="between mb-3">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Asistencia · semana 21 (19–25 mayo)
            <span style={{ marginLeft: 8, padding: '2px 8px', background: 'var(--emerald-soft)', color: 'var(--emerald)', borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em' }}>
              ÚLTIMA IMPORTACIÓN · {importedAt}
            </span>
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{records.length} marcas registradas</span>
            <span style={{ color: 'var(--muted)' }}> · {EMPLOYEES.length} colaboradores · ${Math.abs(stats.diffH * 5).toFixed(2)} ajuste a nómina</span>
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn"><window.Icons.Download size={13} /> Exportar a nómina</button>
          <button className="btn btn-emerald" onClick={() => setImportOpen(true)}>
            <window.Icons.Plus size={13} /> Importar Excel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Asistencia general</div>
          <div className="kpi-value" style={{ color: 'var(--emerald)' }}>
            {stats.attendancePct.toFixed(1)}<span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span className="trend">{stats.total - stats.absent} de {stats.total} marcas</span>
            <span>se presentaron</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">A tiempo</div>
          <div className="kpi-value" style={{ color: stats.onTimePct > 80 ? 'var(--emerald)' : 'var(--gold)' }}>
            {stats.onTimePct.toFixed(0)}<span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span className="trend flat">{stats.onTime} marcas</span>
            <span>0 min de atraso</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Atrasos / incidentes</div>
          <div className="kpi-value" style={{ color: 'var(--gold)' }}>{stats.late + stats.earlyLeave}</div>
          <div className="kpi-foot">
            <span className="trend down">{stats.totalDelayH.toFixed(1)}h acumuladas</span>
            <span>en la semana</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Diferencia horas</div>
          <div className="kpi-value" style={{ color: stats.diffH < 0 ? 'var(--terracotta)' : 'var(--emerald)' }}>
            {stats.diffH >= 0 ? '+' : ''}{stats.diffH.toFixed(1)}<span className="unit">h</span>
          </div>
          <div className="kpi-foot">
            <span className="trend flat">real vs programado</span>
            <span>se ajusta en nómina</span>
          </div>
        </div>
      </div>

      {/* Weekly heatmap-style grid: rows = employees, cols = days */}
      <div className="card mb-3">
        <div className="card-head">
          <div>
            <div className="card-title">Marcas por día</div>
            <div className="card-sub">Verde = a tiempo · oro = atraso · rojo = falta · azul = extra/incapacidad</div>
          </div>
          <div className="row gap-2" style={{ fontSize: 11 }}>
            {['on_time','late','very_late','early_leave','absent','extra_hours','incapacidad'].map(k => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_AT[k].color }}></span>
                <span style={{ color: 'var(--muted)' }}>{STATUS_AT[k].label}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: '6px 22px 18px', overflowX: 'auto' }}>
          <table className="sched-grid">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 200 }}>Colaborador</th>
                {WEEK_DAYS.map(d => (
                  <th key={d.key} className={`day-h ${d.key === TODAY_KEY ? 'today' : ''}`}>
                    <div className="day-name">{d.short} {d.date}</div>
                  </th>
                ))}
                <th style={{ textAlign: 'right', minWidth: 80 }}>Real / Prog.</th>
                <th style={{ textAlign: 'right', minWidth: 60 }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {byEmployee.map(({ emp, empRecs, scheduled, actual, diff, incidents }) => (
                <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => setDetail({ emp, records: empRecs })}>
                  <td className="emp-cell">
                    <div className="row-name">
                      <div className="shift-avatar" style={{ background: emp.color, width: 28, height: 28, fontSize: 10 }}>{emp.initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {emp.role}
                          {incidents > 0 && <span style={{ color: 'var(--gold)', fontWeight: 600, marginLeft: 6 }}>· {incidents} incidente{incidents > 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  {WEEK_DAYS.map(d => {
                    const rec = empRecs.find(r => r.day === d.key);
                    if (!rec) {
                      return (
                        <td key={d.key} className="day-cell">
                          <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>Off</span>
                        </td>
                      );
                    }
                    const st = STATUS_AT[rec.status];
                    return (
                      <td key={d.key} className={`day-cell ${d.key === TODAY_KEY ? 'today' : ''}`} title={`${st.label} — ${rec.actualIn || '—'} / ${rec.actualOut || '—'}`}>
                        <div style={{
                          padding: '6px 8px', borderRadius: 6,
                          background: st.bg,
                          border: `1px solid ${st.color}30`,
                          minWidth: 76,
                          display: 'inline-flex',
                          flexDirection: 'column',
                          gap: 1, alignItems: 'center',
                        }}>
                          {rec.status === 'absent' || rec.status === 'incapacidad' ? (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: st.color, letterSpacing: '0.04em' }}>
                              {st.label.toUpperCase()}
                            </span>
                          ) : (
                            <>
                              <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: st.color }}>
                                {rec.actualIn || '—'}
                              </span>
                              <span className="mono" style={{ fontSize: 9.5, color: st.color, opacity: 0.85 }}>
                                {rec.delayMin > 0 && `+${rec.delayMin}m atraso`}
                                {rec.earlyMin > 0 && `−${rec.earlyMin}m salió`}
                                {rec.status === 'on_time' && '✓ ok'}
                                {rec.status === 'extra_hours' && '+ horas extra'}
                                {rec.status === 'no_clock_out' && 'sin salida'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="total-cell">
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{actual.toFixed(1)}h</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 500 }}>/ {scheduled.toFixed(1)}h</div>
                  </td>
                  <td className="total-cell" style={{ color: diff < 0 ? 'var(--terracotta)' : 'var(--emerald)' }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues section */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top incidencias del equipo</div>
              <div className="card-sub">Para conversaciones 1:1</div>
            </div>
          </div>
          <div style={{ padding: '12px 0' }}>
            {byEmployee.filter(x => x.incidents > 0).slice(0, 6).map(({ emp, incidents, delay }) => (
              <div className="shift-row" key={emp.id} style={{ cursor: 'pointer' }} onClick={() => setDetail({ emp, records: records.filter(r => r.empId === emp.id) })}>
                <div className="shift-avatar" style={{ background: emp.color }}>{emp.initials}</div>
                <div className="shift-meta">
                  <div className="shift-name">{emp.name}</div>
                  <div className="shift-role">{emp.role} · {emp.area}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                    {incidents} incidente{incidents > 1 ? 's' : ''}
                  </div>
                  {delay > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      +{delay} min de atraso
                    </div>
                  )}
                </div>
              </div>
            ))}
            {byEmployee.filter(x => x.incidents > 0).length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                Sin incidencias · todo el equipo en regla
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Ajuste a nómina</div>
              <div className="card-sub">Real vs programado · ${Math.abs(stats.diffH * 5).toFixed(2)} de diferencia</div>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => goTo('payroll')}>
              Ver nómina <window.Icons.ChevronRight size={12} />
            </button>
          </div>
          <div style={{ padding: 22 }}>
            <div className="between" style={{ marginBottom: 12, fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>Horas programadas</span>
              <span className="mono" style={{ fontWeight: 700 }}>{stats.totalScheduledH.toFixed(1)} h</span>
            </div>
            <div className="between" style={{ marginBottom: 12, fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>Horas trabajadas reales</span>
              <span className="mono" style={{ fontWeight: 700 }}>{stats.totalActualH.toFixed(1)} h</span>
            </div>
            <div className="between" style={{ marginBottom: 12, fontSize: 13, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600 }}>Diferencia</span>
              <span className="mono" style={{ fontWeight: 700, color: stats.diffH < 0 ? 'var(--terracotta)' : 'var(--emerald)' }}>
                {stats.diffH >= 0 ? '+' : ''}{stats.diffH.toFixed(1)} h
              </span>
            </div>
            <div className="alert-card warn" style={{ marginTop: 14 }}>
              <window.Icons.Clock size={16} />
              <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45 }}>
                La nómina se ajustará automáticamente con las horas reales. <b>Atrasos descuentan</b>, extras suman al 1.5×.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import drawer */}
      {importOpen && (
        <ImportDrawer onClose={() => setImportOpen(false)} onConfirm={handleImport} />
      )}

      {/* Detail drawer */}
      {detail && (
        <EmployeeDetailDrawer detail={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

/* ---------- Import Excel drawer ---------- */
function ImportDrawer({ onClose, onConfirm }) {
  const [step, setStep] = useStateAT(1); // 1 = drop, 2 = preview, 3 = mapping
  const [fileName, setFileName] = useStateAT('');
  const inputRef = useRefAT();

  const samplePreview = [
    { col_a: 'KAREN',  col_b: '19/05/2026', col_c: '', col_d: '' },
    { col_a: 'ERICK',  col_b: '21/05/2026', col_c: '16:32', col_d: '22:25' },
    { col_a: 'ERICK',  col_b: '22/05/2026', col_c: '15:30', col_d: '23:30' },
    { col_a: 'JOSUE',  col_b: '22/05/2026', col_c: '19:05', col_d: '23:28' },
    { col_a: 'ANDRE',  col_b: '19/05/2026', col_c: '16:30', col_d: '22:30' },
    { col_a: 'ANDRE',  col_b: '21/05/2026', col_c: '18:08', col_d: '22:30' },
    { col_a: 'JOSE',   col_b: '19/05/2026', col_c: '16:48', col_d: '22:18' },
    { col_a: 'MELANIE',col_b: '20/05/2026', col_c: '16:30', col_d: '22:30' },
    { col_a: 'NAYELI', col_b: '21/05/2026', col_c: '16:35', col_d: '22:30' },
    { col_a: 'ERICAR', col_b: '19/05/2026', col_c: '07:45', col_d: '18:25' },
  ];

  const handleFile = (file) => {
    setFileName(file.name);
    setStep(2);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer" style={{ width: 620 }}>
        <div className="drawer-head">
          <div>
            <div className="crumb">Importación</div>
            <h2 className="serif">Subir asistencia desde Excel</h2>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Acepta .xlsx / .csv con marcas de entrada y salida por colaborador
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <window.Icons.Plus size={14} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Stepper */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {[
              { n: 1, label: 'Subir archivo' },
              { n: 2, label: 'Mapear columnas' },
              { n: 3, label: 'Confirmar' },
            ].map(s => (
              <div key={s.n} style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                background: step >= s.n ? 'var(--emerald-soft)' : 'var(--surface-2)',
                color: step >= s.n ? 'var(--emerald)' : 'var(--muted)',
                fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span className="mono" style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: step >= s.n ? 'var(--emerald)' : 'var(--muted-2)',
                  color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {step > s.n ? '✓' : s.n}
                </span>
                {s.label}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: '2px dashed var(--line-2)',
                  borderRadius: 12,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--surface-2)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'var(--emerald-soft)', color: 'var(--emerald)',
                  display: 'grid', placeItems: 'center', margin: '0 auto 14px',
                }}>
                  <window.Icons.Download size={26} style={{ transform: 'rotate(180deg)' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                  Arrastra tu archivo aquí
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                  o haz clic para seleccionar · .xlsx, .xls, .csv
                </div>
                <button className="btn btn-primary" style={{ padding: '8px 18px' }}>
                  Seleccionar archivo
                </button>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                       onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Formato esperado</div>
                <div style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 10, background: '#fff' }}>
                  <table className="tbl" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Colaborador</th>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ERICK</td><td className="mono">21/05/2026</td><td className="mono">16:32</td><td className="mono">22:25</td>
                      </tr>
                      <tr>
                        <td>NAYELI</td><td className="mono">21/05/2026</td><td className="mono">16:35</td><td className="mono">22:30</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                    <button className="btn" style={{ padding: '4px 10px', fontSize: 11 }}>
                      <window.Icons.Download size={12} /> Descargar plantilla .xlsx
                    </button>
                    <span style={{ color: 'var(--muted)' }}>
                      También aceptamos el export directo de tu reloj checador
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <button className="btn" style={{ width: '100%', padding: '10px' }} onClick={() => handleFile({ name: 'asistencia_semana21.xlsx' })}>
                  Continuar con datos de demo
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="alert-card" style={{ background: 'var(--emerald-soft)', borderColor: 'var(--emerald)', marginBottom: 18 }}>
                <window.Icons.Check size={16} stroke={2.4} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fileName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    {samplePreview.length} filas detectadas · sin errores de formato
                  </div>
                </div>
                <button className="btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setStep(1)}>
                  Cambiar archivo
                </button>
              </div>

              <div className="section-label" style={{ marginBottom: 10 }}>Mapear columnas</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {[
                  { col: 'A', detected: 'Colaborador', match: 'Nombre del empleado', confidence: 100 },
                  { col: 'B', detected: 'Fecha', match: 'Fecha del turno', confidence: 100 },
                  { col: 'C', detected: 'Entrada', match: 'Hora marcaje entrada', confidence: 95 },
                  { col: 'D', detected: 'Salida', match: 'Hora marcaje salida', confidence: 95 },
                ].map(c => (
                  <div key={c.col} style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
                    <div className="between" style={{ marginBottom: 6 }}>
                      <span className="mono" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4 }}>Col {c.col}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--emerald)', fontWeight: 700 }}>{c.confidence}% match</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.detected}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>→ {c.match}</div>
                  </div>
                ))}
              </div>

              <div className="section-label" style={{ marginBottom: 10 }}>Vista previa (primeras filas)</div>
              <table className="tbl" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePreview.map((p, i) => {
                    const matched = EMPLOYEES.find(e => e.name.toUpperCase() === p.col_a);
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.col_a}</td>
                        <td className="mono">{p.col_b}</td>
                        <td className="mono">{p.col_c || '—'}</td>
                        <td className="mono">{p.col_d || '—'}</td>
                        <td>
                          {matched ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--emerald)', fontSize: 11, fontWeight: 600 }}>
                              <window.Icons.Check size={11} stroke={2.4} /> Vinculado
                            </span>
                          ) : (
                            <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>Sin match</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 18, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                Se cruzarán las marcas con los <b>horarios programados</b> de la misma semana para calcular automáticamente atrasos, ausencias y horas extras. La nómina se actualizará al confirmar.
              </div>
            </>
          )}
        </div>

        <div className="drawer-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {step === 1 ? 'Paso 1 de 3' : step === 2 ? 'Paso 2 de 3 · listo para confirmar' : ''}
          </div>
          <div className="row gap-2">
            <button className="btn" onClick={onClose}>Cancelar</button>
            {step === 2 && (
              <button className="btn btn-emerald" onClick={onConfirm}>
                <window.Icons.Check size={13} /> Confirmar e importar
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---------- Employee detail drawer ---------- */
function EmployeeDetailDrawer({ detail, onClose }) {
  const { emp, records } = detail;
  const incidents = records.filter(r => ['late','very_late','absent','early_leave','no_clock_out'].includes(r.status));
  const totalScheduled = records.reduce((a, r) => a + r.scheduledMin, 0) / 60;
  const totalActual = records.reduce((a, r) => a + r.actualMin, 0) / 60;
  const totalDelay = records.reduce((a, r) => a + r.delayMin, 0);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer" style={{ width: 520 }}>
        <div className="drawer-head">
          <div>
            <div className="crumb">Detalle de asistencia</div>
            <div className="row gap-2" style={{ marginTop: 8 }}>
              <div className="shift-avatar" style={{ background: emp.color, width: 44, height: 44, fontSize: 14 }}>{emp.initials}</div>
              <div>
                <div className="serif" style={{ fontSize: 22 }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {emp.role} · <span style={{ color: AREA_COLOR[emp.area] }}>{emp.area}</span>
                </div>
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <window.Icons.Plus size={14} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12, padding: 14,
            background: 'var(--surface-2)', borderRadius: 10, marginBottom: 22,
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Reales</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{totalActual.toFixed(1)}h</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Programadas</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{totalScheduled.toFixed(1)}h</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Atraso</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: totalDelay > 0 ? 'var(--gold)' : 'var(--emerald)' }}>
                {totalDelay} min
              </div>
            </div>
          </div>

          <div className="section-label" style={{ marginBottom: 10 }}>Día a día</div>
          <table className="tbl" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>Día</th>
                <th>Programado</th>
                <th>Real</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map(d => {
                const rec = records.find(r => r.day === d.key);
                if (!rec) return (
                  <tr key={d.key} style={{ color: 'var(--muted-2)' }}>
                    <td>{d.label}</td>
                    <td colSpan="3">Descanso</td>
                  </tr>
                );
                const st = STATUS_AT[rec.status];
                return (
                  <tr key={d.key}>
                    <td>{d.label}</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{rec.scheduledIn}–{rec.scheduledOut}</td>
                    <td className="mono">
                      {rec.actualIn || '—'} – {rec.actualOut || '—'}
                      {rec.delayMin > 0 && <span style={{ color: 'var(--gold)', fontSize: 11, marginLeft: 6 }}>+{rec.delayMin}m</span>}
                      {rec.earlyMin > 0 && <span style={{ color: 'var(--gold)', fontSize: 11, marginLeft: 6 }}>−{rec.earlyMin}m</span>}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700,
                        padding: '3px 7px', borderRadius: 4,
                        background: st.bg, color: st.color,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {incidents.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>Acciones sugeridas</div>
              <div className="alert-card warn">
                <window.Icons.Bell size={16} />
                <div style={{ flex: 1, fontSize: 12.5 }}>
                  {incidents.length} incidencia{incidents.length > 1 ? 's' : ''} esta semana — considerar conversación 1:1 con {emp.name.split(' ')[0]}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Datos al cierre de semana
          </div>
          <div className="row gap-2">
            <button className="btn">Enviar por correo</button>
            <button className="btn btn-primary">Justificar</button>
          </div>
        </div>
      </aside>
    </>
  );
}

window.AttendancePage = AttendancePage;
