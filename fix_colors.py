import re

with open('src/app/tournaments/[id]/page.js', 'r') as f:
    content = f.read()

# Main Background Gradients
content = re.sub(r"'linear-gradient\(145deg, rgba\(245,158,11,0\.0[0-9]\) 0%, rgba\(22,27,34,0\.9[0-9]\) 35%, rgba\(13,17,23,0\.9[0-9]\) 100%\)'", "'var(--bg-card)'", content)
content = re.sub(r"'linear-gradient\(145deg, rgba\(245,158,11,0\.0[0-9]\), rgba\(13,17,23,0\.9[0-9]\)'", "'var(--bg-card)'", content)

# Backgrounds
content = re.sub(r"'rgba\(255,\s*255,\s*255,\s*0\.(?:01|015|02|03)\)'", "'var(--bg-subtle)'", content)
content = re.sub(r"'rgba\(255,\s*255,\s*255,\s*0\.(?:04|05|06)\)'", "'var(--border-light)'", content)
content = re.sub(r"'rgba\(255,\s*255,\s*255,\s*0\.(?:08|1|15)\)'", "'var(--border)'", content)
content = re.sub(r"'rgba\(15,\s*23,\s*42,\s*0\.6\)'", "'var(--bg-subtle)'", content)
content = re.sub(r"'rgb\(24,\s*24,\s*27\)'", "'var(--bg-app)'", content)

# Text Colors
content = re.sub(r"'#(?:f8fafc|f1f5f9|e2e8f0|e8eaed)'", "'var(--text-primary)'", content)
content = re.sub(r"'#(?:94a3b8|64748b|8b92a5)'", "'var(--text-secondary)'", content)
content = re.sub(r"'#475569'", "'var(--text-muted)'", content)
content = re.sub(r"color:\s*'#fff'", "color: 'var(--text-primary)'", content)

# Shadows
content = re.sub(r"rgba\(0,\s*0,\s*0,\s*0\.[2-9][0-9]*\)", "rgba(0,0,0,0.04)", content)
content = re.sub(r"filter: 'drop-shadow\(0 4px 12px rgba\(0,0,0,0\.04\)\)'", "filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.05))'", content)

with open('src/app/tournaments/[id]/page.js', 'w') as f:
    f.write(content)
