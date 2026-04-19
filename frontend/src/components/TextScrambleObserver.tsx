import { useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#₹$%&';
const RADIUS   = 120;   // px — scramble characters within this radius
const DURATION = 400;   // ms to fully resolve a character

/** Wrap all text nodes in a container into individual <span> character cells */
function wrapTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip: already wrapped, inputs, script, style, code blocks
      if (parent.classList.contains('cs-char')) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT','STYLE','INPUT','TEXTAREA','CODE','PRE','SVG'].includes(parent.tagName))
        return NodeFilter.FILTER_REJECT;
      if ((node.nodeValue || '').trim().length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let cur;
  while ((cur = walker.nextNode())) nodes.push(cur as Text);

  nodes.forEach(textNode => {
    const text = textNode.nodeValue || '';
    const frag = document.createDocumentFragment();
    [...text].forEach(ch => {
      if (ch === ' ' || ch === '\n') {
        frag.appendChild(document.createTextNode(ch));
        return;
      }
      const span = document.createElement('span');
      span.className  = 'cs-char';
      span.dataset.ch  = ch;
      span.textContent = ch;
      span.style.cssText = 'display:inline-block;transition:none;';
      frag.appendChild(span);
    });
    textNode.parentNode?.replaceChild(frag, textNode);
  });
}

/** State per character span */
interface CharState {
  el: HTMLSpanElement;
  orig: string;
  timer: ReturnType<typeof setTimeout> | null;
  scrambling: boolean;
}

export default function TextScrambleObserver() {
  useEffect(() => {
    const charMap = new WeakMap<HTMLSpanElement, CharState>();

    /** Kick off scramble→resolve for one element */
    const startScramble = (el: HTMLSpanElement) => {
      let state = charMap.get(el);
      if (!state) {
        const orig = el.dataset.ch || el.textContent || '';
        state = { el, orig, timer: null, scrambling: false };
        charMap.set(el, state);
      }
      if (state.scrambling) return;
      state.scrambling = true;

      const orig = state.orig;
      let elapsed  = 0;
      const step   = 40; // ms between scramble frames

      const tick = () => {
        elapsed += step;
        if (elapsed < DURATION) {
          // Random scramble char
          el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          el.style.color = 'rgba(232,184,74,0.85)';
          state!.timer = setTimeout(tick, step);
        } else {
          // Resolve to original
          el.textContent = orig;
          el.style.color = '';
          state!.scrambling = false;
          state!.timer = null;
        }
      };

      state.timer = setTimeout(tick, 0);
    };

    /** Cancel scramble for an element (restores original) */
    const stopScramble = (el: HTMLSpanElement) => {
      const state = charMap.get(el);
      if (!state) return;
      if (state.timer) clearTimeout(state.timer);
      el.textContent = state.orig;
      el.style.color = '';
      state.scrambling = false;
      state.timer = null;
    };

    // Targets: only meaningful text containers, not nav/sidebar/buttons
    const SELECTORS = [
      '.main-content h1', '.main-content h2', '.main-content h3',
      '.main-content p', '.main-content .stat-val',
      '.main-content .card h3', '.main-content .splash-tagline',
    ].join(',');

    let wrapped = false;

    const wrapAll = () => {
      if (wrapped) return;
      const targets = document.querySelectorAll<HTMLElement>(SELECTORS);
      if (targets.length === 0) return;
      targets.forEach(el => wrapTextNodes(el));
      wrapped = true;
    };

    // Delay wrap until DOM is populated
    const initTimer = setTimeout(wrapAll, 1500);

    const activeChars = new Set<HTMLSpanElement>();

    const onMouseMove = (e: MouseEvent) => {
      if (!wrapped) { wrapAll(); return; }

      const mx = e.clientX, my = e.clientY;
      const chars = document.querySelectorAll<HTMLSpanElement>('.cs-char');

      chars.forEach(el => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dist = Math.hypot(mx - cx, my - cy);

        if (dist < RADIUS) {
          if (!activeChars.has(el)) {
            activeChars.add(el);
            startScramble(el);
          }
        } else {
          if (activeChars.has(el)) {
            activeChars.delete(el);
            stopScramble(el);
          }
        }
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return null;
}
