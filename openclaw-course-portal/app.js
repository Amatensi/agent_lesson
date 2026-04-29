const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const sections = qsa(".course-section");
const topNavLinks = qsa(".nav-links a");
const bottomLinks = qsa(".bottom-jump a");
const pageIndicator = qs("#page-indicator");
const prevPage = qs("#prev-page");
const nextPage = qs("#next-page");
let currentSectionIndex = 0;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

qsa(".reveal").forEach((element) => revealObserver.observe(element));

function initHeroCanvas() {
  const canvas = qs("#hero-canvas");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let points = [];
  let frame = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = Array.from({ length: Math.min(62, Math.floor(width / 22)) }, (_, index) => ({
      x: (index * 137) % width,
      y: (index * 83) % height,
      vx: (index % 2 === 0 ? 1 : -1) * (0.16 + (index % 5) * 0.02),
      vy: (index % 3 === 0 ? 1 : -1) * (0.12 + (index % 7) * 0.016)
    }));
  }

  function draw() {
    frame += 1;
    ctx.clearRect(0, 0, width, height);

    points.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < -20) point.x = width + 20;
      if (point.x > width + 20) point.x = -20;
      if (point.y < -20) point.y = height + 20;
      if (point.y > height + 20) point.y = -20;
    });

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 145) {
          const alpha = (1 - distance / 145) * 0.2;
          ctx.strokeStyle = `rgba(15, 143, 111, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    points.forEach((point, index) => {
      const pulse = 1.8 + Math.sin(frame / 42 + index) * 0.75;
      ctx.fillStyle = index % 5 === 0 ? "rgba(211, 95, 69, 0.34)" : "rgba(15, 143, 111, 0.34)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

function updateActivePage(index) {
  currentSectionIndex = Math.max(0, Math.min(index, sections.length - 1));
  const activeSection = sections[currentSectionIndex];
  const activeId = `#${activeSection.id}`;

  topNavLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeId);
  });

  bottomLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeId);
  });

  if (pageIndicator) {
    pageIndicator.textContent = `第 ${currentSectionIndex + 1} / ${sections.length} 页`;
  }

  if (prevPage) prevPage.disabled = currentSectionIndex === 0;
  if (nextPage) nextPage.disabled = currentSectionIndex === sections.length - 1;
}

function scrollToPage(index) {
  const target = sections[Math.max(0, Math.min(index, sections.length - 1))];
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = sections.indexOf(visible.target);
    if (index >= 0) updateActivePage(index);
  },
  { rootMargin: "-42% 0px -46% 0px", threshold: [0.1, 0.25, 0.5] }
);

sections.forEach((section) => sectionObserver.observe(section));

prevPage?.addEventListener("click", () => scrollToPage(currentSectionIndex - 1));
nextPage?.addEventListener("click", () => scrollToPage(currentSectionIndex + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") scrollToPage(currentSectionIndex - 1);
  if (event.key === "ArrowRight") scrollToPage(currentSectionIndex + 1);
});

function initNeuralDemo() {
  const runButton = qs("#run-neural");
  const explanation = qs("#nn-explanation");
  if (!runButton || !explanation) return;

  const layers = {
    input: ["#nn-input-1", "#nn-input-2", "#nn-input-3"],
    weight: ["#nn-weight-1", "#nn-weight-2", "#nn-weight-3"],
    active: ["#nn-active-1", "#nn-active-2"],
    output: ["#nn-output-1"]
  };

  const copy = [
    {
      key: "input",
      title: "输入层",
      text: "输入层接收原始数据：“满血苹果手机”。"
    },
    {
      key: "weight",
      title: "权重层",
      text: "权重层对输入进行加权处理，学习词与词之间的关联。"
    },
    {
      key: "active",
      title: "激活层",
      text: "激活层引入非线性变换，提取更深层的语义特征。"
    },
    {
      key: "output",
      title: "输出层",
      text: "输出层产生最终结果：理解为“一部功能强大的智能手机”。"
    }
  ];

  let step = 0;

  function clearNodes() {
    Object.values(layers).flat().forEach((selector) => qs(selector)?.classList.remove("active"));
  }

  runButton.addEventListener("click", () => {
    if (step >= copy.length) {
      step = 0;
      clearNodes();
      explanation.innerHTML = "<strong>点击下方按钮开始演示</strong><p>神经网络由输入层、权重层、激活层和输出层组成。输入层接收原始数据，权重层进行加权处理，激活层引入非线性变换，输出层产生最终结果。</p>";
      runButton.textContent = "运行神经网络演示";
      return;
    }

    const current = copy[step];
    clearNodes();
    layers[current.key].forEach((selector) => qs(selector)?.classList.add("active"));
    explanation.innerHTML = `<strong>${current.title}</strong><p>${current.text}</p>`;
    step += 1;
    runButton.textContent = step >= copy.length ? "重新演示" : "继续演示";
  });
}

