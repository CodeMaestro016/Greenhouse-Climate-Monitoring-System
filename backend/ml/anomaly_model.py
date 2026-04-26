import sys
import json
import numpy as np
from sklearn.ensemble import IsolationForest

try:
    raw_input = sys.stdin.read().strip()

    if not raw_input:
        raise ValueError("No input received from Node.js")

    input_data = json.loads(raw_input)

    if "values" not in input_data:
        raise ValueError("Missing 'values' key in input JSON")

    values = np.array(input_data["values"], dtype=float).reshape(-1, 1)

    if len(values) < 5:
        raise ValueError("Not enough data for Isolation Forest")

    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(values)

    predictions = model.predict(values)  # -1 = anomaly, 1 = normal

    results = []
    for i in range(len(values)):
        results.append({
            "value": float(values[i][0]),
            "isAnomaly": True if predictions[i] == -1 else False
        })

    print(json.dumps(results))
    sys.stdout.flush()

except Exception as e:
    print(str(e), file=sys.stderr)
    sys.stderr.flush()
    sys.exit(1)