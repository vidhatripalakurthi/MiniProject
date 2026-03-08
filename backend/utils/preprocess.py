import pandas as pd


def preprocess_dataset(file_path):

    try:
        print("Processing file:", file_path)

        # -----------------------------
        # LOAD DATASET
        # -----------------------------
        if file_path.endswith(".csv"):
            try:
                df = pd.read_csv(file_path)
            except:
                df = pd.read_csv(file_path, encoding="latin1")

        elif file_path.endswith(".xlsx"):
            df = pd.read_excel(file_path)

        else:
            return {"status": "error", "message": "Unsupported file format"}

        print("Original columns:", list(df.columns))

        # -----------------------------
        # CLEAN COLUMN NAMES
        # -----------------------------
        df.columns = df.columns.str.strip()
        columns_lower = [c.lower() for c in df.columns]

        # -----------------------------
        # POSSIBLE COLUMN NAMES
        # -----------------------------
        date_candidates = [
            "date",
            "order date",
            "order_date",
            "transaction_date",
            "invoice date"
        ]

        product_candidates = [
            "product",
            "product line",
            "product_name",
            "product name",
            "product_type",
            "item",
            "category"
        ]

        demand_candidates = [
            "quantity",
            "qty",
            "transaction_qty",
            "quantity ordered",
            "quantity sold",
            "sales",
            "units",
            "demand"
        ]

        # -----------------------------
        # DETECT DATE COLUMN
        # -----------------------------
        date_col = None

        for candidate in date_candidates:
            if candidate in columns_lower:
                date_col = df.columns[columns_lower.index(candidate)]
                break

        if date_col is None:
            for col in df.columns:
                if "date" in col.lower():
                    date_col = col
                    break

        # -----------------------------
        # DETECT PRODUCT COLUMN
        # -----------------------------
        product_col = None

        for candidate in product_candidates:
            if candidate in columns_lower:
                product_col = df.columns[columns_lower.index(candidate)]
                break

        if product_col is None:
            for col in df.columns:
                if "product" in col.lower() or "item" in col.lower():
                    product_col = col
                    break

        # -----------------------------
        # DETECT DEMAND COLUMN
        # -----------------------------
        demand_col = None

        for candidate in demand_candidates:
            if candidate in columns_lower:
                demand_col = df.columns[columns_lower.index(candidate)]
                break

        if demand_col is None:
            numeric_cols = df.select_dtypes(include=["int64", "float64"]).columns
            if len(numeric_cols) > 0:
                demand_col = numeric_cols[0]

        # -----------------------------
        # VALIDATION
        # -----------------------------
        if date_col is None:
            return {"status": "error", "message": "Date column not found"}

        if demand_col is None:
            return {"status": "error", "message": "Demand column not found"}

        if product_col is None:
            df["Product"] = "General"
            product_col = "Product"

        print("Detected Date column:", date_col)
        print("Detected Product column:", product_col)
        print("Detected Demand column:", demand_col)

        # -----------------------------
        # SELECT REQUIRED COLUMNS
        # -----------------------------
        df = df[[date_col, product_col, demand_col]]

        df.columns = ["Date", "Product", "Demand"]

        # -----------------------------
        # CLEAN DATE
        # -----------------------------
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

        # -----------------------------
        # CLEAN DEMAND COLUMN
        # -----------------------------
        df["Demand"] = (
            df["Demand"]
            .astype(str)
            .str.replace(",", "")
            .str.replace("₹", "")
            .str.strip()
        )

        df["Demand"] = pd.to_numeric(df["Demand"], errors="coerce")

        # -----------------------------
        # REMOVE INVALID ROWS
        # -----------------------------
        df = df.dropna(subset=["Date", "Demand"])

        # -----------------------------
        # DATASET SIZE CHECK
        # -----------------------------
        if len(df) < 10:
            return {
                "status": "error",
                "message": "Dataset too small for forecasting"
            }

        # -----------------------------
        # AGGREGATE DATA
        # -----------------------------
        df = (
            df.groupby(["Date", "Product"])["Demand"]
            .sum()
            .reset_index()
        )

        df = df.sort_values("Date")

        print("Preprocessing completed. Rows:", len(df))

        return {
            "status": "success",
            "data": df
        }

    except Exception as e:

        print("Preprocessing error:", str(e))

        return {
            "status": "error",
            "message": str(e)
        }