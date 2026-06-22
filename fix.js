const fs = require('fs');
const path = 'src/app/tournaments/[id]/page.js';
let c = fs.readFileSync(path, 'utf8');

// Replace active tab logic manually
c = c.replace(/background: isActive \? 'rgba\(245, 158, 11, 0.25\)' : 'var\(--border-light\)'/g, "background: isActive ? 'var(--primary)' : 'var(--border-light)'");
c = c.replace(/color: isActive \? '#fbbf24' : 'var\(--text-secondary\)'/g, "color: isActive ? '#ffffff' : 'var(--text-secondary)'");
c = c.replace(/border: `1px solid \$\{isActive \? 'rgba\(245, 158, 11, 0.4\)' : 'var\(--border\)'\}`/g, "border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`");
c = c.replace(/boxShadow: isActive \? '0 4px 12px rgba\(245, 158, 11, 0.2\)' : 'none'/g, "boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'");

// Replace match view tabs
c = c.replace(/background: matchView === 'upcoming' \? 'rgba\(245, 158, 11, 0.25\)' : 'transparent'/g, "background: matchView === 'upcoming' ? 'var(--primary)' : 'transparent'");
c = c.replace(/color: matchView === 'upcoming' \? '#f59e0b' : 'var\(--text-secondary\)'/g, "color: matchView === 'upcoming' ? '#ffffff' : 'var(--text-secondary)'");
c = c.replace(/background: matchView === 'finished' \? 'rgba\(245, 158, 11, 0.25\)' : 'transparent'/g, "background: matchView === 'finished' ? 'var(--primary)' : 'transparent'");
c = c.replace(/color: matchView === 'finished' \? '#f59e0b' : 'var\(--text-secondary\)'/g, "color: matchView === 'finished' ? '#ffffff' : 'var(--text-secondary)'");

// Specific text colors
c = c.replace(/'#fbbf24'/g, "'var(--text-primary)'");
c = c.replace(/"#fbbf24"/g, '"currentColor"');
c = c.replace(/'#f59e0b'/g, "'var(--primary)'");
c = c.replace(/"#f59e0b"/g, '"currentColor"');

// Replace literal #f59e0b that wasn't matched above
c = c.replace(/#f59e0b/g, 'var(--primary)');
c = c.replace(/#fbbf24/g, 'var(--primary)');

// General RGB replacements
c = c.replace(/rgba\(245,\s*158,\s*11,/g, 'rgba(0, 0, 0,');
c = c.replace(/rgba\(245,158,11,/g, 'rgba(0,0,0,');
c = c.replace(/rgba\(217,\s*119,\s*6,/g, 'rgba(0, 0, 0,');
c = c.replace(/rgba\(217,119,6,/g, 'rgba(0,0,0,');

fs.writeFileSync(path, c);
console.log('Fixed colors in page.js');
