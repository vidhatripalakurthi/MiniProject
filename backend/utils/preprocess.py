import pandas as pd

def preprocess_dataset(file_path):

    try:
        print("Processing file:", file_path)
        # Load dataset
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file_path.endswith(".xlsx"):
            df = pd.read_excel(file_path)
        else:
            return {"status": "error", "message": "Unsupported file format"}

        # Candidate columns
        date_candidates = ["date","transaction_date","order date","order_date"]
        product_candidates = ["product","product_type","product line","product_name","product name"]
        demand_candidates = ["quantity","transaction_qty","quantity ordered","sales","quantity (liters/kg)","quantity sold","qty"]

        columns = df.columns.str.lower()

        # Detect date column
        date_col = None
        for col in date_candidates:
            if col in columns.values:
                date_col = df.columns[columns == col][0]
                break

        # Detect product column
        product_col = None
        for col in product_candidates:
            if col in columns.values:
                product_col = df.columns[columns == col][0]
                break

        # Detect demand column
        demand_col = None
        for col in demand_candidates:
            if col in columns.values:
                demand_col = df.columns[columns == col][0]
                break

        if date_col is None:
            return {"status": "error", "message": "Date column not found"}

        if demand_col is None:
            return {"status": "error", "message": "Demand column not found"}

        if product_col is None:
            df["Product"] = "General"
            product_col = "Product"

        # Select columns
        df = df[[date_col, product_col, demand_col]]

        # Rename
        df.columns = ["Date","Product","Demand"]

        # Convert date
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

        # Convert demand
        df["Demand"] = pd.to_numeric(df["Demand"], errors="coerce")

        # Remove invalid rows
        df = df.dropna()

        if len(df) < 10:
            return {"status": "error", "message": "Dataset too small for forecasting"}

        # Aggregate
        df = df.groupby(["Date","Product"])["Demand"].sum().reset_index()

        df = df.sort_values("Date")

        return {"status": "success", "data": df}

    except Exception as e:
        print("Preprocessing error:", str(e))
        return {"status": "error", "message": str(e)}