#!/usr/bin/env python3
"""
Convert an image into ASCII / Unicode Braille pixel art for Pi Startup Banner.
Uses Python Pillow (PIL) as the third-party image processing library.
"""

import sys
import os
from PIL import Image, ImageEnhance
import numpy as np

def convert_image_to_braille(image_path: str, width: int = 64, contrast: float = 1.4, threshold: int = 195):
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}", file=sys.stderr)
        sys.exit(1)
        
    img = Image.open(image_path).convert('RGB')
    
    # Auto-crop padding around the subject (background is light)
    arr = np.array(img, dtype=float)
    is_avatar = (arr[:, :, 0] < 225) | (arr[:, :, 1] < 215) | (arr[:, :, 2] < 205)
    ay, ax = np.where(is_avatar)
    
    if len(ay) > 0 and len(ax) > 0:
        ymin, ymax = int(np.percentile(ay, 1)), int(np.percentile(ay, 99))
        xmin, xmax = int(np.percentile(ax, 1)), int(np.percentile(ax, 99))
        cropped = img.crop((xmin, ymin, xmax, ymax))
    else:
        cropped = img

    aspect = cropped.height / cropped.width
    height = int(width * aspect * 0.48)
    
    gray = cropped.convert('L')
    enh = ImageEnhance.Contrast(gray)
    gray_enh = enh.enhance(contrast)
    
    bw, bh = width * 2, height * 4
    res = gray_enh.resize((bw, bh), Image.Resampling.LANCZOS)
    arr_res = np.array(res)
    
    dot_map = [
        (0,0, 0x01), (0,1, 0x02), (0,2, 0x04), (0,3, 0x40),
        (1,0, 0x08), (1,1, 0x10), (1,2, 0x20), (1,3, 0x80)
    ]
    
    lines = []
    for y in range(0, bh, 4):
        line = ""
        for x in range(0, bw, 2):
            code = 0x2800
            for dx, dy, bit in dot_map:
                py = y + dy
                px = x + dx
                if py < bh and px < bw:
                    if arr_res[py, px] < threshold:
                        code |= bit
            line += chr(code)
        lines.append(line.rstrip())
        
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
        
    return lines

if __name__ == "__main__":
    img_path = r"C:\Users\NoRainCity\Desktop\b_f1618d489dd0983454bfdccf80902a92.jpg"
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        
    lines = convert_image_to_braille(img_path)
    print("const BANNER_ART = [")
    for l in lines:
        print(f'  "{l}",')
    print("] as const;")
