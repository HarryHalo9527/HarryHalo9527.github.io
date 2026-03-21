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
      addMessage('agent', `${getFallbackResponse(message)}\n\n注：这条先基于站内知识回答，云端模型这次没连上。`);
    } finally {
      isSending = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function getFallbackResponse(message) {
    const msg = message.toLowerCase();

    if (/擅长|专长|能做什么|会什么|做什么/.test(msg)) {
      return '转福更擅长三类事：一是企业AI场景评估与落地路径设计，二是数据治理/数据中台这类数字化基础建设，三是把业务问题翻译成可执行的方案与项目。简单说，他不是只讲模型的人，更偏“业务+数据+AI落地”的组合型顾问。';
    }
    if (/经历|背景|简历|做过什么|在哪些行业/.test(msg)) {
      return '转福有 11 年以上数字化转型相关经验，做过咨询、方案、售前和实施，行业覆盖汽车、装备制造、消费品和政企。能力重心在企业架构、数据治理、经营分析和AI场景落地，不是纯技术研发路线，而是偏解决方案和转型推进。';
    }
    if (/fire/.test(msg) || /场景评估|适不适合|能不能做|值不值得做/.test(msg)) {
      return '如果你在判断一个AI场景值不值得做，转福常用 FIRE 模型：看频次、AI适配度、数据就绪度、效果可衡量性。高频、可标准化、有一定数据基础、能量化价值的场景，通常更适合优先落地。你也可以把具体场景发给我，我可以先按这四个维度帮你做个初判。';
    }
    if (/turn/.test(msg) || /转型|个人.*ai|学习|提升|怎么开始/.test(msg)) {
      return '如果是个人AI转型，转福更看四件事：你是否真正理解AI边界，是否已经在工作里稳定使用，是否具备数字化基础，是否已经形成下一步行动。很多人卡住不是不会用工具，而是没有把AI纳入日常工作流。';
    }
    if (/场景|评估|适不适合|能不能做|AI.*做/.test(msg)) {
      return '判断AI场景，不要先问“模型强不强”，而要先问“业务痛点够不够刚需”。转福通常会先看这个场景是不是高频重复、是不是依赖文本/知识/判断、数据是不是够用、最后效果能不能量化。如果你愿意，可以直接把行业、场景、现有数据情况发出来，我按 FIRE 逻辑帮你快速判断。';
    }
    if (/数据治理|数据中台|主数据/.test(msg)) {
      return '转福对数据治理的核心判断是：它不是技术项目，而是组织治理项目。先把数据标准、口径、责任和质量机制立住，再谈中台和AI，不然最后只会变成“垃圾进，垃圾出”。他的路径论就是“先治理，再中台，后智能”。';
    }
    if (/合作|咨询|联系|价格|报价/.test(msg)) {
      return '如果你是企业侧，比较适合找转福讨论三类合作：AI场景梳理与优先级判断、数字化转型规划、数据治理/中台方案设计。价格和排期这类信息需要他本人确认，但你可以先把行业、问题和目标发清楚，沟通会高效很多。';
    }
    if (/你是谁|介绍|关于/.test(msg)) {
      return '我是转福的认知代理，不是他本人，但会尽量用他的公开方法论和工作方式回答问题。你可以把我理解成一个“先帮你判断方向、再决定要不要深聊”的前置顾问，尤其适合聊AI场景、数据治理和转型路径。';
    }

    return '这个问题可以聊，但我先给你一个转福式的简化判断：先定义真实业务问题，再看有没有数据基础，最后再决定要不要上AI。很多项目失败，不是模型不行，而是问题定义错了或者路径走反了。你如果愿意，可以把你的具体场景补一句，我会直接给判断，不绕弯子。';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
