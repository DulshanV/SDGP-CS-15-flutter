#!/usr/bin/env python3
from PIL import Image
import os

# Load the logo
logo_path = "report/images/Logo.jpeg"
output_path = "flutter_application_1/assets/images/logo.png"

# Open the image
img = Image.open(logo_path)
print(f"Original size: {img.size}")

# Crop to get just the icon portion (approximately 60% of the top)
width, height = img.size
# Crop to roughly the shield icon area only
crop_height = int(height * 0.65)
crop_box = (0, 0, width, crop_height)
img_cropped = img.crop(crop_box)
print(f"Cropped size: {img_cropped.size}")

# Convert to RGBA
if img_cropped.mode != 'RGBA':
    img_cropped = img_cropped.convert('RGBA')

# Remove white and light background
data = img_cropped.getdata()
new_data = []

for item in data:
    r, g, b = item[0], item[1], item[2]
    # More aggressive: remove anything that's very light (255 or near-white in JPEG)
    if r > 240 and g > 240 and b > 240:
        new_data.append((r, g, b, 0))  # Fully transparent
    else:
        new_data.append(item)  # Keep original

img_cropped.putdata(new_data)

# Save with optimization
img_cropped.save(output_path, 'PNG', optimize=True)
print(f"✓ Logo icon extracted and processed")
print(f"✓ Saved to: {output_path}")
print(f"✓ Format: PNG with transparent background")
print(f"✓ Final size: {img_cropped.size}")
