"use strict";

/**
 * Segurança (front-end):
 * - Sem eval / new Function
 * - Validação + sanitização de quantidade
 * - Nada de inserir HTML não confiável (usamos textContent)
 */

function qs(sel, parent = document) {
  return parent.querySelector(sel);
}
function qsa(sel, parent = document) {
  return Array.from(parent.querySelectorAll(sel));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function onlyDigits(str) {
  return String(str).replace(/[^\d]/g, "");
}

function formatBRL(value) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function estimateTechnique(tipo, qty, prazo) {
  // Heurística simples (você pode ajustar depois conforme seus preços reais)
  // - Silk: melhor para quantidade alta
  // - DTF: detalhado e médio
  // - Bordado: premium / baixa a média
  // - Sublimação: esportivo (time) e dry-fit (assumido)
  if (tipo === "time" && qty >= 20) return "Sublimação ou DTF (dependendo do tecido)";
  if (qty >= 120) return "Silk (ótimo custo em volume)";
  if (qty >= 50) return "DTF ou Silk (depende do layout)";
  if (prazo === "urgente") return "DTF (agilidade e detalhes)";
  return "DTF ou Bordado (se quiser premium)";
}

function estimateRange(qty, prazo) {
  // Faixa estimada fictícia (substitua por sua regra real)
  // Base por unidade cai com volume; prazo urgente aumenta um pouco.
  const base = qty < 30 ? 42 : qty < 60 ? 34 : qty < 120 ? 29 : 25;
  const multiplier = prazo === "urgente" ? 1.12 : prazo === "programado" ? 0.98 : 1.0;

  const low = base * multiplier * qty;
  const high = (base * 1.22) * multiplier * qty;

  return { low, high };
}

function nextStep(tipo) {
  if (tipo === "empresa") return "Próximo passo: enviar logo/guia de marca + tamanhos (briefing).";
  if (tipo === "evento") return "Próximo passo: enviar arte e confirmar prazo/quantidades por tamanho.";
  if (tipo === "time") return "Próximo passo: enviar nomes/números (se houver) + referência de modelo.";
  return "Próximo passo: enviar arte/referência + tamanhos. A gente valida antes de produzir.";
}

function initYear() {
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initMenu() {
  const toggle = qs(".nav-toggle");
  const menu = qs("#menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
  toggle.classList.toggle("is-active");
  });


  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Fecha ao clicar em um link
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function initQuoteForm() {
  const form = qs("#quoteForm");
  const result = qs("#quoteResult");
  if (!form || !result) return;

  const qtyInput = qs("#quantidade");
  const tipoSel = qs("#tipo");
  const prazoSel = qs("#prazo");

  // Sanitização live: mantém somente dígitos
  qtyInput.addEventListener("input", () => {
    const clean = onlyDigits(qtyInput.value);
    qtyInput.value = clean;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Valida quantidade
    const qtyRaw = onlyDigits(qtyInput.value);
    const qty = Number(qtyRaw);

    if (!Number.isFinite(qty) || qty <= 0) {
      result.hidden = false;
      result.textContent = "Por favor, informe uma quantidade válida (ex.: 100).";
      return;
    }

    // Evita números absurdos por segurança/robustez
    const qtySafe = clamp(qty, 1, 99999);

    const tipo = String(tipoSel.value || "empresa");
    const prazo = String(prazoSel.value || "normal");

    const tech = estimateTechnique(tipo, qtySafe, prazo);
    const range = estimateRange(qtySafe, prazo);
    const step = nextStep(tipo);

    // Render seguro (sem innerHTML com conteúdo de usuário)
    result.hidden = false;

    // Monta texto com boa densidade para IA/SEO (explicativo)
    const msg =
      `✅ Pré-orçamento estimado para ${qtySafe} unidade(s) (${tipo}, prazo: ${prazo}).\n` +
      `Faixa estimada: ${formatBRL(range.low)} – ${formatBRL(range.high)}.\n` +
      `Técnica sugerida: ${tech}.\n` +
      `${step}\n` +
      `Obs.: valores finais dependem de tecido, cores, tamanho da estampa e validação da arte.`;

    result.textContent = msg;
  });
}

function initPortfolioFilters() {
  const chips = qsa(".chip");
  const works = qsa(".work");
  if (!chips.length || !works.length) return;

  function setActive(btn) {
    chips.forEach(c => c.classList.toggle("is-active", c === btn));
  }

  function applyFilter(filter) {
    works.forEach(w => {
      const tags = String(w.dataset.tags || "");
      const show = filter === "all" ? true : tags.includes(filter);
      w.style.display = show ? "" : "none";
    });
  }

  chips.forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = String(btn.dataset.filter || "all");
      setActive(btn);
      applyFilter(filter);
    });
  });
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initMenu();
  initQuoteForm();
  initPortfolioFilters();
});
