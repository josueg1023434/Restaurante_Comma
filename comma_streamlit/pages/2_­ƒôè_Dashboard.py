"""
Página: Dashboard Ejecutivo
KPIs, tendencias, heatmaps y rankings.
"""
from datetime import timedelta
import streamlit as st

from lib import db, kpis, charts
from lib.theme import inject_css


st.set_page_config(page_title="Dashboard · Comma", page_icon="📊", layout="wide")
inject_css()

st.title("📊 Dashboard Ejecutivo")

conn = db.get_connection()
counts = db.get_table_counts()

if not any(v > 0 for v in counts.values()):
    st.warning("⚠️ No hay datos cargados. Ve a **📤 Subir Datos** primero.")
    st.stop()


# ============================================================
# FILTROS DE FECHA EN SIDEBAR
# ============================================================
min_f, max_f = kpis.get_date_range(conn)

with st.sidebar:
    st.markdown("## 🔍 Filtros")

    if min_f and max_f:
        st.caption(f"Datos disponibles: **{min_f}** → **{max_f}**")

        preset = st.radio(
            "Período",
            ["Últimos 7 días", "Últimos 30 días", "Últimos 90 días",
             "Todo el período", "Personalizado"],
            index=3,
        )

        if preset == "Últimos 7 días":
            fecha_ini = max_f - timedelta(days=7)
            fecha_fin = max_f
        elif preset == "Últimos 30 días":
            fecha_ini = max_f - timedelta(days=30)
            fecha_fin = max_f
        elif preset == "Últimos 90 días":
            fecha_ini = max_f - timedelta(days=90)
            fecha_fin = max_f
        elif preset == "Todo el período":
            fecha_ini = min_f
            fecha_fin = max_f
        else:
            rango = st.date_input(
                "Rango",
                value=(min_f, max_f),
                min_value=min_f,
                max_value=max_f,
            )
            if len(rango) == 2:
                fecha_ini, fecha_fin = rango
            else:
                fecha_ini, fecha_fin = min_f, max_f
    else:
        fecha_ini, fecha_fin = None, None


# ============================================================
# KPIs PRINCIPALES
# ============================================================
resumen = kpis.kpis_resumen(conn, fecha_ini, fecha_fin)

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric(
    "Ventas Netas",
    f"${resumen['ventas_netas']:,.2f}",
    f"{resumen['dias_operados']} días",
)
c2.metric(
    "Tickets",
    f"{resumen['tickets']:,}",
    f"{resumen['tickets'] / max(resumen['dias_operados'], 1):.0f}/día",
)
c3.metric(
    "Ticket Promedio",
    f"${resumen['ticket_promedio']:,.2f}",
    f"{resumen['items_por_ticket']:.1f} items/ticket",
)
c4.metric(
    "Items Vendidos",
    f"{int(resumen['items_vendidos']):,}",
    f"{resumen['productos_activos']} productos activos",
)
c5.metric(
    "Clientes Únicos",
    f"{resumen['clientes_unicos']:,}",
    f"{resumen['meseros_activos']} meseros",
)


# Línea secundaria de métricas
c1, c2, c3, c4 = st.columns(4)
c1.metric("Venta diaria promedio", f"${resumen['venta_promedio_diaria']:,.2f}")
c2.metric("Tasa de anulación", f"{resumen['tasa_anulacion']:.2f}%",
           f"{resumen['anulados']} anulados")
inv = kpis.inventario_alertas(conn)
c3.metric("Inventario", f"{inv['total']} productos",
           f"{inv['stock_negativo']} con stock negativo" if inv['stock_negativo'] > 0 else "OK")
c4.metric("Valor en inventario", f"${inv['valor_inventario']:,.2f}")


# ============================================================
# TENDENCIA
# ============================================================
st.markdown("---")
st.markdown("### 📈 Tendencia de ventas")

tab1, tab2 = st.tabs(["Diario", "Mensual"])