function initAttentionDemo() {
  const demo = qs("#attention-demo");
  if (!demo) return;
  const result = qs("#attention-result");
  const words = qsa(".attention-word", demo);

  words.forEach((word) => {
    word.addEventListener("click", () => {
      words.forEach((item) => item.classList.remove("target", "connected"));
      word.classList.add("target");

      if (word.dataset.pronoun !== undefined) {
        qsa(".attention-source", demo).forEach((item) => item.classList.add("connected"));
        result.textContent = "“它” 指代的是：苹果手机";
      } else {
        result.textContent = `当前关注词：“${word.textContent.trim()}”。点击“它”可以看到指代关系。`;
      }
    });
  });
}

function initBookingDemo() {
  const manualSteps = qsa(".manual-step");
  const agentSteps = qsa(".agent-step");
  const manualNext = qs("#manual-next");
  const manualReset = qs("#manual-reset");
  const agentRun = qs("#agent-run");
  const agentReset = qs("#agent-reset");
  let manualIndex = 0;
  let agentIndex = 0;
  let agentTimer = null;

  function showManual(index) {
    manualIndex = Math.max(0, Math.min(index, manualSteps.length - 1));
    manualSteps.forEach((step, stepIndex) => {
      step.classList.toggle("active", stepIndex === manualIndex);
    });
  }

  function showAgent(index) {
    agentIndex = Math.max(0, Math.min(index, agentSteps.length - 1));
    agentSteps.forEach((step, stepIndex) => {
      step.classList.toggle("active", stepIndex === agentIndex);
    });
  }

  manualNext?.addEventListener("click", () => showManual((manualIndex + 1) % manualSteps.length));
  manualReset?.addEventListener("click", () => showManual(0));

  agentReset?.addEventListener("click", () => {
    window.clearInterval(agentTimer);
    showAgent(0);
  });

  agentRun?.addEventListener("click", () => {
    window.clearInterval(agentTimer);
    showAgent(0);
    agentTimer = window.setInterval(() => {
      if (agentIndex >= agentSteps.length - 1) {
        window.clearInterval(agentTimer);
        return;
      }
      showAgent(agentIndex + 1);
    }, 1100);
  });
}

function initRagDemo() {
  const runButton = qs("#run-rag");
  if (!runButton) return;
  const steps = qsa(".rag-step");
  const output = qs("#rag-output");
  const answer = qs("#rag-answer");
  const contents = [
    "小明是一位律师，我想了解他的专业领域。",
    "将问题转换为向量表示，保留“律师”“专业领域”“小明”等语义特征。",
    "在知识库中检索：找到相关文档，提到小明专精于婚姻民事诉讼相关领域。",
    "将检索到的知识注入 Prompt：根据参考资料回答，并限制答案边界。",
    "基于检索到的知识生成答案。"
  ];
  let running = false;

  function reset() {
    steps.forEach((step, index) => {
      step.classList.remove("active");
      const content = qs(`#rag-c${index}`);
      if (content) content.textContent = ["等待输入", "等待处理", "等待检索", "等待注入", "等待生成"][index];
    });
    output?.classList.remove("active");
    if (answer) answer.textContent = "等待 RAG 演示运行。";
  }

  runButton.addEventListener("click", async () => {
    if (running) return;
    running = true;
    reset();
    runButton.textContent = "演示运行中";

    for (let index = 0; index < steps.length; index += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 720));
      steps[index].classList.add("active");
      const content = qs(`#rag-c${index}`);
      if (content) content.textContent = contents[index];
    }

    output?.classList.add("active");
    if (answer) {
      answer.textContent = "小明是我所的员工，他专精于婚姻民事诉讼相关领域，在这一领域有丰富经验。";
    }
    runButton.textContent = "重新运行RAG演示";
    running = false;
  });
}

function initScrollProgress() {
  const header = qs(".site-header");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 10);
  });
}

initHeroCanvas();
updateActivePage(0);
initScrollProgress();
initNeuralDemo();
initAttentionDemo();
initBookingDemo();
initRagDemo();
