# Tira o cartão roxo de fundo dos personagens "Divertidos": preenche a partir das bordas
# tudo que tem cor de fundo e vira transparência, com a borda suavizada.
# Uso: python3 scripts/recortar-divertidos.py <pasta dos Divertidos> <pasta de saída>
import sys, os
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

orig, destino = sys.argv[1], sys.argv[2]
os.makedirs(destino, exist_ok=True)
for nome in sorted(f for f in os.listdir(orig) if f.endswith('.webp')):
    im = np.asarray(Image.open(os.path.join(orig, nome)).convert('RGB')).astype(int)
    h, w, _ = im.shape
    # Fundo: roxo escuro, azulado. Saturação parecida com o cartão, sem ser o desenho.
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    parecido = (b > r) & (b > g + 30) & (b < 170) & (r < 110) & (g < 80)
    fundo = np.zeros((h, w), bool)
    fila = deque()
    for x in range(w):
        for y in (0, h - 1):
            if parecido[y, x]: fundo[y, x] = True; fila.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if parecido[y, x] and not fundo[y, x]: fundo[y, x] = True; fila.append((y, x))
    while fila:
        y, x = fila.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not fundo[ny, nx] and parecido[ny, nx]:
                fundo[ny, nx] = True; fila.append((ny, nx))
    alfa = Image.fromarray(np.where(fundo, 0, 255).astype('uint8'))
    alfa = alfa.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    saida = Image.fromarray(im.astype('uint8')).convert('RGBA')
    saida.putalpha(alfa)
    saida.save(os.path.join(destino, nome), 'WEBP', quality=90, method=6)
