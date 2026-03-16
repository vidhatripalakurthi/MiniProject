import pandas as pd
from pmdarima import auto_arima


def run_arima_model(df, forecast_steps):

    data = df.copy()

    data["Date"] = pd.to_datetime(data["Date"])
    data["Demand"] = pd.to_numeric(data["Demand"], errors="coerce")

    data = data.sort_values("Date")

    series = data.set_index("Date")["Demand"]

    # Fast ARIMA configuration
    model = auto_arima(
        series,
        seasonal=False,          # removed seasonal search
        stepwise=True,           # fast stepwise search
        start_p=0,
        start_q=0,
        max_p=3,
        max_q=3,
        d=None,
        suppress_warnings=True,
        error_action="ignore"
    )

    forecast = model.predict(n_periods=forecast_steps)

    future_dates = pd.date_range(
        start=series.index[-1],
        periods=forecast_steps + 1,
        freq="W"
    )[1:]

    forecast_df = pd.DataFrame({
        "ds": future_dates,
        "yhat": forecast
    })

    return forecast_df