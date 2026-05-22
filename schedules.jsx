// Schedules page — real Entrada/Salida/Carga format with editing, vacancies, balance, email
const { useState: useStateSC, useRef: useRefSC, useEffect: useEffectSC } = React;

function ShiftCell({ shift, isToday, onClick }) {
  if (!shift) {
    return <span className="shift-off" onClick={onClick}>—</span>;
  }
  const hrs = shiftHours(shift);
  const isMorning = parseInt(shift.in.split(':')[0], 10) < 12;
  const cls = ['shift-cell'];
  if (hrs >= 9) cls.push('long');
  if (isMorning) cls.push('morning');
  return (
    <button className={cls.join(' ')} onClick={onClick}>
      <span className="times">{shift.in}–{shift.out}</span>
      <span className="carga">{fmtHours(hrs)} h</span>
    </button>
  );
}

function VacancyCell({ note, onClick }) {
  return (
    <button className="shift-vacant" onClick={onClick} title={note}>
      <span className="v-label">Vacante</span>
      <span className="v-sub">sin cubrir</span>
    </button>
  );
}

function EditPopover({ open, x, y, shift, onSave, onClear, onClose }) {
  const [inT, setInT] = useStateSC(shift?.in || '');
  const [outT, setOutT] = useStateSC(shift?.out || '');
  useEffectSC(() => {
    setInT(shift?.in || '');
    setOutT(shift?.out || '');
  }, [shift]);
  if (!open) return null;
  return (
    <>
      <div className="popover-backdrop" onClick={onClose}></div>
      <div className="popover" style={{ left: x, top: y }}>
        <h4>Editar turno</h4>
        <div className="field">
          <label>Entrada</label>
          <input value={inT} onChange={e => setInT(e.target.value)} placeholder="16:30" />
        </div>
        <div className="field">
          <label>Salida</label>
          <input value={outT} onChange={e => setOutT(e.target.value)} placeholder="22:30" />
        </div>
        <div className="pop-foot">
          <button className="btn" style={{ padding: '5px 10px', fontSize: 11, color: 'var(--danger)' }} onClick={onClear}>
            Marcar descanso
          </button>
          <button className="btn btn-emerald" style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={() => onSave({ in: inT, out: outT })}>
            Guardar
          </button>
        </div>
      </div>
    </>
  );
}

