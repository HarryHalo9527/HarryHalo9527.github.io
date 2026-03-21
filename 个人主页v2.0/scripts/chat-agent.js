/**
 * Live Agent — 杨转福的认知代理
 */
(function() {
  const AGENT_SYSTEM_PROMPT = `你是杨转福的认知代理，部署在他的个人网站上。你不是他本人，但你理解他的思维方式和专业领域。

## 关于杨转福
- 企业与个人转型推动者，AI大模型解决方案架构师
- 11年+数字化转型咨询、售前与实施经验
- 擅长：数据中台、主数据、数据治理、经营驾驶舱、智能问数、生产运营优化
- 行业经验：汽车、装备制造、消费品、政企
- 认证：TOGAF、CDGA、PMP、阿里云ACP
- 方法论：
  - FIRE模型（AI场景评估）：Frequency × Intelligence × Readiness × Effect
  - TURN模型（个人AI转型评估）：Think × Use × Ready × Next
  - 价值三角：行业方法 × 数据资产 × AI 能力
  - 路径论：先治理 → 再中台 → 后智能
- 公众号：转见未来

## 你的人格
- 语气：专业、直接、有洞察力、不废话
- 提供价值 > 推销自己
- 诚实 > 讨好（会说"这个场景可能不适合用AI"）
- 高效 > 礼貌（快速判断意图，不寒暄）

## 你的边界
- 可以代表他的公开观点和方法论
- 可以基于FIRE/TURN模型等框架做初步分析
- 不能代他做承诺、报价或做最终决策
- 不确定时说"这个需要和转福确认"

## 能力路由
- 如果用户想评估某个AI场景是否可行 → 建议使用网站上的FIRE评估器
- 如果用户想了解个人AI转型 → 建议使用TURN评估
- 如果用户想合作 → 引导了解背景后建议联系转福
- 一般问题 → 基于知识回答，简洁有力

## 回答要求
- 中文回答，简洁直接
- 每次回答控制在200字以内
- 第一句话就要给出核心观点或判断`;

  let chatHistory = [];
  let isOpen = false;
  let isSending = false;

  function init() {
    const toggle = document.getElementById('chat-toggle');
    const panel = document.getElementById('chat-panel');
    const closeBtn = document.getElementById('chat-close');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      if (isOpen && chatHistory.length === 0) {
        addMessage('agent', '你好，我是转福的认知代理。你可以问我关于AI场景评估、数字化转型、数据治理等问题，也可以直接试试网站上的FIRE评估器和TURN评估。有什么我能帮你的？');
      }
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      panel.classList.remove('open');
    });

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  function addMessage(role, content) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.textContent = content;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    if (role === 'agent') {
      chatHistory.push({ role: 'assistant', content });
    } else {
      chatHistory.push({ role: 'user', content });
    }
  }

  async function handleSend() {
    if (isSending) return;

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const message = input.value.trim();
    if (!message) return;

    isSending = true;
    input.disabled = true;
    sendBtn.disabled = true;
    input.value = '';
    addMessage('user', message);

    // Show typing indicator
    const container = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.className = 'chat-msg agent';
    typing.innerHTML = '<span class="loading-text"><span class="spinner"></span> 思考中...</span>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    try {
      if (!LLM_API.isConfigured()) {
        typing.remove();
        addMessage('agent', getFallbackResponse(message));
        return;
      }

      const history = chatHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await LLM_API.chat(AGENT_SYSTEM_PROMPT, message, {
        history: history.slice(0, -1),
        temperature: 0.5,
        maxTokens: 280,
        timeoutMs: 10000,
        retries: 1
      });

      typing.remove();
      addMessage('agent', response);
    } catch (err) {
      console.error('Chat agent error:', err);
      typing.remove();
      addMessage('agent', `${getFallbackResponse(message)}\n\n当前网络或AI代理响应较慢，我先给你一个本地回答。`);
    } finally {
      isSending = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function getFallbackResponse(message) {
    const msg = message.toLowerCase();

    if (/场景|评估|适不适合|能不能做|AI.*做/.test(msg)) {
      return '这是一个关于AI场景评估的好问题！建议你使用网站上的FIRE评估器，输入你的行业和场景描述，可以得到Frequency、Intelligence、Readiness、Effect四个维度的量化评分和落地建议。点击首页的「评估你的AI场景」即可开始。';
    }
    if (/转型|个人.*AI|学习|提升/.test(msg)) {
      return '个人AI转型是一个系统性的过程。建议你先用网站上的TURN评估做一个自测，了解自己在Think(认知)、Use(应用)、Ready(基础)、Next(行动)四个维度的就绪度，然后有针对性地提升。';
    }
    if (/数据治理|数据中台|主数据/.test(msg)) {
      return '数据治理是AI落地的基础。转福的方法论是「先治理、再中台、后智能」——数据质量不行，AI再强也白搭。如果需要深入探讨数据治理方案，建议联系转福做专业咨询。';
    }
    if (/合作|咨询|联系|价格|报价/.test(msg)) {
      return '感谢你的合作意向！转福目前可提供：AI场景评估与方案设计、数字化转型规划、数据治理方案咨询等服务。具体合作事宜需要和转福本人确认。你可以通过页面底部的联系方式联系他，或关注公众号「转见未来」。';
    }
    if (/你是谁|介绍|关于/.test(msg)) {
      return '我是杨转福的认知代理，部署在他的个人网站上。转福是一位有11年+经验的企业与个人转型推动者，专注数字化转型和AI大模型应用。你可以问我关于他的专业领域的问题，或者试试网站上的FIRE/TURN评估工具。';
    }

    return '这是一个好问题。不过为了给你更准确的回答，建议你试试网站上的互动工具——FIRE评估器可以评估企业AI场景，TURN评估可以测试个人AI转型就绪度。如果需要深度咨询，可以通过页面底部联系转福。';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
