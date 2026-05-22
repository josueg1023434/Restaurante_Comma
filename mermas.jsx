// Mermas / Desperdicios — waste tracking with causes, stations, $ impact
const { useState: useStateWS, useMemo: useMemoWS } = React;

// Waste reasons with associated colors
const REASONS = {
  vencimiento:      { label: 'Vencimiento',      color: '#C8623C', icon: 'Clock' },
  ruptura:          { label: 'Ruptura',          color: '#B43A3A', icon: 'Plus' },
  error_cocina:     { label: 'Error cocina',     color: '#B58A3C', icon: 'Inventory' },
  devolucion:       { label: 'Devolución cliente',color: '#4A3F8C', icon: 'ArrowDown' },
  quemado:          { label: 'Quemado',          color: '#7A2C2C', icon: 'Plus' },
  accidente:        { label: 'Accidente',        color: '#A33A6B', icon: 'Plus' },
  sobrante_cierre:  { label: 'Sobrante cierre',  color: '#7A7A72', icon: 'Clock' },
  contaminacion:    { label: 'Contaminación',    color: '#5C3D7A', icon: 'Plus' },
  mantenimiento:    { label: 'Falla equipo',     color: '#3D7A6B', icon: 'Settings' },
};

const STATIONS_W = [
  { id: 'cocina_caliente', name: 'Cocina Caliente', color: '#C8623C' },
  { id: 'cocina_fria',     name: 'Cocina Fría',     color: '#7A5237' },
  { id: 'barra',           name: 'Barra',           color: '#4A3F8C' },
  { id: 'salon',           name: 'Salón',           color: '#0F6B4E' },
  { id: 'almacen',         name: 'Almacén',         color: '#B58A3C' },
];

// Seed waste entries — last 14 days
const SEED_WASTE = [
  { id: 'w1',  date: 'Hoy 17:42',     item: 'Hamburguesa DE LA CASA',  qty: 1, unit: 'plato',   reason: 'devolucion',     station: 'cocina_caliente', reporter: 8, cost: 2.30, notes: 'Cliente: pan duro, mesa 5' },
  { id: 'w2',  date: 'Hoy 16:15',     item: 'Pan brioche',             qty: 8, unit: 'unidad',  reason: 'vencimiento',    station: 'almacen',         reporter: 1, cost: 2.40, notes: 'Lote del lunes' },
  { id: 'w3',  date: 'Hoy 15:30',     item: 'Limonada Frutos Rojos',   qty: 1, unit: 'vaso',    reason: 'accidente',      station: 'barra',           reporter: 6, cost: 0.62, notes: 'Derrame al servir' },
  { id: 'w4',  date: 'Hoy 14:08',     item: 'Costilla St. Louis',      qty: 1, unit: 'porción', reason: 'quemado',        station: 'cocina_caliente', reporter: 9, cost: 6.40, notes: 'Tiempo de cocción excedido' },
  { id: 'w5',  date: 'Ayer 22:30',    item: 'Lechuga romana',          qty: 1.5,unit:'kg',     reason: 'sobrante_cierre',station: 'cocina_fria',     reporter: 11,cost: 1.80, notes: 'Limpia, se reaprovechó parcial' },
  { id: 'w6',  date: 'Ayer 21:15',    item: 'Botella refresco vidrio', qty: 1, unit: 'unidad',  reason: 'ruptura',        station: 'salon',           reporter: 4, cost: 1.20, notes: 'Cayó al pasar mesero' },
  { id: 'w7',  date: 'Ayer 20:00',    item: 'Boneless wings (8u)',     qty: 1, unit: 'porción', reason: 'error_cocina',   station: 'cocina_caliente', reporter: 10,cost: 3.20, notes: 'Salsa equivocada en pedido' },
  { id: 'w8',  date: 'Ayer 14:30',    item: 'Tomate riñón',            qty: 0.8,unit: 'kg',     reason: 'vencimiento',    station: 'almacen',         reporter: 11,cost: 1.04, notes: 'Pieza con magulladura' },
  { id: 'w9',  date: '20 may 19:00',  item: 'Aceite freidora',         qty: 5, unit: 'litro',   reason: 'mantenimiento',  station: 'cocina_caliente', reporter: 8, cost: 12.50,notes: 'Rotación programada' },
  { id: 'w10', date: '20 may 17:20',  item: 'Smoked Fries',            qty: 1, unit: 'porción', reason: 'devolucion',     station: 'cocina_caliente', reporter: 9, cost: 2.80, notes: 'Cliente pidió cambio por papas crujientes' },
  { id: 'w11', date: '20 may 15:40',  item: 'Frutos rojos congelados', qty: 0.3,unit: 'kg',     reason: 'contaminacion',  station: 'barra',           reporter: 7, cost: 3.30, notes: 'Bolsa abierta sin sellar' },
  { id: 'w12', date: '19 may 22:00',  item: 'Pollo deshuesado',        qty: 2, unit: 'kg',     reason: 'sobrante_cierre',station: 'cocina_caliente', reporter: 8, cost: 32.00,notes: 'Sobre-producción para evento' },
  { id: 'w13', date: '19 may 18:30',  item: 'Queso cheddar líquido',   qty: 0.4,unit: 'kg',    reason: 'vencimiento',    station: 'cocina_fria',     reporter: 11,cost: 8.80, notes: 'Olor agrio detectado' },
  { id: 'w14', date: '18 may 13:15',  item: 'Hielo',                   qty: 8, unit: 'kg',    reason: 'mantenimiento',  station: 'barra',           reporter: 6, cost: 6.00, notes: 'Falla del frigorífico — derretido' },
  { id: 'w15', date: '17 may 20:00',  item: 'Pan brioche',             qty: 12,unit: 'unidad',reason: 'vencimiento',    station: 'almacen',         reporter: 1, cost: 3.60, notes: '' },
  { id: 'w16', date: '17 may 16:45',  item: 'KETO MOJADA',             qty: 1, unit: 'plato', reason: 'error_cocina',   station: 'cocina_caliente', reporter: 10,cost: 4.20, notes: 'Carne término incorrecto' },
  { id: 'w17', date: '16 may 21:30',  item: 'Limones',                 qty: 0.5,unit: 'kg',   reason: 'vencimiento',    station: 'almacen',         reporter: 11,cost: 0.65, notes: '' },
  { id: 'w18', date: '15 may 19:00',  item: 'Aguacate Hass',           qty: 4, unit: 'unidad',reason: 'vencimiento',    station: 'cocina_fria',     reporter: 11,cost: 2.40, notes: 'Sobre maduros' },
  { id: 'w19', date: '15 may 14:00',  item: 'Servilletas premium',     qty: 1, unit: 'paquete',reason: 'ruptura',       station: 'salon',           reporter: 4, cost: 2.80, notes: 'Caja mojada en bodega' },
  { id: 'w20', date: '14 may 22:30',  item: 'Helado vainilla',         qty: 1, unit: 'litro', reason: 'mantenimiento',  station: 'barra',           reporter: 7, cost: 14.00,notes: 'Apagón nocturno · derretido' },
];

