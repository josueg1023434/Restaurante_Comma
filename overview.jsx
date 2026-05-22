// Overview page — KPIs, chart, today's schedule, weekly preview
const { useState: useStateOV, useEffect: useEffectOV } = React;

function OccupancyChart({ hourlyData }) {
  const W = 720, H = 220, padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  // pick operating hours 12-23 (12 cells)
  const window = hourlyData ? hourlyData.slice(12, 24) : null;
  const HOURS = window ? window.map(h => String(h.hour).padStart(2, '0')) : ['12','13','14','15','16','17','18','19','20','21','22','23'];
  const max = window ? Math.max(...window.map(h => h.count)) * 1.1 : 100;
  const OCCUPANCY = window ? window.map(h => h.count) : [12, 28, 36, 22, 18, 38, 62, 78, 84, 72, 52, 32];
  const REVENUE = window ? window.map(h => h.revenue) : OCCUPANCY.map(v => v * 5);
  const maxR = Math.max(...REVENUE) * 1.1 || 1;
  const step = innerW / (HOURS.length - 1);
  const linePts = OCCUPANCY.map((v, i) => `${padL + i * step},${padT + innerH - (v / max) * innerH}`).join(' ');
  const areaPath = `M ${padL},${padT + innerH} L ${OCCUPANCY.map((v, i) => `${padL + i * step},${padT + innerH - (v / max) * innerH}`).join(' L ')} L ${padL + innerW},${padT + innerH} Z`;
  const barW = (innerW / HOURS.length) * 0.42;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(max * t));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{display: 'block'}}>
      {ticks.map(v => (
        <g key={v}>
          <line x1={padL} x2={padL + innerW} y1={padT + innerH - (v / max) * innerH} y2={padT + innerH - (v / max) * innerH} stroke="#ECEAE2" strokeWidth="1" strokeDasharray={v === 0 ? '0' : '2 3'} />
          <text x={padL - 8} y={padT + innerH - (v / max) * innerH + 3} fontSize="10" fill="#8A8A82" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>
        </g>
      ))}
      {REVENUE.map((v, i) => {
        const x = padL + i * step - barW / 2;
        const h = (v / maxR) * innerH;
        return <rect key={i} x={x} y={padT + innerH - h} width={barW} height={h} rx="2" fill="#F4ECDA" />;
      })}
      <path d={areaPath} fill="rgba(15,107,78,0.07)" />
      <polyline points={linePts} fill="none" stroke="#0F6B4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {OCCUPANCY.map((v, i) => (
        <circle key={i} cx={padL + i * step} cy={padT + innerH - (v / max) * innerH} r="3.5" fill="#fff" stroke="#0F6B4E" strokeWidth="2" />
      ))}
      {HOURS.map((h, i) => (
        <text key={h} x={padL + i * step} y={H - 8} fontSize="10.5" fill="#8A8A82" textAnchor="middle" fontFamily="JetBrains Mono">{h}h</text>
      ))}
    </svg>
  );
}

