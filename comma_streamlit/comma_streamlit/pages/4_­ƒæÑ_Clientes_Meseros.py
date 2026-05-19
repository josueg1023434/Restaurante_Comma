"""
Página: Clientes y Meseros
Análisis de retención y performance de equipo.
"""
import streamlit as st

from lib import db, kpis, charts
from lib.theme import inject_css


st.set_page_config(page_title="Clientes y Meseros · Comma", page_icon="👥", layout="wide")
inject_css()

st.title("👥 Clientes y Meseros")

conn = db.get_connection()
counts = db.get_table_counts()

if counts.get("ventas_tickets", 0) == 0:
    st.warning("⚠️ No hay datos de tickets. Sube primero **Reporte_de_Ventas**.")
    st.stop()


# Filtros
min_f, max_f = kpis.get_date_range(conn)
with st.sidebar:
    st.markdown("## 🔍 Filtros")
    if min_f and max_f:
        rango = st.date_input("Período", value=(min_f, max_f), min_value=min_f, max_value=max_f)
        fecha_ini, fecha_fin = rango if len(rango) == 2 else (min_f, max_f)
    else:
        fecha_ini, fecha_fin = None, None


# ============================================================
# MESEROS
# ============================================================
st.markdown("### 👨‍🍳 Performance de meseros")

df_m = kpis.performance_meseros(conn, fecha_ini, fecha_fin)
if df_m.empty:
    st.info("Sin datos de meseros.")
else:
    c1, c2 = st.columns([3, 2])

    with c1:
        st.plotly_chart(charts.chart_meseros(df_m), use_container_width=True)

    with c2:
        st.dataframe(
            df_m,
            use_container_width=True,
            hide_index=True,
            column_config={
                "mesero": "Mesero",
                "tickets": st.column_config.NumberColumn("Tickets", format="%d"),
                "ventas": st.column_config.NumberColumn("Ventas", format="$%.2f"),
                "ticket_promedio": st.column_config.NumberColumn("Ticket Prom.", format="$%.2f"),
            },
        )


# ============================================================
# CLIENTES RECURRENTES
# ============================================================
st.markdown("---")
st.markdown("### ⭐ Clientes recurrentes (2+ visitas)")

df_c = kpis.top_clientes(conn, fecha_ini, fecha_fin, limit=50)
if df_c.empty:
    st.info("No hay clientes recurrentes con datos suficientes.")
else:
    # Stats rápidas
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Clientes recurrentes", f"{len(df_c)}")
    c2.metric("Total gastado por ellos", f"${df_c['gastado'].sum():,.2f}")
    c3.metric("Visitas promedio", f"{df_c['visitas'].mean():.1f}")
    c4.metric("Top cliente", f"${df_c['gastado'].iloc[0]:,.0f}",
              df_c['cliente'].iloc[0][:20])

    st.dataframe(
        df_c,
        use_container_width=True,
        hide_index=True,
        column_config={
            "cliente": "Cliente",
            "visitas": st.column_config.NumberColumn("Visitas", format="%d"),
            "gastado": st.column_config.NumberColumn("Gastado", format="$%.2f"),
            "ticket_promedio": st.column_config.NumberColumn("Ticket Prom.", format="$%.2f"),
            "ultima_visita": "Última visita",
        },
    )

    # Segmentación RFM simple
    st.markdown("---")
    st.markdown("### 🎯 Segmentación RFM (simple)")
    st.caption("R = días desde última visita · F = frecuencia · M = monto gastado")

    import pandas as pd
    from datetime import date
    df_rfm = df_c.copy()
    today = date.today()
    df_rfm["dias_desde_ultima"] = (pd.to_datetime(today) - pd.to_datetime(df_rfm["ultima_visita"])).dt.days

    def segmentar(row):
        if row["visitas"] >= 5 and row["dias_desde_ultima"] <= 30:
            return "🏆 VIP activo"
        elif row["visitas"] >= 3 and row["dias_desde_ultima"] <= 60:
            return "💚 Leal"
        elif row["dias_desde_ultima"] > 90:
            return "💤 Inactivo"
        elif row["visitas"] >= 3:
            return "⚠️ En riesgo"
        else:
            return "🆕 Nuevo recurrente"

    df_rfm["segmento"] = df_rfm.apply(segmentar, axis=1)
    seg_counts = df_rfm["segmento"].value_counts().reset_index()
    seg_counts.columns = ["Segmento", "Clientes"]
    st.dataframe(seg_counts, use_container_width=True, hide_index=True)
