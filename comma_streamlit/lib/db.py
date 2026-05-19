"""
Gestión de base de datos DuckDB para Comma Intelligence Platform.
DuckDB es una BD analítica embebida (como SQLite pero para analytics).
Toda la data se guarda en un archivo .duckdb local.
"""
from pathlib import Path
import duckdb
import streamlit as st

# Ruta de la base de datos
DB_DIR = Path(__file__).parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "comma.duckdb"


@st.cache_resource
def get_connection():
    """
    Conexión cacheada a DuckDB. Streamlit la reutiliza entre reruns.
    read_only=False permite escribir; check_same_thread=False para Streamlit.
    """
    conn = duckdb.connect(str(DB_PATH), read_only=False)
    _initialize_schema(conn)
    return conn


def _initialize_schema(conn):
    """Crea las tablas si no existen."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ventas_detalle (
            id BIGINT,
            fecha DATE,
            hora INTEGER,
            documento VARCHAR,
            producto VARCHAR,
            categoria VARCHAR,
            cantidad DOUBLE,
            precio_unitario DOUBLE,
            subtotal DOUBLE,
            mesero VARCHAR,
            mesa VARCHAR,
            cliente VARCHAR,
            row_hash VARCHAR PRIMARY KEY
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS ventas_tickets (
            documento VARCHAR PRIMARY KEY,
            fecha DATE,
            hora INTEGER,
            mesero VARCHAR,
            mesa VARCHAR,
            cliente VARCHAR,
            subtotal DOUBLE,
            iva DOUBLE,
            total DOUBLE,
            estado VARCHAR
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS ventas_pagos (
            id BIGINT,
            documento VARCHAR,
            fecha DATE,
            forma_pago VARCHAR,
            banco VARCHAR,
            monto DOUBLE,
            row_hash VARCHAR PRIMARY KEY
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS inventario (
            codigo VARCHAR PRIMARY KEY,
            articulo VARCHAR,
            linea VARCHAR,
            existencia DOUBLE,
            unidades DOUBLE,
            costo_promedio DOUBLE,
            valor DOUBLE,
            fecha_snapshot DATE
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS uploads_log (
            id INTEGER PRIMARY KEY,
            archivo VARCHAR,
            tipo VARCHAR,
            filas_insertadas INTEGER,
            filas_duplicadas INTEGER,
            fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


def reset_database():
    """Borra todos los datos. Útil para pruebas."""
    conn = get_connection()
    for tabla in ["ventas_detalle", "ventas_tickets", "ventas_pagos",
                   "inventario", "uploads_log"]:
        conn.execute(f"DELETE FROM {tabla}")
    conn.commit()


def get_table_counts():
    """Devuelve el conteo de filas por tabla."""
    conn = get_connection()
    counts = {}
    for tabla in ["ventas_detalle", "ventas_tickets", "ventas_pagos", "inventario"]:
        try:
            result = conn.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()
            counts[tabla] = result[0] if result else 0
        except Exception:
            counts[tabla] = 0
    return counts


def has_data():
    """Verifica si hay al menos algo de data cargada."""
    counts = get_table_counts()
    return any(v > 0 for v in counts.values())
