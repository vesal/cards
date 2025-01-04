import re
n = 52
k = 1
for i in range(1, n+1):
    trailing_zeros = re.search(r'0+$', str(k*i))
    n0 = len(trailing_zeros.group(0)) if trailing_zeros else 0
    print(f' * {i} = {n0}')
    k = k * i

