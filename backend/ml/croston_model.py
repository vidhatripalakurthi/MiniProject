import pandas as pd
import numpy as np


def croston(series, alpha=0.1):

    demand = np.array(series)

    n = len(demand)

    q = np.zeros(n)
    a = np.zeros(n)
    f = np.zeros(n)

    first = np.argmax(demand > 0)

    q[first] = demand[first]
    a[first] = 1
    f[first] = q[first] / a[first]

    for t in range(first + 1, n):

        if demand[t] > 0:

            q[t] = q[t-1] + alpha * (demand[t] - q[t-1])
            a[t] = a[t-1] + alpha * (1 - a[t-1])

        else:

            q[t] = q[t-1]
            a[t] = a[t-1] + alpha * (1 - a[t-1])

        f[t] = q[t] / a[t]

    return f[-1]


def run_croston_model(df, forecast_steps):

    data = df.copy()

    data["Date"] = pd.to_datetime(data["Date"])
    data = data.sort_values("Date")

    series = data.set_index("Date")["Demand"]

    forecast_value = croston(series)

    future_dates = pd.date_range(
        start=series.index[-1],
        periods=forecast_steps + 1,
        freq="W"
    )[1:]

    forecast_df = pd.DataFrame({
        "ds": future_dates,
        "yhat": [forecast_value] * forecast_steps
    })

    return forecast_df