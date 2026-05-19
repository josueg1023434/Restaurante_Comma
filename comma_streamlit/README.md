# 🍔 Comma Intelligence Platform

Plataforma de **Business Intelligence + Analytics + AI** para el restaurante Comma (Ecuador). MVP funcional construido con Streamlit, DuckDB y Plotly.

> **Estado:** v0.1 MVP funcional — carga real de Excels, dashboards interactivos, AI insights basados en reglas.

---

## 🚀 ¿Qué hace?

- **📤 Sube tus Excels del POS** (xlsx o xls). La plataforma detecta automáticamente el tipo de archivo y evita duplicados con hash.
- **📊 Dashboard ejecutivo** con KPIs, tendencias, heatmaps de hora × día, top productos, formas de pago.
- **🍔 Análisis de productos** con detección de duplicados por capitalización.
- **👥 Clientes recurrentes** con segmentación RFM simple.
- **📦 Alertas de inventario** (stock negativo, bajo, cero).
- **💡 AI Insights** automáticos: caídas sostenidas, concentración horaria, productos estrella, anomalías (z-score), oportunidades de retención.

---

## 🏗️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend / UI | Streamlit 1.40 + CSS custom (glassmorphism dark) |
| Storage | DuckDB embebido (archivo `data/comma.duckdb`) |
| Procesamiento | Pandas + openpyxl/xlrd |
| Visualización | Plotly |
| Hosting | Streamlit Community Cloud (gratis) |

**Sin dependencias externas pagas. Sin servidor que mantener.**

---

## 📦 Estructura del proyecto

```
comma_streamlit/
├── Home.py                          # Página principal
├── pages/
│   ├── 1_📤_Subir_Datos.py          # Ingesta de Excels
│   ├── 2_📊_Dashboard.py            # Dashboard ejecutivo
│   ├── 3_🍔_Productos.py            # Análisis de productos
│   ├── 4_👥_Clientes_Meseros.py     # Performance equipo + RFM
│   ├── 5_📦_Inventario.py           # Alertas inventario
│   └── 6_💡_AI_Insights.py          # Motor de insights
├── lib/
│   ├── db.py                        # Gestión de DuckDB
│   ├── data_loader.py               # Detección + normalización
│   ├── kpis.py                      # Queries SQL de KPIs
│   ├── insights.py                  # Motor de reglas
│   ├── charts.py                    # Helpers de Plotly
│   └── theme.py                     # CSS y componentes
├── .streamlit/config.toml           # Tema dark
├── requirements.txt
└── data/                            # DuckDB se guarda aquí
```

---

## 🏃 Cómo correr localmente

### 1. Requisitos
- Python 3.9 o superior
- pip

### 2. Instalación

```bash
# Clonar
git clone https://github.com/josueg1023434/Restaurante_Comma.git
cd Restaurante_Comma

# (recomendado) crear entorno virtual
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Correr la app
streamlit run Home.py
```

Abre el navegador en `http://localhost:8501` y listo.

---

## ☁️ Deploy gratis en Streamlit Cloud

1. Sube todo este repo a GitHub (público o privado).
2. Ve a [share.streamlit.io](https://share.streamlit.io).
3. Inicia sesión con GitHub.
4. Clic en **New app** → selecciona tu repo → branch `main` → main file: `Home.py`.
5. Deploy.

En ~2 minutos tendrás un link tipo `https://comma-bi.streamlit.app` que puedes compartir.

> ⚠️ **Importante:** en Streamlit Cloud el sistema de archivos no es persistente.
> Cada vez que la app reinicia, se pierden los datos. Para producción real,
> migrar a Postgres (Supabase tiene tier gratis) o usar el camino 2 (Next.js + FastAPI).

---

## 📊 Archivos del POS soportados

| Archivo | Detección automática por columnas |
|---|---|
| Detalle de ventas por artículos | `articulo`, `cantidad`, `mesero`, `precio` |
| Reporte de Ventas | `documento`, `total`, `mesero`, `subtotal` |
| Ventas por Formas de Pago | `forma`, `pago`, `banco` |
| Informe de Existencias | `existencia`, `linea`, `costo` |

Si tu archivo tiene nombres de columnas distintos, edita las firmas en
`lib/data_loader.py` (variable `SIGNATURES`).

---

## 🛠️ Decisiones técnicas

- **DuckDB en vez de Postgres**: el MVP es single-tenant y DuckDB es 100x más
  simple para empezar. Cuando se haga multi-tenant, se migra fácil.
- **Streamlit en vez de Next.js**: time-to-MVP es de horas, no semanas.
  Para Camino 2 (producto SaaS final), ver `ARQUITECTURA.md`.
- **Reglas en vez de LLM** para insights: barato, rápido, explicable.
  Los LLMs se agregan en Camino 2 para refinar las recomendaciones.
- **Detección por columnas** en vez de por nombre de archivo: robusto ante
  cambios de nombre en el POS.

---

## 📝 Roadmap próximo

- [ ] Forecast con Prophet (28 días + holidays Ecuador)
- [ ] Export PDF del dashboard
- [ ] Comparación entre períodos (este mes vs mes anterior)
- [ ] Alertas por email/WhatsApp cuando se detecta caída
- [ ] Migrar storage a Supabase para persistencia en cloud
- [ ] Multi-tenant (varios restaurantes en la misma app)

---

## 📄 Licencia

Proyecto privado. Desarrollado para **Restaurante Comma** · Ecuador 2026.
