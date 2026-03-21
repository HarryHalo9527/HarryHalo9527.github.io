/**
 * FIRE Model Evaluator — Enterprise AI Scene Assessment
 */
(function() {
  let fireModel = null;

  async function loadModel() {
    if (fireModel) return fireModel;
    const resp = await fetch('data/fire-model.json');
    fireModel = await resp.json();
    return fireModel;
  }

  function initForm() {
    const panel = document.getElementById('fire-panel');
    if (!panel) return;

    loadModel().then(model => {
      const industryOptions = model.industries.map(i => `<option value="${i}">${i}</option>`).join('');
      const scaleOptions = model.scales.map(s => `<option value="${s}">${s}</option>`).join('');

      panel.querySelector('.eval-form').innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>所属行业</label>
            <select id="fire-industry"><option value="">请选择行业</option>${industryOptions}</select>
          </div>
          <div class="form-group">
            <label>企业规模</label>
            <select id="fire-scale"><option value="">请选择规模</option>${scaleOptions}</select>
          </div>
        </div>
        <div class="form-group">
          <label>AI 应用场景描述</label>
          <textarea id="fire-scene" placeholder="请描述你想用AI实现的业务场景，例如：&#10;我们是一家制造企业，想做设备故障知识库问答，让一线工人遇到设备问题时能快速查到解决方案...&#10;&#10;越具体，评估越准确。"></textarea>
        </div>
        <div class="form-group">
          <label>数据与系统现状（选填）</label>
          <textarea id="fire-data" rows="3" placeholder="例如：已有ERP系统，设备维修记录在Excel中，约5000条历史数据..."></textarea>
        </div>
        <div style="text-align:center; margin-top:.5rem;">
          <button class="btn btn-primary" id="fire-submit">
            <span class="btn-text">开始 FIRE 评估</span>
            <span class="btn-loading loading-text" style="display:none;"><span class="spinner"></span> AI 分析中...</span>
          </button>
        </div>
        <p style="text-align:center; font-size:.75rem; color:var(--text-muted); margin-top:.5rem;">
          基于 FIRE 模型 · 由 AI 提供智能分析
        </p>
      `;

      document.getElementById('fire-submit').addEventListener('click', handleSubmit);
    });
  }

  async function handleSubmit() {
    const industry = document.getElementById('fire-industry').value;
    const scale = document.getElementById('fire-scale').value;
    const scene = document.getElementById('fire-scene').value.trim();
    const dataStatus = document.getElementById('fire-data').value.trim();

    if (!industry || !scale || !scene) {
      alert('请填写行业、企业规模和场景描述');
      return;
    }

    const btn = document.getElementById('fire-submit');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';

    try {
      const model = await loadModel();

      if (!LLM_API.isConfigured()) {
        // Fallback: use rule-based scoring
        const result = ruleBasedScoring(industry, scene, dataStatus);
        renderResult(model, result);
        return;
      }

      const userMsg = `行业：${industry}\n企业规模：${scale}\n\n业务场景：${scene}${dataStatus ? '\n\n数据与系统现状：' + dataStatus : ''}`;

      const response = await LLM_API.chat(model.systemPrompt, userMsg, {
        temperature: 0.3,
        maxTokens: 1500
      });

      const result = LLM_API.parseJSON(response);
      renderResult(model, result);
    } catch (err) {
      console.error('FIRE evaluation error:', err);
      // Fallback to rule-based
      const model = await loadModel();
      const result = ruleBasedScoring(industry, scene, dataStatus);
      renderResult(model, result);
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  function ruleBasedScoring(industry, scene, dataStatus) {
    // Simple heuristic scoring as fallback
    const sceneLower = scene.toLowerCase();
    let F = 3, I = 3, R = 3, E = 3;

    // Frequency heuristics
    if (/客服|问答|查询|搜索|推荐|实时/.test(scene)) F = 5;
    else if (/日报|工单|审核|分类|巡检/.test(scene)) F = 4;
    else if (/报告|文档|方案|分析/.test(scene)) F = 3;
    else if (/规划|战略|年度/.test(scene)) F = 2;

    // Intelligence heuristics
    if (/问答|摘要|翻译|分类|文案|总结/.test(scene)) I = 5;
    else if (/报告|方案|审查|检索|生成/.test(scene)) I = 4;
    else if (/预测|推荐|分析/.test(scene)) I = 3;
    else if (/控制|精密|实时计算/.test(scene)) I = 2;

    // Readiness heuristics
    if (dataStatus) {
      if (/充足|完整|API|数据湖|数据中台/.test(dataStatus)) R = 5;
      else if (/系统|数据库|结构化/.test(dataStatus)) R = 4;
      else if (/Excel|文档|部分/.test(dataStatus)) R = 3;
      else if (/少|缺|无|没有/.test(dataStatus)) R = 2;
    }

    // Effect heuristics
    if (/成本|节省|效率|工时|金额|ROI/.test(scene)) E = 4;
    else if (/质量|满意度|准确率/.test(scene)) E = 4;
    else if (/体验|服务/.test(scene)) E = 3;

    const total = F + I + R + E;
    let priority = '条件培育';
    if (total >= 16) priority = '立即启动';
    else if (total >= 12) priority = '规划推进';
    else if (total < 8) priority = '暂时搁置';

    const weaknesses = [];
    if (F <= 2) weaknesses.push('频次偏低：考虑扩大场景覆盖范围或合并相似场景');
    if (I <= 2) weaknesses.push('AI适配度低：尝试拆解为子任务，找出AI可介入的环节');
    if (R <= 2) weaknesses.push('数据就绪度不足：建议先做数据治理和基础建设');
    if (E <= 2) weaknesses.push('效果难量化：设计A/B对比实验，明确衡量指标');

    return {
      scores: { F, I, R, E },
      reasons: {
        F: `基于场景描述推断的业务频次评分`,
        I: `基于场景特征评估的AI适配程度`,
        R: `基于数据现状描述的就绪度评估`,
        E: `基于场景价值预估的可量化程度`
      },
      total,
      priority,
      weaknesses,
      recommendations: [
        '建议从最高频、最刚需的子场景切入，快速验证价值',
        '先跑MVP验证效果，用数据说话争取更多资源',
        '关注数据质量和标注规范，这是AI效果的基础'
      ],
      summary: `该场景综合评分${total}/20，建议${priority}。${weaknesses.length > 0 ? '需关注：' + weaknesses[0] : '各维度表现均衡。'}（注：此为规则引擎评估，接入AI后将提供更精准的分析。）`
    };
  }

  function renderResult(model, result) {
    const resultPanel = document.getElementById('fire-result');
    if (!resultPanel) return;

    const dims = model.dimensions;
    const levelColor = result.total >= 16 ? 'green' : result.total >= 12 ? 'blue' : result.total >= 8 ? 'yellow' : 'red';
    const levelEmoji = result.total >= 16 ? '🟢' : result.total >= 12 ? '🔵' : result.total >= 8 ? '🟡' : '🔴';

    const dimColors = { F: '#f87171', I: '#fbbf24', R: '#34d399', E: '#60a5fa' };

    // Render radar chart
    const radarContainer = resultPanel.querySelector('.result-radar');
    const chart = new RadarChart(radarContainer, {
      size: 240,
      colors: { grid: 'rgba(42,53,85,0.6)', fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6', text: '#94a3b8', dot: '#3b82f6', score: '#e2e8f0' }
    });
    chart.render(dims, result.scores);

    // Score header
    resultPanel.querySelector('.result-score').textContent = result.total;
    resultPanel.querySelector('.result-score-label').textContent = '/ 20 分';
    const levelEl = resultPanel.querySelector('.result-level');
    levelEl.textContent = `${levelEmoji} ${result.priority}`;
    levelEl.className = `result-level level-${levelColor}`;

    // Dimension scores
    const dimList = resultPanel.querySelector('.result-dim-list');
    dimList.innerHTML = dims.map(d => {
      const score = result.scores[d.key];
      const isWeak = score <= 2;
      return `<div class="result-dim">
        <div class="dim-letter" style="background:${dimColors[d.key]}22; color:${dimColors[d.key]}">${d.key}</div>
        <div class="dim-name">${d.label}${isWeak ? ' ⚠️' : ''}</div>
        <div class="dim-score" style="color:${dimColors[d.key]}">${score}/5</div>
      </div>`;
    }).join('');

    // Analysis
    const analysis = resultPanel.querySelector('.result-analysis');
    analysis.innerHTML = `
      <h4>评估分析</h4>
      <p>${result.summary}</p>
      ${result.reasons ? `
        <h4 style="margin-top:1rem;">各维度评分理由</h4>
        <ul>${dims.map(d => `<li><strong>${d.key} - ${d.label}：</strong>${result.reasons[d.key]}</li>`).join('')}</ul>
      ` : ''}
      ${result.weaknesses && result.weaknesses.length > 0 ? `
        <h4 style="margin-top:1rem;">短板补齐建议</h4>
        <ul>${result.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
      ` : ''}
      ${result.recommendations ? `
        <h4 style="margin-top:1rem;">落地路径建议</h4>
        <ul>${result.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      ` : ''}
    `;

    // CTA
    const cta = resultPanel.querySelector('.result-cta');
    cta.innerHTML = `
      <p>想要更深入的场景评估和定制落地方案？</p>
      <a href="#contact" class="btn btn-primary">联系杨转福获取专业咨询</a>
    `;

    resultPanel.classList.add('active');
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', initForm);
  window.FireEvaluator = { initForm, loadModel };
})();
