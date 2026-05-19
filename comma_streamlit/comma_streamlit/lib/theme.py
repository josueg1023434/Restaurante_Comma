"""
Estilos CSS personalizados para Streamlit.
Look glassmorphism dark consistente con el dashboard HTML original.
"""

CUSTOM_CSS = """
<style>
    /* ========== TOKENS ========== */
    :root {
        --c-bg: #0a0a0f;
        --c-surface: #16161f;
        --c-surface-2: #1f1f2e;
        --c-border: rgba(255, 255, 255, 0.08);
        --c-text: #e5e7eb;
        --c-text-muted: #9ca3af;
        --c-primary: #8b5cf6;
        --c-secondary: #14b8a6;
        --c-accent: #f59e0b;
        --c-danger: #ef4444;
        --c-success: #10b981;
    }

    /* ========== APP BACKGROUND ========== */
    .stApp {
        background: radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 50%);
    }

    /* ========== SIDEBAR ========== */
    section[data-testid="stSidebar"] {
        background: rgba(10, 10, 15, 0.85) !important;
        backdrop-filter: blur(20px);
        border-right: 1px solid var(--c-border);
    }

    section[data-testid="stSidebar"] .stMarkdown h2 {
        color: var(--c-primary);
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* ========== KPI METRIC CARDS ========== */
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, rgba(22, 22, 31, 0.6) 0%, rgba(31, 31, 46, 0.3) 100%);
        border: 1px solid var(--c-border);
        border-radius: 16px;
        padding: 20px;
        backdrop-filter: blur(10px);
        transition: all 0.2s ease;
    }

    [data-testid="stMetric"]:hover {
        border-color: var(--c-primary);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
    }

    [data-testid="stMetricLabel"] {
        color: var(--c-text-muted) !important;
        font-size: 0.75rem !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
    }

    [data-testid="stMetricValue"] {
        color: var(--c-text) !important;
        font-size: 2rem !important;
        font-weight: 700 !important;
    }

    [data-testid="stMetricDelta"] {
        font-size: 0.85rem !important;
    }

    /* ========== HEADERS ========== */
    h1 {
        background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 800 !important;
        letter-spacing: -0.02em;
    }

    h2, h3 {
        color: var(--c-text) !important;
        font-weight: 700 !important;
    }

    /* ========== BUTTONS ========== */
    .stButton > button {
        background: linear-gradient(135deg, var(--c-primary) 0%, #7c3aed 100%);
        color: white !important;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        padding: 0.5rem 1.2rem;
        transition: all 0.2s ease;
    }

    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
    }

    /* ========== UPLOADER ========== */
    [data-testid="stFileUploaderDropzone"] {
        background: rgba(22, 22, 31, 0.5);
        border: 2px dashed var(--c-border);
        border-radius: 16px;
        transition: all 0.2s ease;
    }

    [data-testid="stFileUploaderDropzone"]:hover {
        border-color: var(--c-primary);
        background: rgba(139, 92, 246, 0.05);
    }

    /* ========== EXPANDER ========== */
    .streamlit-expanderHeader {
        background: rgba(22, 22, 31, 0.5) !important;
        border-radius: 10px;
        border: 1px solid var(--c-border) !important;
    }

    /* ========== DATAFRAMES ========== */
    [data-testid="stDataFrame"] {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--c-border);
    }

    /* ========== TABS ========== */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background: transparent;
    }

    .stTabs [data-baseweb="tab"] {
        background: rgba(22, 22, 31, 0.5);
        border-radius: 10px;
        padding: 8px 16px;
        border: 1px solid var(--c-border);
    }

    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, var(--c-primary) 0%, #7c3aed 100%) !important;
        border-color: transparent !important;
        color: white !important;
    }

    /* ========== ALERT CARDS (custom) ========== */
    .insight-card {
        background: rgba(22, 22, 31, 0.6);
        border: 1px solid var(--c-border);
        border-left: 3px solid var(--c-primary);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 12px;
        backdrop-filter: blur(10px);
    }

    .insight-card.critical { border-left-color: var(--c-danger); }
    .insight-card.warning { border-left-color: var(--c-accent); }
    .insight-card.opportunity { border-left-color: var(--c-primary); }
    .insight-card.success { border-left-color: var(--c-success); }
    .insight-card.info { border-left-color: #3b82f6; }

    .insight-title {
        font-weight: 700;
        color: var(--c-text);
        font-size: 0.95rem;
        margin-bottom: 6px;
    }

    .insight-desc {
        color: var(--c-text-muted);
        font-size: 0.85rem;
        line-height: 1.5;
        margin-bottom: 8px;
    }

    .insight-rec {
        font-size: 0.8rem;
        color: var(--c-secondary);
        font-style: italic;
        padding-top: 8px;
        border-top: 1px dashed var(--c-border);
    }

    .insight-badge {
        display: inline-block;
        font-size: 0.65rem;
        padding: 2px 8px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .badge-critical { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
    .badge-opportunity { background: rgba(139, 92, 246, 0.15); color: #c4b5fd; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; }
    .badge-info { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }

    /* Hide Streamlit branding */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    header { visibility: hidden; }
</style>
"""


def inject_css():
    """Inyecta el CSS personalizado en la app."""
    import streamlit as st
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


def render_insight_card(insight: dict):
    """Renderiza una card de insight con estilo custom."""
    import streamlit as st
    tipo = insight.get("tipo", "info")
    labels = {
        "critical": "🔴 Crítico",
        "warning": "🟡 Advertencia",
        "opportunity": "💡 Oportunidad",
        "success": "🟢 Éxito",
        "info": "ℹ️ Info",
    }
    html = f"""
    <div class="insight-card {tipo}">
        <div class="insight-badge badge-{tipo}">{labels.get(tipo, 'Info')}</div>
        <div class="insight-title">{insight['titulo']}</div>
        <div class="insight-desc">{insight['descripcion']}</div>
        <div class="insight-rec">💡 {insight['recomendacion']}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)
