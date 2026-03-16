import pandas as pd
from prophet import Prophet


def run_prophet_model(df, forecast_steps):

    data = df.copy()

    # Ensure datetime
    data["Date"] = pd.to_datetime(data["Date"])
    data = data.sort_values("Date")

    # -------------------------
    # Feature Engineering
    # -------------------------
    data["month"] = data["Date"].dt.month
    data["weekofyear"] = data["Date"].dt.isocalendar().week.astype(int)
    data["quarter"] = data["Date"].dt.quarter

    prophet_df = data.rename(columns={
        "Date": "ds",
        "Demand": "y"
    })

    # -------------------------
    # Prophet Model
    # -------------------------
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        changepoint_prior_scale=0.1
    )

    # Custom Monthly Seasonality
    model.add_seasonality(
        name="monthly",
        period=30.5,
        fourier_order=5
    )

    # Extra regressors
    model.add_regressor("month")
    model.add_regressor("weekofyear")
    model.add_regressor("quarter")

    # -------------------------
    # Train
    # -------------------------
    model.fit(prophet_df)

    # -------------------------
    # Future Data
    # -------------------------
    future = model.make_future_dataframe(
        periods=forecast_steps,
        freq="W"
    )

    # Add features to future dataframe
    future["month"] = future["ds"].dt.month
    future["weekofyear"] = future["ds"].dt.isocalendar().week.astype(int)
    future["quarter"] = future["ds"].dt.quarter

    # -------------------------
    # Forecast
    # -------------------------
    forecast = model.predict(future)

    forecast_df = forecast[["ds", "yhat"]]

    forecast_df = forecast_df.tail(forecast_steps)

    return forecast_df