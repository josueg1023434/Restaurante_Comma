// Recetario / Food cost — recipes for top sellers with cost analysis
const { useState: useStateRC, useMemo: useMemoRC } = React;

// Realistic recipes for the top-selling items in their POS data
// Costs in USD per unit of ingredient. Premium fast-food target FC%: 28-32%
const RECIPES = [
  {
    id: 1, name: 'DE LA CASA', category: 'COCINAS', line: 'HAMBURGUESAS',
    salePrice: 7.25, soldPeriod: 1068, revenuePeriod: 7743, portions: 1,
    description: 'Hamburguesa insignia · pan brioche, carne 180g, queso cheddar, lechuga, tomate, salsa especial + papas',
    ingredients: [
      { item: 'Pan brioche',         qty: 1,   unit: 'unidad', costPerUnit: 0.30 },
      { item: 'Carne molida res',    qty: 180, unit: 'g',      costPerUnit: 0.011 },
      { item: 'Queso cheddar',       qty: 30,  unit: 'g',      costPerUnit: 0.022 },
      { item: 'Lechuga romana',      qty: 20,  unit: 'g',      costPerUnit: 0.004 },
      { item: 'Tomate riñón',        qty: 30,  unit: 'g',      costPerUnit: 0.003 },
      { item: 'Salsa de la casa',    qty: 30,  unit: 'ml',     costPerUnit: 0.012 },
      { item: 'Papas fritas',        qty: 120, unit: 'g',      costPerUnit: 0.006 },
      { item: 'Empaque + servilleta',qty: 1,   unit: 'unidad', costPerUnit: 0.08 },
    ],
  },
  {
    id: 2, name: 'KETO MOJADA', category: 'COCINAS', line: 'HAMBURGUESAS',
    salePrice: 10.50, soldPeriod: 482, revenuePeriod: 5059.95, portions: 1,
    description: 'Hamburguesa keto · sin pan, lechuga como base, doble carne, queso, tocino, salsa especial',
    ingredients: [
      { item: 'Lechuga iceberg',    qty: 100, unit: 'g',  costPerUnit: 0.005 },
      { item: 'Carne molida res',   qty: 280, unit: 'g',  costPerUnit: 0.011 },
      { item: 'Queso cheddar',      qty: 45,  unit: 'g',  costPerUnit: 0.022 },
      { item: 'Tocino premium',     qty: 40,  unit: 'g',  costPerUnit: 0.028 },
      { item: 'Salsa keto especial',qty: 40,  unit: 'ml', costPerUnit: 0.014 },
      { item: 'Tomate riñón',       qty: 40,  unit: 'g',  costPerUnit: 0.003 },
      { item: 'Empaque',            qty: 1,   unit: 'unidad', costPerUnit: 0.10 },
    ],
  },
  {
    id: 3, name: 'BONELESS FRIES', category: 'COCINAS', line: 'PARA COMPARTIR',
    salePrice: 6.70, soldPeriod: 567, revenuePeriod: 3798.9, portions: 1,
    description: 'Papas con pollo boneless y queso fundido',
    ingredients: [
      { item: 'Papas',              qty: 250, unit: 'g',  costPerUnit: 0.005 },
      { item: 'Pollo boneless',     qty: 120, unit: 'g',  costPerUnit: 0.018 },
      { item: 'Queso cheddar líquido', qty: 50, unit: 'ml', costPerUnit: 0.020 },
      { item: 'Salsa BBQ',          qty: 25,  unit: 'ml', costPerUnit: 0.010 },
      { item: 'Empaque',            qty: 1,   unit: 'unidad', costPerUnit: 0.10 },
    ],
  },
  {
    id: 4, name: 'Smoked Fries', category: 'COCINAS', line: 'PARA COMPARTIR',
    salePrice: 6.70, soldPeriod: 524, revenuePeriod: 3508.79, portions: 1,
    description: 'Papas con tocino ahumado, queso fundido y salsa BBQ ahumada',
    ingredients: [
      { item: 'Papas',                 qty: 250, unit: 'g',  costPerUnit: 0.005 },
      { item: 'Tocino ahumado',        qty: 60,  unit: 'g',  costPerUnit: 0.030 },
      { item: 'Queso cheddar líquido', qty: 50,  unit: 'ml', costPerUnit: 0.020 },
      { item: 'BBQ ahumado casera',    qty: 30,  unit: 'ml', costPerUnit: 0.014 },
      { item: 'Cebollín',              qty: 8,   unit: 'g',  costPerUnit: 0.006 },
      { item: 'Empaque',               qty: 1,   unit: 'unidad', costPerUnit: 0.10 },
    ],
  },
  {
    id: 5, name: '8 boneless wings', category: 'COCINAS', line: 'PARA COMPARTIR',
    salePrice: 6.70, soldPeriod: 491, revenuePeriod: 3289.03, portions: 1,
    description: '8 unidades de pollo deshuesado con salsa a elección',
    ingredients: [
      { item: 'Pollo deshuesado',   qty: 280, unit: 'g',  costPerUnit: 0.016 },
      { item: 'Harina para empanizar', qty: 40, unit: 'g', costPerUnit: 0.003 },
      { item: 'Salsa (a elección)', qty: 50,  unit: 'ml', costPerUnit: 0.012 },
      { item: 'Apio fresco',        qty: 30,  unit: 'g',  costPerUnit: 0.005 },
      { item: 'Aceite freidora',    qty: 25,  unit: 'ml', costPerUnit: 0.005 },
      { item: 'Empaque',            qty: 1,   unit: 'unidad', costPerUnit: 0.10 },
    ],
  },
  {
    id: 6, name: 'COSTILLA ST. LOUIS 400 gr.', category: 'COCINAS', line: 'FUERTES',
    salePrice: 15.60, soldPeriod: 207, revenuePeriod: 3229.20, portions: 1,
    description: 'Costilla cerdo St. Louis 400g · cocción lenta 6h, glaseada en BBQ casero, papas y coleslaw',
    ingredients: [
      { item: 'Costilla cerdo St.Louis', qty: 400, unit: 'g', costPerUnit: 0.015 },
      { item: 'BBQ casero',         qty: 60,  unit: 'ml', costPerUnit: 0.014 },
      { item: 'Papas',              qty: 150, unit: 'g',  costPerUnit: 0.005 },
      { item: 'Coleslaw',           qty: 80,  unit: 'g',  costPerUnit: 0.008 },
      { item: 'Especias rub',       qty: 8,   unit: 'g',  costPerUnit: 0.012 },
      { item: 'Empaque',            qty: 1,   unit: 'unidad', costPerUnit: 0.12 },
    ],
  },
  {
    id: 7, name: 'LIMONADA DE FRUTOS ROJOS', category: 'BEBIDAS', line: 'BEBIDAS',
    salePrice: 2.80, soldPeriod: 974, revenuePeriod: 2727.2, portions: 1,
    description: 'Limonada artesanal con pulpa de frutos rojos · 16 oz',
    ingredients: [
      { item: 'Limón sutil',        qty: 80,  unit: 'g',  costPerUnit: 0.0013 },
      { item: 'Pulpa frutos rojos', qty: 40,  unit: 'g',  costPerUnit: 0.011 },
      { item: 'Azúcar',             qty: 25,  unit: 'g',  costPerUnit: 0.001 },
      { item: 'Agua / hielo',       qty: 350, unit: 'ml', costPerUnit: 0.0003 },
      { item: 'Vaso 16oz + sorbete',qty: 1,   unit: 'unidad', costPerUnit: 0.09 },
    ],
  },
  {
    id: 8, name: 'LIMONADA CLASICA', category: 'BEBIDAS', line: 'BEBIDAS',
    salePrice: 3.00, soldPeriod: 513, revenuePeriod: 1536.60, portions: 1,
    description: 'Limonada natural recién hecha · 16 oz',
    ingredients: [
      { item: 'Limón sutil',        qty: 100, unit: 'g',  costPerUnit: 0.0013 },
      { item: 'Azúcar',             qty: 30,  unit: 'g',  costPerUnit: 0.001 },
      { item: 'Agua / hielo',       qty: 380, unit: 'ml', costPerUnit: 0.0003 },
      { item: 'Vaso 16oz + sorbete',qty: 1,   unit: 'unidad', costPerUnit: 0.09 },
    ],
  },
  {
    id: 9, name: 'AGUA', category: 'BEBIDAS', line: 'BEBIDAS',
    salePrice: 1.90, soldPeriod: 662, revenuePeriod: 1257.81, portions: 1,
    description: 'Agua sin gas 500ml',
    ingredients: [
      { item: 'Agua botella 500ml', qty: 1, unit: 'unidad', costPerUnit: 0.55 },
    ],
  },
  {
    id: 10, name: 'MILKSHAKE NUTELLA', category: 'BEBIDAS', line: 'WAFFLES',
    salePrice: 4.00, soldPeriod: 94, revenuePeriod: 376, portions: 1,
    description: 'Malteada espesa de chocolate con Nutella y crema chantilly',
    ingredients: [
      { item: 'Helado vainilla',    qty: 200, unit: 'g',  costPerUnit: 0.012 },
      { item: 'Nutella',            qty: 40,  unit: 'g',  costPerUnit: 0.024 },
      { item: 'Leche entera',       qty: 150, unit: 'ml', costPerUnit: 0.002 },
      { item: 'Crema chantilly',    qty: 30,  unit: 'g',  costPerUnit: 0.014 },
      { item: 'Vaso + sorbete + topping', qty: 1, unit: 'unidad', costPerUnit: 0.18 },
    ],
  },
  {
    id: 11, name: 'Sundae de Nutella', category: 'WAFFLES', line: 'WAFFLES',
    salePrice: 3.90, soldPeriod: 78, revenuePeriod: 304.20, portions: 1,
    description: 'Helado de vainilla, Nutella tibia, fresa fresca, crema chantilly y nueces',
    ingredients: [
      { item: 'Helado vainilla',    qty: 180, unit: 'g',  costPerUnit: 0.012 },
      { item: 'Nutella',            qty: 35,  unit: 'g',  costPerUnit: 0.024 },
      { item: 'Fresa fresca',       qty: 40,  unit: 'g',  costPerUnit: 0.011 },
      { item: 'Nueces',             qty: 12,  unit: 'g',  costPerUnit: 0.025 },
      { item: 'Crema chantilly',    qty: 20,  unit: 'g',  costPerUnit: 0.014 },
      { item: 'Copa + cuchara',     qty: 1,   unit: 'unidad', costPerUnit: 0.16 },
    ],
  },
  {
    id: 12, name: 'ICE TEA LEMONADA', category: 'BEBIDAS', line: 'BEBIDAS',
    salePrice: 2.50, soldPeriod: 145, revenuePeriod: 362.5, portions: 1,
    description: 'Té frío con limonada y menta · 16 oz',
    ingredients: [
      { item: 'Té negro infusión',  qty: 200, unit: 'ml', costPerUnit: 0.001 },
      { item: 'Limón sutil',        qty: 50,  unit: 'g',  costPerUnit: 0.0013 },
      { item: 'Azúcar',             qty: 20,  unit: 'g',  costPerUnit: 0.001 },
      { item: 'Menta fresca',       qty: 5,   unit: 'g',  costPerUnit: 0.018 },
      { item: 'Agua / hielo',       qty: 200, unit: 'ml', costPerUnit: 0.0003 },
      { item: 'Vaso 16oz + sorbete',qty: 1,   unit: 'unidad', costPerUnit: 0.09 },
    ],
  },
  {
    id: 13, name: 'PORCION PAPAS', category: 'COCINAS', line: 'PARA COMPARTIR',
    salePrice: 2.75, soldPeriod: 312, revenuePeriod: 858.00, portions: 1,
    description: 'Porción de papas fritas crujientes con salsas',
    ingredients: [
      { item: 'Papas',              qty: 200, unit: 'g',  costPerUnit: 0.005 },
      { item: 'Sal y especias',     qty: 4,   unit: 'g',  costPerUnit: 0.005 },
      { item: 'Aceite freidora',    qty: 20,  unit: 'ml', costPerUnit: 0.005 },
      { item: 'Empaque + 2 salsas', qty: 1,   unit: 'unidad', costPerUnit: 0.14 },
    ],
  },
  {
    id: 14, name: 'Splasher Comma', category: 'BEBIDAS', line: 'BEBIDAS',
    salePrice: 3.50, soldPeriod: 88, revenuePeriod: 308.00, portions: 1,
    description: 'Coctelería sin alcohol de la casa · frutos cítricos, jarabe de jengibre y soda',
    ingredients: [
      { item: 'Soda',               qty: 200, unit: 'ml', costPerUnit: 0.003 },
      { item: 'Pulpa maracuyá',     qty: 30,  unit: 'g',  costPerUnit: 0.012 },
      { item: 'Jarabe jengibre',    qty: 25,  unit: 'ml', costPerUnit: 0.018 },
      { item: 'Limón sutil',        qty: 30,  unit: 'g',  costPerUnit: 0.0013 },
      { item: 'Menta + ralladura',  qty: 5,   unit: 'g',  costPerUnit: 0.012 },
      { item: 'Vaso especial + decoración', qty: 1, unit: 'unidad', costPerUnit: 0.22 },
    ],
  },
];

