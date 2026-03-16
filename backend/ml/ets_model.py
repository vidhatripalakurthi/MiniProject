import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def run_ets_model(df, forecast_steps):

    data = df.copy()

    data["Date"] = pd.to_datetime(data["Date"])
    data = data.sort_values("Date")

    series = data.set_index("Date")["Demand"]

    model = ExponentialSmoothing(
        series,
        trend="add",
        seasonal=None,
        damped_trend=True
    )

    fit = model.fit()

    forecast = fit.forecast(forecast_steps)

    future_dates = pd.date_range(
        start=series.index[-1],
        periods=forecast_steps + 1,
        freq="W"
    )[1:]

    forecast_df = pd.DataFrame({
        "ds": future_dates,
        "yhat": forecast.values
    })

    return forecast_df