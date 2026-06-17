import re

with open('src/app/tournaments/[id]/page.js', 'r') as f:
    content = f.read()

# Hex colors (general)
content = re.sub(r'#f8fafc', 'var(--text-primary)', content)
content = re.sub(r'#f1f5f9', 'var(--text-primary)', content)
content = re.sub(r'#e2e8f0', 'var(--text-primary)', content)
content = re.sub(r'#e8eaed', 'var(--text-primary)', content)

content = re.sub(r'#94a3b8', 'var(--text-secondary)', content)
content = re.sub(r'#64748b', 'var(--text-secondary)', content)
content = re.sub(r'#8b92a5', 'var(--text-secondary)', content)

content = re.sub(r'#475569', 'var(--text-muted)', content)

# rgba white variants for borders/backgrounds
content = re.sub(r'rgba\(255,\s*255,\s*255,\s*0\.0[123]\)', 'var(--bg-subtle)', content)
content = re.sub(r'rgba\(255,\s*255,\s*255,\s*0\.0[456]\)', 'var(--border-light)', content)
content = re.sub(r'rgba\(255,\s*255,\s*255,\s*0\.(?:08|1|15)\)', 'var(--border)', content)

# background rgba
content = re.sub(r'rgba\(15,\s*23,\s*42,\s*0\.6\)', 'var(--bg-subtle)', content)
content = re.sub(r'rgb\(24,\s*24,\s*27\)', 'var(--bg-app)', content)
content = re.sub(r'rgba\(13,\s*17,\s*23,\s*0\.[0-9]+\)', 'var(--bg-app)', content)
content = re.sub(r'rgba\(22,\s*27,\s*34,\s*0\.[0-9]+\)', 'var(--bg-card)', content)

with open('src/app/tournaments/[id]/page.js', 'w') as f:
    f.write(content)
