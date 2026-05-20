"""
Loader inteligente de archivos Excel del POS de Comma.
Detecta automáticamente el tipo de archivo por sus columnas y lo normaliza
a un esquema canónico antes de insertar en DuckDB.
"""
import hashlib
import re
import unicodedata
from typing import Optional

import pandas as pd
import numpy as np


# ============================================================
# DETECCIÓN DE TIPO DE ARCHIVO
# ============================================================

# Firmas de cada tipo (palabras clave en columnas)
SIGNATURES = {
    "ventas_detalle": ["articulo", "cantidad", "mesero", "precio"],
    "ventas_tickets": ["documento", "total", "mesero", "subtotal"],
    "ventas_pagos": ["forma", "pago", "banco"],
    "inventario": ["existencia", "linea", "costo"],
}


def normalize_col(col: str) -> str:
    """Normaliza un nombre de columna: lowercase, sin tildes, sin espacios.
    También quita sufijos .1, .2 que pandas agrega a columnas duplicadas."""
    if not isinstance(col, str):
        col = str(col)
    # Quitar tildes
    col = unicodedata.normalize("NFD", col)
    col = "".join(c for c in col if unicodedata.category(c) != "Mn")
    # Lowercase y limpiar
    col = col.lower().strip()
    # Quitar sufijos numéricos tipo .1, .2 que pandas agrega
    col = re.sub(r"\.\d+$", "", col)
    col = re.sub(r"[^a-z0-9]+", "_", col)
    col = col.strip("_")
    if not col:
        col = "col"
    return col


def deduplicate_columns(cols: list) -> list:
    """Si hay nombres duplicados, agrega sufijo _2, _3, etc."""
    seen = {}
    result = []
    for c in cols:
        if c in seen:
            seen[c] += 1
            result.append(f"{c}_{seen[c]}")
        else:
            seen[c] = 1
            result.append(c)
    return result


def detect_file_type(df: pd.DataFrame) -> Optional[str]:
    """
    Detecta el tipo de archivo basándose en las columnas presentes.
    Devuelve el tipo o None si no logra identificarlo.
    """
    cols_normalized = " ".join(normalize_col(c) for c in df.columns)

    scores = {}
    for file_type, keywords in SIGNATURES.items():
        score = sum(1 for kw in keywords if kw in cols_normalized)
        scores[file_type] = score

    best_type = max(scores, key=scores.get)
    # Necesita al menos 2 keywords matching
    if scores[best_type] >= 2:
        return best_type
    return None


def read_excel_safe(file) -> pd.DataFrame:
    """
    Lee un archivo Excel manejando ambos formatos (.xls y .xlsx).
    Devuelve DataFrame con columnas normalizadas.
    """
    name = file.name.lower() if hasattr(file, "name") else str(file).lower()

    try:
        if name.endswith(".xls"):
            # Algunos .xls del POS son HTML disfrazado
            try:
                df = pd.read_excel(file, engine="xlrd")
            except Exception:
                # Intentar como HTML
                file.seek(0) if hasattr(file, "seek") else None
                tables = pd.read_html(file)
                if tables:
                    df = tables[0]
                else:
                    raise ValueError("No se pudo leer el archivo .xls")
        else:
            df = pd.read_excel(file, engine="openpyxl")
    except Exception as e:
        raise ValueError(f"Error leyendo archivo: {e}")

    # Normalizar nombres de columnas
    df.columns = [normalize_col(c) for c in df.columns]
    # Resolver duplicados (ej: dos columnas 'iva' → 'iva', 'iva_2')
    df.columns = deduplicate_columns(list(df.columns))
    return df


# ============================================================
# NORMALIZADORES POR TIPO
# ============================================================

def find_col(df: pd.DataFrame, *candidates) -> Optional[str]:
    """Busca la primera columna que matchee alguno de los candidatos."""
    for cand in candidates:
        for col in df.columns:
            if cand in col:
                return col
    return None


def parse_date(value):
    """Parsea fecha desde múltiples formatos."""
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.date()
    try:
        return pd.to_datetime(value, errors="coerce", dayfirst=True).date()
    except Exception:
        return None


def parse_hour(value):
    """Extrae la hora (0-23) de un valor."""
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.hour
    # Si es string "HH:MM:SS" o similar
    try:
        ts = pd.to_datetime(value, errors="coerce")
        if pd.notna(ts):
            return ts.hour
    except Exception:
        pass
    # Si es string tipo "23:45"
    s = str(value)
    match = re.match(r"^(\d{1,2})", s)
    if match:
        h = int(match.group(1))
        if 0 <= h <= 23:
            return h
    return None


def safe_float(value):
    """Convierte a float, devolviendo 0 si falla."""
    try:
        if pd.isna(value):
            return 0.0
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def hash_row(*values) -> str:
    """Genera hash MD5 de los valores para detectar duplicados."""
    raw = "|".join(str(v) for v in values)
    return hashlib.md5(raw.encode()).hexdigest()