with tab1:
    df_diario = kpis.ventas_diarias(conn, fecha_ini, fecha_fin)
    if df_diario.empty:
        st.info("Sin datos de tickets para el período seleccionado.")
    else:
        st.plotly_chart(charts.chart_tendencia(df_diario), use_container_width=True)

with tab2:
    df_mensual = kpis.ventas_mensuales(conn, fecha_ini, fecha_fin)
    if df_mensual.empty:
        st.info("Sin datos suficientes.")
    else:
        st.plotly_chart(charts.chart_mensual(df_mensual), use_container_width=True)


# ============================================================
# HEATMAP Y CATEGORÍAS
# ============================================================
st.markdown("---")
c1, c2 = st.columns([3, 2])

with c1:
    st.markdown("### 🔥 Heatmap hora × día")
    df_hm = kpis.heatmap_hora_dia(conn, fecha_ini, fecha_fin)
    if df_hm.empty:
        st.info("Sin datos para heatmap.")
    else:
        st.plotly_chart(charts.chart_heatmap(df_hm), use_container_width=True)

with c2:
    st.markdown("### 🍽️ Ventas por categoría")
    df_cat = kpis.ventas_por_categoria(conn, fecha_ini, fecha_fin)
    if df_cat.empty:
        st.info("Sin datos de categorías.")
    else:
        st.plotly_chart(charts.chart_categorias(df_cat), use_container_width=True)


# ============================================================
# HORAS Y DÍAS DE LA SEMANA
# ============================================================
st.markdown("---")
c1, c2 = st.columns(2)

with c1:
    st.markdown("### ⏰ Ventas por hora")
    df_h = kpis.ventas_por_hora(conn, fecha_ini, fecha_fin)
    if df_h.empty:
        st.info("Sin datos.")
    else:
        st.plotly_chart(charts.chart_horas(df_h), use_container_width=True)

with c2:
    st.markdown("### 📅 Ventas por día de la semana")
    df_d = kpis.ventas_por_dow(conn, fecha_ini, fecha_fin)
    if df_d.empty:
        st.info("Sin datos.")
    else:
        st.plotly_chart(charts.chart_dow(df_d), use_container_width=True)


# ============================================================
# TOP PRODUCTOS
# ============================================================
st.markdown("---")
st.markdown("### 🏆 Top 10 productos por ingresos")
df_top = kpis.top_productos(conn, fecha_ini, fecha_fin, limit=10)
if df_top.empty:
    st.info("Sin datos de productos.")
else:
    c1, c2 = st.columns([2, 3])
    with c1:
        st.plotly_chart(charts.chart_top_productos(df_top), use_container_width=True)
    with c2:
        st.dataframe(
            df_top,
            use_container_width=True,
            hide_index=True,
            column_config={
                "producto": "Producto",
                "categoria": "Categoría",
                "unidades": st.column_config.NumberColumn("Unidades", format="%d"),
                "ingresos": st.column_config.NumberColumn("Ingresos", format="$%.2f"),
                "precio_prom": st.column_config.NumberColumn("Precio Prom.", format="$%.2f"),
                "tickets": st.column_config.NumberColumn("Tickets", format="%d"),
            },
        )


# ============================================================
# FORMAS DE PAGO
# ============================================================
st.markdown("---")
st.markdown("### 💳 Formas de pago")
df_pag = kpis.formas_pago(conn, fecha_ini, fecha_fin)
if df_pag.empty:
    st.info("Sin datos de pagos.")
else:
    c1, c2 = st.columns([1, 2])
    with c1:
        st.plotly_chart(charts.chart_formas_pago(df_pag), use_container_width=True)
    with c2:
        st.dataframe(
            df_pag,
            use_container_width=True,
            hide_index=True,
            column_config={
                "forma_pago": "Forma de pago",
                "banco": "Banco",
                "monto": st.column_config.NumberColumn("Monto", format="$%.2f"),
                "transacciones": st.column_config.NumberColumn("Transacciones", format="%d"),
            },
        )
