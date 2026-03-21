/**
 * SVG Radar Chart renderer
 * Renders a 4-dimension radar chart for FIRE / TURN models
 */
class RadarChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.size = options.size || 240;
    this.maxScore = options.maxScore || 5;
    this.colors = options.colors || {
      grid: 'rgba(42,53,85,0.6)',
      fill: 'rgba(59,130,246,0.15)',
      stroke: '#3b82f6',
      text: '#94a3b8',
      dot: '#3b82f6',
      score: '#e2e8f0'
    };
  }

  render(dimensions, scores) {
    const cx = this.size / 2;
    const cy = this.size / 2;
    const radius = this.size / 2 - 40;
    const n = dimensions.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    const getPoint = (i, value) => {
      const angle = startAngle + i * angleStep;
      const r = (value / this.maxScore) * radius;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    };

    let svg = `<svg viewBox="0 0 ${this.size} ${this.size}" width="${this.size}" height="${this.size}" xmlns="http://www.w3.org/2000/svg">`;

    // Grid rings
    for (let level = 1; level <= this.maxScore; level++) {
      const r = (level / this.maxScore) * radius;
      const points = [];
      for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      svg += `<polygon points="${points.join(' ')}" fill="none" stroke="${this.colors.grid}" stroke-width="1"/>`;
    }

    // Axis lines
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, this.maxScore);
      svg += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${this.colors.grid}" stroke-width="1"/>`;
    }

    // Data polygon
    const dataPoints = dimensions.map((d, i) => {
      const score = scores[d.key] || 0;
      const p = getPoint(i, score);
      return `${p.x},${p.y}`;
    });
    svg += `<polygon points="${dataPoints.join(' ')}" fill="${this.colors.fill}" stroke="${this.colors.stroke}" stroke-width="2"/>`;

    // Data dots + Labels
    dimensions.forEach((d, i) => {
      const score = scores[d.key] || 0;
      const p = getPoint(i, score);
      svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${this.colors.dot}"/>`;

      // Label
      const labelP = getPoint(i, this.maxScore + 1.2);
      const anchor = labelP.x < cx - 5 ? 'end' : labelP.x > cx + 5 ? 'start' : 'middle';
      svg += `<text x="${labelP.x}" y="${labelP.y}" text-anchor="${anchor}" dominant-baseline="middle" fill="${this.colors.text}" font-size="12" font-weight="600">${d.key}</text>`;

      // Score
      const scoreP = getPoint(i, score + 0.6);
      svg += `<text x="${scoreP.x}" y="${scoreP.y}" text-anchor="middle" dominant-baseline="middle" fill="${this.colors.score}" font-size="11" font-weight="700" font-family="'JetBrains Mono',monospace">${score}</text>`;
    });

    svg += '</svg>';
    this.container.innerHTML = svg;
  }
}

window.RadarChart = RadarChart;