def clean_text(value) -> str:
    """Limpia texto: strip, mayúsculas para evitar duplicación case-sensitive."""
    if pd.isna(value):
        return ""
    return str(value).strip().upper()


# ============================================================
# NORMALIZADORES ESPECÍFICOS
# ============================================================

def normalize_ventas_detalle(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza Detalle_de_ventas_por_articulos."""
    col_fecha = find_col(df, "fecha")
    col_hora = find_col(df, "hora")
    col_doc = find_col(df, "documento", "numero", "ticket")
    col_prod = find_col(df, "articulo", "producto", "descripcion")
    col_cat = find_col(df, "linea", "categoria", "grupo")
    col_cant = find_col(df, "cantidad")
    col_precio = find_col(df, "precio")
    col_subtotal = find_col(df, "subtotal", "total", "valor")
    col_mesero = find_col(df, "mesero", "vendedor", "empleado")
    col_mesa = find_col(df, "mesa")
    col_cliente = find_col(df, "cliente")

    rows = []
    for idx, r in df.iterrows():
        fecha = parse_date(r[col_fecha]) if col_fecha else None
        if fecha is None:
            continue
        hora = parse_hour(r[col_hora]) if col_hora else None
        producto = clean_text(r[col_prod]) if col_prod else ""
        if not producto:
            continue
        cantidad = safe_float(r[col_cant]) if col_cant else 1.0
        precio = safe_float(r[col_precio]) if col_precio else 0.0
        subtotal = safe_float(r[col_subtotal]) if col_subtotal else cantidad * precio
        doc = str(r[col_doc]) if col_doc else ""
        categoria = clean_text(r[col_cat]) if col_cat else "SIN CATEGORIA"
        mesero = clean_text(r[col_mesero]) if col_mesero else ""
        mesa = clean_text(r[col_mesa]) if col_mesa else ""
        cliente = clean_text(r[col_cliente]) if col_cliente else ""

        rh = hash_row(fecha, hora, doc, producto, cantidad, subtotal)
        rows.append({
            "id": idx,
            "fecha": fecha,
            "hora": hora,
            "documento": doc,
            "producto": producto,
            "categoria": categoria,
            "cantidad": cantidad,
            "precio_unitario": precio,
            "subtotal": subtotal,
            "mesero": mesero,
            "mesa": mesa,
            "cliente": cliente,
            "row_hash": rh,
        })

    return pd.DataFrame(rows)


def normalize_ventas_tickets(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza Reporte_de_Ventas (tickets agregados)."""
    col_fecha = find_col(df, "fecha")
    col_hora = find_col(df, "hora")
    col_doc = find_col(df, "documento", "numero", "ticket")
    col_total = find_col(df, "total")
    col_subtotal = find_col(df, "subtotal")
    col_iva = find_col(df, "iva", "impuesto")
    col_mesero = find_col(df, "mesero", "vendedor", "empleado")
    col_mesa = find_col(df, "mesa")
    col_cliente = find_col(df, "cliente")
    col_estado = find_col(df, "estado", "anulado")

    rows = []
    for _, r in df.iterrows():
        fecha = parse_date(r[col_fecha]) if col_fecha else None
        if fecha is None:
            continue
        doc = str(r[col_doc]) if col_doc and pd.notna(r[col_doc]) else ""
        if not doc:
            continue
        rows.append({
            "documento": doc,
            "fecha": fecha,
            "hora": parse_hour(r[col_hora]) if col_hora else None,
            "mesero": clean_text(r[col_mesero]) if col_mesero else "",
            "mesa": clean_text(r[col_mesa]) if col_mesa else "",
            "cliente": clean_text(r[col_cliente]) if col_cliente else "",
            "subtotal": safe_float(r[col_subtotal]) if col_subtotal else 0.0,
            "iva": safe_float(r[col_iva]) if col_iva else 0.0,
            "total": safe_float(r[col_total]) if col_total else 0.0,
            "estado": clean_text(r[col_estado]) if col_estado else "ACTIVO",
        })

    return pd.DataFrame(rows)


def normalize_ventas_pagos(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza Ventas_por_Formas_de_Pago."""
    col_fecha = find_col(df, "fecha")
    col_doc = find_col(df, "documento", "numero", "ticket")
    col_forma = find_col(df, "forma_pago", "forma", "metodo")
    col_banco = find_col(df, "banco", "entidad")
    col_monto = find_col(df, "monto", "valor", "total", "subtotal")

    rows = []
    for idx, r in df.iterrows():
        fecha = parse_date(r[col_fecha]) if col_fecha else None
        if fecha is None:
            continue
        doc = str(r[col_doc]) if col_doc else ""
        forma = clean_text(r[col_forma]) if col_forma else "EFECTIVO"
        banco = clean_text(r[col_banco]) if col_banco else ""
        monto = safe_float(r[col_monto]) if col_monto else 0.0
        if monto == 0:
            continue
        rh = hash_row(fecha, doc, forma, banco, monto)
        rows.append({
            "id": idx,
            "documento": doc,
            "fecha": fecha,
            "forma_pago": forma,
            "banco": banco,
            "monto": monto,
            "row_hash": rh,
        })

    return pd.DataFrame(rows)


def normalize_inventario(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza Informe_de_Existencias."""
    col_codigo = find_col(df, "codigo", "id")
    col_articulo = find_col(df, "articulo", "producto", "descripcion")
    col_linea = find_col(df, "linea", "categoria")
    col_existencia = find_col(df, "existencia", "stock")
    col_unidades = find_col(df, "unidades")
    col_costo = find_col(df, "costo")
    col_valor = find_col(df, "valor")

    snapshot_date = pd.Timestamp.now().date()

    rows = []
    for _, r in df.iterrows():
        codigo = str(r[col_codigo]) if col_codigo and pd.notna(r[col_codigo]) else ""
        if not codigo:
            continue
        rows.append({
            "codigo": codigo,
            "articulo": clean_text(r[col_articulo]) if col_articulo else "",
            "linea": clean_text(r[col_linea]) if col_linea else "",
            "existencia": safe_float(r[col_existencia]) if col_existencia else 0.0,
            "unidades": safe_float(r[col_unidades]) if col_unidades else 0.0,
            "costo_promedio": safe_float(r[col_costo]) if col_costo else 0.0,
            "valor": safe_float(r[col_valor]) if col_valor else 0.0,
            "fecha_snapshot": snapshot_date,
        })

    return pd.DataFrame(rows)


# ============================================================
# FUNCIÓN PRINCIPAL DE INGESTA
# ============================================================

NORMALIZERS = {
    "ventas_detalle": normalize_ventas_detalle,
    "ventas_tickets": normalize_ventas_tickets,
    "ventas_pagos": normalize_ventas_pagos,
    "inventario": normalize_inventario,
}


def ingest_file(file, conn) -> dict:
    """
    Ingesta un archivo Excel: lee, detecta tipo, normaliza e inserta en DuckDB.
    Devuelve un dict con resultado: {tipo, filas_insertadas, filas_duplicadas, error}
    """
    result = {
        "archivo": file.name if hasattr(file, "name") else "unknown",
        "tipo": None,
        "filas_insertadas": 0,
        "filas_duplicadas": 0,
        "error": None,
    }

    try:
        df = read_excel_safe(file)
    except Exception as e:
        result["error"] = f"Error leyendo Excel: {e}"
        return result

    file_type = detect_file_type(df)
    if not file_type:
        result["error"] = (
            f"No se pudo identificar el tipo de archivo. "
            f"Columnas detectadas: {list(df.columns)[:8]}"
        )
        return result

    result["tipo"] = file_type

    try:
        normalizer = NORMALIZERS[file_type]
        df_norm = normalizer(df)
    except Exception as e:
        result["error"] = f"Error normalizando datos: {e}"
        return result

    if df_norm.empty:
        result["error"] = "El archivo se procesó pero no contiene filas válidas."
        return result

    # Insertar en DuckDB con manejo de duplicados
    try:
        if file_type == "inventario":
            # Inventario es snapshot: reemplazar todo
            conn.execute("DELETE FROM inventario")
            conn.register("temp_df", df_norm)
            conn.execute("INSERT INTO inventario SELECT * FROM temp_df")
            conn.unregister("temp_df")
            result["filas_insertadas"] = len(df_norm)
        else:
            # Ventas: insertar con detección de duplicados
            tabla = file_type
            conn.register("temp_df", df_norm)

            # Detectar duplicados existentes
            if file_type == "ventas_tickets":
                pk_col = "documento"
            else:
                pk_col = "row_hash"

            existing = conn.execute(
                f"SELECT {pk_col} FROM {tabla}"
            ).fetchdf()[pk_col].tolist()

            df_new = df_norm[~df_norm[pk_col].isin(existing)]
            duplicados = len(df_norm) - len(df_new)

            if not df_new.empty:
                conn.register("temp_df_new", df_new)
                conn.execute(f"INSERT INTO {tabla} SELECT * FROM temp_df_new")
                conn.unregister("temp_df_new")

            conn.unregister("temp_df")
            result["filas_insertadas"] = len(df_new)
            result["filas_duplicadas"] = duplicados

        # Registrar en log
        conn.execute("""
            INSERT INTO uploads_log (id, archivo, tipo, filas_insertadas, filas_duplicadas)
            VALUES (
                (SELECT COALESCE(MAX(id), 0) + 1 FROM uploads_log),
                ?, ?, ?, ?
            )
        """, [result["archivo"], file_type, result["filas_insertadas"],
              result["filas_duplicadas"]])
        conn.commit()

    except Exception as e:
        result["error"] = f"Error insertando en BD: {e}"
        return result

    return result
