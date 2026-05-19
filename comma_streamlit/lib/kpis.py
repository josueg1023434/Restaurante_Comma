"""
Cálculo de KPIs sobre los datos cargados en DuckDB.
Todas las queries respetan filtros opcionales de fecha.
"""
from datetime import date, timedelta
from typing import Optional, Tuple

import pandas as pd
import streamlit as st


def _date_filter(fecha_ini: Optional[date], fecha_fin: Optional[date],
                  col: str = "fecha") -> Tuple[str, list]:
    """Construye cláusula WHERE de fecha y parámetros."""
    conditions = []
    params = []
    if fecha_ini:
        conditions.append(f"{col} >= ?")
        params.append(fecha_ini)
    if fecha_fin:
        conditions.append(f"{col} <= ?")
        params.append(fecha_fin)
    where = " AND ".join(conditions) if conditions else "1=1"
    return where, params


@st.cache_data(ttl=60)
def get_date_range(_conn) -> Tuple[Optional[date], Optional[date]]:
    """Devuelve el rango de fechas disponibles en los datos."""
    try:
        result = _conn.execute("""
            SELECT MIN(fecha) AS min_f, MAX(fecha) AS max_f
            FROM (
                SELECT fecha FROM ventas_tickets
                UNION ALL
                SELECT fecha FROM ventas_detalle
            )
        """).fetchone()
        if result and result[0]:
            return result[0], result[1]
    except Exception:
        pass
    return None, None


def kpis_resumen(_conn, fecha_ini=None, fecha_fin=None) -> dict:
    """KPIs ejecutivos principales."""
    where_t, params_t = _date_filter(fecha_ini, fecha_fin)
    where_d, params_d = _date_filter(fecha_ini, fecha_fin)

    # Desde tickets
    try:
        r = _conn.execute(f"""
            SELECT
                COALESCE(SUM(total), 0) AS ventas_netas,
                COUNT(*) AS tickets,
                COALESCE(AVG(total), 0) AS ticket_promedio,
                COUNT(DISTINCT mesero) AS meseros_activos,
                COUNT(DISTINCT cliente) FILTER (WHERE cliente != '' AND cliente IS NOT NULL) AS clientes_unicos,
                COUNT(DISTINCT fecha) AS dias_operados,
                COUNT(*) FILTER (WHERE estado LIKE '%ANUL%') AS anulados
            FROM ventas_tickets
            WHERE {where_t}
        """, params_t).fetchone()
    except Exception:
        r = (0, 0, 0, 0, 0, 0, 0)

    # Desde detalle (items vendidos)
    try:
        items = _conn.execute(f"""
            SELECT
                COALESCE(SUM(cantidad), 0) AS items_vendidos,
                COUNT(DISTINCT producto) AS productos_activos
            FROM ventas_detalle
            WHERE {where_d}
        """, params_d).fetchone()
    except Exception:
        items = (0, 0)

    ventas, tickets, ticket_prom, meseros, clientes, dias, anulados = r
    items_vendidos, productos_activos = items

    tasa_anulacion = (anulados / tickets * 100) if tickets > 0 else 0
    items_por_ticket = (items_vendidos / tickets) if tickets > 0 else 0
    venta_promedio_diaria = (ventas / dias) if dias > 0 else 0

    return {
        "ventas_netas": float(ventas or 0),
        "tickets": int(tickets or 0),
        "ticket_promedio": float(ticket_prom or 0),
        "items_vendidos": float(items_vendidos or 0),
        "items_por_ticket": float(items_por_ticket),
        "productos_activos": int(productos_activos or 0),
        "meseros_activos": int(meseros or 0),
        "clientes_unicos": int(clientes or 0),
        "dias_operados": int(dias or 0),
        "anulados": int(anulados or 0),
        "tasa_anulacion": float(tasa_anulacion),
        "venta_promedio_diaria": float(venta_promedio_diaria),
    }


