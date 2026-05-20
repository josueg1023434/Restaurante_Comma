"""
Página: AI Insights
Detección automática de patrones, anomalías y oportunidades.
"""
import streamlit as st

from lib import db, kpis, insights
from lib.theme import inject_css, render_insight_card


st.set_page_config(page_title="AI Insights · Comma", page_icon="💡", layout="wide")
inject_css()

st.title("💡 AI Insights")
st.markdown(
    "Detección automática de patrones, anomalías y oportunidades basadas en "
    "reglas heurísticas aplicadas a tus datos."
)

conn = db.get_connection()
counts = db.get_table_counts()

if not any(v > 0 for v in counts.values()):
    st.warning("⚠️ No hay datos cargados.")
    st.stop()


# Filtros
min_f, max_f = kpis.get_date_range(conn)
with st.sidebar:
    st.markdown("## 🔍 Filtros")
    if min_f and max_f:
        rango = st.date_input("Período", value=(min_f, max_f),
                              min_value=min_f, max_value=max_f)
        fecha_ini, fecha_fin = rango if len(rango) == 2 else (min_f, max_f)
    else:
        fecha_ini, fecha_fin = None, None


# ============================================================
# GENERAR INSIGHTS
# ============================================================
with st.spinner("Analizando datos..."):
    todos = insights.generar_insights(conn, fecha_ini, fecha_fin)


if not todos:
    st.info("No se detectaron patrones suficientes con los datos actuales. "
             "Carga más datos o amplía el rango de fechas.")
    st.stop()


# ============================================================
# RESUMEN
# ============================================================
por_tipo = {}
for ins in todos:
    por_tipo.setdefault(ins["tipo"], []).append(ins)

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("🔴 Críticos", len(por_tipo.get("critical", [])))
c2.metric("🟡 Advertencias", len(por_tipo.get("warning", [])))
c3.metric("💡 Oportunidades", len(por_tipo.get("opportunity", [])))
c4.metric("🟢 Éxitos", len(por_tipo.get("success", [])))
c5.metric("📊 Total", len(todos))


# ============================================================
# FILTROS DE VISUALIZACIÓN
# ============================================================
st.markdown("---")
filtro_tipo = st.multiselect(
    "Filtrar por tipo",
    options=["critical", "warning", "opportunity", "success", "info"],
    default=["critical", "warning", "opportunity", "success"],
    format_func=lambda x: {
        "critical": "🔴 Crítico",
        "warning": "🟡 Advertencia",
        "opportunity": "💡 Oportunidad",
        "success": "🟢 Éxito",
        "info": "ℹ️ Info",
    }.get(x, x),
)

filtrados = [i for i in todos if i["tipo"] in filtro_tipo]


# ============================================================
# RENDER INSIGHTS
# ============================================================
st.markdown(f"### 📋 {len(filtrados)} insight(s)")

for ins in filtrados:
    render_insight_card(ins)


# ============================================================
# EXPLICACIÓN
# ============================================================
st.markdown("---")
with st.expander("ℹ️ ¿Cómo funcionan estos insights?"):
    st.markdown("""
    Los insights se generan aplicando reglas heurísticas sobre los KPIs:

    - **Tendencias sostenidas**: regresión lineal sobre ventas mensuales,
      detecta caídas o crecimientos con R² > 0.6.
    - **Concentración horaria**: detecta si una hora supera el 25% del total.
    - **Dependencia de fin de semana**: alerta si vie+sáb pasan 45%.
    - **Productos estrella**: identifica el top si supera 10% del top-10.
    - **Anomalías**: días con z-score > 3 (récords).
    - **Retención**: alerta si menos de 10% son recurrentes con 3+ visitas.
    - **Duplicados**: productos con misma escritura pero distinta capitalización.
    - **Inventario**: stock negativo, cero o bajo.

    En la versión completa de la plataforma (Camino 2), estos insights se
    enriquecerán con **LLMs (Claude/GPT)** para generar recomendaciones
    contextuales más sofisticadas y forecasting con **Prophet**.
    """)
