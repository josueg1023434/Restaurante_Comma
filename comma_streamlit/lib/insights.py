"""
Motor de AI Insights basado en reglas heurísticas sobre los KPIs.
Detecta automáticamente patrones, anomalías y oportunidades.
"""
from typing import List, Dict
import pandas as pd
import numpy as np

from lib import kpis


def _insight(tipo: str, titulo: str, descripcion: str, recomendacion: str,
              kpi: str = "", severidad: int = 1) -> Dict:
    """Helper para construir un insight estándar."""
    return {
        "tipo": tipo,  # critical | warning | opportunity | success | info
        "titulo": titulo,
        "descripcion": descripcion,
        "recomendacion": recomendacion,
        "kpi": kpi,
        "severidad": severidad,
    }


def detectar_tendencia(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Detecta caídas o crecimientos sostenidos mes a mes."""
    insights = []
    df = kpis.ventas_mensuales(_conn, fecha_ini, fecha_fin)
    if len(df) < 2:
        return insights

    df = df.sort_values("mes")
    primer = float(df["ventas"].iloc[0])
    ultimo = float(df["ventas"].iloc[-1])
    if primer == 0:
        return insights

    cambio_pct = (ultimo - primer) / primer * 100

    # Regresión lineal simple
    x = np.arange(len(df))
    y = df["ventas"].values
    slope, intercept = np.polyfit(x, y, 1)
    y_pred = slope * x + intercept
    ss_res = ((y - y_pred) ** 2).sum()
    ss_tot = ((y - y.mean()) ** 2).sum()
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

    if cambio_pct < -10 and r2 > 0.6:
        insights.append(_insight(
            "critical",
            f"Caída sostenida en ventas mensuales: {cambio_pct:.1f}%",
            f"Las ventas mensuales pasaron de ${primer:,.0f} a ${ultimo:,.0f} "
            f"en {len(df)} meses (R²={r2:.2f}, confianza alta de tendencia).",
            "Investigar causa raíz: cambios en menú, precios, competencia, "
            "estacionalidad post-fiestas o caída en frecuencia de clientes.",
            f"{cambio_pct:.1f}%",
            severidad=3,
        ))
    elif cambio_pct > 10 and r2 > 0.6:
        insights.append(_insight(
            "success",
            f"Crecimiento sostenido: +{cambio_pct:.1f}%",
            f"Las ventas crecieron de ${primer:,.0f} a ${ultimo:,.0f} "
            f"con tendencia clara (R²={r2:.2f}).",
            "Identificar qué cambios produjeron el crecimiento y consolidarlos.",
            f"+{cambio_pct:.1f}%",
            severidad=1,
        ))

    return insights


def detectar_concentracion_horaria(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Detecta concentración excesiva en pocas horas."""
    insights = []
    df = kpis.ventas_por_hora(_conn, fecha_ini, fecha_fin)
    if df.empty:
        return insights

    total = df["ventas"].sum()
    if total == 0:
        return insights

    df = df.sort_values("ventas", ascending=False).reset_index(drop=True)
    hora_pico = int(df["hora"].iloc[0])
    pct_pico = float(df["ventas"].iloc[0]) / total * 100

    if pct_pico > 25:
        insights.append(_insight(
            "warning",
            f"Concentración alta en hora pico ({hora_pico}h)",
            f"El {pct_pico:.1f}% de las ventas ocurren en una sola hora ({hora_pico}h). "
            f"Esto sugiere posible cuello de botella operativo y oportunidad "
            f"de expandir a horarios con baja ocupación.",
            f"Evaluar promociones para horarios de menor tráfico y revisar "
            f"capacidad operativa en la hora pico para no perder ventas.",
            f"{pct_pico:.0f}%",
            severidad=2,
        ))
    return insights


def detectar_dependencia_dias(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Detecta si el negocio depende demasiado de pocos días."""
    insights = []
    df = kpis.ventas_por_dow(_conn, fecha_ini, fecha_fin)
    if df.empty:
        return insights

    total = df["ventas"].sum()
    if total == 0:
        return insights

    # Viernes (5) + Sábado (6)
    fin_semana = df[df["dow"].isin([5, 6])]["ventas"].sum()
    pct_fds = fin_semana / total * 100

    if pct_fds > 45:
        insights.append(_insight(
            "warning",
            f"Dependencia alta de fin de semana ({pct_fds:.0f}%)",
            f"Viernes y sábado generan el {pct_fds:.1f}% de las ventas. "
            f"Una caída en esos días impacta directamente el mes.",
            "Diseñar campañas para activar lunes-jueves: 2x1, menú ejecutivo, "
            "happy hour temprano, o eventos temáticos.",
            f"{pct_fds:.0f}%",
            severidad=2,
        ))
    return insights


def detectar_productos_ganadores(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Identifica el producto estrella."""
    insights = []
    df = kpis.top_productos(_conn, fecha_ini, fecha_fin, limit=10)
    if df.empty:
        return insights

    total = df["ingresos"].sum()
    top = df.iloc[0]
    pct = float(top["ingresos"]) / total * 100 if total > 0 else 0

    if pct > 10:
        insights.append(_insight(
            "success",
            f"Producto estrella: {top['producto'][:40]}",
            f"Genera ${float(top['ingresos']):,.0f} ({pct:.1f}% del top-10) "
            f"con {int(top['unidades'])} unidades vendidas.",
            "Destacarlo en menú, foto principal y posibles variaciones premium.",
            f"${float(top['ingresos']):,.0f}",
            severidad=1,
        ))
    return insights


def detectar_inventario(_conn) -> List[Dict]:
    """Alertas de inventario."""
    insights = []
    alertas = kpis.inventario_alertas(_conn)
    if alertas["total"] == 0:
        return insights

    if alertas["stock_negativo"] > 0:
        insights.append(_insight(
            "critical",
            f"Stock negativo en {alertas['stock_negativo']} productos",
            f"{alertas['stock_negativo']} de {alertas['total']} productos "
            f"({alertas['stock_negativo'] / alertas['total'] * 100:.0f}%) tienen "
            f"existencia negativa. Esto suele significar que el POS no descuenta "
            f"correctamente los combos o recetas.",
            "Auditoría física del inventario y revisar configuración de recetas "
            "en el POS para que descuente ingredientes.",
            f"{alertas['stock_negativo']}",
            severidad=3,
        ))

    if alertas["stock_bajo"] > 0:
        insights.append(_insight(
            "warning",
            f"Stock bajo en {alertas['stock_bajo']} productos",
            f"{alertas['stock_bajo']} productos con menos de 5 unidades. "
            f"Riesgo de quiebre de stock inminente.",
            "Revisar productos críticos y reabastecer antes del fin de semana.",
            f"{alertas['stock_bajo']}",
            severidad=2,
        ))
    return insights


def detectar_duplicacion_productos(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Detecta posibles duplicados por mayúsculas/minúsculas o similares."""
    insights = []
    try:
        df = _conn.execute("""
            SELECT LOWER(TRIM(producto)) AS p_norm, COUNT(DISTINCT producto) AS n
            FROM ventas_detalle
            GROUP BY p_norm
            HAVING COUNT(DISTINCT producto) > 1
            LIMIT 20
        """).fetchdf()
        if not df.empty:
            insights.append(_insight(
                "warning",
                f"Productos duplicados por capitalización ({len(df)} casos)",
                f"Se detectaron {len(df)} productos que aparecen con "
                f"diferentes mayúsculas/minúsculas (ej: 'Hamburguesa' vs 'HAMBURGUESA'). "
                f"Esto distorsiona los reportes de top productos.",
                "Estandarizar nombres de productos en el POS a un único formato.",
                f"{len(df)}",
                severidad=2,
            ))
    except Exception:
        pass
    return insights


def detectar_clientes_recurrentes(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Analiza base de clientes recurrentes."""
    insights = []
    df = kpis.top_clientes(_conn, fecha_ini, fecha_fin, limit=1000)
    resumen = kpis.kpis_resumen(_conn, fecha_ini, fecha_fin)

    if not df.empty and resumen["clientes_unicos"] > 0:
        recurrentes_3 = len(df[df["visitas"] >= 3])
        pct = recurrentes_3 / resumen["clientes_unicos"] * 100

        if pct < 10 and resumen["clientes_unicos"] > 100:
            insights.append(_insight(
                "opportunity",
                f"Base de clientes recurrentes pequeña ({recurrentes_3})",
                f"Solo {recurrentes_3} de {resumen['clientes_unicos']} clientes "
                f"({pct:.1f}%) han venido 3+ veces. La retención es la palanca "
                f"de crecimiento más barata.",
                "Implementar programa de fidelidad simple: tarjeta de sellos, "
                "descuento al 5to ticket, o WhatsApp marketing segmentado.",
                f"{pct:.1f}%",
                severidad=2,
            ))
    return insights


def detectar_anomalias_diarias(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Detecta días con ventas anómalamente altas o bajas (z-score)."""
    insights = []
    df = kpis.ventas_diarias(_conn, fecha_ini, fecha_fin)
    if len(df) < 30:
        return insights

    mean = df["ventas"].mean()
    std = df["ventas"].std()
    if std == 0:
        return insights

    df["zscore"] = (df["ventas"] - mean) / std

    # Día récord
    record = df.loc[df["ventas"].idxmax()]
    if record["zscore"] > 3:
        insights.append(_insight(
            "success",
            f"Día récord: {record['fecha'].strftime('%d %b %Y')}",
            f"Ventas de ${float(record['ventas']):,.0f} "
            f"({record['zscore']:.1f}σ por encima del promedio). "
            f"Vale la pena entender qué pasó para replicar.",
            "Revisar qué hizo diferente ese día: promoción, evento, fecha especial. "
            "Documentar y replicar la receta.",
            f"${float(record['ventas']):,.0f}",
            severidad=1,
        ))

    return insights


# ============================================================
# ORQUESTADOR
# ============================================================

DETECTORES = [
    detectar_tendencia,
    detectar_concentracion_horaria,
    detectar_dependencia_dias,
    detectar_productos_ganadores,
    detectar_clientes_recurrentes,
    detectar_anomalias_diarias,
    detectar_duplicacion_productos,
]


def generar_insights(_conn, fecha_ini=None, fecha_fin=None) -> List[Dict]:
    """Ejecuta todos los detectores y devuelve insights ordenados por severidad."""
    todos = []
    for detector in DETECTORES:
        try:
            todos.extend(detector(_conn, fecha_ini, fecha_fin))
        except Exception:
            pass

    # Inventario no depende de filtro de fecha
    try:
        todos.extend(detectar_inventario(_conn))
    except Exception:
        pass

    # Ordenar por severidad descendente
    todos.sort(key=lambda x: x.get("severidad", 1), reverse=True)
    return todos


TIPO_CONFIG = {
    "critical": {"emoji": "🔴", "color": "#ef4444", "label": "Crítico"},
    "warning": {"emoji": "🟡", "color": "#f59e0b", "label": "Advertencia"},
    "opportunity": {"emoji": "💡", "color": "#8b5cf6", "label": "Oportunidad"},
    "success": {"emoji": "🟢", "color": "#10b981", "label": "Éxito"},
    "info": {"emoji": "ℹ️", "color": "#3b82f6", "label": "Info"},
}