def ventas_diarias(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Serie temporal de ventas diarias."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        df = _conn.execute(f"""
            SELECT fecha, SUM(total) AS ventas, COUNT(*) AS tickets,
                   AVG(total) AS ticket_promedio
            FROM ventas_tickets
            WHERE {where}
            GROUP BY fecha
            ORDER BY fecha
        """, params).fetchdf()
        if not df.empty:
            df["fecha"] = pd.to_datetime(df["fecha"])
            df["ma7"] = df["ventas"].rolling(7, min_periods=1).mean()
        return df
    except Exception:
        return pd.DataFrame(columns=["fecha", "ventas", "tickets", "ticket_promedio", "ma7"])


def ventas_mensuales(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Agregado mensual."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        df = _conn.execute(f"""
            SELECT
                DATE_TRUNC('month', fecha) AS mes,
                SUM(total) AS ventas,
                COUNT(*) AS tickets,
                AVG(total) AS ticket_promedio
            FROM ventas_tickets
            WHERE {where}
            GROUP BY mes
            ORDER BY mes
        """, params).fetchdf()
        if not df.empty:
            df["mes"] = pd.to_datetime(df["mes"])
        return df
    except Exception:
        return pd.DataFrame()


def top_productos(_conn, fecha_ini=None, fecha_fin=None, limit=20) -> pd.DataFrame:
    """Top productos por ingresos."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        return _conn.execute(f"""
            SELECT
                producto,
                categoria,
                SUM(cantidad) AS unidades,
                SUM(subtotal) AS ingresos,
                AVG(precio_unitario) AS precio_prom,
                COUNT(DISTINCT documento) AS tickets
            FROM ventas_detalle
            WHERE {where}
            GROUP BY producto, categoria
            ORDER BY ingresos DESC
            LIMIT {limit}
        """, params).fetchdf()
    except Exception:
        return pd.DataFrame()


def ventas_por_categoria(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Distribución por categoría."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        return _conn.execute(f"""
            SELECT
                categoria,
                SUM(subtotal) AS ingresos,
                SUM(cantidad) AS unidades,
                COUNT(DISTINCT producto) AS productos
            FROM ventas_detalle
            WHERE {where}
            GROUP BY categoria
            ORDER BY ingresos DESC
        """, params).fetchdf()
    except Exception:
        return pd.DataFrame()


def heatmap_hora_dia(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Heatmap hora × día de la semana."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        df = _conn.execute(f"""
            SELECT
                DAYOFWEEK(fecha) AS dow,
                hora,
                SUM(total) AS ventas,
                COUNT(*) AS tickets
            FROM ventas_tickets
            WHERE {where} AND hora IS NOT NULL
            GROUP BY dow, hora
            ORDER BY dow, hora
        """, params).fetchdf()
        return df
    except Exception:
        return pd.DataFrame()


def ventas_por_hora(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Distribución por hora."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        return _conn.execute(f"""
            SELECT
                hora,
                SUM(total) AS ventas,
                COUNT(*) AS tickets
            FROM ventas_tickets
            WHERE {where} AND hora IS NOT NULL
            GROUP BY hora
            ORDER BY hora
        """, params).fetchdf()
    except Exception:
        return pd.DataFrame()


def ventas_por_dow(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Distribución por día de la semana."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        df = _conn.execute(f"""
            SELECT
                DAYOFWEEK(fecha) AS dow,
                SUM(total) AS ventas,
                COUNT(*) AS tickets,
                AVG(total) AS ticket_prom
            FROM ventas_tickets
            WHERE {where}
            GROUP BY dow
            ORDER BY dow
        """, params).fetchdf()
        if not df.empty:
            dias = {0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
                    4: "Jueves", 5: "Viernes", 6: "Sábado"}
            df["dia"] = df["dow"].map(dias)
        return df
    except Exception:
        return pd.DataFrame()


def performance_meseros(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Ranking de meseros."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        return _conn.execute(f"""
            SELECT
                mesero,
                COUNT(*) AS tickets,
                SUM(total) AS ventas,
                AVG(total) AS ticket_promedio
            FROM ventas_tickets
            WHERE {where} AND mesero != '' AND mesero IS NOT NULL
            GROUP BY mesero
            ORDER BY ventas DESC
        """, params).fetchdf()
    except Exception:
        return pd.DataFrame()


def formas_pago(_conn, fecha_ini=None, fecha_fin=None) -> pd.DataFrame:
    """Distribución por forma de pago."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        return _conn.execute(f"""
            SELECT
                forma_pago,
                COALESCE(NULLIF(banco, ''), 'N/A') AS banco,
                SUM(monto) AS monto,
                COUNT(*) AS transacciones
            FROM ventas_pagos
            WHERE {where}
            GROUP BY forma_pago, banco
            ORDER BY monto DESC
        """, params).fetchdf()
    except Exception:
        return pd.DataFrame()


def top_clientes(_conn, fecha_ini=None, fecha_fin=None, limit=20) -> pd.DataFrame:
    """Top clientes por frecuencia y monto."""
    where, params = _date_filter(fecha_ini, fecha_fin)
    try:
        return _conn.execute(f"""
            SELECT
                cliente,
                COUNT(*) AS visitas,
                SUM(total) AS gastado,
                AVG(total) AS ticket_promedio,
                MAX(fecha) AS ultima_visita
            FROM ventas_tickets
            WHERE {where} AND cliente != '' AND cliente IS NOT NULL
              AND cliente NOT IN ('CONSUMIDOR FINAL', 'CLIENTE GENERAL', '0', 'SIN CLIENTE')
            GROUP BY cliente
            HAVING COUNT(*) >= 2
            ORDER BY gastado DESC
            LIMIT {limit}
        """, params).fetchdf()
    except Exception:
        return pd.DataFrame()


def inventario_alertas(_conn) -> dict:
    """Resumen de alertas de inventario."""
    try:
        r = _conn.execute("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE existencia < 0) AS stock_negativo,
                COUNT(*) FILTER (WHERE existencia = 0) AS stock_cero,
                COUNT(*) FILTER (WHERE existencia > 0 AND existencia <= 5) AS stock_bajo,
                SUM(valor) FILTER (WHERE existencia > 0) AS valor_inventario
            FROM inventario
        """).fetchone()
        total, neg, cero, bajo, valor = r or (0, 0, 0, 0, 0)
        return {
            "total": int(total or 0),
            "stock_negativo": int(neg or 0),
            "stock_cero": int(cero or 0),
            "stock_bajo": int(bajo or 0),
            "valor_inventario": float(valor or 0),
        }
    except Exception:
        return {"total": 0, "stock_negativo": 0, "stock_cero": 0,
                "stock_bajo": 0, "valor_inventario": 0}


def inventario_detalle(_conn) -> pd.DataFrame:
    """Detalle del inventario para tabla."""
    try:
        return _conn.execute("""
            SELECT codigo, articulo, linea, existencia, costo_promedio, valor,
                   CASE
                       WHEN existencia < 0 THEN '🔴 Negativo'
                       WHEN existencia = 0 THEN '⚪ Sin stock'
                       WHEN existencia <= 5 THEN '🟡 Bajo'
                       ELSE '🟢 OK'
                   END AS estado
            FROM inventario
            ORDER BY existencia ASC
        """).fetchdf()
    except Exception:
        return pd.DataFrame()
