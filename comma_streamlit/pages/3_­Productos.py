"""
Página: Productos
Análisis profundo de productos, ABC, sin rotación, duplicados.
"""
from datetime import timedelta
import streamlit as st
import pandas as pd

from lib import db, kpis, charts
from lib.theme import inject_css


st.set_page_config(page_title="Productos · Comma", page_icon="🍔", layout="wide")
inject_css()

st.title("🍔 Análisis de Productos")

conn = db.get_connection()
counts = db.get_table_counts()

if counts.get("ventas_detalle", 0) == 0:
    st.warning("⚠️ No hay datos de detalle de ventas. Sube primero el archivo "
                "**Detalle_de_ventas_por_articulos**.")
    st.stop()


# ============================================================
# FILTROS
# ============================================================
min_f, max_f = kpis.get_date_range(conn)

with st.sidebar:
    st.markdown("## 🔍 Filtros")
    if min_f and max_f:
        rango = st.date_input(
            "Período",
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
# RESUMEN POR CATEGORÍA
# ============================================================
st.markdown("### 📦 Resumen por categoría")
df_cat = kpis.ventas_por_categoria(conn, fecha_ini, fecha_fin)
if not df_cat.empty:
    st.dataframe(
        df_cat,
        use_container_width=True,
        hide_index=True,
        column_config={
            "categoria": "Categoría",
            "ingresos": st.column_config.NumberColumn("Ingresos", format="$%.2f"),
            "unidades": st.column_config.NumberColumn("Unidades", format="%d"),
            "productos": st.column_config.NumberColumn("# Productos", format="%d"),
        },
    )


# ============================================================
# TOP Y BOTTOM PRODUCTOS
# ============================================================
st.markdown("---")
tab1, tab2, tab3 = st.tabs(["🏆 Top productos", "📉 Bottom productos", "🔍 Buscar producto"])

with tab1:
    n = st.slider("Cantidad a mostrar", 5, 50, 20, key="top_n")
    df_top = kpis.top_productos(conn, fecha_ini, fecha_fin, limit=n)
    if df_top.empty:
        st.info("Sin datos.")
    else:
        st.plotly_chart(charts.chart_top_productos(df_top, n=n), use_container_width=True)
        st.dataframe(df_top, use_container_width=True, hide_index=True)

with tab2:
    st.markdown("Productos con menor rotación (al menos 1 venta en el período):")
    try:
        df_bottom = conn.execute("""
            SELECT
                producto,
                categoria,
                SUM(cantidad) AS unidades,
                SUM(subtotal) AS ingresos,
                COUNT(DISTINCT documento) AS tickets
            FROM ventas_detalle
            WHERE fecha BETWEEN ? AND ?
            GROUP BY producto, categoria
            ORDER BY ingresos ASC
            LIMIT 30
        """, [fecha_ini, fecha_fin]).fetchdf()
        st.dataframe(df_bottom, use_container_width=True, hide_index=True)
    except Exception as e:
        st.error(f"Error: {e}")

with tab3:
    busqueda = st.text_input("Buscar producto", placeholder="ej: hamburguesa")
    if busqueda:
        try:
            df_search = conn.execute("""
                SELECT
                    producto,
                    categoria,
                    SUM(cantidad) AS unidades,
                    SUM(subtotal) AS ingresos,
                    AVG(precio_unitario) AS precio_prom,
                    MIN(fecha) AS primera_venta,
                    MAX(fecha) AS ultima_venta
                FROM ventas_detalle
                WHERE LOWER(producto) LIKE LOWER(?)
                  AND fecha BETWEEN ? AND ?
                GROUP BY producto, categoria
                ORDER BY ingresos DESC
            """, [f"%{busqueda}%", fecha_ini, fecha_fin]).fetchdf()
            if df_search.empty:
                st.info("Sin resultados.")
            else:
                st.dataframe(df_search, use_container_width=True, hide_index=True)
        except Exception as e:
            st.error(f"Error: {e}")


# ============================================================
# DUPLICADOS POR CAPITALIZACIÓN
# ============================================================
st.markdown("---")
st.markdown("### ⚠️ Productos duplicados por capitalización")
st.caption("Productos que aparecen con diferentes mayúsculas/minúsculas en el POS.")

try:
    df_dup = conn.execute("""
        SELECT
            LOWER(TRIM(producto)) AS producto_normalizado,
            COUNT(DISTINCT producto) AS variantes,
            STRING_AGG(DISTINCT producto, ' | ') AS nombres,
            SUM(subtotal) AS ingresos_total
        FROM ventas_detalle
        GROUP BY producto_normalizado
        HAVING COUNT(DISTINCT producto) > 1
        ORDER BY ingresos_total DESC
    """).fetchdf()

    if df_dup.empty:
        st.success("✓ No hay productos duplicados por capitalización.")
    else:
        st.warning(f"Se encontraron {len(df_dup)} productos con duplicación.")
        st.dataframe(df_dup, use_container_width=True, hide_index=True)
except Exception as e:
    st.error(f"Error: {e}")
