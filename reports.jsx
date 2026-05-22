// Reports page — real metrics from POS exports
const { useState: useStateRP, useEffect: useEffectRP } = React;

// Load insights.json once at module load
let _insights = null;
function useInsights() {
  const [data, setData] = useStateRP(_insights);
  useEffectRP(() => {
    if (!_insights) {
      fetch('insights.json').then(r => r.json()).then(d => {
        _insights = d;
        setData(d);
      });
    }
  }, []);
  return data;
}

const fmtMoney = (n) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtMoneyD = (n) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n) => {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
};

/* ---------- Monthly revenue chart ---------- */
function MonthlyChart({ data }) {
  const W = 720, H = 220, padL = 50, padR = 16, padT = 16, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(...data.map(d => d.revenue)) * 1.1;
  const step = innerW / (data.length - 1 || 1);
  const linePts = data.map((d, i) => `${padL + i * step},${padT + innerH - (d.revenue / max) * innerH}`).join(' ');
  const areaPath = `M ${padL},${padT + innerH} L ${data.map((d, i) => `${padL + i * step},${padT + innerH - (d.revenue / max) * innerH}`).join(' L ')} L ${padL + innerW},${padT + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(max * t));

  const monthLabel = (m) => {
    const [y, mo] = m.split('-');
    return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(mo,10)-1] + ' ' + y.slice(2);
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      {ticks.map(v => (
        <g key={v}>
          <line x1={padL} x2={padL + innerW} y1={padT + innerH - (v / max) * innerH} y2={padT + innerH - (v / max) * innerH}
                stroke="#ECEAE2" strokeWidth="1" strokeDasharray={v === 0 ? '0' : '2 3'} />
          <text x={padL - 8} y={padT + innerH - (v / max) * innerH + 3} fontSize="10"
                fill="#8A8A82" textAnchor="end" fontFamily="JetBrains Mono">
            {fmtCompact(v)}
          </text>
        </g>
      ))}
      <path d={areaPath} fill="rgba(15,107,78,0.10)" />
      <polyline points={linePts} fill="none" stroke="#0F6B4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.month}>
          <circle cx={padL + i * step} cy={padT + innerH - (d.revenue / max) * innerH} r="4" fill="#fff" stroke="#0F6B4E" strokeWidth="2.5" />
          <text x={padL + i * step} y={padT + innerH - (d.revenue / max) * innerH - 12} fontSize="11"
                fill="#161614" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">
            {fmtCompact(d.revenue)}
          </text>
          <text x={padL + i * step} y={H - 12} fontSize="11" fill="#8A8A82" textAnchor="middle">
            {monthLabel(d.month)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- Day of week + Hourly ---------- */
function DayOfWeekBars({ data }) {
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div style={{ padding: '12px 22px 22px' }}>
      {data.slice(1).concat(data[0]).map(d => ( // start Mon
        <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 30, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{d.day}</div>
          <div style={{ flex: 1, height: 24, background: 'var(--surface-2)', borderRadius: 4, position: 'relative' }}>
            <div style={{
              width: `${(d.revenue / max) * 100}%`, height: '100%',
              background: 'var(--emerald)', borderRadius: 4,
            }}></div>
            <div className="mono" style={{
              position: 'absolute', right: 8, top: 4, fontSize: 11, fontWeight: 700,
              color: (d.revenue / max) > 0.4 ? '#fff' : 'var(--ink)',
            }}>
              {fmtCompact(d.revenue)}
            </div>
          </div>
          <div className="mono" style={{ width: 60, textAlign: 'right', fontSize: 10.5, color: 'var(--muted)' }}>
            {d.count} fact
          </div>
        </div>
      ))}
    </div>
  );
}

function HourlyHeatmap({ data }) {
  const max = Math.max(...data.map(d => d.revenue));
  // collapse to operating hours 11-23
  const window = data.slice(11, 24);
  return (
    <div style={{ padding: '12px 22px 22px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 3 }}>
        {window.map(h => {
          const intensity = h.revenue / max;
          return (
            <div key={h.hour} style={{
              aspectRatio: '1 / 1',
              borderRadius: 4,
              background: `rgba(15,107,78,${0.08 + intensity * 0.85})`,
              display: 'grid',
              placeItems: 'center',
              color: intensity > 0.45 ? '#fff' : 'var(--ink)',
              fontSize: 9.5,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
            }} title={`${h.hour}:00 — ${fmtMoneyD(h.revenue)}`}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{h.hour}h</div>
              <div style={{ fontSize: 10.5 }}>{h.count}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
        Facturas por hora de operación · intensidad ∝ ingresos
      </div>
    </div>
  );
}

/* ---------- Donut chart for categories/payments ---------- */
function Donut({ data, colors, label = 'value' }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const R = 64, r = 44, cx = 90, cy = 90;
  let cum = 0;
  const arcs = data.map((d, i) => {
    const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
    cum += d.value;
    const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const xi2 = cx + r * Math.cos(end), yi2 = cy + r * Math.sin(end);
    const xi1 = cx + r * Math.cos(start), yi1 = cy + r * Math.sin(start);
    return { d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`, color: colors[i % colors.length] };
  });
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '14px 22px 22px' }}>
      <svg viewBox="0 0 180 180" width="180" height="180">
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
        <text x="90" y="86" textAnchor="middle" fontSize="11" fill="#8A8A82" fontFamily="Manrope">Total</text>
        <text x="90" y="106" textAnchor="middle" fontSize="18" fontWeight="700" fill="#161614" fontFamily="JetBrains Mono">
          {fmtCompact(total)}
        </text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map((d, i) => (
          <div key={d.name} className="between" style={{ marginBottom: 10, fontSize: 12.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], flexShrink: 0 }}></span>
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            </span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {fmtCompact(d.value)}
              <span style={{ color: 'var(--muted)', fontWeight: 500, marginLeft: 6 }}>
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Reports page ---------- */
function ReportsPage({ goTo }) {
  const d = useInsights();
  const [range, setRange] = useStateRP('all');

  if (!d) {
    return (
      <div data-screen-label="Reports">
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          Cargando reportes del sistema…
        </div>
      </div>
    );
  }

  const monthLabel = (m) => {
    const [y, mo] = m.split('-');
    return ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][parseInt(mo,10)-1] + ' ' + y;
  };

  // Find staff members who are meseros
  const meseroLookup = {};
  d.byMesero.forEach(m => { meseroLookup[m.name.toUpperCase()] = m; });
  const activeMeseros = EMPLOYEES.map(e => ({
    emp: e,
    sales: meseroLookup[e.name.toUpperCase()] || null,
  })).filter(x => x.sales);

  const lastMonth = d.monthly[d.monthly.length - 1];
  const prevMonth = d.monthly[d.monthly.length - 2];
  const monthGrowth = prevMonth ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;

  return (
    <div data-screen-label="Reports">
      <div className="between mb-3">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Reportes del sistema · {monthLabel(d.salesSummary.periodFirst)} – {monthLabel(d.salesSummary.periodLast)}
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{d.salesSummary.facturas.toLocaleString()} facturas</span>
            <span style={{ color: 'var(--muted)' }}> · datos sincronizados al 25 abr 2026</span>
          </div>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className={range === 'month' ? 'active' : ''} onClick={() => setRange('month')}>Último mes</button>
            <button className={range === 'q' ? 'active' : ''} onClick={() => setRange('q')}>Trimestre</button>
            <button className={range === 'all' ? 'active' : ''} onClick={() => setRange('all')}>Todo el periodo</button>
          </div>
          <button className="btn"><window.Icons.Download size={13} /> Descargar PDF</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Ingresos totales</div>
          <div className="kpi-value">{fmtCompact(d.salesSummary.totalGross)}<span className="unit">USD</span></div>
          <div className="kpi-foot">
            <span className="trend"><window.Icons.ArrowUp size={11} stroke={2.2} /> {monthGrowth > 0 ? '+' : ''}{monthGrowth.toFixed(1)}%</span>
            <span>vs. mes anterior</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Ticket promedio</div>
          <div className="kpi-value">${d.salesSummary.avgTicket.toFixed(2)}</div>
          <div className="kpi-foot">
            <span className="trend flat">por factura</span>
            <span>{d.salesSummary.facturas.toLocaleString()} facturas</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">IVA recaudado</div>
          <div className="kpi-value">{fmtCompact(d.salesSummary.totalIva)}<span className="unit">USD</span></div>
          <div className="kpi-foot">
            <span className="trend flat">{((d.salesSummary.totalIva / d.salesSummary.totalGross) * 100).toFixed(1)}% efectivo</span>
            <span>5 meses</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Anulaciones</div>
          <div className="kpi-value" style={{ color: 'var(--terracotta)' }}>{d.cancellations.total}</div>
          <div className="kpi-foot">
            <span className="trend down">{((d.cancellations.total / d.salesSummary.facturas) * 100).toFixed(2)}%</span>
            <span>tasa anulación</span>
          </div>
        </div>
      </div>

      {/* Monthly trend + DOW */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Tendencia mensual de ingresos</div>
              <div className="card-sub">5 meses · {fmtCompact(d.salesSummary.totalGross)} acumulado</div>
            </div>
          </div>
          <div style={{ padding: '6px 22px 18px' }}>
            <MonthlyChart data={d.monthly} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Ingresos por día de semana</div>
              <div className="card-sub">Detecta tu día más fuerte</div>
            </div>
          </div>
          <DayOfWeekBars data={d.dayOfWeek} />
        </div>
      </div>

      {/* Hourly + Categories */}
      <div className="grid-2b mb-3">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Hora pico — calor de operación</div>
              <div className="card-sub">Facturas por hora · 11h a 23h</div>
            </div>
          </div>
          <HourlyHeatmap data={d.hourly} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Mix por categoría</div>
              <div className="card-sub">Ingresos · todo el periodo</div>
            </div>
          </div>
          <Donut
            data={d.byCategory.filter(c => c.revenue > 100).map(c => ({ name: c.name, value: c.revenue }))}
            colors={['#0F6B4E', '#C8623C', '#B58A3C', '#4A3F8C', '#2E5C8A', '#7A5237', '#3D7A6B']}
          />
        </div>
      </div>

      {/* Meseros vs Staff — connect sales to people */}
      <div className="card mb-3">
        <div className="card-head">
          <div>
            <div className="card-title">Ventas atribuidas al equipo</div>
            <div className="card-sub">Top vendedores cruzados con tu plantilla actual</div>
          </div>
          <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => goTo('staff')}>
            Ver directorio <window.Icons.ChevronRight size={12} />
          </button>
        </div>
        <div style={{ padding: 22 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Mesero</th>
                <th>Vinculado con</th>
                <th style={{ textAlign: 'right' }}>Facturas</th>
                <th style={{ textAlign: 'right' }}>Artículos</th>
                <th style={{ textAlign: 'right' }}>Ingresos atribuidos</th>
                <th style={{ textAlign: 'right' }}>Promedio/factura</th>
                <th style={{ textAlign: 'right' }}>% del total</th>
              </tr>
            </thead>
            <tbody>
              {d.byMesero.slice(0, 10).map(m => {
                const emp = EMPLOYEES.find(e => e.name.toUpperCase() === m.name.toUpperCase());
                const pct = (m.revenue / d.salesSummary.totalGross) * 100;
                return (
                  <tr key={m.name}>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</td>
                    <td>
                      {emp ? (
                        <div className="row-name">
                          <div className="shift-avatar" style={{ background: emp.color, width: 24, height: 24, fontSize: 9 }}>
                            {emp.initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 12.5 }}>{emp.role}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{emp.area} · activo</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted-2)', fontStyle: 'italic' }}>No vinculado (histórico)</span>
                      )}
                    </td>
                    <td className="num" style={{ textAlign: 'right' }}>{m.tickets}</td>
                    <td className="num" style={{ textAlign: 'right', color: 'var(--muted)' }}>{m.qty}</td>
                    <td className="num total" style={{ textAlign: 'right' }}>{fmtMoneyD(m.revenue)}</td>
                    <td className="num" style={{ textAlign: 'right', color: 'var(--muted)' }}>
                      ${(m.revenue / m.tickets).toFixed(2)}
                    </td>
                    <td className="num" style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 80,
                        height: 6,
                        background: 'var(--surface-2)',
                        borderRadius: 3,
                        verticalAlign: 'middle',
                        marginRight: 8,
                        position: 'relative',
                      }}>
                        <span style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${pct * 2}%`,
                          background: emp ? AREA_COLOR[emp.area] : 'var(--muted-2)',
                          borderRadius: 3,
                        }}></span>
                      </span>
                      <span className="mono" style={{ fontSize: 11 }}>{pct.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Despacho + payment + top articles */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top artículos por ingresos</div>
              <div className="card-sub">{d.topArticles.length} productos · ingresos del periodo</div>
            </div>
          </div>
          <div style={{ padding: 22 }}>
            {d.topArticles.slice(0, 10).map((a, i) => {
              const max = d.topArticles[0].revenue;
              return (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div className="mono" style={{ width: 24, color: 'var(--muted)', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.cat} · {a.qty} u.</div>
                  </div>
                  <div style={{ width: 100 }}>
                    <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(a.revenue / max) * 100}%`, height: '100%', background: AREA_COLOR.Cocina }}></div>
                    </div>
                  </div>
                  <div className="mono" style={{ width: 70, textAlign: 'right', fontSize: 12.5, fontWeight: 700 }}>
                    {fmtCompact(a.revenue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Distribución por ubicación</div>
              <div className="card-sub">¿Dónde se vende más?</div>
            </div>
          </div>
          <Donut
            data={d.despacho.filter(x => x.type !== 'OTRO').map(x => ({ name: x.type, value: x.revenue }))}
            colors={['#0F6B4E', '#C8623C', '#B58A3C', '#4A3F8C', '#2E5C8A']}
          />
          <div style={{ padding: '0 22px 22px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <b style={{ color: 'var(--emerald)' }}>JARDÍN lidera</b> con 51% del negocio — considerar reforzar servicio outdoor en horas pico.
            </div>
          </div>
        </div>
      </div>

      {/* Payment + cancellations */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Formas de pago</div>
              <div className="card-sub">Distribución de cobros</div>
            </div>
          </div>
          <Donut
            data={d.paymentMethods.slice(0, 5).map(p => ({ name: p.name, value: p.revenue }))}
            colors={['#0F6B4E', '#C8623C', '#B58A3C', '#4A3F8C', '#7A5237']}
          />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top clientes recurrentes</div>
              <div className="card-sub">Excluye consumidor final</div>
            </div>
          </div>
          <div style={{ padding: '16px 0 8px' }}>
            {d.topClients.slice(0, 7).map((c, i) => (
              <div key={i} className="shift-row" style={{ padding: '10px 22px' }}>
                <div className="shift-avatar" style={{
                  background: COLORS[i % COLORS.length],
                  width: 30, height: 30, fontSize: 11,
                }}>
                  {c.name.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.qty} compras · margen {c.margen.toFixed(0)}%</div>
                </div>
                <div className="mono" style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  {fmtMoneyD(c.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory + cancellations alerts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">⚠ Alertas de inventario</div>
              <div className="card-sub">
                {d.inventory.negativeStock} artículos con stock negativo · revisar conteo físico
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Stock más crítico (negativos)</div>
            {d.inventory.topNegative.slice(0, 6).map((it, i) => (
              <div key={i} className="between" style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--line)' : 'none', fontSize: 12.5 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.articulo}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{it.linea}</div>
                </div>
                <div className="mono" style={{ color: 'var(--danger)', fontWeight: 700 }}>{it.existencia}</div>
              </div>
            ))}
            <div className="alert-card warn" style={{ marginTop: 14 }}>
              <window.Icons.Inventory size={16} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                <b>{d.inventory.negativeStock} de {d.inventory.items} artículos</b> tienen stock negativo. Sugerido: hacer conteo físico esta semana.
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Pedidos anulados — recientes</div>
              <div className="card-sub">{d.cancellations.total} en el periodo · revisar motivos</div>
            </div>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            {d.cancellations.sample.slice(0, 6).map((c, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--line)' : 'none' }}>
                <div className="between" style={{ marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{c.mesa}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c.monto > 0 ? 'var(--terracotta)' : 'var(--muted)' }}>
                    {c.monto > 0 ? fmtMoneyD(c.monto) : 'Sin monto'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{c.motivo || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.ReportsPage = ReportsPage;
window.useInsights = useInsights;