function EmailDrawer({ open, onClose, schedule, week }) {
  const [recipients, setRecipients] = useStateSC(EMPLOYEES.map(e => e.id));
  const [sentTo, setSentTo] = useStateSC([]);
  const [sending, setSending] = useStateSC(false);

  if (!open) return null;

  const toggle = (id) => {
    setRecipients(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id]);
  };

  const send = () => {
    setSending(true);
    setTimeout(() => {
      setSentTo(recipients);
      setSending(false);
    }, 900);
  };

  const sampleEmp = EMPLOYEES.find(e => recipients.includes(e.id)) || EMPLOYEES[0];
  const sampleShifts = schedule[sampleEmp.id];
  const sampleTotal = WEEK_DAYS.reduce((a, d) => a + shiftHours(sampleShifts[d.key]), 0);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <div className="crumb" style={{ marginBottom: 4 }}>Envío de horarios</div>
            <h2 className="serif">Mandar horarios al equipo</h2>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Semana del {week} · {recipients.length} destinatarios seleccionados
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <window.Icons.Plus size={14} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="section-label" style={{ marginBottom: 10 }}>Vista previa</div>
          <div className="email-preview" style={{ marginBottom: 22 }}>
            <div className="em-from">
              <div><b style={{ color: 'var(--ink)' }}>De:</b> Sofía Mendoza &lt;sofia@comma.sv&gt;</div>
              <div><b style={{ color: 'var(--ink)' }}>Para:</b> {sampleEmp.email}</div>
              <div><b style={{ color: 'var(--ink)' }}>Asunto:</b> Tu horario · semana 19–25 mayo 2026</div>
            </div>
            <div className="em-subject">Hola {sampleEmp.name},</div>
            <p style={{ margin: '0 0 10px' }}>
              Te compartimos tu horario para esta semana. Cualquier cambio o impedimento,
              avísanos con al menos 24h de anticipación.
            </p>
            <table className="schedule-tbl" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Día</th>
                  <th style={{ textAlign: 'center' }}>Entrada</th>
                  <th style={{ textAlign: 'center' }}>Salida</th>
                  <th style={{ textAlign: 'right' }}>Carga</th>
                </tr>
              </thead>
              <tbody>
                {WEEK_DAYS.map(d => {
                  const s = sampleShifts[d.key];
                  return (
                    <tr key={d.key}>
                      <td>{d.label} {d.date}</td>
                      <td className="mono" style={{ textAlign: 'center' }}>{s ? s.in : '—'}</td>
                      <td className="mono" style={{ textAlign: 'center' }}>{s ? s.out : '—'}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{s ? fmtHours(shiftHours(s)) : '—'}</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 700 }}>
                  <td>Total semana</td>
                  <td></td><td></td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmtHours(sampleTotal)} h</td>
                </tr>
              </tbody>
            </table>
            <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--muted)' }}>
              — Equipo Comma · Sucursal Centro
            </p>
          </div>

          <div className="section-label" style={{ marginBottom: 10 }}>Destinatarios ({recipients.length})</div>
          {EMPLOYEES.map(e => {
            const isSel = recipients.includes(e.id);
            const isSent = sentTo.includes(e.id);
            return (
              <div className={`recip-row ${isSent ? 'sent' : ''}`} key={e.id} onClick={() => toggle(e.id)}>
                <div className={`recip-check ${isSel ? 'on' : ''}`}>
                  {(isSel || isSent) && <window.Icons.Check size={11} stroke={3} />}
                </div>
                <div className="shift-avatar" style={{ background: e.color, width: 28, height: 28, fontSize: 10 }}>
                  {e.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
                  <div className="recip-email">{e.email}</div>
                </div>
                <span className="task-tag" style={{ background: AREA_COLOR[e.area] + '20', color: AREA_COLOR[e.area] }}>
                  {e.area}
                </span>
              </div>
            );
          })}
        </div>

        <div className="drawer-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {sentTo.length > 0 ? `✓ Enviado a ${sentTo.length} de ${EMPLOYEES.length}` : 'Listo para enviar'}
          </div>
          <div className="row gap-2">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-emerald" onClick={send} disabled={sending || recipients.length === 0}>
              {sending ? 'Enviando…' :
               sentTo.length > 0 ? 'Reenviar' :
               <><window.Icons.Check size={13} /> Enviar a {recipients.length} {recipients.length === 1 ? 'persona' : 'personas'}</>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SchedulesPage() {
  const [schedule, setSchedule] = useStateSC(SCHEDULE);
  const [popover, setPopover] = useStateSC(null);
  const [drawerOpen, setDrawerOpen] = useStateSC(false);
  const [sentRows, setSentRows] = useStateSC(new Set());
  const [highlightVacant, setHighlightVacant] = useStateSC(true);

  const openEdit = (empId, dayKey, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      empId, dayKey,
      x: Math.min(rect.left, window.innerWidth - 270),
      y: rect.bottom + 6,
      shift: schedule[empId][dayKey],
    });
  };
  const closePop = () => setPopover(null);
  const saveShift = (s) => {
    setSchedule(prev => ({
      ...prev,
      [popover.empId]: { ...prev[popover.empId], [popover.dayKey]: s }
    }));
    closePop();
  };
  const clearShift = () => {
    setSchedule(prev => ({
      ...prev,
      [popover.empId]: { ...prev[popover.empId], [popover.dayKey]: null }
    }));
    closePop();
  };

  const sendRow = (empId) => {
    setSentRows(prev => { const n = new Set(prev); n.add(empId); return n; });
  };

  // compute weekly totals
  const totals = {};
  EMPLOYEES.forEach(e => {
    totals[e.id] = WEEK_DAYS.reduce((a, d) => a + shiftHours(schedule[e.id]?.[d.key]), 0);
  });
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  // per-area totals
  const areaTotals = {};
  AREAS.forEach(a => {
    areaTotals[a] = EMPLOYEES.filter(e => e.area === a).reduce((s, e) => s + totals[e.id], 0);
  });

  // per-day coverage
  const dayCoverage = WEEK_DAYS.map(d => ({
    ...d,
    count: EMPLOYEES.filter(e => schedule[e.id]?.[d.key]).length,
    hours: EMPLOYEES.reduce((a, e) => a + shiftHours(schedule[e.id]?.[d.key]), 0),
  }));

  return (
    <div data-screen-label="Schedules">
      <div className="between mb-3">
        <div className="row gap-2">
          <button className="icon-btn"><window.Icons.ChevronLeft size={14}/></button>
          <div>
            <div style={{fontSize: 14, fontWeight: 600}}>Semana 21 · 19–25 mayo 2026</div>
            <div style={{fontSize: 12, color: 'var(--muted)'}}>
              {EMPLOYEES.length} colaboradores · {fmtHours(grandTotal)} hrs asignadas · {VACANCIES.length} vacantes
            </div>
          </div>
          <button className="icon-btn"><window.Icons.ChevronRight size={14}/></button>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button>Día</button>
            <button className="active">Semana</button>
            <button>Mes</button>
          </div>
          <button className="btn" onClick={() => setHighlightVacant(v => !v)}>
            <window.Icons.Filter size={13}/> {highlightVacant ? 'Ocultar' : 'Mostrar'} vacantes
          </button>
          <button className="btn"><window.Icons.Download size={13}/> Exportar</button>
          <button className="btn btn-emerald" onClick={() => setDrawerOpen(true)}>
            <window.Icons.Bell size={13}/> Enviar por correo
          </button>
        </div>
      </div>

      {/* Vacancy alerts */}
      {highlightVacant && VACANCIES.length > 0 && (
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
          {VACANCIES.map((v, i) => {
            const day = WEEK_DAYS.find(d => d.key === v.day);
            return (
              <div className="alert-card danger" key={i}>
                <div style={{ width: 4, alignSelf: 'stretch', background: 'var(--danger)', borderRadius: 2 }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 700 }}>
                    Vacante sin cubrir · {day.label} {day.date}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                    {v.position} · <span className="mono">{v.needed}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{v.note}</div>
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>
                  Asignar refuerzo
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main schedule grid */}
      <div className="card mb-3">
        <div style={{ overflowX: 'auto' }}>
          <table className="sched-grid">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 220 }}>Área · Colaborador</th>
                {WEEK_DAYS.map(d => (
                  <th key={d.key} className={`day-h ${d.key === TODAY_KEY ? 'today' : ''}`}>
                    <div className="day-name">{d.short} {d.date}</div>
                    <div className="day-date">turno tarde</div>
                  </th>
                ))}
                <th style={{ textAlign: 'right', minWidth: 80 }}>Carga sem.</th>
                <th style={{ minWidth: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {AREAS.map(area => {
                const areaEmps = EMPLOYEES.filter(e => e.area === area);
                return (
                  <React.Fragment key={area}>
                    <tr className="sched-area-row">
                      <td colSpan={WEEK_DAYS.length + 3}>
                        <span className="area-tag">
                          <span className="area-dot" style={{ background: AREA_COLOR[area] }}></span>
                          {area}
                          <span style={{ color: 'var(--muted)', fontWeight: 500, letterSpacing: 0, textTransform: 'none', marginLeft: 8 }}>
                            {areaEmps.length} {areaEmps.length === 1 ? 'colaborador' : 'colaboradores'} · {fmtHours(areaTotals[area])} h
                          </span>
                        </span>
                      </td>
                    </tr>
                    {areaEmps.map(emp => {
                      const isSent = sentRows.has(emp.id);
                      // detect vacancy for this employee/day (Liss Friday)
                      const hasVacancy = (dayKey) => {
                        return VACANCIES.some(v =>
                          v.day === dayKey &&
                          v.area === emp.area &&
                          !schedule[emp.id]?.[dayKey] &&
                          emp.id === 12 && dayKey === 'vie' // demo specific
                        );
                      };
                      return (
                        <tr key={emp.id}>
                          <td className="emp-cell">
                            <div className="row-name">
                              <div className="shift-avatar" style={{ background: emp.color, width: 30, height: 30, fontSize: 11 }}>
                                {emp.initials}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{emp.role}</div>
                              </div>
                            </div>
                          </td>
                          {WEEK_DAYS.map(d => {
                            const s = schedule[emp.id]?.[d.key];
                            const vacant = hasVacancy(d.key) && highlightVacant;
                            return (
                              <td key={d.key} className={`day-cell ${d.key === TODAY_KEY ? 'today' : ''}`}>
                                {vacant ? (
                                  <VacancyCell note="Liss reportó incapacidad" onClick={(e) => openEdit(emp.id, d.key, e)} />
                                ) : (
                                  <ShiftCell shift={s} isToday={d.key === TODAY_KEY} onClick={(e) => openEdit(emp.id, d.key, e)} />
                                )}
                              </td>
                            );
                          })}
                          <td className="total-cell">{fmtHours(totals[emp.id])} h</td>
                          <td className="actions-cell">
                            <button
                              className={`row-icon-btn ${isSent ? 'sent' : ''}`}
                              title={isSent ? 'Horario enviado' : 'Enviar horario por correo'}
                              onClick={() => sendRow(emp.id)}
                            >
                              {isSent ? <window.Icons.Check size={13} stroke={2.4} /> : <window.Icons.Bell size={13} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg)' }}>
                <td className="emp-cell" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Cobertura por día
                </td>
                {dayCoverage.map(d => (
                  <td key={d.key} className={`day-cell ${d.key === TODAY_KEY ? 'today' : ''}`} style={{ height: 50 }}>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{d.count}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>{fmtHours(d.hours)} h</div>
                  </td>
                ))}
                <td className="total-cell" style={{ fontSize: 13 }}>{fmtHours(grandTotal)} h</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Balance / distribution analytics */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Distribución por colaborador</div>
              <div className="card-sub">Carga semanal · objetivo 40h por persona</div>
            </div>
          </div>
          <div style={{ padding: '18px 22px 22px' }}>
            <div className="balance-card">
              {EMPLOYEES.map(e => {
                const t = totals[e.id];
                const pct = Math.min(100, (t / 48) * 100);
                const targetX = (40 / 48) * 100;
                const over = t > 44;
                const under = t < 24 && t > 0;
                const zero = t === 0;
                return (
                  <div className="balance-row" key={e.id}>
                    <div className="between" style={{ fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="area-dot" style={{ background: AREA_COLOR[e.area] }}></span>
                        <span style={{ fontWeight: 600 }}>{e.name}</span>
                        <span style={{ color: 'var(--muted)' }}>· {e.area}</span>
                      </span>
                      <span className="mono" style={{
                        fontWeight: 700,
                        color: zero ? 'var(--muted-2)' : over ? 'var(--terracotta)' : under ? 'var(--gold)' : 'var(--ink)'
                      }}>
                        {fmtHours(t)} h
                        {over && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600 }}>SOBRE</span>}
                        {under && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600 }}>BAJO</span>}
                        {zero && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600 }}>SIN ASIGNAR</span>}
                      </span>
                    </div>
                    <div className="balance-bar">
                      <div className="fill" style={{
                        width: `${pct}%`,
                        background: zero ? 'transparent' : over ? 'var(--terracotta)' : under ? 'var(--gold)' : AREA_COLOR[e.area]
                      }}></div>
                      <div className="target" style={{ left: `${targetX}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Resumen por área</div>
              <div className="card-sub">Horas asignadas esta semana</div>
            </div>
          </div>
          <div style={{ padding: '18px 22px 6px' }}>
            {AREAS.map(area => {
              const total = areaTotals[area];
              const pct = (total / grandTotal) * 100;
              const emps = EMPLOYEES.filter(e => e.area === area).length;
              return (
                <div className="balance-row" key={area} style={{ marginBottom: 14 }}>
                  <div className="between" style={{ fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="area-dot" style={{ background: AREA_COLOR[area], width: 10, height: 10 }}></span>
                      <span style={{ fontWeight: 600 }}>{area}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>· {emps} pers.</span>
                    </span>
                    <span className="mono" style={{ fontWeight: 700 }}>{fmtHours(total)} h <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {pct.toFixed(0)}%</span></span>
                  </div>
                  <div className="balance-bar" style={{ height: 8 }}>
                    <div className="fill" style={{ width: `${pct * 2}%`, background: AREA_COLOR[area] }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--line)', marginTop: 6 }}>
            <div className="section-label" style={{ paddingTop: 16, marginBottom: 10 }}>Diagnóstico</div>
            <div className="alert-card warn">
              <window.Icons.Clock size={16} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                <b>Karen</b> sin turnos asignados esta semana — coordinar antes del lunes.
              </div>
            </div>
            <div className="alert-card warn">
              <window.Icons.Clock size={16} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                Cobertura del <b>miércoles</b> baja (3 personas) — considerar reforzar servicio.
              </div>
            </div>
            <div className="alert-card" style={{ background: 'var(--emerald-soft)', borderColor: 'var(--emerald)' }}>
              <window.Icons.Check size={16} stroke={2.4} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                Bar y Cocina dentro del rango objetivo (28–44h por persona).
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditPopover
        open={!!popover}
        x={popover?.x}
        y={popover?.y}
        shift={popover?.shift}
        onSave={saveShift}
        onClear={clearShift}
        onClose={closePop}
      />

      <EmailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        schedule={schedule}
        week="19–25 mayo 2026"
      />
    </div>
  );
}

window.SchedulesPage = SchedulesPage;
