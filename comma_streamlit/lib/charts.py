"""
Utilidades de gráficos con Plotly, tematizados en dark glassmorphism.
"""
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd


# Paleta consistente con el dashboard HTML
COLOR_PRIMARY = "#8b5cf6"   # violet
COLOR_SECONDARY = "#14b8a6"  # teal
COLOR_ACCENT = "#f59e0b"     # amber
COLOR_DANGER = "#ef4444"
COLOR_SUCCESS = "#10b981"
COLOR_TEXT = "#e5e7eb"
COLOR_GRID = "rgba(255,255,255,0.06)"
COLOR_BG = "rgba(0,0,0,0)"

PALETTE = ["#8b5cf6", "#14b8a6", "#f59e0b", "#ef4444", "#10b981",
            "#3b82f6", "#ec4899", "#a78bfa", "#22d3ee", "#fb923c"]


def apply_dark_theme(fig: go.Figure, height: int = 380) -> go.Figure:
    """Aplica el tema dark consistente a cualquier figura."""
    fig.update_layout(
        plot_bgcolor=COLOR_BG,
        paper_bgcolor=COLOR_BG,
        font=dict(color=COLOR_TEXT, family="Inter, sans-serif", size=12),
        margin=dict(l=10, r=10, t=40, b=10),
        height=height,
        hoverlabel=dict(
            bgcolor="#16161f",
            font_size=12,
            font_color=COLOR_TEXT,
            bordercolor=COLOR_PRIMARY,
        ),
        xaxis=dict(
            gridcolor=COLOR_GRID,
            showgrid=True,
            zeroline=False,
            linecolor=COLOR_GRID,
        ),
        yaxis=dict(
            gridcolor=COLOR_GRID,
            showgrid=True,
            zeroline=False,
            linecolor=COLOR_GRID,
        ),
        legend=dict(
            bgcolor=COLOR_BG,
            bordercolor=COLOR_GRID,
            font=dict(color=COLOR_TEXT),
        ),
    )
    return fig


def chart_tendencia(df: pd.DataFrame) -> go.Figure:
    """Línea de tendencia diaria con MA7."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    fig.add_trace(go.Scatter(
        x=df["fecha"], y=df["ventas"],
        mode="lines",
        name="Ventas diarias",
        line=dict(color=COLOR_PRIMARY, width=1.5),
        fill="tozeroy",
        fillcolor="rgba(139, 92, 246, 0.08)",
    ))
    fig.add_trace(go.Scatter(
        x=df["fecha"], y=df["ma7"],
        mode="lines",
        name="Promedio 7 días",
        line=dict(color=COLOR_SECONDARY, width=2.5),
    ))
    fig.update_layout(title=None, hovermode="x unified")
    return apply_dark_theme(fig, height=380)


def chart_mensual(df: pd.DataFrame) -> go.Figure:
    """Barras mensuales."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    fig.add_trace(go.Bar(
        x=df["mes"], y=df["ventas"],
        marker_color=COLOR_PRIMARY,
        marker_line_color=COLOR_PRIMARY,
        text=[f"${v:,.0f}" for v in df["ventas"]],
        textposition="outside",
        textfont=dict(color=COLOR_TEXT),
    ))
    return apply_dark_theme(fig, height=340)


def chart_categorias(df: pd.DataFrame) -> go.Figure:
    """Donut de categorías."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    fig.add_trace(go.Pie(
        labels=df["categoria"],
        values=df["ingresos"],
        hole=0.6,
        marker=dict(colors=PALETTE, line=dict(color="#0a0a0f", width=2)),
        textinfo="percent",
        textfont=dict(color="white", size=11),
    ))
    fig.update_layout(showlegend=True, legend=dict(orientation="v", x=1.05, y=0.5))
    return apply_dark_theme(fig, height=380)


def chart_horas(df: pd.DataFrame) -> go.Figure:
    """Barras de ventas por hora."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    fig.add_trace(go.Bar(
        x=df["hora"], y=df["ventas"],
        marker=dict(
            color=df["ventas"],
            colorscale=[[0, "#1e1b4b"], [1, COLOR_PRIMARY]],
            line=dict(width=0),
        ),
    ))
    fig.update_xaxes(title="Hora del día", dtick=1)
    fig.update_yaxes(title="Ventas")
    return apply_dark_theme(fig, height=340)


