// Real team + actual schedule for week of 19–25 May 2026
const COLORS = ['#0F6B4E', '#C8623C', '#B58A3C', '#4A3F8C', '#2E5C8A', '#7A5237', '#3D7A6B', '#A33A6B', '#5C7A3D'];
const colorFor = (i) => COLORS[i % COLORS.length];
const initialsOf = (name) => name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

// Real team — grouped by area
const EMPLOYEES = [
  // SERVICIO
  { id: 1,  name: 'Karen',   area: 'Servicio', role: 'Servicios',                phone: '+503 7212-4401', email: 'karen@comma.sv',   hired: '2024-02' },
  { id: 2,  name: 'Erick',   area: 'Servicio', role: 'Servicios',                phone: '+503 7212-4402', email: 'erick@comma.sv',   hired: '2023-09' },
  { id: 3,  name: 'Josué',   area: 'Servicio', role: 'Servicios',                phone: '+503 7212-4403', email: 'josue@comma.sv',   hired: '2024-11' },
  { id: 4,  name: 'André',   area: 'Servicio', role: 'Servicios',                phone: '+503 7212-4404', email: 'andre@comma.sv',   hired: '2023-04' },
  { id: 5,  name: 'José',    area: 'Servicio', role: 'Servicios',                phone: '+503 7212-4405', email: 'jose@comma.sv',    hired: '2024-06' },
  // BAR
  { id: 6,  name: 'Melanie', area: 'Bar',      role: 'Bartender',                phone: '+503 7212-4406', email: 'melanie@comma.sv', hired: '2023-11' },
  { id: 7,  name: 'Nayeli',  area: 'Bar',      role: 'Bartender',                phone: '+503 7212-4407', email: 'nayeli@comma.sv',  hired: '2022-08' },
  // COCINA
  { id: 8,  name: 'Ericar',  area: 'Cocina',   role: 'Jefe de Cocina',           phone: '+503 7212-4408', email: 'ericar@comma.sv',  hired: '2021-03' },
  { id: 9,  name: 'Juan',    area: 'Cocina',   role: 'Jefe Suplente de Cocina',  phone: '+503 7212-4409', email: 'juan@comma.sv',    hired: '2022-05' },
  { id: 10, name: 'Willian', area: 'Cocina',   role: 'Auxiliar de Cocina',       phone: '+503 7212-4410', email: 'willian@comma.sv', hired: '2024-01' },
  { id: 11, name: 'Paola',   area: 'Cocina',   role: 'Auxiliar de Cocina',       phone: '+503 7212-4411', email: 'paola@comma.sv',   hired: '2024-08' },
  // CAJA
  { id: 12, name: 'Liss',    area: 'Caja',     role: 'Cajera',                   phone: '+503 7212-4412', email: 'liss@comma.sv',    hired: '2023-07' },
];

EMPLOYEES.forEach((e, i) => { e.color = colorFor(i); e.initials = initialsOf(e.name); });

const AREAS = ['Servicio', 'Bar', 'Cocina', 'Caja'];
const AREA_COLOR = {
  Servicio: '#0F6B4E',
  Bar: '#4A3F8C',
  Cocina: '#C8623C',
  Caja: '#B58A3C',
};

// Week: Mar 19 – Lun 25 May 2026 (Tue → Mon)
const WEEK_DAYS = [
  { key: 'mar', label: 'Martes',    short: 'Mar', date: '19/05' },
  { key: 'mie', label: 'Miércoles', short: 'Mié', date: '20/05' },
  { key: 'jue', label: 'Jueves',    short: 'Jue', date: '21/05' },
  { key: 'vie', label: 'Viernes',   short: 'Vie', date: '22/05' },
  { key: 'sab', label: 'Sábado',    short: 'Sáb', date: '23/05' },
  { key: 'dom', label: 'Domingo',   short: 'Dom', date: '24/05' },
  { key: 'lun', label: 'Lunes',     short: 'Lun', date: '25/05' },
];
const TODAY_KEY = 'jue'; // Thursday is "today" in this snapshot

