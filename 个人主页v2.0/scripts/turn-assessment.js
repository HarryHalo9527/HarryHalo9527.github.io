/**
 * TURN Model Assessment — Personal AI Transformation Readiness
 */
(function() {
  let turnModel = null;
  let currentQuestion = 0;
  let answers = {};

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadModel() {
    if (turnModel) return turnModel;
    const resp = await fetch('data/turn-model.json');
    turnModel = await resp.json();
    return turnModel;
  }

  function initAssessment() {
    const panel = document.getElementById('turn-panel');
    if (!panel) return;

    panel.querySelector('.eval-form').innerHTML = `
      <div class="q-progress">
        <div class="q-progress-bar"><div class="q-progress-fill" id="turn-progress" style="width:0%"></div></div>
        <div class="q-progress-text" id="turn-progress-text">0 / 10</div>
      </div>
      <div id="turn-questions"></div>
      <div style="text-align:center; margin-top:1rem;">
        <button class="btn btn-primary" id="turn-submit" style="display:none;">
          <span class="btn-text">查看我的评估报告</span>
          <span class="btn-loading loading-text" style="display:none;"><span class="spinner"></span> 生成报告中...</span>
        </button>
      </div>
    `;

    loadModel().then(model => {
      currentQuestion = 0;
      answers = {};
      renderQuestion(model);
    });
  }

  function renderQuestion(model) {
    const container = document.getElementById('turn-questions');
    const total = model.questions.length;

    if (currentQuestion >= total) {
      document.getElementById('turn-submit').style.display = 'inline-flex';
      document.getElementById('turn-submit').onclick = () => handleSubmit(model);
      return;
    }

    const q = model.questions[currentQuestion];
    const dimInfo = model.dimensions.find(d => d.key === q.dim);
    const dimColors = { T: '#a78bfa', U: '#22d3ee', R: '#34d399', N: '#fbbf24' };

    container.innerHTML = `
      <div class="question-card">
        <div class="q-dim" style="color:${dimColors[q.dim]}">${q.dim} · ${dimInfo.label}</div>
        <div class="q-text">${q.text}</div>
        <div class="q-options">
          ${q.options.map((opt, i) => `
            <label class="q-option" data-index="${i}" data-score="${opt.score}">
              ${opt.text}
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Update progress
    const progress = ((currentQuestion) / total) * 100;
    document.getElementById('turn-progress').style.width = progress + '%';
    document.getElementById('turn-progress-text').textContent = `${currentQuestion} / ${total}`;

    // Bind option clicks
    container.querySelectorAll('.q-option').forEach(opt => {
      opt.addEventListener('click', function() {
        if (container.dataset.locked === 'true') return;
        container.dataset.locked = 'true';
        container.querySelectorAll('.q-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');

        const score = parseInt(this.dataset.score);
        answers[currentQuestion] = { dim: q.dim, score };

        setTimeout(() => {
          currentQuestion++;
          container.dataset.locked = 'false';
          renderQuestion(model);
        }, 300);
      });
    });
  }

  function calculateScores() {
    const dimScores = {};
    const groupedScores = { T: [], U: [], R: [], N: [] };

    Object.values(answers).forEach(answer => {
      if (answer && groupedScores[answer.dim]) {
        groupedScores[answer.dim].push(answer.score);
      }
    });

    for (const [dim, scores] of Object.entries(groupedScores)) {
      if (scores.length === 0) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      dimScores[dim] = Math.round(avg);
    }
    // Ensure all dims have scores
    ['T', 'U', 'R', 'N'].forEach(d => {
      if (!dimScores[d]) dimScores[d] = 1;
    });
    return dimScores;
  }

  async function handleSubmit(model) {
    const btn = document.getElementById('turn-submit');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';

    // Update progress to 100%
    document.getElementById('turn-progress').style.width = '100%';
    document.getElementById('turn-progress-text').textContent = `${model.questions.length} / ${model.questions.length}`;

    const scores = calculateScores();
    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    try {
      let analysis = null;

      if (LLM_API.isConfigured()) {
        const userMsg = `用户TURN评估结果：\nT(Think AI认知): ${scores.T}/5\nU(Use AI应用): ${scores.U}/5\nR(Ready 数字化基础): ${scores.R}/5\nN(Next 行动力): ${scores.N}/5\n总分: ${total}/20`;

        const response = await LLM_API.chat(model.systemPrompt, userMsg, {
          temperature: 0.5,
          maxTokens: 800,
          timeoutMs: 10000,
          retries: 1
        });
        analysis = LLM_API.parseJSON(response);
      }

      renderResult(model, scores, total, analysis);
    } catch (err) {
      console.error('TURN analysis error:', err);
      renderResult(model, scores, total, null);
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  function renderResult(model, scores, total, analysis) {
    const resultPanel = document.getElementById('turn-result');
    if (!resultPanel) return;

    const level = model.levels.find(l => total >= l.range[0] && total <= l.range[1]) || model.levels[model.levels.length - 1];
    const dimColors = { T: '#a78bfa', U: '#22d3ee', R: '#34d399', N: '#fbbf24' };

    // Render radar chart
    const radarContainer = resultPanel.querySelector('.result-radar');
    const chart = new RadarChart(radarContainer, {
      size: 240,
      colors: { grid: 'rgba(42,53,85,0.6)', fill: 'rgba(139,92,246,0.15)', stroke: '#8b5cf6', text: '#94a3b8', dot: '#8b5cf6', score: '#e2e8f0' }
    });
    chart.render(model.dimensions, scores);

    // Score header
    resultPanel.querySelector('.result-score').textContent = total;
    resultPanel.querySelector('.result-score-label').textContent = '/ 20 分';
    const levelEl = resultPanel.querySelector('.result-level');
    levelEl.textContent = level.label;
    levelEl.className = `result-level level-${level.color}`;

    // Dimension scores
    const dimList = resultPanel.querySelector('.result-dim-list');
    dimList.innerHTML = model.dimensions.map(d => {
      const score = scores[d.key];
      const isWeak = score <= 2;
      return `<div class="result-dim">
        <div class="dim-letter" style="background:${dimColors[d.key]}22; color:${dimColors[d.key]}">${d.key}</div>
        <div class="dim-name">${d.label}${isWeak ? ' ⚠️' : ''}</div>
        <div class="dim-score" style="color:${dimColors[d.key]}">${score}/5</div>
      </div>`;
    }).join('');

    // Analysis
    const analysisEl = resultPanel.querySelector('.result-analysis');

    if (analysis) {
      const safeStrengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
      const safeWeaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
      const safeActionPlan = Array.isArray(analysis.actionPlan) ? analysis.actionPlan : [];
      analysisEl.innerHTML = `
        <h4>个性化分析</h4>
        <p>${escapeHtml(analysis.summary)}</p>
        ${safeStrengths.length > 0 ? `<h4 style="margin-top:1rem;">你的优势</h4><ul>${safeStrengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
        ${safeWeaknesses.length > 0 ? `<h4 style="margin-top:1rem;">需要提升的方面</h4><ul>${safeWeaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>` : ''}
        ${safeActionPlan.length > 0 ? `<h4 style="margin-top:1rem;">行动建议</h4><ul>${safeActionPlan.map((a, i) => `<li><strong>第${i+1}步：</strong>${escapeHtml(a)}</li>`).join('')}</ul>` : ''}
      `;
    } else {
      // Fallback analysis
      const weakDims = model.dimensions.filter(d => scores[d.key] <= 2);
      const strongDims = model.dimensions.filter(d => scores[d.key] >= 4);
      analysisEl.innerHTML = `
        <h4>评估分析</h4>
        <p>${level.desc}。你的AI转型就绪度总分为${total}/20分，处于「${level.label}」阶段。</p>
        ${strongDims.length > 0 ? `<h4 style="margin-top:1rem;">你的优势</h4><ul>${strongDims.map(d => `<li><strong>${d.label}：</strong>${d.oneLiner}</li>`).join('')}</ul>` : ''}
        ${weakDims.length > 0 ? `<h4 style="margin-top:1rem;">需要提升</h4><ul>${weakDims.map(d => `<li><strong>${d.label}：</strong>${d.oneLiner}</li>`).join('')}</ul>` : ''}
        <p style="margin-top:.75rem; font-size:.8rem; color:var(--text-muted);">（接入AI后将提供更详细的个性化分析报告）</p>
      `;
    }

    // CTA based on level
    const cta = resultPanel.querySelector('.result-cta');
    cta.innerHTML = `
      <p>${level.cta}</p>
      ${level.level === 'observer' || level.level === 'risk' ?
        `<a href="#contact" class="btn btn-primary">预约 AI 转型咨询</a>` :
        `<a href="#contact" class="btn btn-secondary">关注「转见未来」</a>`
      }
    `;

    resultPanel.classList.add('active');
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('DOMContentLoaded', initAssessment);
  window.TurnAssessment = { initAssessment, loadModel };
})();
