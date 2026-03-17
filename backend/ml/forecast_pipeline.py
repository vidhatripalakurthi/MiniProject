import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

from ml.prophet_model import run_prophet_model
from ml.arima_model import run_arima_model
from ml.ets_model import run_ets_model
from ml.croston_model import run_croston_model

from ml.metrics import calculate_metrics, confidence_from_mape


# -------------------------
# DATA PREPARATION
# -------------------------
def prepare_time_series(df, product):

    product_df = df[df["Product"] == product].copy()

    # Ignore negligible demand
    if product_df["Demand"].sum() < 50:
        return None

    product_df["Date"] = pd.to_datetime(product_df["Date"])
    product_df = product_df.sort_values("Date")

    product_df = product_df[["Date", "Demand"]]

    # Weekly aggregation
    product_df = (
        product_df
        .set_index("Date")
        .resample("W")
        .sum()
        .reset_index()
    )

    # Fill missing weeks
    full_range = pd.date_range(
        start=product_df["Date"].min(),
        end=product_df["Date"].max(),
        freq="W"
    )

    product_df = (
        product_df
        .set_index("Date")
        .reindex(full_range)
        .rename_axis("Date")
        .reset_index()
    )

    product_df["Demand"] = product_df["Demand"].fillna(0)

    # Limit history
    if len(product_df) > 104:
        product_df = product_df.tail(104)

    # Smoothing
    product_df["Demand"] = (
        product_df["Demand"]
        .ewm(span=8, adjust=False)
        .mean()
    )

    # Log transform
    product_df["Demand"] = np.log1p(product_df["Demand"])

    if product_df["Demand"].nunique() <= 1:
        return None

    return product_df


# -------------------------
# TRAIN TEST SPLIT
# -------------------------
def train_test_split_time_series(df, test_ratio=0.2):

    split_index = int(len(df) * (1 - test_ratio))

    train = df.iloc[:split_index]
    test = df.iloc[split_index:]

    return train, test


# -------------------------
# MODEL EVALUATION
# -------------------------
def evaluate_models(train, test):

    metrics = {}

    forecast_steps = len(test)

    actual = np.expm1(test["Demand"].values)

    # Prophet
    prophet_pred = run_prophet_model(train, forecast_steps)
    prophet_values = prophet_pred["yhat"].values[:forecast_steps]
    prophet_values = np.expm1(np.clip(prophet_values, 0, None))
    metrics["prophet"] = calculate_metrics(actual, prophet_values)

    # ARIMA
    arima_pred = run_arima_model(train, forecast_steps)
    arima_values = arima_pred["yhat"].values[:forecast_steps]
    arima_values = np.expm1(np.clip(arima_values, 0, None))
    metrics["arima"] = calculate_metrics(actual, arima_values)

    # ETS
    ets_pred = run_ets_model(train, forecast_steps)
    ets_values = ets_pred["yhat"].values[:forecast_steps]
    ets_values = np.expm1(np.clip(ets_values, 0, None))
    metrics["ets"] = calculate_metrics(actual, ets_values)

    # Croston
    croston_pred = run_croston_model(train, forecast_steps)
    croston_values = croston_pred["yhat"].values[:forecast_steps]
    croston_values = np.expm1(np.clip(croston_values, 0, None))
    metrics["croston"] = calculate_metrics(actual, croston_values)

    return metrics


def select_best_model(metrics):

    best_model = None
    best_mape = float("inf")

    for model_name, values in metrics.items():

        mape = values["MAPE"]

        if mape < best_mape:
            best_mape = mape
            best_model = model_name

    return best_model


# -------------------------
# FUTURE FORECAST
# -------------------------
def run_best_model_full(product_df, best_model, forecast_months=6):

    forecast_steps = forecast_months * 4

    if best_model == "prophet":
        pred = run_prophet_model(product_df, forecast_steps)

    elif best_model == "arima":
        pred = run_arima_model(product_df, forecast_steps)

    elif best_model == "ets":
        pred = run_ets_model(product_df, forecast_steps)

    elif best_model == "croston":
        pred = run_croston_model(product_df, forecast_steps)

    values = pred["yhat"].values[:forecast_steps]

    values = np.expm1(np.clip(values, 0, None))

    return values


# -------------------------
# SINGLE THREAD WORKER
# -------------------------
def process_single_product(df, product):
    try:
        product_df = prepare_time_series(df, product)

        if product_df is None:
            return product, None

        train, test = train_test_split_time_series(product_df)

        metrics = evaluate_models(train, test)

        best_model = select_best_model(metrics)

        best_mape = metrics[best_model]["MAPE"]

        confidence = confidence_from_mape(best_mape)

        # Run best model on FULL DATA
        forecast_values = run_best_model_full(product_df, best_model)

        return product, {
            "metrics": metrics,
            "best_model": best_model,
            "confidence": confidence,
            "forecast": forecast_values.tolist()
        }
    except Exception as e:
        print(f"Pipeline failed for {product}: {str(e)}")
        return product, None


# -------------------------
# MAIN PIPELINE
# -------------------------
def run_forecast_pipeline(file_path, selected_product):

    df = pd.read_csv(file_path)

    if selected_product == "All Products":
        products = df["Product"].unique().tolist()
    elif isinstance(selected_product, list):
        products = selected_product
    else:
        products = [selected_product]

    results = {}

    # Run in parallel to cut processing time by up to 4x
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(process_single_product, df, prod): prod for prod in products}
        
        for future in as_completed(futures):
            prod, result = future.result()
            if result:
                results[prod] = result

    return results