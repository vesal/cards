from PIL import Image
from PIL import ImageFilter
import cairosvg
import os

def convert_svg_to_png(svg_path, png_path, width, height):
    print(f"Processing {svg_path} -> {png_path} ")
    # Muunna SVG PNG:ksi
    cairosvg.svg2png(url=svg_path, write_to="temp.png")
    
    # Avaa PNG väliaikaisesti ja muuta sen kokoa
    with Image.open("temp.png") as img:
        resized_img = img.resize((width, height), Image.Resampling.LANCZOS)
        # resized_img = resized_img.filter(ImageFilter.SMOOTH_MORE)
        resized_img.save(png_path)

width, height = 71, 96       # Haluttu koko

# Kansion tiedostot
"""
suits = ['clubs', 'diamonds', 'hearts', 'spades']
osuits = ['c', 'd', 'h', 's']
ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']

for suit in suits:
    for rank in ranks:
        svg_file = f"{suit}_{rank}.svg"
        output_png = f"{osuits[suits.index(suit)]}{ranks.index(rank)+1:02}.png"
        
        if os.path.exists(svg_file):
            convert_svg_to_png(svg_file, output_png, width, height)

convert_svg_to_png("joker_black.svg", "jokerb.png", width, height)
convert_svg_to_png("joker_red.svg", "jokerr.png", width, height)
"""
for i in range(1, 13+1): 
    svg_file = f"back{i}.svg"
    if os.path.exists(svg_file):
        output_png = f"back{i}.png"
        convert_svg_to_png(svg_file, output_png, width, height)
