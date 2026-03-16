from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np


def calculate_metrics(actual, predicted):

    actual = np.array(actual)
    predicted = np.array(predicted)

    # -------------------------
    # MAE
    # -------------------------
    mae = mean_absolute_error(actual, predicted)

    # -------------------------
    # RMSE
    # -------------------------
    rmse = np.sqrt(mean_squared_error(actual, predicted))

    # -------------------------
    # MAPE
    # -------------------------
    mask = actual != 0

    if np.sum(mask) == 0:
        mape = 0
    else:
        mape = np.mean(
            np.abs((actual[mask] - predicted[mask]) / actual[mask])
        ) * 100

    return {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "MAPE": float(mape)
    }


# -------------------------
# CONFIDENCE SCORE
# -------------------------
def confidence_from_mape(mape):

    if mape <= 35:
        return "High"

    elif mape <= 50:
        return "Medium"

    else:
        return "Low"