function MermasPage({ goTo }) {
  const [waste, setWaste] = useStateWS(SEED_WASTE);
  const [composing, setComposing] = useStateWS(false);
  const [period, setPeriod] = useStateWS('week'); // week | month | all
  const [reasonFilter, setReasonFilter] = useStateWS('all');
  const [stationFilter, setStationFilter] = useStateWS('all');

  // Filter
  const filtered = useMemoWS(() => {
    let r = waste;
    if (reasonFilter !== 'all') r = r.filter(w => w.reason === reasonFilter);
    if (stationFilter !== 'all') r = r.filter(w => w.station === stationFilter);
    // (period filter is decorative here)
    return r;
  }, [waste, reasonFilter, stationFilter]);

  // Aggregations
  const stats = useMemoWS(() => {
    const total = waste.reduce((a, w) => a + w.cost, 0);
    const byReason = {};
    const byStation = {};
    const byItem = {};
    for (const w of waste) {
      byReason[w.reason] = (byReason[w.reason] || 0) + w.cost;
      byStation[w.station] = (byStation[w.station] || 0) + w.cost;
      byItem[w.item] = (byItem[w.item] || { item: w.item, cost: 0, count: 0 });
      byItem[w.item].cost += w.cost;
      byItem[w.item].count += 1;
    }
    const reasonsArr = Object.entries(byReason)
      .map(([k, v]) => ({ key: k, label: REASONS[k].label, color: REASONS[k].color, value: v }))
      .sort((a, b) => b.value - a.value);
    const stationsArr = Object.entries(byStation)
      .map(([k, v]) => ({ key: k, ...STATIONS_W.find(s => s.id === k), value: v }))
      .sort((a, b) => b.value - a.value);
    const itemsArr = Object.values(byItem).sort((a, b) => b.cost - a.cost);
    // Weekly comparison (mock — assume previous week was 15% higher)
    const lastWeekTotal = total * 1.18;
    const trend = ((total - lastWeekTotal) / lastWeekTotal) * 100;
    return { total, reasons: reasonsArr, stations: stationsArr, items: itemsArr, trend, count: waste.length };
  }, [waste]);

  // Assume weekly sales for % calc — using insights
  const insights = window.useInsights ? window.useInsights() : null;
  const weeklySales = insights ? (insights.salesSummary.totalGross / 22) : 5000; // 5 months ~22 weeks
  const wastePctVsSales = (stats.total / weeklySales) * 100;

  const addEntry = (payload) => {
    setWaste(prev => [{ ...payload, id: 'w' + Date.now(), date: 'Ahora' }, ...prev]);
    setComposing(false);
  };

  return (
    <div data-screen-label="Mermas">
      <div className="between mb-3">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Mermas y desperdicios · últimos 14 días</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{stats.count} registros</span>
            <span style={{ color: 'var(--muted)' }}> · ${stats.total.toFixed(2)} pérdida acumulada</span>
          </div>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Semana</button>
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mes</button>
            <button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>Todo</button>
          </div>
          <button className="btn"><window.Icons.Download size={13} /> Exportar</button>
          <button className="btn btn-emerald" onClick={() => setComposing(true)}>
            <window.Icons.Plus size={13} /> Registrar merma
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Pérdida acumulada</div>
          <div className="kpi-value" style={{ color: 'var(--terracotta)' }}>
            ${stats.total.toFixed(0)}<span className="unit">USD</span>
          </div>
          <div className="kpi-foot">
            <span className={`trend ${stats.trend < 0 ? '' : 'down'}`}>
              {stats.trend < 0 ? '↓' : '↑'} {Math.abs(stats.trend).toFixed(1)}%
            </span>
            <span>vs. semana anterior</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">% sobre ventas</div>
          <div className="kpi-value" style={{ color: wastePctVsSales > 5 ? 'var(--danger)' : wastePctVsSales > 3 ? 'var(--gold)' : 'var(--emerald)' }}>
            {wastePctVsSales.toFixed(2)}<span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span className="trend flat">objetivo &lt; 3%</span>
            <span>industria 3-5%</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Causa principal</div>
          <div className="kpi-value" style={{ fontSize: 24, color: stats.reasons[0]?.color }}>
            {stats.reasons[0]?.label || '—'}
          </div>
          <div className="kpi-foot">
            <span className="trend flat">${stats.reasons[0]?.value.toFixed(0)} pérdida</span>
            <span>{((stats.reasons[0]?.value / stats.total) * 100).toFixed(0)}% del total</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Estación más afectada</div>
          <div className="kpi-value" style={{ fontSize: 22, color: stats.stations[0]?.color }}>
            {stats.stations[0]?.name || '—'}
          </div>
          <div className="kpi-foot">
            <span className="trend flat">${stats.stations[0]?.value.toFixed(0)}</span>
            <span>{((stats.stations[0]?.value / stats.total) * 100).toFixed(0)}% del total</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Distribución por causa</div>
              <div className="card-sub">Pareto · ${stats.total.toFixed(2)} total</div>
            </div>
          </div>
          <div style={{ padding: '14px 22px 22px' }}>
            {stats.reasons.map(r => {
              const pct = (r.value / stats.total) * 100;
              return (
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}
                     onClick={() => setReasonFilter(reasonFilter === r.key ? 'all' : r.key)}>
                  <div style={{ width: 130, fontSize: 12, fontWeight: 500, color: reasonFilter === r.key ? r.color : 'var(--ink)' }}>
                    {r.label}
                  </div>
                  <div style={{ flex: 1, height: 22, background: 'var(--surface-2)', borderRadius: 4, position: 'relative' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: r.color, borderRadius: 4,
                    }}></div>
                    <span className="mono" style={{
                      position: 'absolute', right: 8, top: 3, fontSize: 10.5, fontWeight: 700,
                      color: pct > 35 ? '#fff' : 'var(--ink)',
                    }}>
                      ${r.value.toFixed(2)}
                    </span>
                  </div>
                  <div className="mono" style={{ width: 38, textAlign: 'right', fontSize: 11, color: 'var(--muted)' }}>
                    {pct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top artículos perdidos</div>
              <div className="card-sub">Ordenado por costo · clic para detalle</div>
            </div>
          </div>
          <div style={{ padding: '14px 22px 22px' }}>
            {stats.items.slice(0, 8).map((it, i) => {
              const pct = (it.cost / stats.items[0].cost) * 100;
              return (
                <div key={it.item} className="between" style={{ padding: '8px 0', borderBottom: i < 7 ? '1px solid var(--line)' : 'none', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <span className="mono" style={{ width: 20, color: 'var(--muted)', fontSize: 10, fontWeight: 700, textAlign: 'right' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.item}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{it.count} {it.count === 1 ? 'incidente' : 'incidentes'}</div>
                    </div>
                  </div>
                  <div style={{ width: 80 }}>
                    <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--terracotta)' }}></div>
                    </div>
                  </div>
                  <div className="mono" style={{ width: 56, textAlign: 'right', fontWeight: 700 }}>
                    ${it.cost.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Diagnóstico operativo</div>
              <div className="card-sub">Patrones detectados automáticamente</div>
            </div>
          </div>
          <div style={{ padding: '14px 0' }}>
            <div className="alert-card warn" style={{ margin: '0 22px 10px' }}>
              <window.Icons.Clock size={16} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                <b>Vencimientos</b> son la causa #1 (${stats.reasons.find(r => r.key === 'vencimiento')?.value.toFixed(0)}). Sugerido: revisar rotación FIFO y reducir pedidos de perecederos.
              </div>
            </div>
            <div className="alert-card danger" style={{ margin: '0 22px 10px' }}>
              <window.Icons.Plus size={16} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                <b>Pan brioche</b> perdido 2 veces esta semana (20 unidades). Recomendación: bajar pedido diario o congelar excedente.
              </div>
            </div>
            <div className="alert-card" style={{ margin: '0 22px 10px', background: 'var(--gold-soft)', borderColor: 'var(--gold)' }}>
              <window.Icons.Inventory size={16} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                <b>Cocina caliente</b> concentra {((stats.stations.find(s => s.key === 'cocina_caliente')?.value / stats.total) * 100).toFixed(0)}% de las pérdidas. Capacitar al equipo en control de cocción.
              </div>
            </div>
            <div className="alert-card" style={{ margin: '0 22px', background: 'var(--emerald-soft)', borderColor: 'var(--emerald)' }}>
              <window.Icons.Check size={16} stroke={2.4} />
              <div style={{ flex: 1, fontSize: 12.5 }}>
                Pérdidas <b>{Math.abs(stats.trend).toFixed(1)}% menores</b> que la semana pasada — el equipo está mejorando.
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Por estación</div>
              <div className="card-sub">Dónde ocurren las mermas</div>
            </div>
          </div>
          <div style={{ padding: '18px 22px 22px' }}>
            {stats.stations.map(s => {
              const pct = (s.value / stats.total) * 100;
              const cnt = waste.filter(w => w.station === s.key).length;
              return (
                <div key={s.key} style={{ marginBottom: 14, cursor: 'pointer' }}
                     onClick={() => setStationFilter(stationFilter === s.key ? 'all' : s.key)}>
                  <div className="between" style={{ marginBottom: 6, fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="area-dot" style={{ background: s.color, width: 10, height: 10 }}></span>
                      <span style={{ fontWeight: 600, color: stationFilter === s.key ? s.color : 'var(--ink)' }}>{s.name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>· {cnt} eventos</span>
                    </span>
                    <span className="mono" style={{ fontWeight: 700 }}>
                      ${s.value.toFixed(2)}
                      <span style={{ color: 'var(--muted)', fontWeight: 500, marginLeft: 6, fontSize: 11 }}>
                        {pct.toFixed(0)}%
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 2}%`, maxWidth: '100%', height: '100%', background: s.color, borderRadius: 3 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline / list */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Registro de mermas</div>
            <div className="card-sub">
              {filtered.length} eventos
              {(reasonFilter !== 'all' || stationFilter !== 'all') && ' filtrados'}
            </div>
          </div>
          <div className="row gap-2">
            {reasonFilter !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: REASONS[reasonFilter].color + '20', color: REASONS[reasonFilter].color, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                {REASONS[reasonFilter].label}
                <button onClick={() => setReasonFilter('all')} style={{ cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <window.Icons.Plus size={11} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </div>
            )}
            {stationFilter !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                {STATIONS_W.find(s => s.id === stationFilter)?.name}
                <button onClick={() => setStationFilter('all')} style={{ cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <window.Icons.Plus size={11} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </div>
            )}
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Cuándo</th>
              <th>Artículo</th>
              <th style={{ textAlign: 'right' }}>Cantidad</th>
              <th>Causa</th>
              <th>Estación</th>
              <th>Reportado por</th>
              <th>Notas</th>
              <th style={{ textAlign: 'right' }}>Pérdida</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => {
              const reason = REASONS[w.reason];
              const station = STATIONS_W.find(s => s.id === w.station);
              const emp = EMPLOYEES.find(e => e.id === w.reporter);
              return (
                <tr key={w.id}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--muted)' }}>
                    {w.date}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{w.item}</td>
                  <td className="num" style={{ textAlign: 'right' }}>
                    {w.qty} <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 500 }}>{w.unit}</span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 10.5, padding: '3px 8px', borderRadius: 4,
                      background: reason.color + '20', color: reason.color,
                      fontWeight: 600, letterSpacing: '0.03em',
                    }}>
                      {reason.label}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="area-dot" style={{ background: station?.color }}></span>
                      {station?.name}
                    </span>
                  </td>
                  <td>
                    {emp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="mini-avatar" style={{ background: emp.color, width: 22, height: 22, fontSize: 9 }}>
                          {emp.initials}
                        </div>
                        <span style={{ fontSize: 12 }}>{emp.name}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.notes || '—'}
                  </td>
                  <td className="num total" style={{ textAlign: 'right', color: 'var(--terracotta)' }}>
                    −${w.cost.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--bg)', fontWeight: 700 }}>
              <td colSpan="7" style={{ padding: '14px 16px', textAlign: 'right', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Total pérdida {filtered.length === waste.length ? 'periodo' : 'filtrado'}
              </td>
              <td className="num" style={{ textAlign: 'right', padding: '14px 16px', fontSize: 15, color: 'var(--terracotta)' }}>
                −${filtered.reduce((a, w) => a + w.cost, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {composing && <MermaDrawer onClose={() => setComposing(false)} onAdd={addEntry} />}
    </div>
  );
}

/* ---------- New merma drawer ---------- */
function MermaDrawer({ onClose, onAdd }) {
  const [item, setItem] = useStateWS('');
  const [qty, setQty] = useStateWS(1);
  const [unit, setUnit] = useStateWS('unidad');
  const [reason, setReason] = useStateWS('vencimiento');
  const [station, setStation] = useStateWS('cocina_caliente');
  const [reporter, setReporter] = useStateWS(8);
  const [cost, setCost] = useStateWS('');
  const [notes, setNotes] = useStateWS('');

  const submit = () => {
    if (!item.trim()) return;
    onAdd({
      item: item.trim(),
      qty: parseFloat(qty) || 0,
      unit, reason, station, reporter,
      cost: parseFloat(cost) || 0,
      notes: notes.trim(),
    });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer" style={{ width: 500 }}>
        <div className="drawer-head">
          <div>
            <div className="crumb">Nueva merma</div>
            <h2 className="serif">Registrar pérdida</h2>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Indica qué se perdió, dónde y por qué
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <window.Icons.Plus size={14} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Artículo
            </label>
            <input value={item} onChange={e => setItem(e.target.value)}
              placeholder="Ej. Pan brioche, Hamburguesa DE LA CASA…"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Cantidad</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'JetBrains Mono' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Unidad</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none' }}>
                {['unidad','plato','porción','kg','g','litro','ml','botella','paquete'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Costo $</label>
              <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'JetBrains Mono' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Causa</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {Object.entries(REASONS).map(([k, v]) => (
                <button key={k} onClick={() => setReason(k)}
                  style={{
                    padding: '8px 4px', borderRadius: 8,
                    border: reason === k ? `2px solid ${v.color}` : '1px solid var(--line-2)',
                    background: reason === k ? v.color + '15' : '#fff',
                    color: reason === k ? v.color : 'var(--ink-2)',
                    fontWeight: 600, fontSize: 11, cursor: 'pointer',
                  }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Estación</label>
              <select value={station} onChange={e => setStation(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none' }}>
                {STATIONS_W.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Reportado por</label>
              <select value={reporter} onChange={e => setReporter(parseInt(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none' }}>
                {EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>Notas / contexto</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3"
              placeholder="Ej. cliente pidió cambio por temperatura, lote del lunes, etc."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
          </div>
        </div>

        <div className="drawer-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Se descontará del inventario si aplica
          </div>
          <div className="row gap-2">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-emerald" onClick={submit} disabled={!item.trim()}>
              <window.Icons.Check size={13} /> Registrar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

window.MermasPage = MermasPage;
