// Procurement / Station requests — each station posts what they need,
// consolidates into a single purchase order, prevents negative stock.

const { useState: useStateRQ, useMemo: useMemoRQ } = React;

// Stations with their lead and area
const STATIONS = [
  { id: 'cocina_caliente', name: 'Cocina Caliente', icon: 'Inventory', lead: 8,  area: 'Cocina', color: '#C8623C' },
  { id: 'cocina_fria',     name: 'Cocina Fría / Mise',  icon: 'Inventory', lead: 9,  area: 'Cocina', color: '#7A5237' },
  { id: 'barra',           name: 'Barra / Bebidas',     icon: 'Coffee',    lead: 7,  area: 'Bar',    color: '#4A3F8C' },
  { id: 'salon',           name: 'Salón / Servicio',    icon: 'Staff',     lead: 4,  area: 'Servicio', color: '#0F6B4E' },
  { id: 'caja',            name: 'Caja',                icon: 'Payroll',   lead: 12, area: 'Caja',   color: '#B58A3C' },
  { id: 'limpieza',        name: 'Limpieza',            icon: 'Check',     lead: 12, area: 'Caja',   color: '#3D7A6B' },
];

// Seed requests — realistic based on a fast-food premium restaurant
const SEED_REQUESTS = [
  // Cocina caliente
  { id: 'r1', station: 'cocina_caliente', item: 'Tomate riñón', qty: 5, unit: 'kg', urgency: 'hoy', requestedBy: 8, requestedAt: 'Hoy 14:20', status: 'pending', notes: 'Para mise en place de la cena', supplier: 'Mercado Mayorista', est: 8.50 },
  { id: 'r2', station: 'cocina_caliente', item: 'Aceite vegetal 1L', qty: 6, unit: 'botella', urgency: 'semana', requestedBy: 8, requestedAt: 'Hoy 09:00', status: 'approved', notes: 'Para freidora — duramos 5 días con esto', supplier: 'Distribuidora Aceitera', est: 24.00 },
  { id: 'r3', station: 'cocina_caliente', item: 'Pollo deshuesado', qty: 8, unit: 'kg', urgency: 'hoy', requestedBy: 9, requestedAt: 'Hoy 16:45', status: 'pending', notes: 'Quedamos con 2 kg, fin de semana exige más', supplier: 'Avícola San Pedro', est: 64.00, linkedItem: '8 boneless wings' },
  { id: 'r4', station: 'cocina_caliente', item: 'Pan brioche para hamburguesa', qty: 60, unit: 'unidad', urgency: 'manana', requestedBy: 10, requestedAt: 'Ayer 22:10', status: 'pending', notes: '', supplier: 'Panadería Artesanal', est: 18.00 },

  // Cocina fría
  { id: 'r5', station: 'cocina_fria', item: 'Lechuga romana', qty: 4, unit: 'kg', urgency: 'hoy', requestedBy: 11, requestedAt: 'Hoy 10:30', status: 'approved', notes: 'Para ensaladas de la tarde', supplier: 'Mercado Mayorista', est: 6.00 },
  { id: 'r6', station: 'cocina_fria', item: 'Queso cheddar', qty: 3, unit: 'kg', urgency: 'semana', requestedBy: 11, requestedAt: 'Hoy 11:00', status: 'pending', notes: '', supplier: 'Distribuidora Láctea', est: 36.00, linkedItem: 'PORCION CHEDAR LIQUIDO' },
  { id: 'r7', station: 'cocina_fria', item: 'Aguacate Hass', qty: 30, unit: 'unidad', urgency: 'semana', requestedBy: 11, requestedAt: 'Ayer 17:00', status: 'purchased', notes: 'Recibido a las 11:00', supplier: 'Mercado Mayorista', est: 18.00 },

  // Barra
  { id: 'r8',  station: 'barra', item: 'Limones', qty: 8, unit: 'kg', urgency: 'hoy', requestedBy: 6, requestedAt: 'Hoy 12:15', status: 'pending', notes: 'Para limonadas — top venta', supplier: 'Mercado Mayorista', est: 10.40, linkedItem: 'LIMONADA DE FRUTOS ROJOS' },
  { id: 'r9',  station: 'barra', item: 'Hielo en cubo', qty: 4, unit: 'bolsa 5kg', urgency: 'hoy', requestedBy: 7, requestedAt: 'Hoy 13:00', status: 'pending', notes: 'Reposición diaria fines de semana', supplier: 'Distribuidora El Polo', est: 12.00 },
  { id: 'r10', station: 'barra', item: 'Frutos rojos congelados', qty: 2, unit: 'kg', urgency: 'semana', requestedBy: 6, requestedAt: 'Hoy 14:00', status: 'approved', notes: '', supplier: 'Frozen Foods', est: 22.00, linkedItem: 'FRUTOS ROJOS' },
  { id: 'r11', station: 'barra', item: 'Almíbar de vainilla', qty: 2, unit: 'botella', urgency: 'mes', requestedBy: 7, requestedAt: 'Ayer 19:30', status: 'pending', notes: '', supplier: 'Distribuidora Bar', est: 16.00 },

  // Salón
  { id: 'r12', station: 'salon', item: 'Servilletas premium', qty: 10, unit: 'paquete', urgency: 'semana', requestedBy: 2, requestedAt: 'Hoy 09:45', status: 'pending', notes: '', supplier: 'Suministros Generales', est: 28.00 },
  { id: 'r13', station: 'salon', item: 'Velas pequeñas', qty: 30, unit: 'unidad', urgency: 'mes', requestedBy: 4, requestedAt: 'Hoy 15:00', status: 'pending', notes: 'Reposición ambientación de mesas', supplier: 'Suministros Generales', est: 9.00 },

  // Caja
  { id: 'r14', station: 'caja', item: 'Rollos térmicos impresora', qty: 6, unit: 'rollo', urgency: 'hoy', requestedBy: 12, requestedAt: 'Hoy 10:00', status: 'pending', notes: '⚠ Solo queda 1 rollo', supplier: 'Suministros Generales', est: 18.00 },
  { id: 'r15', station: 'caja', item: 'Bolsas de cambio', qty: 1, unit: 'paquete', urgency: 'mes', requestedBy: 12, requestedAt: 'Ayer 21:00', status: 'pending', notes: '', supplier: 'Suministros Generales', est: 4.00 },

  // Limpieza
  { id: 'r16', station: 'limpieza', item: 'Cloro 2L', qty: 3, unit: 'galón', urgency: 'semana', requestedBy: 5, requestedAt: 'Hoy 08:30', status: 'pending', notes: '', supplier: 'Distribuidora Limpieza SA', est: 21.00 },
  { id: 'r17', station: 'limpieza', item: 'Bolsas basura 50L', qty: 5, unit: 'paquete', urgency: 'semana', requestedBy: 5, requestedAt: 'Hoy 08:35', status: 'pending', notes: '', supplier: 'Distribuidora Limpieza SA', est: 15.00 },
  { id: 'r18', station: 'limpieza', item: 'Desengrasante industrial', qty: 2, unit: 'galón', urgency: 'hoy', requestedBy: 5, requestedAt: 'Hoy 08:40', status: 'pending', notes: 'Para limpieza de freidora', supplier: 'Distribuidora Limpieza SA', est: 28.00 },
];