// Targets for premium fast-food
const FC_TARGET_LOW = 25;
const FC_TARGET_HIGH = 32;
const FC_CRITICAL = 40;

function recipeCost(recipe) {
  return recipe.ingredients.reduce((sum, i) => sum + (i.qty * i.costPerUnit), 0);
}
function recipeMetrics(recipe) {
  const cost = recipeCost(recipe);
  const fc = (cost / recipe.salePrice) * 100;
  const margin = recipe.salePrice - cost;
  const totalMargin = margin * recipe.soldPeriod;
  const totalCost = cost * recipe.soldPeriod;
  return { cost, fc, margin, totalMargin, totalCost };
}
function fcZone(fc) {
  if (fc < FC_TARGET_LOW) return { label: 'BAJO', color: 'var(--emerald)', bg: 'var(--emerald-soft)', tip: 'Muy rentable · revisar si la porción es adecuada' };
  if (fc <= FC_TARGET_HIGH) return { label: 'EN TARGET', color: 'var(--emerald)', bg: 'var(--emerald-soft)', tip: '25–32% es la zona ideal de premium fast-food' };
  if (fc <= FC_CRITICAL) return { label: 'ALTO', color: 'var(--gold)', bg: 'var(--gold-soft)', tip: '32–40% requiere atención · ajustar porción o subir precio' };
  return { label: 'CRÍTICO', color: 'var(--danger)', bg: '#FBE3E3', tip: '>40% no rentable · acción inmediata' };
}

