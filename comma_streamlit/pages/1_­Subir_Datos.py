"""
Página: Subir Datos
Carga de archivos Excel del POS con detección automática de tipo.
"""
import streamlit as st
import pandas as pd

from lib import db
from lib.data_loader import ingest_file, read_excel_safe, detect_file_type
from lib.theme import inject_css


st.set_page_config(page_title="Subir Datos · Comma", page_icon="📤", layout="wide")
inject_css()

st.title("📤 Subir Datos")
st.markdown(
    "Sube los archivos Excel exportados desde el POS. La plataforma detecta "
    "automáticamente el tipo de archivo y evita duplicados."
)

conn = db.get_connection()


# ============================================================
# TIPOS DE ARCHIVO SOPORTADOS
# ============================================================
with st.expander("ℹ️ Tipos de archivo soportados", expanded=False):
    st.markdown("""
    | Archivo del POS | Columnas clave | Tabla destino |
    |---|---|---|
    | **Detalle de ventas por artículos** | articulo, cantidad, mesero | `ventas_detalle` |
    | **Reporte de Ventas** | documento, total, mesero | `ventas_tickets` |
    | **Ventas por Formas de Pago** | forma_pago, banco, monto | `ventas_pagos` |
    | **Informe de Existencias** | existencia, linea, costo | `inventario` |

    Los formatos `.xlsx` y `.xls` están ambos soportados.
    Si un `.xls` está guardado como HTML (común en exports antiguos del POS),
    se intentará leer automáticamente.
    """)


# ============================================================
# UPLOADER
# ============================================================
st.markdown("### 🗂️ Selecciona archivos")

uploaded_files = st.file_uploader(
    "Arrastra archivos Excel aquí (o haz clic para seleccionar)",
    type=["xlsx", "xls"],
    accept_multiple_files=True,
    label_visibility="collapsed",
)

if uploaded_files:
    st.markdown(f"**{len(uploaded_files)} archivo(s) seleccionado(s)**")

    # Vista previa antes de cargar
    with st.expander("👁️ Vista previa antes de cargar", expanded=False):
        for f in uploaded_files:
            st.markdown(f"**{f.name}** ({f.size / 1024:.1f} KB)")
            try:
                f.seek(0)
                df_preview = read_excel_safe(f)
                tipo_detectado = detect_file_type(df_preview)
                f.seek(0)

                if tipo_detectado:
                    st.success(f"✓ Tipo detectado: `{tipo_detectado}`")
                else:
                    st.error("⚠️ No se pudo detectar el tipo de archivo")

                # Intentar mostrar preview; si falla por dupes, mostrar versión limpia
                try:
                    st.dataframe(df_preview.head(5), use_container_width=True)
                except Exception:
                    # Fallback: convertir todo a string para evitar problemas de Arrow
                    df_safe = df_preview.head(5).astype(str)
                    # Forzar nombres únicos
                    df_safe.columns = [f"{c}_{i}" if list(df_safe.columns).count(c) > 1
                                       else c for i, c in enumerate(df_safe.columns)]
                    st.dataframe(df_safe, use_container_width=True)

                st.caption(f"{len(df_preview):,} filas × {len(df_preview.columns)} columnas")
                st.caption(f"Columnas: {', '.join(df_preview.columns[:10])}...")
            except Exception as e:
                st.error(f"Error leyendo: {e}")
            st.markdown("---")

    # Botón de carga
    if st.button("🚀 Procesar y cargar archivos", type="primary", use_container_width=True):
        progress = st.progress(0, text="Procesando...")
        results = []

        for i, f in enumerate(uploaded_files):
            f.seek(0)
            progress.progress(
                (i + 1) / len(uploaded_files),
                text=f"Procesando {f.name}...",
            )
            result = ingest_file(f, conn)
            results.append(result)

        progress.empty()

        # Resumen de resultados
        st.markdown("### 📋 Resultados de la carga")

        for r in results:
            if r["error"]:
                st.error(f"❌ **{r['archivo']}** — {r['error']}")
            else:
                tipo = r["tipo"]
                ins = r["filas_insertadas"]
                dup = r["filas_duplicadas"]
                msg = f"✓ **{r['archivo']}** → `{tipo}` · {ins:,} filas insertadas"
                if dup > 0:
                    msg += f" · {dup:,} duplicados omitidos"
                st.success(msg)

        # Refresh contadores
        counts = db.get_table_counts()
        st.markdown("### 📊 Estado actual de la base de datos")
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Detalle ventas", f"{counts.get('ventas_detalle', 0):,}")
        c2.metric("Tickets", f"{counts.get('ventas_tickets', 0):,}")
        c3.metric("Pagos", f"{counts.get('ventas_pagos', 0):,}")
        c4.metric("Inventario", f"{counts.get('inventario', 0):,}")

        if any(v > 0 for v in counts.values()):
            st.info("👉 Ya puedes ir al **Dashboard** o a **AI Insights** desde el menú lateral.")


# ============================================================
# HISTORIAL DE CARGAS
# ============================================================
st.markdown("---")
st.markdown("### 📜 Historial de cargas")

try:
    log = conn.execute("""
        SELECT
            fecha_carga,
            archivo,
            tipo,
            filas_insertadas,
            filas_duplicadas
        FROM uploads_log
        ORDER BY fecha_carga DESC
        LIMIT 20
    """).fetchdf()

    if log.empty:
        st.info("Aún no hay cargas registradas.")
    else:
        log["fecha_carga"] = pd.to_datetime(log["fecha_carga"]).dt.strftime("%Y-%m-%d %H:%M")
        st.dataframe(
            log,
            use_container_width=True,
            hide_index=True,
            column_config={
                "fecha_carga": "Fecha",
                "archivo": "Archivo",
                "tipo": "Tipo",
                "filas_insertadas": st.column_config.NumberColumn("Insertadas", format="%d"),
                "filas_duplicadas": st.column_config.NumberColumn("Duplicadas", format="%d"),
            },
        )
except Exception as e:
    st.warning(f"No se pudo cargar historial: {e}")


# ============================================================
# ZONA PELIGROSA
# ============================================================
st.markdown("---")
with st.expander("⚠️ Zona peligrosa", expanded=False):
    st.warning("Estas acciones son irreversibles. Úsalas solo si sabes lo que haces.")
    if st.button("🗑️ Borrar TODOS los datos", type="secondary"):
        db.reset_database()
        st.success("Base de datos vaciada. Recarga la página.")
        st.rerun()