def chart_dow(df: pd.DataFrame) -> go.Figure:
    """Barras de ventas por día de la semana."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    fig.add_trace(go.Bar(
        x=df["dia"], y=df["ventas"],
        marker=dict(
            color=df["ventas"],
            colorscale=[[0, "#0f766e"], [1, COLOR_SECONDARY]],
            line=dict(width=0),
        ),
        text=[f"${v:,.0f}" for v in df["ventas"]],
        textposition="outside",
        textfont=dict(color=COLOR_TEXT, size=10),
    ))
    return apply_dark_theme(fig, height=340)


def chart_heatmap(df: pd.DataFrame) -> go.Figure:
    """Heatmap hora × día de la semana."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    dias_orden = {0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié",
                  4: "Jue", 5: "Vie", 6: "Sáb"}
    df = df.copy()
    df["dia"] = df["dow"].map(dias_orden)

    pivot = df.pivot_table(
        index="dia", columns="hora", values="ventas",
        aggfunc="sum", fill_value=0,
    )
    # Reordenar días
    orden = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    pivot = pivot.reindex([d for d in orden if d in pivot.index])

    fig.add_trace(go.Heatmap(
        z=pivot.values,
        x=pivot.columns,
        y=pivot.index,
        colorscale=[[0, "#0a0a0f"], [0.3, "#312e81"], [0.7, COLOR_PRIMARY], [1, "#a78bfa"]],
        showscale=True,
        colorbar=dict(
            title="$",
            tickfont=dict(color=COLOR_TEXT),
            bgcolor=COLOR_BG,
        ),
    ))
    fig.update_xaxes(title="Hora", dtick=1)
    fig.update_yaxes(title=None)
    return apply_dark_theme(fig, height=320)


def chart_top_productos(df: pd.DataFrame, n: int = 10) -> go.Figure:
    """Barras horizontales de top productos."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    df = df.head(n).sort_values("ingresos")
    fig.add_trace(go.Bar(
        x=df["ingresos"],
        y=df["producto"],
        orientation="h",
        marker=dict(
            color=df["ingresos"],
            colorscale=[[0, "#3b0764"], [1, COLOR_PRIMARY]],
            line=dict(width=0),
        ),
        text=[f"${v:,.0f}" for v in df["ingresos"]],
        textposition="outside",
        textfont=dict(color=COLOR_TEXT, size=10),
    ))
    fig.update_xaxes(title="Ingresos")
    fig.update_yaxes(title=None)
    return apply_dark_theme(fig, height=max(340, 30 * len(df)))


def chart_meseros(df: pd.DataFrame) -> go.Figure:
    """Barras de meseros."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    df = df.head(15).sort_values("ventas")
    fig.add_trace(go.Bar(
        x=df["ventas"],
        y=df["mesero"],
        orientation="h",
        marker_color=COLOR_SECONDARY,
        text=[f"${v:,.0f}" for v in df["ventas"]],
        textposition="outside",
        textfont=dict(color=COLOR_TEXT, size=10),
    ))
    return apply_dark_theme(fig, height=max(340, 30 * len(df)))


def chart_formas_pago(df: pd.DataFrame) -> go.Figure:
    """Donut de formas de pago."""
    fig = go.Figure()
    if df.empty:
        return apply_dark_theme(fig)

    agg = df.groupby("forma_pago")["monto"].sum().reset_index().sort_values("monto", ascending=False)
    fig.add_trace(go.Pie(
        labels=agg["forma_pago"],
        values=agg["monto"],
        hole=0.55,
        marker=dict(colors=PALETTE, line=dict(color="#0a0a0f", width=2)),
        textinfo="label+percent",
        textfont=dict(color="white", size=11),
    ))
    fig.update_layout(showlegend=False)
    return apply_dark_theme(fig, height=380)