function RecipesPage({ goTo }) {
  const [selected, setSelected] = useStateRC(null);
  const [view, setView] = useStateRC('cards'); // cards | table
  const [filter, setFilter] = useStateRC('all'); // all | target | high | critical
  const [search, setSearch] = useStateRC('');
  const [categoryFilter, setCategoryFilter] = useStateRC('all');

  const enriched = useMemoRC(() =>
    RECIPES.map(r => ({ ...r, ...recipeMetrics(r), zone: fcZone(recipeMetrics(r).fc) }))
  , []);

  const filtered = useMemoRC(() => {
    let r = enriched;
    if (categoryFilter !== 'all') r = r.filter(x => x.category === categoryFilter);
    if (filter === 'target') r = r.filter(x => x.fc >= FC_TARGET_LOW && x.fc <= FC_TARGET_HIGH);
    if (filter === 'low') r = r.filter(x => x.fc < FC_TARGET_LOW);
    if (filter === 'high') r = r.filter(x => x.fc > FC_TARGET_HIGH && x.fc <= FC_CRITICAL);
    if (filter === 'critical') r = r.filter(x => x.fc > FC_CRITICAL);
    if (search) r = r.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [filter, categoryFilter, search, enriched]);

  const stats = useMemoRC(() => {
    const totalRevenue = enriched.reduce((a, r) => a + r.revenuePeriod, 0);
    const totalCost = enriched.reduce((a, r) => a + r.totalCost, 0);
    const totalMargin = totalRevenue - totalCost;
    const avgFC = (totalCost / totalRevenue) * 100;
    const inTarget = enriched.filter(r => r.fc >= FC_TARGET_LOW && r.fc <= FC_TARGET_HIGH).length;
    const over = enriched.filter(r => r.fc > FC_TARGET_HIGH).length;
    return { totalRevenue, totalCost, totalMargin, avgFC, inTarget, over };
  }, [enriched]);

  const cats = ['all', ...new Set(enriched.map(r => r.category))];

  return (
    <div data-screen-label="Recipes">
      <div className="between mb-3">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Recetario · {enriched.length} fichas técnicas</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>Food cost promedio: </span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: stats.avgFC <= FC_TARGET_HIGH ? 'var(--emerald)' : 'var(--gold)' }}>
              {stats.avgFC.toFixed(1)}%
            </span>
            <span style={{ color: 'var(--muted)' }}> · objetivo 25–32%</span>
          </div>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}>Tarjetas</button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Tabla</button>
          </div>
          <button className="btn"><window.Icons.Download size={13} /> Exportar</button>
          <button className="btn btn-emerald"><window.Icons.Plus size={13} /> Nueva ficha</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">FC promedio</div>
          <div className="kpi-value" style={{ color: stats.avgFC <= FC_TARGET_HIGH ? 'var(--emerald)' : 'var(--gold)' }}>
            {stats.avgFC.toFixed(1)}<span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span className="trend">target 25–32%</span>
            <span>{enriched.length} platos</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Margen del periodo</div>
          <div className="kpi-value">${(stats.totalMargin / 1000).toFixed(1)}<span className="unit">K USD</span></div>
          <div className="kpi-foot">
            <span className="trend">{((stats.totalMargin / stats.totalRevenue) * 100).toFixed(0)}% margen</span>
            <span>vs. ${(stats.totalRevenue / 1000).toFixed(1)}K ventas</span>
          </div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => setFilter('target')}>
          <div className="kpi-label">En target</div>
          <div className="kpi-value" style={{ color: 'var(--emerald)' }}>{stats.inTarget}<span className="unit">/ {enriched.length}</span></div>
          <div className="kpi-foot">
            <span className="trend">FC 25–32%</span>
            <span>óptimo</span>
          </div>
        </div>
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => setFilter('high')}>
          <div className="kpi-label">Sobre target</div>
          <div className="kpi-value" style={{ color: 'var(--gold)' }}>{stats.over}</div>
          <div className="kpi-foot">
            <span className="trend down">FC &gt; 32%</span>
            <span>ajustar precio o porción</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div style={{ padding: '14px 22px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos ({enriched.length})</button>
            <button className={filter === 'low' ? 'active' : ''} onClick={() => setFilter('low')}>FC bajo</button>
            <button className={filter === 'target' ? 'active' : ''} onClick={() => setFilter('target')}>En target ({stats.inTarget})</button>
            <button className={filter === 'high' ? 'active' : ''} onClick={() => setFilter('high')}>Alto</button>
            <button className={filter === 'critical' ? 'active' : ''} onClick={() => setFilter('critical')}>Crítico</button>
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--surface)' }}>
            {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas las categorías' : c}</option>)}
          </select>
          <div className="search" style={{ width: 220 }}>
            <window.Icons.Search size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plato…" />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            Mostrando {filtered.length} de {enriched.length}
          </div>
        </div>
      </div>

      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => setSelected(r)} />)}
        </div>
      )}

      {view === 'table' && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Plato</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'right' }}>Margen</th>
                <th style={{ textAlign: 'right' }}>Food Cost</th>
                <th style={{ textAlign: 'right' }}>Vendidos</th>
                <th style={{ textAlign: 'right' }}>Margen total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.ingredients.length} ingredientes</div>
                  </td>
                  <td><span className="task-tag" style={{ background: 'var(--surface-2)' }}>{r.category}</span></td>
                  <td className="num" style={{ textAlign: 'right' }}>${r.cost.toFixed(2)}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>${r.salePrice.toFixed(2)}</td>
                  <td className="num" style={{ textAlign: 'right', color: 'var(--emerald)', fontWeight: 600 }}>${r.margin.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px',
                      borderRadius: 4, fontSize: 12, fontWeight: 700,
                      background: r.zone.bg, color: r.zone.color,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {r.fc.toFixed(1)}%
                    </span>
                  </td>
                  <td className="num" style={{ textAlign: 'right' }}>{r.soldPeriod.toLocaleString()}</td>
                  <td className="num total" style={{ textAlign: 'right' }}>${r.totalMargin.toFixed(0)}</td>
                  <td><window.Icons.ChevronRight size={13} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <RecipeDrawer recipe={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function RecipeCard({ recipe, onClick }) {
  const r = recipe;
  return (
    <div className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={onClick}>
      <div style={{
        padding: '14px 18px 6px',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="between" style={{ marginBottom: 6 }}>
          <span className="task-tag" style={{ background: 'var(--surface-2)' }}>{r.line}</span>
          <span style={{
            padding: '3px 8px',
            borderRadius: 4, fontSize: 11, fontWeight: 700,
            background: r.zone.bg, color: r.zone.color,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.04em',
          }}>
            FC {r.fc.toFixed(1)}%
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{r.description}</div>
      </div>
      <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Costo</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>${r.cost.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Precio</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>${r.salePrice.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Margen</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--emerald)' }}>${r.margin.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Vendidos</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{r.soldPeriod.toLocaleString()}</div>
        </div>
      </div>
      <div style={{
        padding: '10px 18px',
        background: 'var(--surface-2)',
        borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--muted)',
        marginTop: 'auto',
      }}>
        <span>Margen aportado al periodo</span>
        <span className="mono" style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>
          ${r.totalMargin.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

function RecipeDrawer({ recipe, onClose }) {
  const r = recipe;
  // Simulate "what-if" scenarios with slider
  const [whatIfPrice, setWhatIfPrice] = useStateRC(r.salePrice);
  const newMargin = whatIfPrice - r.cost;
  const newFC = (r.cost / whatIfPrice) * 100;
  const newZone = fcZone(newFC);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer" style={{ width: 540 }}>
        <div className="drawer-head" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="crumb">{r.category} · {r.line}</div>
              <h2 className="serif">{r.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {r.description}
              </div>
            </div>
            <button className="icon-btn" onClick={onClose}>
              <window.Icons.Plus size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12, marginTop: 18, padding: 14,
            background: 'var(--surface-2)', borderRadius: 10,
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Costo</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>${r.cost.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Precio</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>${r.salePrice.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Food Cost</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 4, color: r.zone.color }}>{r.fc.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Margen</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 4, color: 'var(--emerald)' }}>${r.margin.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="drawer-body">
          <div style={{ marginBottom: 18 }}>
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: r.zone.bg, borderLeft: `3px solid ${r.zone.color}`,
              fontSize: 12.5, color: 'var(--ink-2)',
              lineHeight: 1.5,
            }}>
              <b style={{ color: r.zone.color }}>{r.zone.label} ({r.fc.toFixed(1)}%)</b> — {r.zone.tip}
            </div>
          </div>

          <div className="section-label" style={{ marginBottom: 10 }}>Ingredientes ({r.ingredients.length})</div>
          <table className="tbl" style={{ marginBottom: 22 }}>
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th style={{ textAlign: 'right' }}>Cant.</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {r.ingredients.map((it, i) => {
                const total = it.qty * it.costPerUnit;
                const pctOfCost = (total / r.cost) * 100;
                return (
                  <tr key={i}>
                    <td style={{ fontSize: 12.5 }}>{it.item}</td>
                    <td className="num" style={{ textAlign: 'right' }}>
                      {it.qty} <span style={{ color: 'var(--muted)', fontSize: 10 }}>{it.unit}</span>
                    </td>
                    <td className="num" style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 11 }}>
                      ${it.costPerUnit.toFixed(4)}/{it.unit}
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${total.toFixed(3)}
                      <span style={{ color: 'var(--muted)', fontSize: 10, marginLeft: 6, fontWeight: 500 }}>
                        {pctOfCost.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg)' }}>
                <td colSpan="3" style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Costo total ingredientes
                </td>
                <td className="num total" style={{ textAlign: 'right', padding: '12px 16px', fontSize: 14 }}>
                  ${r.cost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* What-if analysis */}
          <div className="section-label" style={{ marginBottom: 10 }}>Análisis "qué pasaría si"</div>
          <div style={{
            padding: 16, borderRadius: 10,
            background: 'var(--surface-2)', marginBottom: 18,
          }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              Si cambias el precio de venta a:
            </div>
            <div className="between" style={{ marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>${whatIfPrice.toFixed(2)}</span>
              <input
                type="range"
                min={r.cost * 1.5}
                max={r.salePrice * 1.5}
                step="0.05"
                value={whatIfPrice}
                onChange={e => setWhatIfPrice(parseFloat(e.target.value))}
                style={{ flex: 1, marginLeft: 16, accentColor: 'var(--emerald)' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Nuevo FC</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: newZone.color }}>
                  {newFC.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Nuevo margen</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--emerald)' }}>
                  ${newMargin.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Margen periodo</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                  ${(newMargin * r.soldPeriod).toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Sales context */}
          <div className="section-label" style={{ marginBottom: 10 }}>Desempeño · 5 meses</div>
          <div style={{
            padding: 16, borderRadius: 10, border: '1px solid var(--line)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Unidades vendidas</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{r.soldPeriod.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Ingresos generados</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>${r.revenuePeriod.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Costo total ingredientes</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: 'var(--terracotta)' }}>
                  −${r.totalCost.toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Margen aportado</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: 'var(--emerald)' }}>
                  +${r.totalMargin.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Última actualización · hoy 14:32
          </div>
          <div className="row gap-2">
            <button className="btn">Duplicar</button>
            <button className="btn btn-primary"><window.Icons.Check size={13} /> Guardar cambios</button>
          </div>
        </div>
      </aside>
    </>
  );
}

window.RecipesPage = RecipesPage;
