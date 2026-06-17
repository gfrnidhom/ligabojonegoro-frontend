import re

with open('src/app/tournaments/[id]/page.js', 'r') as f:
    content = f.read()

content = re.sub(r"'#0f172a'", "'var(--bg-card)'", content)

with open('src/app/tournaments/[id]/page.js', 'w') as f:
    f.write(content)