function OverviewPage({ goTo }) {
  const insights = window.useInsights ? window.useInsights() : null;

  // Compute today's shifts from real schedule
  const todayList = EMPLOYEES
    .map(e => ({ emp: e, shift: SCHEDULE[e.id][TODAY_KEY], status: liveStatus(e) }))
    .filter(x => x.shift)
    .sort((a, b) => {
      const aTime = parseInt(a.shift.in.replace(':', ''), 10);
      const bTime = parseInt(b.shift.in.replace(':', ''), 10);
      return aTime - bTime;
    });

  const onNow = todayList.filter(x => x.status === 'on').length;
  const upcoming = todayList.filter(x => x.status === 'upcoming').length;

  // Compute total hours for the week
  const totalHours = EMPLOYEES.reduce((sum, e) =>
    sum + WEEK_DAYS.reduce((a, d) => a + shiftHours(SCHEDULE[e.id]?.[d.key]), 0)
  , 0);

  // Real sales numbers
  const lastMonth = insights?.monthly?.[insights.monthly.length - 1];
  const prevMonth = insights?.monthly?.[insights.monthly.length - 2];
  const monthGrowth = prevMonth && lastMonth ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
  const avgTicket = insights?.salesSummary?.avgTicket || 0;
  const totalFacturas = insights?.salesSummary?.facturas || 0;

  const fmtK = (n) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : '$' + Math.round(n);

  return (
    <div data-screen-label="Overview">
      {/* KPI row */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Ingresos · último mes</div>
          <div className="kpi-value">
            {lastMonth ? fmtK(lastMonth.revenue) : '—'}
            <span className="unit">USD</span>
          </div>
          <div className="kpi-foot">
            <span className={`trend ${monthGrowth >= 0 ? '' : 'down'}`}>
              <Icons.ArrowUp size={11} stroke={2.2} style={{ transform: monthGrowth >= 0 ? 'none' : 'rotate(180deg)' }} />
              {Math.abs(monthGrowth).toFixed(1)}%
            </span>
            <span>vs. mes anterior</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Ticket promedio</div>
          <div className="kpi-value">${avgTicket.toFixed(2)}</div>
          <div className="kpi-foot">
            <span className="trend flat">{totalFacturas.toLocaleString()} facturas</span>
            <span>5 meses datos</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">En turno ahora</div>
          <div className="kpi-value">{onNow}<span className="unit">/ {EMPLOYEES.length} activos</span></div>
          <div className="kpi-foot">
            <span className="trend">{upcoming} próximos</span>
            <span>Jue. 22 · 18:30</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Vacantes sin cubrir</div>
          <div className="kpi-value" style={{color: 'var(--terracotta)'}}>{VACANCIES.length}<span className="unit">esta sem.</span></div>
          <div className="kpi-foot">
            <span className="trend down"><Icons.ArrowUp size={11} stroke={2.2}/> +1</span>
            <span>Vie. + Sáb. tarde</span>
          </div>
        </div>
      </div>

      {/* Chart + Today's shift */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Patrón de operación · hora del día</div>
              <div className="card-sub">Facturas e ingresos promedio por hora · datos reales POS</div>
            </div>
            <div className="tabs">
              <button className="active">5 meses</button>
              <button>30 días</button>
            </div>
          </div>
          <div className="chart-legend">
            <span><span className="legend-swatch" style={{background: '#0F6B4E'}}></span>Facturas</span>
            <span><span className="legend-swatch" style={{background: '#F4ECDA'}}></span>Ingresos</span>
          </div>
          <div style={{padding: '0 22px 18px'}}>
            <OccupancyChart hourlyData={insights?.hourly} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Turnos de hoy</div>
              <div className="card-sub">{todayList.length} programados · {onNow} en operación</div>
            </div>
            <button className="btn" style={{padding: '5px 10px', fontSize: 12}} onClick={() => goTo('schedules')}>
              Ver todos <Icons.ChevronRight size={12}/>
            </button>
          </div>
          <div className="shift-list">
            {todayList.map(({ emp, shift, status }) => (
              <div className="shift-row" key={emp.id}>
                <div className="shift-avatar" style={{background: emp.color}}>{emp.initials}</div>
                <div className="shift-meta">
                  <div className="shift-name">{emp.name}</div>
                  <div className="shift-role">{emp.role} · <span style={{color: AREA_COLOR[emp.area]}}>{emp.area}</span></div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div className="shift-time">{shift.in}–{shift.out}</div>
                  <div className="shift-role" style={{display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end'}}>
                    <span className={`status-dot ${status === 'on' ? '' : status === 'upcoming' ? 'break' : 'off'}`}></span>
                    {STATUS_LABEL[status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly schedule preview — destacado */}
      <div className="card mb-3">
        <div className="card-head">
          <div>
            <div className="card-title">Horarios · Semana 21 (19–25 may.)</div>
            <div className="card-sub">Equipo Comma · {EMPLOYEES.length} colaboradores · clic para abrir vista completa</div>
          </div>
          <div className="row gap-2">
            <button className="btn" onClick={() => goTo('schedules')}>
              <Icons.Bell size={13}/> Enviar por correo
            </button>
            <button className="btn-primary btn" onClick={() => goTo('schedules')}>
              Editar semana <Icons.ChevronRight size={12}/>
            </button>
          </div>
        </div>
        <div style={{padding: '6px 22px 22px', overflowX: 'auto'}}>
          <table className="sched-grid">
            <thead>
              <tr>
                <th style={{textAlign: 'left', minWidth: 200}}>Área · Colaborador</th>
                {WEEK_DAYS.map(d => (
                  <th key={d.key} className={`day-h ${d.key === TODAY_KEY ? 'today' : ''}`}>
                    <div className="day-name">{d.short}</div>
                    <div className="day-date">{d.date}</div>
                  </th>
                ))}
                <th style={{textAlign: 'right', minWidth: 70}}>Carga</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.slice(0, 8).map(emp => {
                const total = WEEK_DAYS.reduce((a, d) => a + shiftHours(SCHEDULE[emp.id]?.[d.key]), 0);
                return (
                  <tr key={emp.id}>
                    <td className="emp-cell">
                      <div className="row-name">
                        <div className="shift-avatar" style={{background: emp.color, width: 28, height: 28, fontSize: 10}}>{emp.initials}</div>
                        <div>
                          <div style={{fontSize: 13, fontWeight: 600}}>{emp.name}</div>
                          <div style={{fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6}}>
                            <span className="area-dot" style={{background: AREA_COLOR[emp.area]}}></span>
                            {emp.area}
                          </div>
                        </div>
                      </div>
                    </td>
                    {WEEK_DAYS.map(d => {
                      const s = SCHEDULE[emp.id]?.[d.key];
                      return (
                        <td key={d.key} className={`day-cell ${d.key === TODAY_KEY ? 'today' : ''}`}>
                          {s ? (
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: 4}}>
                              <span className="mono" style={{fontSize: 11.5, fontWeight: 600}}>{s.in}–{s.out}</span>
                              <span className="mono" style={{fontSize: 10, color: 'var(--muted)'}}>{fmtHours(shiftHours(s))} h</span>
                            </div>
                          ) : (
                            <span style={{color: 'var(--muted-2)', fontSize: 11}}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="total-cell">{fmtHours(total)} h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{textAlign: 'center', padding: '14px 0 0', borderTop: '1px solid var(--line)', marginTop: 4}}>
            <button className="btn" style={{fontSize: 12}} onClick={() => goTo('schedules')}>
              Ver los {EMPLOYEES.length - 8} colaboradores restantes
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: alerts + role distribution */}
      <div className="grid-2b">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Alertas operativas</div>
              <div className="card-sub">Requieren atención del supervisor</div>
            </div>
            <button className="btn" style={{padding: '5px 10px', fontSize: 12}}>Ver todas</button>
          </div>
          <div style={{padding: '6px 0'}}>
            <div className="shift-row">
              <div style={{width: 8, height: 8, borderRadius: 4, background: 'var(--danger)'}}></div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 13, fontWeight: 600}}>Liss — incapacidad Vie. 22</div>
                <div style={{fontSize: 11.5, color: 'var(--muted)'}}>Caja · 18:00–23:30 · vacante sin cubrir</div>
              </div>
              <button className="btn" style={{padding: '4px 10px', fontSize: 11}} onClick={() => goTo('schedules')}>Resolver</button>
            </div>
            <div className="shift-row">
              <div style={{width: 8, height: 8, borderRadius: 4, background: 'var(--gold)'}}></div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 13, fontWeight: 600}}>Refuerzo cocina — sábado tarde</div>
                <div style={{fontSize: 11.5, color: 'var(--muted)'}}>Proyección 92% ocupación · falta 1 auxiliar</div>
              </div>
              <button className="btn" style={{padding: '4px 10px', fontSize: 11}} onClick={() => goTo('schedules')}>Asignar</button>
            </div>
            <div className="shift-row">
              <div style={{width: 8, height: 8, borderRadius: 4, background: 'var(--gold)'}}></div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 13, fontWeight: 600}}>Karen — sin turnos asignados</div>
                <div style={{fontSize: 11.5, color: 'var(--muted)'}}>Servicio · semana 21 · 0 horas</div>
              </div>
              <button className="btn" style={{padding: '4px 10px', fontSize: 11}} onClick={() => goTo('schedules')}>Programar</button>
            </div>
            <div className="shift-row">
              <div style={{width: 8, height: 8, borderRadius: 4, background: 'var(--emerald)'}}></div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 13, fontWeight: 600}}>Horarios pendientes de envío</div>
                <div style={{fontSize: 11.5, color: 'var(--muted)'}}>12 correos listos · semana 19–25 may.</div>
              </div>
              <button className="btn btn-emerald" style={{padding: '4px 10px', fontSize: 11}} onClick={() => goTo('schedules')}>Enviar</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Distribución por área</div>
              <div className="card-sub">Plantilla activa · {EMPLOYEES.length} colaboradores</div>
            </div>
          </div>
          <div style={{padding: 22}}>
            {AREAS.map((area) => {
              const emps = EMPLOYEES.filter(e => e.area === area);
              const hours = emps.reduce((a, e) => a + WEEK_DAYS.reduce((s, d) => s + shiftHours(SCHEDULE[e.id]?.[d.key]), 0), 0);
              const pct = Math.round((emps.length / EMPLOYEES.length) * 100);
              return (
                <div key={area} style={{marginBottom: 16}}>
                  <div className="between" style={{marginBottom: 6, fontSize: 13}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500}}>
                      <span className="area-dot" style={{background: AREA_COLOR[area], width: 10, height: 10}}></span>
                      {area}
                    </span>
                    <span className="mono muted" style={{fontSize: 12}}>{emps.length} pers · {fmtHours(hours)} h</span>
                  </div>
                  <div style={{height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden'}}>
                    <div style={{width: `${pct}%`, height: '100%', background: AREA_COLOR[area], borderRadius: 3}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

window.OverviewPage = OverviewPage;
