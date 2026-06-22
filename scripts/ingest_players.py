import kagglehub
import pandas as pd
import json
import os
import glob

print("Downloading dataset...")
path = kagglehub.dataset_download("rovnez/fc-26-fifa-26-player-data")
print("Path to dataset files:", path)

# Find the CSV file inside the downloaded directory
csv_files = glob.glob(os.path.join(path, "*.csv"))
if not csv_files:
    print("No CSV files found in the dataset.")
    exit(1)

csv_file = csv_files[0]
print(f"Reading {csv_file}...")
df = pd.read_csv(csv_file)

# The dataset likely has columns like: 'short_name', 'player_positions', 'overall', 'club_name', 'nationality_name'
# Let's inspect the columns to be safe, but we'll try to map them to our format.
print(f"Dataset columns: {df.columns.tolist()}")

# Function to get the primary position
def get_primary_position(pos_str):
    if pd.isna(pos_str):
        return "N/A"
    return pos_str.split(',')[0].strip()

players_data = []

# If it's a large dataset, let's take the top 500 players by overall to keep the JSON small
if 'overall' in df.columns:
    df = df.sort_values(by='overall', ascending=False).head(500)
else:
    df = df.head(500)

for index, row in df.iterrows():
    # Attempt to safely get values, falling back to 'Unknown' if the column doesn't exist
    name = row['short_name'] if 'short_name' in df.columns else (row['Name'] if 'Name' in df.columns else "Unknown")
    pos_raw = row['player_positions'] if 'player_positions' in df.columns else (row['Position'] if 'Position' in df.columns else "CM")
    position = get_primary_position(pos_raw)
    
    # We'll generate a random squad number if it's missing, or try to use club_jersey_number
    number = row['club_jersey_number'] if 'club_jersey_number' in df.columns else "10"
    if pd.isna(number):
        number = "10"
        
    team = row['nationality_name'] if 'nationality_name' in df.columns else (row['club_name'] if 'club_name' in df.columns else "Unknown")
    rating = row['overall'] if 'overall' in df.columns else 80

    players_data.append({
        "id": f"p_{index}",
        "name": str(name),
        "position": position,
        "number": str(int(float(number))),
        "team": str(team),
        "rating": int(rating)
    })

output_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, 'fifa-players.json')

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(players_data, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(players_data)} players and saved to {output_file}")
