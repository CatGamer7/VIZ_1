import numpy as np
import pandas as pd
from scipy import stats as scipy_stats


QQ_MAX_POINTS = 200


def compute_histogram(values: np.ndarray, bins: int = 30) -> dict:
    
    counts, edges = np.histogram(values, bins=bins)
    centers = (edges[:-1] + edges[1:]) / 2
    widths = np.diff(edges)

    return {
        'centers': centers.tolist(),
        'counts': counts.tolist(),
        'widths': widths.tolist(),
    }


def compute_qq(values: np.ndarray) -> dict:
    
    (osm, osr), (slope, intercept, _) = scipy_stats.probplot(values, dist='norm')


    n = len(osm)
    if n > QQ_MAX_POINTS:
        idx = np.linspace(0, n - 1, QQ_MAX_POINTS).astype(int)
        osm = np.asarray(osm)[idx]
        osr = np.asarray(osr)[idx]

    return {
        'theoretical': np.asarray(osm).tolist(),
        'sample': np.asarray(osr).tolist(),
        'ref_slope': float(slope),
        'ref_intercept': float(intercept),
    }


def compute_correlation(df: pd.DataFrame, method: str) -> dict:
    
    corr = df.corr(method=method)
    
    return {
        'columns': corr.columns.tolist(),
        'matrix': corr.values.tolist(),
    }
