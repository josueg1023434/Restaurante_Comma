"""
Página: Inventario
Alertas, valor en stock, productos sin movimiento.
"""
import streamlit as st
import plotly.express as px

from lib import db, kpis
from lib.theme import inject_css, COLOR_PRIMARY


st.set_page_config(page_title="Inventario · Comma", page_icon="📦", layout="wide")
inject_css()

st.title("📦 Inventario")

conn = db.get_connection()
counts = db.get_table_counts()

if counts.get("inventario", 0) == 0:
    st.warning("⚠️ No hay datos de inventario. Sube primero **Informe_de_Existencias**.")
    st.stop()


# ============================================================
# RESUMEN DE ALERTAS
# ============================================================
alertas = kpis.inventario_alertas(conn)

st.markdown("### 🚨 Resumen de alertas")
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Total productos", f"{alertas['total']}")
c2.metric("Stock negativo", f"{alertas['stock_negativo']}",
          delta=f"-{alertas['stock_negativo'] / max(alertas['total'], 1) * 100:.0f}%",
          delta_color="inverse")
c3.metric("Stock cero", f"{alertas['stock_cero']}")
c4.metric("Stock bajo (≤5)", f"{alertas['stock_bajo']}")
c5.metric("Valor inventario", f"${alertas['valor_inventario']:,.2f}")


# ============================================================
# DETALLE
# ============================================================
st.markdown("---")
st.markdown("### 📋 Detalle del inventario")

df = kpis.inventario_detalle(conn)
if df.empty:
    st.info("Sin datos.")
    st.stop()


# Filtro por estado
estados = df["estado"].unique().tolist()
filtro = st.multiselect("Filtrar por estado", estados, default=estados)
df_filtered = df[df["estado"].isin(filtro)]

# Buscador
busqueda = st.text_input("🔍 Buscar producto", placeholder="ej: hamburguesa")
if busqueda:
    df_filtered = df_filtered[
        df_filtered["articulo"].str.contains(busqueda, case=False, na=False)
    ]

st.caption(f"Mostrando {len(df_filtered)} de {len(df)} productos")

st.dataframe(
    df_filtered,
    use_container_width=True,
    hide_index=True,
    column_config={
        "codigo": "Código",
        "articulo": "Artículo",
        "linea": "Línea",
        "existencia": st.column_config.NumberColumn("Existencia", format="%.0f"),
        "costo_promedio": st.column_config.NumberColumn("Costo Prom.", format="$%.2f"),
        "valor": st.column_config.NumberColumn("Valor", format="$%.2f"),
        "estado": "Estado",
    },
)


# ============================================================
# DISTRIBUCIÓN POR LÍNEA
# ============================================================
st.markdown("---")
st.markdown("### 📊 Valor en stock por línea")

import pandas as pd

df_pos = df[df["existencia"] > 0]
if not df_pos.empty:
    df_linea = df_pos.groupby("linea").agg(
        productos=("codigo", "count"),
        valor=("valor", "sum"),
    ).reset_index().sort_values("valor", ascending=False)

    fig = px.bar(
        df_linea, x="linea", y="valor",
        text="valor",
        labels={"linea": "Línea", "valor": "Valor en stock"},
    )
    fig.update_traces(
        marker_color=COLOR_PRIMARY,
        texttemplate="$%{text:,.0f}",
        textposition="outside",
    )
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#e5e7eb",
        height=400,
    )
    st.plotly_chart(fig, use_container_width=True)


# ============================================================
# DIAGNÓSTICO
# ============================================================
st.markdown("---")
with st.expander("💡 ¿Qué significan estos números?"):
    st.markdown("""
    **Stock negativo** suele indicar uno de estos problemas:
    - El POS no descuenta correctamente los ingredientes de los combos/recetas.
    - Hubo ventas sin que los productos estuvieran ingresados al sistema.
    - El inventario inicial nunca se cargó.

    **Acción recomendada:**
    1. Hacer auditoría física: contar productos y comparar con el sistema.
    2. Revisar la configuración de **recetas** en el POS (cada combo debe descontar sus ingredientes).
    3. Cargar inventario inicial correcto y reiniciar el conteo.
    4. Establecer un día fijo para inventarios físicos (ej: domingo en la noche).
    """)
