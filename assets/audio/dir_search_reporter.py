import os

directories = [
    r".",
    r"./cover-art"
]

output_file = "file_list.txt"

with open(output_file, "w", encoding="utf-8") as f:   # <-- add encoding="utf-8"
    for directory in directories:
        f.write(f"\n=== Files in: {directory} ===\n")
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                full_path = os.path.join(directory, filename)
                if os.path.isfile(full_path):
                    f.write(filename + "\n")
        else:
            f.write(f"  [Directory not found]\n")

print(f"File names written to {output_file}")