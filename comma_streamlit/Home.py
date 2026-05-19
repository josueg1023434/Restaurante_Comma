"""
Comma Intelligence Platform — Home
Plataforma de Business Intelligence + AI para Restaurante Comma.
"""
import streamlit as st

from lib import db
from lib.theme import inject_css


# ============================================================
# CONFIG GLOBAL
# ============================================================
st.set_page_config(
    page_title="Comma Intelligence",
    page_icon="🍔",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "About": "Comma Intelligence Platform v0.1 — BI + AI para Restaurante Comma",
    },
)

inject_css()


# ============================================================
# HERO
# ============================================================
st.markdown("""
<div style='padding: 40px 0 20px 0;'>
    <h1 style='font-size: 3rem; margin-bottom: 0;'>Comma Intelligence</h1>
    <p style='color: #9ca3af; font-size: 1.1rem; margin-top: 0;'>
        Plataforma BI + Analytics + AI · v0.1 MVP
    </p>
</div>
""", unsafe_allow_html=True)


# ============================================================
# ESTADO DE LOS DATOS
# ============================================================
conn = db.get_connection()
counts = db.get_table_counts()
has_data = any(v > 0 for v in counts.values())

if not has_data:
    st.warning("👋 Bienvenido. Aún no hay datos cargados. Usa **📤 Subir Datos** en el menú lateral para empezar.")
else:
    st.success(f"✓ Datos cargados — {sum(counts.values()):,} registros en total")

    # KPIs rápidos del estado actual
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Detalle de ventas", f"{counts.get('ventas_detalle', 0):,}", "filas")
    with c2:
        st.metric("Tickets", f"{counts.get('ventas_tickets', 0):,}", "tickets")
    with c3:
        st.metric("Pagos", f"{counts.get('ventas_pagos', 0):,}", "transacciones")
    with c4:
        st.metric("Inventario", f"{counts.get('inventario', 0):,}", "productos")


# ============================================================
# CARDS DE NAVEGACIÓN
# ============================================================
st.markdown("### 🚀 Navegación rápida")
st.markdown("Usa el menú lateral o accede directo a las secciones:")

c1, c2, c3 = st.columns(3)

with c1:
    st.markdown("""
    <div style='background: rgba(22,22,31,0.6); padding: 20px; border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.08); height: 200px;'>
        <h3 style='color: #8b5cf6; margin-top: 0;'>📤 Subir Datos</h3>
        <p style='color: #9ca3af; font-size: 0.9rem;'>
            Carga los archivos Excel del POS. La plataforma detecta el tipo
            automáticamente y evita duplicados.
        </p>
    </div>
    """, unsafe_allow_html=True)

with c2:
    st.markdown("""
    <div style='background: rgba(22,22,31,0.6); padding: 20px; border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.08); height: 200px;'>
        <h3 style='color: #14b8a6; margin-top: 0;'>📊 Dashboard</h3>
        <p style='color: #9ca3af; font-size: 0.9rem;'>
            KPIs ejecutivos, tendencias, heatmaps de hora × día,
            top productos y categorías.
        </p>
    </div>
    """, unsafe_allow_html=True)

with c3:
    st.markdown("""
    <div style='background: rgba(22,22,31,0.6); padding: 20px; border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.08); height: 200px;'>
        <h3 style='color: #f59e0b; margin-top: 0;'>💡 AI Insights</h3>
        <p style='color: #9ca3af; font-size: 0.9rem;'>
            Detección automática de patrones, anomalías y oportunidades
            de mejora basadas en tus datos.
        </p>
    </div>
    """, unsafe_allow_html=True)


# ============================================================
# QUÉ HAY DENTRO
# ============================================================
st.markdown("---")
st.markdown("### 📋 ¿Qué incluye la plataforma?")

c1, c2 = st.columns(2)

with c1:
    st.markdown("""
    **Analytics**
    - Ventas diarias / mensuales con MA7
    - Heatmap de hora × día de la semana
    - Top productos por ingresos y unidades
    - Performance de meseros
    - Distribución de formas de pago
    - Clientes recurrentes (RFM básico)

    **Operaciones**
    - Alertas de inventario (stock negativo, bajo, cero)
    - Análisis de productos sin rotación
    - Detección de duplicados por capitalización
    """)

with c2:
    st.markdown("""
    **AI Insights (motor de reglas)**
    - Tendencias sostenidas (caídas/crecimientos con R²)
    - Concentración horaria y dependencia de fin de semana
    - Productos estrella vs sin rotación
    - Días récord (z-score)
    - Oportunidades de retención de clientes

    **Datos**
    - Carga incremental con hash anti-duplicados
    - Procesamiento de .xlsx y .xls
    - Detección automática del tipo de archivo
    - Persistencia local con DuckDB
    """)


# ============================================================
# FOOTER
# ============================================================
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #6b7280; font-size: 0.85rem; padding: 20px;'>
    Comma Intelligence Platform · v0.1 · Streamlit + DuckDB + Plotly<br>
    Desarrollado para <strong>Restaurante Comma</strong> · Ecuador
</div>
""", unsafe_allow_html=True)
