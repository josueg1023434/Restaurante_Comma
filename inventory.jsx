// Inventory page — real stock data + diagnostics for restaurant operations
const { useState: useStateIV, useMemo: useMemoIV } = React;

function InventoryPage({ goTo }) {
  const insights = window.useInsights ? window.useInsights() : null;
  const [filter, setFilter] = useStateIV('all');     // all | critical | negative | low | ok
  const [linea, setLinea] = useStateIV('all');
  const [search, setSearch] = useStateIV('');
  const [page, setPage] = useStateIV(0);
  const pageSize = 12;

  if (!insights || !insights.inventoryFull) {
    return (
      <div data-screen-label="Inventory">
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          Cargando inventario…
        </div>
      </div>
    );
  }

  const items = insights.inventoryFull;
  const byLine = insights.inventoryByLine.filter(l => l.line !== 'Total');

  // Filtered items
  const filtered = useMemoIV(() => {
    let r = items;
    if (linea !== 'all') r = r.filter(i => i.linea === linea);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(i => i.articulo.toLowerCase().includes(s) || i.codigo.toLowerCase().includes(s));
    }
    switch (filter) {
      case 'negative': return r.filter(i => i.existencia < 0).sort((a, b) => a.existencia - b.existencia);
      case 'low':      return r.filter(i => i.existencia > 0 && i.existencia <= 10).sort((a, b) => a.existencia - b.existencia);
      case 'zero':     return r.filter(i => i.existencia === 0);
      case 'ok':       return r.filter(i => i.existencia > 10);
      default:         return r;
    }
  }, [filter, linea, search]);

  const stats = useMemoIV(() => {
    const negative = items.filter(i => i.existencia < 0).length;
    const zero = items.filter(i => i.existencia === 0).length;
    const low = items.filter(i => i.existencia > 0 && i.existencia <= 10).length;
    const ok = items.filter(i => i.existencia > 10).length;
    const totalValue = items.reduce((a, i) => a + i.valor, 0);
    const itemsWithCost = items.filter(i => i.costo > 0).length;
    return { negative, zero, low, ok, totalValue, itemsWithCost };
  }, []);

  const pageItems = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const statusOf = (it) => {
    if (it.existencia < 0) return { label: 'NEGATIVO', cls: 'late', color: 'var(--danger)' };
    if (it.existencia === 0) return { label: 'SIN STOCK', cls: 'off', color: 'var(--muted-2)' };
    if (it.existencia <= 10) return { label: 'BAJO', cls: 'break', color: 'var(--gold)' };
    return { label: 'OK', cls: '', color: 'var(--emerald)' };
  };

  const fmtMoney = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div data-screen-label="Inventory">
      <div className="between mb-3">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Inventario · cierre 25 abr 2026 13:12</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{items.length} artículos registrados</span>
            <span style={{ color: 'var(--muted)' }}> · valor en libros {fmtMoney(stats.totalValue)} USD</span>
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn"><window.Icons.Download size={13} /> Exportar</button>
          <button className="btn"><window.Icons.Plus size={13} /> Nuevo artículo</button>
          <button className="btn btn-primary"><window.Icons.Check size={13} /> Conteo físico</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => { setFilter('ok'); setPage(0); }}>
          <div className="kpi-label">Stock saludable</div>
          <div className="kpi-value" style={{ color: 'var(--emerald)' }}>{stats.ok}<span className="unit">de {items.length}</span></div>
          <div className="kpi-foot">
            <span className="trend">{((stats.ok / items.length) * 100).toFixed(0)}% del total</span>
            <span>existencia &gt; 10</span>
          </div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => { setFilter('low'); setPage(0); }}>
          <div className="kpi-label">Stock bajo (reponer)</div>
          <div className="kpi-value" style={{ color: 'var(--gold)' }}>{stats.low}</div>
          <div className="kpi-foot">
            <span className="trend flat">≤ 10 u.</span>
            <span>punto de reorden</span>
          </div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => { setFilter('zero'); setPage(0); }}>
          <div className="kpi-label">Sin stock</div>
          <div className="kpi-value" style={{ color: 'var(--muted)' }}>{stats.zero}</div>
          <div className="kpi-foot">
            <span className="trend flat">= 0 u.</span>
            <span>agotados</span>
          </div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => { setFilter('negative'); setPage(0); }}>
          <div className="kpi-label">Stock negativo</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{stats.negative}</div>
          <div className="kpi-foot">
            <span className="trend down">{((stats.negative / items.length) * 100).toFixed(0)}% del total</span>
            <span>requiere conteo</span>
          </div>
        </div>
      </div>

      {/* Critical diagnostic */}
      {stats.negative > 50 && (
        <div className="alert-card danger mb-3" style={{ padding: 18 }}>
          <div style={{ width: 4, alignSelf: 'stretch', background: 'var(--danger)', borderRadius: 2 }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 700 }}>
              Diagnóstico crítico de inventario
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
              {stats.negative} artículos ({((stats.negative / items.length) * 100).toFixed(0)}%) tienen existencias negativas
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
              Esto suele indicar que se venden productos sin registrar entradas de compra, o que las recetas no descargan los ingredientes correctamente.
              <b> Solo {stats.itemsWithCost} de {items.length} artículos tienen costo promedio asignado</b> — sin costo es imposible medir margen real.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ fontSize: 12 }}>
                <window.Icons.Check size={13} /> Iniciar conteo físico
              </button>
              <button className="btn" style={{ fontSize: 12 }}>
                Asignar costos faltantes ({items.length - stats.itemsWithCost})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lines summary */}
      <div className="card mb-3">
        <div className="card-head">
          <div>
            <div className="card-title">Resumen por línea</div>
            <div className="card-sub">{byLine.length} líneas · clic para filtrar</div>
          </div>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {byLine.slice(0, 12).map(l => {
            const issueRate = ((l.negative + l.zero) / l.items) * 100;
            const isSel = linea === l.line;
            return (
              <div key={l.line}
                   onClick={() => { setLinea(isSel ? 'all' : l.line); setPage(0); }}
                   style={{
                     border: `1px solid ${isSel ? 'var(--emerald)' : 'var(--line)'}`,
                     background: isSel ? 'var(--emerald-soft)' : 'var(--surface)',
                     borderRadius: 10,
                     padding: 12,
                     cursor: 'pointer',
                   }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.line}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                  <span className="serif" style={{ fontSize: 22, fontWeight: 400 }}>{l.items}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>items</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 10.5, display: 'flex', gap: 8, color: 'var(--muted)' }}>
                  {l.negative > 0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>· {l.negative} neg</span>}
                  {l.low > 0 && <span style={{ color: 'var(--gold)', fontWeight: 600 }}>· {l.low} bajo</span>}
                  {l.zero > 0 && <span>· {l.zero} cero</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters + table */}
      <div className="card">
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(0); }}>Todos ({items.length})</button>
            <button className={filter === 'negative' ? 'active' : ''} onClick={() => { setFilter('negative'); setPage(0); }}>Negativo ({stats.negative})</button>
            <button className={filter === 'low' ? 'active' : ''} onClick={() => { setFilter('low'); setPage(0); }}>Bajo ({stats.low})</button>
            <button className={filter === 'zero' ? 'active' : ''} onClick={() => { setFilter('zero'); setPage(0); }}>Cero ({stats.zero})</button>
            <button className={filter === 'ok' ? 'active' : ''} onClick={() => { setFilter('ok'); setPage(0); }}>OK ({stats.ok})</button>
          </div>
          <div className="search" style={{ width: 240 }}>
            <window.Icons.Search size={14} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar artículo o código…" />
          </div>
          {linea !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--emerald-soft)', color: 'var(--emerald)', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              Línea: {linea}
              <button onClick={() => setLinea('all')} style={{ background: 'transparent', cursor: 'pointer', color: 'var(--emerald)', display: 'grid', placeItems: 'center' }}>
                <window.Icons.Plus size={11} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            Mostrando {pageItems.length} de {filtered.length}
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Estado</th>
              <th>Artículo</th>
              <th>Línea</th>
              <th style={{ width: 70 }}>Código</th>
              <th style={{ textAlign: 'right' }}>Existencia</th>
              <th style={{ textAlign: 'right' }}>Costo prom.</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((it, i) => {
              const st = statusOf(it);
              return (
                <tr key={it.codigo + '-' + i}>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      width: 6, height: 6,
                      borderRadius: 3,
                      background: st.color,
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}></span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, letterSpacing: '0.06em' }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{it.articulo}</td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4, letterSpacing: '0.02em' }}>
                      {it.linea}
                    </span>
                  </td>
                  <td className="num" style={{ color: 'var(--muted)', fontSize: 11 }}>{it.codigo}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: st.color }}>
                    {it.existencia}
                  </td>
                  <td className="num" style={{ textAlign: 'right', color: it.costo === 0 ? 'var(--muted-2)' : 'var(--ink)' }}>
                    {it.costo > 0 ? fmtMoney(it.costo) : '—'}
                  </td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: it.valor > 0 ? 700 : 500, color: it.valor === 0 ? 'var(--muted-2)' : 'var(--ink)' }}>
                    {fmtMoney(it.valor)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="row-icon-btn" title="Ajustar conteo">
                      <window.Icons.Check size={13} />
                    </button>
                    <button className="row-icon-btn" title="Crear orden de compra">
                      <window.Icons.Inventory size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr><td colSpan="8" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                Sin artículos que coincidan con el filtro
              </td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ padding: '12px 22px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <div style={{ color: 'var(--muted)' }}>
              Página {page + 1} de {totalPages}
            </div>
            <div className="row gap-2">
              <button className="btn" style={{ padding: '5px 10px' }} disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <window.Icons.ChevronLeft size={13} /> Anterior
              </button>
              <button className="btn" style={{ padding: '5px 10px' }} disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
                Siguiente <window.Icons.ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Missing modules call-out */}
      <div className="grid-2" style={{ marginTop: 22 }}>
        <div className="card" style={{ background: 'var(--surface-2)', borderStyle: 'dashed' }}>
          <div className="card-head" style={{ borderBottom: 'none' }}>
            <div>
              <div className="card-title">📋 Próximos módulos sugeridos</div>
              <div className="card-sub">Para gestión integral de inventario</div>
            </div>
          </div>
          <div style={{ padding: '0 22px 22px' }}>
            {[
              { t: 'Fichas técnicas / Recetario', d: 'Costo por plato, ingredientes y rendimiento — para medir food cost real' },
              { t: 'Órdenes de compra a proveedores', d: 'Generar pedidos automáticos cuando stock baje de mínimos' },
              { t: 'Mermas y desperdicios', d: 'Registrar pérdidas por vencimiento, ruptura, error de cocina' },
              { t: 'Movimientos de inventario', d: 'Historial de entradas, salidas, ajustes — auditable' },
            ].map((m, i) => (
              <div key={i} className="between" style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{m.d}</div>
                </div>
                <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }}>Planificar</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">🎯 Acciones recomendadas hoy</div>
              <div className="card-sub">Priorizadas por impacto</div>
            </div>
          </div>
          <div style={{ padding: '6px 0' }}>
            <div className="shift-row">
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--danger)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>01</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Conteo físico semanal</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Reconciliar los {stats.negative} ítems en negativo</div>
              </div>
              <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 11 }}>Iniciar</button>
            </div>
            <div className="shift-row">
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>02</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Asignar costos faltantes</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{items.length - stats.itemsWithCost} artículos sin costo — bloquea cálculo de margen</div>
              </div>
              <button className="btn" style={{ padding: '4px 10px', fontSize: 11 }}>Revisar</button>
            </div>
            <div className="shift-row">
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>03</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Reorden de materia prima</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{stats.low} items en stock bajo — generar OC a proveedor</div>
              </div>
              <button className="btn" style={{ padding: '4px 10px', fontSize: 11 }}>Crear OC</button>
            </div>
            <div className="shift-row">
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--emerald)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>04</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Definir punto de reorden por item</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Configurar mínimos basados en velocidad de consumo</div>
              </div>
              <button className="btn" style={{ padding: '4px 10px', fontSize: 11 }}>Configurar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.InventoryPage = InventoryPage;