// Schedule entries — null = descanso, { in, out } = turno
// Times match the captured spreadsheet exactly.
const SCHEDULE = {
  1:  { mar: null,                  mie: null,                  jue: null,                  vie: null,                  sab: { in: '16:30', out: '22:30' }, dom: null,                  lun: null },
  2:  { mar: null,                  mie: null,                  jue: { in: '16:30', out: '22:30' }, vie: { in: '15:30', out: '23:30' }, sab: { in: '15:30', out: '23:30' }, dom: { in: '12:00', out: '20:00' }, lun: null },
  3:  { mar: null,                  mie: null,                  jue: null,                  vie: { in: '19:00', out: '23:30' }, sab: { in: '18:00', out: '23:30' }, dom: { in: '12:00', out: '18:00' }, lun: null },
  4:  { mar: { in: '16:30', out: '22:30' }, mie: null,                  jue: { in: '18:00', out: '22:30' }, vie: { in: '16:30', out: '23:30' }, sab: { in: '15:30', out: '23:30' }, dom: null,                  lun: { in: '16:30', out: '22:30' } },
  5:  { mar: { in: '16:30', out: '22:30' }, mie: null,                  jue: null,                  vie: null,                  sab: null,                  dom: { in: '12:00', out: '20:00' }, lun: { in: '16:30', out: '22:30' } },
  6:  { mar: null,                  mie: { in: '16:30', out: '22:30' }, jue: null,                  vie: { in: '18:00', out: '23:30' }, sab: { in: '18:00', out: '23:30' }, dom: null,                  lun: null },
  7:  { mar: { in: '16:30', out: '22:30' }, mie: { in: '16:30', out: '22:30' }, jue: { in: '16:30', out: '22:30' }, vie: { in: '15:30', out: '23:30' }, sab: { in: '15:30', out: '23:30' }, dom: { in: '12:00', out: '20:00' }, lun: null },
  8:  { mar: { in: '08:00', out: '18:00' }, mie: null,                  jue: { in: '16:30', out: '22:30' }, vie: { in: '14:30', out: '22:30' }, sab: { in: '12:00', out: '22:00' }, dom: { in: '11:00', out: '19:00' }, lun: null },
  9:  { mar: { in: '16:30', out: '22:30' }, mie: { in: '16:30', out: '22:30' }, jue: null,                  vie: { in: '18:30', out: '23:30' }, sab: { in: '16:30', out: '23:30' }, dom: null,                  lun: { in: '16:30', out: '22:30' } },
  10: { mar: { in: '13:00', out: '17:00' }, mie: { in: '18:00', out: '22:30' }, jue: null,                  vie: { in: '14:30', out: '23:30' }, sab: { in: '14:30', out: '23:30' }, dom: { in: '12:00', out: '20:00' }, lun: { in: '13:00', out: '17:00' } },
  11: { mar: { in: '18:00', out: '22:30' }, mie: null,                  jue: { in: '18:00', out: '22:30' }, vie: { in: '18:00', out: '23:30' }, sab: { in: '14:30', out: '23:30' }, dom: null,                  lun: { in: '18:00', out: '22:30' } },
  12: { mar: { in: '18:00', out: '22:30' }, mie: { in: '17:00', out: '22:30' }, jue: { in: '18:00', out: '22:30' }, vie: null /* VACANTE */,          sab: { in: '17:00', out: '23:30' }, dom: null,                  lun: { in: '18:00', out: '22:30' } },
};

// Computed unfilled shifts (gaps detected manually for demo)
const VACANCIES = [
  { day: 'vie', area: 'Caja', position: 'Cajera', needed: '18:00–23:30', note: 'Liss avisó incapacidad — sin cubrir' },
  { day: 'sab', area: 'Cocina', position: 'Aux. Cocina (refuerzo)', needed: '17:00–23:30', note: 'Proyección 92% ocupación sábado' },
];

// Compute carga (hours) from in/out times
function shiftHours(s) {
  if (!s) return 0;
  const [ih, im] = s.in.split(':').map(Number);
  const [oh, om] = s.out.split(':').map(Number);
  return ((oh * 60 + om) - (ih * 60 + im)) / 60;
}
function fmtHours(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}:${String(mm).padStart(2, '0')}`;
}

// Live status per employee (for "ahora" — we simulate Thursday 18:30)
function liveStatus(emp) {
  const s = SCHEDULE[emp.id][TODAY_KEY];
  if (!s) return 'off';
  const now = 18 * 60 + 30;
  const [ih, im] = s.in.split(':').map(Number);
  const [oh, om] = s.out.split(':').map(Number);
  const start = ih * 60 + im, end = oh * 60 + om;
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'on';
  return 'done';
}

const STATUS_LABEL = {
  on: 'En turno',
  off: 'Descanso',
  upcoming: 'Próximo',
  done: 'Finalizado',
  break: 'Pausa',
  late: 'Tarde',
};

// Tasks (Kanban) — updated to real team
const TASKS_INITIAL = {
  todo: [
    { id: 't1', title: 'Mise en place — estación fría', desc: 'Cortar guarniciones y emplatar 30 raciones', assignee: 10, tag: 'prep' },
    { id: 't2', title: 'Recepción de proveedores', desc: 'Verificar pedido de carnes y producto fresco', assignee: 8, tag: 'open' },
    { id: 't3', title: 'Limpieza profunda baños', desc: 'Incluye reposición de insumos', assignee: 5, tag: 'clean' },
    { id: 't4', title: 'Cubrir caja Viernes 18:00', desc: '⚠ Vacante — Liss reportó incapacidad', assignee: 12, tag: 'open' },
  ],
  progress: [
    { id: 't5', title: 'Servicio cena — barra', desc: 'Cobertura 18:00 a 23:30', assignee: 7, tag: 'open' },
    { id: 't6', title: 'Preparación salsas del día', desc: 'Demi-glace, alioli trufado, BBQ ahumado', assignee: 11, tag: 'prep' },
    { id: 't7', title: 'Inventario de bebidas', desc: 'Cava y nevera principal', assignee: 6, tag: 'open' },
  ],
  review: [
    { id: 't8', title: 'Limpieza freidoras', desc: 'Cambio de aceite y filtrado', assignee: 9, tag: 'clean' },
  ],
  done: [
    { id: 't9',  title: 'Apertura de caja', desc: 'Conteo inicial $850', assignee: 12, tag: 'open' },
    { id: 't10', title: 'Setup salón comedor', desc: '14 mesas + montaje completo', assignee: 4, tag: 'open' },
    { id: 't11', title: 'Briefing turno tarde', desc: 'Especiales del día y reservas VIP', assignee: 8, tag: 'open' },
  ],
};

Object.assign(window, {
  COLORS, colorFor, initialsOf,
  EMPLOYEES, AREAS, AREA_COLOR,
  WEEK_DAYS, TODAY_KEY, SCHEDULE, VACANCIES,
  shiftHours, fmtHours, liveStatus,
  STATUS_LABEL, TASKS_INITIAL,
});