const URGENCY = {
  hoy:    { label: 'Hoy',           color: '#B43A3A', bg: '#FBE3E3', order: 0 },
  manana: { label: 'Mañana',        color: '#C8623C', bg: '#F6E8DF', order: 1 },
  semana: { label: 'Esta semana',   color: '#B58A3C', bg: '#F4ECDA', order: 2 },
  mes:    { label: 'Próximo pedido',color: '#7A7A72', bg: '#F4F3EE', order: 3 },
};

const STATUS = {
  pending:   { label: 'Pendiente',    color: 'var(--muted)',     bg: 'var(--surface-2)'   },
  approved:  { label: 'Aprobado',     color: 'var(--emerald)',   bg: 'var(--emerald-soft)'},
  purchased: { label: 'Comprado',     color: '#4A3F8C',          bg: '#E8E5F3'            },
  received:  { label: 'Recibido',     color: 'var(--emerald)',   bg: 'var(--emerald-soft)'},
  rejected:  { label: 'Rechazado',    color: 'var(--danger)',    bg: '#FBE3E3'            },
};

function ProcurementPage({ goTo }) {
  const insights = window.useInsights ? window.useInsights() : null;
  const [requests, setRequests] = useStateRQ(SEED_REQUESTS);
  const [view, setView] = useStateRQ('stations'); // stations | consolidated | history
  const [composing, setComposing] = useStateRQ(null); // {station} when adding

  // Inventory lookup by article name (case-insensitive) for cross-checking
  const inventoryByName = {};
  if (insights?.inventoryFull) {
    insights.inventoryFull.forEach(it => {
      inventoryByName[it.articulo.toLowerCase()] = it;
    });
  }

  const addRequest = (station, payload) => {
    const newReq = {
      id: 'r' + Date.now(),
      station,
      requestedAt: 'Ahora',
      status: 'pending',
      ...payload,
    };
    setRequests(prev => [...prev, newReq]);
    setComposing(null);
  };

  const setStatus = (id, status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // Group requests by station
  const byStation = useMemoRQ(() => {
    const grouped = {};
    STATIONS.forEach(s => { grouped[s.id] = []; });
    requests.forEach(r => {
      if (grouped[r.station]) grouped[r.station].push(r);
    });
    // Sort by urgency
    Object.values(grouped).forEach(arr => arr.sort((a, b) => URGENCY[a.urgency].order - URGENCY[b.urgency].order));
    return grouped;
  }, [requests]);

  // Consolidated: by supplier, then by item (sum quantities if same item)
  const consolidated = useMemoRQ(() => {
    const active = requests.filter(r => r.status === 'pending' || r.status === 'approved');
    const bySupplier = {};
    for (const r of active) {
      const sup = r.supplier || 'Sin asignar';
      if (!bySupplier[sup]) bySupplier[sup] = { supplier: sup, items: {}, total: 0, count: 0 };
      const key = r.item.toLowerCase();
      if (!bySupplier[sup].items[key]) {
        bySupplier[sup].items[key] = {
          item: r.item, unit: r.unit, qty: 0, est: 0,
          urgencies: new Set(),
          stations: new Set(),
          linked: r.linkedItem,
          notes: [],
        };
      }
      const e = bySupplier[sup].items[key];
      e.qty += r.qty;
      e.est += r.est * (r.qty / (r.qty || 1)) ; // est is for the quantity already
      e.urgencies.add(r.urgency);
      e.stations.add(r.station);
      if (r.notes) e.notes.push(r.notes);
      bySupplier[sup].total += r.est;
      bySupplier[sup].count += 1;
    }
    return Object.values(bySupplier)
      .map(s => ({ ...s, items: Object.values(s.items) }))
      .sort((a, b) => b.total - a.total);
  }, [requests]);

  const grandTotal = consolidated.reduce((a, s) => a + s.total, 0);
  const totalActive = requests.filter(r => r.status === 'pending' || r.status === 'approved').length;
  const totalUrgent = requests.filter(r => r.urgency === 'hoy' && r.status !== 'purchased' && r.status !== 'received').length;

  return (
    <div data-screen-label="Procurement">
      <div className="between mb-3">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Solicitudes de compra · jueves 22 mayo</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{totalActive} solicitudes activas</span>
            <span style={{ color: 'var(--muted)' }}> · {totalUrgent} urgentes hoy · ${grandTotal.toFixed(2)} estimado total</span>
          </div>
        </div>
        <div className="row gap-2">
          <div className="tabs">
            <button className={view === 'stations' ? 'active' : ''} onClick={() => setView('stations')}>Por estación</button>
            <button className={view === 'consolidated' ? 'active' : ''} onClick={() => setView('consolidated')}>Consolidado</button>
            <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>Historial</button>
          </div>
          <button className="btn"><window.Icons.Download size={13} /> Exportar OC</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Urgentes hoy</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{totalUrgent}</div>
          <div className="kpi-foot">
            <span className="trend down">acción inmediata</span>
            <span>antes 18:00</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">En aprobación</div>
          <div className="kpi-value">{requests.filter(r => r.status === 'pending').length}</div>
          <div className="kpi-foot">
            <span className="trend flat">esperando</span>
            <span>requiere gerente</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Aprobadas</div>
          <div className="kpi-value" style={{ color: 'var(--emerald)' }}>{requests.filter(r => r.status === 'approved').length}</div>
          <div className="kpi-foot">
            <span className="trend">listas para OC</span>
            <span>generar pedido</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total a comprar</div>
          <div className="kpi-value">
            {grandTotal >= 1000 ? '$' + (grandTotal / 1000).toFixed(1) : '$' + grandTotal.toFixed(0)}
            <span className="unit">{grandTotal >= 1000 ? 'K USD' : 'USD'}</span>
          </div>
          <div className="kpi-foot">
            <span className="trend flat">{consolidated.length} proveedores</span>
            <span>periodo actual</span>
          </div>
        </div>
      </div>

      {view === 'stations' && (
        <StationsView
          stations={STATIONS}
          byStation={byStation}
          inventoryByName={inventoryByName}
          onAdd={(s) => setComposing(s)}
          onStatus={setStatus}
        />
      )}

      {view === 'consolidated' && (
        <ConsolidatedView
          consolidated={consolidated}
          inventoryByName={inventoryByName}
          grandTotal={grandTotal}
        />
      )}

      {view === 'history' && (
        <HistoryView requests={requests.filter(r => r.status === 'purchased' || r.status === 'received' || r.status === 'rejected')} />
      )}

      {composing && (
        <NewRequestModal
          station={composing}
          inventoryItems={insights?.inventoryFull || []}
          onClose={() => setComposing(null)}
          onAdd={(payload) => addRequest(composing.id, payload)}
        />
      )}
    </div>
  );
}

/* ---------- Stations view (Kanban of station boards) ---------- */
function StationsView({ stations, byStation, inventoryByName, onAdd, onStatus }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
    }}>
      {stations.map(s => {
        const reqs = byStation[s.id] || [];
        const lead = EMPLOYEES.find(e => e.id === s.lead);
        const urgent = reqs.filter(r => r.urgency === 'hoy' && r.status === 'pending').length;
        return (
          <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-head" style={{ padding: '14px 18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="area-dot" style={{ background: s.color, width: 10, height: 10 }}></span>
                  <div className="card-title">{s.name}</div>
                </div>
                <div className="card-sub" style={{ marginTop: 4 }}>
                  {reqs.length} solicitudes · responsable {lead?.name || '—'}
                  {urgent > 0 && <span style={{ color: 'var(--danger)', fontWeight: 700, marginLeft: 6 }}>· {urgent} urgentes</span>}
                </div>
              </div>
              <button className="row-icon-btn" title="Nueva solicitud" onClick={() => onAdd(s)}>
                <window.Icons.Plus size={14} />
              </button>
            </div>
            <div style={{ padding: '6px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
              {reqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted-2)', fontSize: 12 }}>
                  Sin solicitudes
                </div>
              ) : reqs.map(r => (
                <RequestCard key={r.id} req={r} inventoryByName={inventoryByName} onStatus={onStatus} />
              ))}
              <button onClick={() => onAdd(s)} style={{
                width: '100%', padding: '8px',
                background: 'transparent',
                border: '1px dashed var(--line-2)',
                borderRadius: 8,
                color: 'var(--muted)',
                fontSize: 12,
                fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer',
              }}>
                <window.Icons.Plus size={12} /> Solicitar artículo
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestCard({ req, inventoryByName, onStatus }) {
  const urg = URGENCY[req.urgency];
  const st = STATUS[req.status];
  const emp = EMPLOYEES.find(e => e.id === req.requestedBy);
  // Stock alert: if linked inventory item is negative or low
  let stockWarning = null;
  if (req.linkedItem) {
    const inv = inventoryByName[req.linkedItem.toLowerCase()];
    if (inv && inv.existencia < 0) {
      stockWarning = `Stock POS en negativo (${inv.existencia})`;
    } else if (inv && inv.existencia <= 5 && inv.existencia >= 0) {
      stockWarning = `Stock POS bajo (${inv.existencia})`;
    }
  }

  return (
    <div style={{
      border: '1px solid var(--line)',
      borderLeft: `3px solid ${urg.color}`,
      borderRadius: 8,
      padding: '10px 12px',
      background: 'var(--surface)',
    }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{req.item}</div>
        <span style={{
          fontSize: 9.5, fontWeight: 700,
          padding: '2px 6px', borderRadius: 4,
          background: urg.bg, color: urg.color,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>{urg.label}</span>
      </div>
      <div className="row gap-2" style={{ marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{req.qty}</span>
        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{req.unit}</span>
        {req.est > 0 && (
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', marginLeft: 'auto' }}>~${req.est.toFixed(2)}</span>
        )}
      </div>
      {stockWarning && (
        <div style={{
          fontSize: 10.5, color: 'var(--danger)',
          background: '#FDF4F4', padding: '4px 6px',
          borderRadius: 4, marginBottom: 6,
          fontWeight: 600,
        }}>
          ⚠ {stockWarning}
        </div>
      )}
      {req.notes && (
        <div style={{ fontSize: 11, color: 'var(--ink-2)', fontStyle: 'italic', marginBottom: 6, lineHeight: 1.4 }}>
          {req.notes}
        </div>
      )}
      <div className="between" style={{ marginTop: 4, fontSize: 10.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)' }}>
          {emp && (
            <>
              <div className="mini-avatar" style={{ background: emp.color, width: 16, height: 16, fontSize: 8 }}>{emp.initials}</div>
              <span>{emp.name}</span>
            </>
          )}
          <span>· {req.requestedAt}</span>
        </div>
        <span style={{
          fontSize: 9.5, fontWeight: 700,
          padding: '2px 6px', borderRadius: 4,
          background: st.bg, color: st.color,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>{st.label}</span>
      </div>
      {req.status === 'pending' && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button className="btn btn-emerald" style={{ flex: 1, padding: '4px 8px', fontSize: 10.5 }} onClick={() => onStatus(req.id, 'approved')}>
            Aprobar
          </button>
          <button className="btn" style={{ padding: '4px 8px', fontSize: 10.5, color: 'var(--danger)' }} onClick={() => onStatus(req.id, 'rejected')}>
            Rechazar
          </button>
        </div>
      )}
      {req.status === 'approved' && (
        <button className="btn btn-primary" style={{ width: '100%', padding: '4px 8px', fontSize: 10.5, marginTop: 8 }} onClick={() => onStatus(req.id, 'purchased')}>
          Marcar como comprado
        </button>
      )}
      {req.status === 'purchased' && (
        <button className="btn" style={{ width: '100%', padding: '4px 8px', fontSize: 10.5, marginTop: 8, background: 'var(--emerald-soft)', color: 'var(--emerald)', borderColor: 'var(--emerald)' }} onClick={() => onStatus(req.id, 'received')}>
          Confirmar recepción
        </button>
      )}
    </div>
  );
}

/* ---------- Consolidated view: by supplier ---------- */
function ConsolidatedView({ consolidated, inventoryByName, grandTotal }) {
  return (
    <div>
      <div className="alert-card" style={{ background: 'var(--emerald-soft)', borderColor: 'var(--emerald)', marginBottom: 14 }}>
        <window.Icons.Check size={16} stroke={2.4} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            Orden de compra consolidada
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
            {consolidated.length} proveedores · {consolidated.reduce((a, s) => a + s.items.length, 0)} líneas · <b className="mono">${grandTotal.toFixed(2)} USD total estimado</b>
          </div>
        </div>
        <button className="btn btn-emerald" style={{ alignSelf: 'center' }}>
          <window.Icons.Bell size={13} /> Enviar a proveedores
        </button>
      </div>

      {consolidated.map(sup => {
        return (
          <div className="card mb-3" key={sup.supplier}>
            <div className="card-head">
              <div>
                <div className="card-title">{sup.supplier}</div>
                <div className="card-sub">{sup.items.length} líneas · {sup.count} solicitudes</div>
              </div>
              <div className="row gap-2">
                <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>${sup.total.toFixed(2)}</span>
                <button className="btn"><window.Icons.Download size={13} /> PDF</button>
                <button className="btn btn-primary">Generar OC</button>
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Urgencia</th>
                  <th>Artículo</th>
                  <th>Stations</th>
                  <th style={{ textAlign: 'right' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Stock POS</th>
                  <th style={{ textAlign: 'right' }}>Est.</th>
                </tr>
              </thead>
              <tbody>
                {sup.items.map((it, i) => {
                  const maxUrgency = [...it.urgencies].sort((a, b) => URGENCY[a].order - URGENCY[b].order)[0];
                  const urg = URGENCY[maxUrgency];
                  const inv = it.linked ? inventoryByName[it.linked.toLowerCase()] : null;
                  return (
                    <tr key={i}>
                      <td>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 4,
                          background: urg.bg, color: urg.color,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>{urg.label}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{it.item}</div>
                        {it.notes.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>
                            {it.notes[0]}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {[...it.stations].map(sid => {
                            const st = STATIONS.find(s => s.id === sid);
                            return (
                              <span key={sid} style={{
                                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                background: st.color + '15', color: st.color, fontWeight: 600,
                              }}>
                                {st.name.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {it.qty} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 11 }}>{it.unit}</span>
                      </td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {inv ? (
                          <span style={{
                            color: inv.existencia < 0 ? 'var(--danger)' : inv.existencia <= 10 ? 'var(--gold)' : 'var(--emerald)',
                            fontWeight: 700,
                          }}>
                            {inv.existencia}
                          </span>
                        ) : <span style={{ color: 'var(--muted-2)' }}>—</span>}
                      </td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>${it.est.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)' }}>
                  <td colSpan="5" style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Subtotal {sup.supplier}
                  </td>
                  <td className="num" style={{ textAlign: 'right', padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>
                    ${sup.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      {consolidated.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          No hay solicitudes pendientes ni aprobadas
        </div>
      )}
    </div>
  );
}

/* ---------- History view ---------- */
function HistoryView({ requests }) {
  if (requests.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
        Sin historial todavía
      </div>
    );
  }
  return (
    <div className="card">
      <table className="tbl">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Estación</th>
            <th>Solicitante</th>
            <th>Proveedor</th>
            <th style={{ textAlign: 'right' }}>Cantidad</th>
            <th style={{ textAlign: 'right' }}>Costo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => {
            const st = STATUS[r.status];
            const station = STATIONS.find(s => s.id === r.station);
            const emp = EMPLOYEES.find(e => e.id === r.requestedBy);
            return (
              <tr key={r.id}>
                <td style={{ fontSize: 13, fontWeight: 600 }}>{r.item}</td>
                <td>{station?.name}</td>
                <td>{emp?.name}</td>
                <td>{r.supplier}</td>
                <td className="num" style={{ textAlign: 'right' }}>{r.qty} {r.unit}</td>
                <td className="num" style={{ textAlign: 'right' }}>${r.est.toFixed(2)}</td>
                <td>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
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
    </div>
  );
}

/* ---------- New request modal ---------- */
function NewRequestModal({ station, inventoryItems, onClose, onAdd }) {
  const [item, setItem] = useStateRQ('');
  const [qty, setQty] = useStateRQ(1);
  const [unit, setUnit] = useStateRQ('unidad');
  const [urgency, setUrgency] = useStateRQ('semana');
  const [notes, setNotes] = useStateRQ('');
  const [est, setEst] = useStateRQ(0);
  const [supplier, setSupplier] = useStateRQ('Por asignar');

  const submit = () => {
    if (!item.trim()) return;
    onAdd({
      item: item.trim(),
      qty: parseFloat(qty) || 1,
      unit, urgency, supplier,
      est: parseFloat(est) || 0,
      notes: notes.trim(),
      requestedBy: station.lead,
    });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer" style={{ width: 480 }}>
        <div className="drawer-head">
          <div>
            <div className="crumb" style={{ marginBottom: 4 }}>Nueva solicitud</div>
            <h2 className="serif">{station.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Indica qué artículo necesitas y para cuándo
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
            <input
              value={item}
              onChange={e => setItem(e.target.value)}
              placeholder="Ej. Tomate riñón, Aceite vegetal, Servilletas…"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Cantidad
              </label>
              <input
                type="number" value={qty} onChange={e => setQty(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'JetBrains Mono' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Unidad
              </label>
              <select value={unit} onChange={e => setUnit(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
                {['unidad', 'kg', 'g', 'lb', 'litro', 'ml', 'botella', 'paquete', 'caja', 'galón', 'rollo', 'bolsa'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Urgencia
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {Object.entries(URGENCY).map(([k, v]) => (
                <button key={k} onClick={() => setUrgency(k)}
                  style={{
                    padding: '10px 4px', borderRadius: 8,
                    border: urgency === k ? `2px solid ${v.color}` : '1px solid var(--line-2)',
                    background: urgency === k ? v.bg : '#fff',
                    color: urgency === k ? v.color : 'var(--ink-2)',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Proveedor sugerido
              </label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Costo estimado
              </label>
              <input type="number" step="0.01" value={est} onChange={e => setEst(e.target.value)} placeholder="0.00"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'JetBrains Mono' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Notas / contexto
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3"
              placeholder="Ej. para servicio de cena del viernes, top venta, etc."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div className="drawer-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Va al pool de aprobación del gerente
          </div>
          <div className="row gap-2">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-emerald" onClick={submit} disabled={!item.trim()}>
              <window.Icons.Plus size={13} /> Enviar solicitud
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

window.ProcurementPage = ProcurementPage;
