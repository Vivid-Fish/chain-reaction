// platform/shell.js — Browser shell that manages game lifecycle
// Discovers games, shows menu, runs selected game, handles end/restart

import { createBrowserRunner } from './core.js';
import { createInputCapture } from './input.js';
import { createRenderer } from './renderer.js';
import { createAudioEngine } from './audio.js';

export function createShell(container, gameRegistry) {
  let currentRunner = null;
  let currentInput = null;
  let audioEngine = null;
  let canvas = null;

  function init() {
    container.innerHTML = '';
    container.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:#0a0a0f;color:#fff;font-family:monospace;overflow:hidden;';
    showMenu();
  }

  function showMenu() {
    stopCurrentGame();
    container.innerHTML = '';

    const menu = document.createElement('div');
    menu.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px;max-width:400px;width:100%;';

    const title = document.createElement('div');
    title.textContent = 'GAME LAB';
    title.style.cssText = 'font-size:24px;font-weight:bold;letter-spacing:4px;margin-bottom:20px;color:#4af;';
    menu.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.textContent = `${gameRegistry.length} games available`;
    subtitle.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:10px;';
    menu.appendChild(subtitle);

    for (const entry of gameRegistry) {
      const btn = document.createElement('button');
      btn.textContent = entry.name;
      btn.style.cssText = 'width:100%;padding:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;font-family:monospace;font-size:15px;cursor:pointer;border-radius:6px;transition:all 0.15s;';
      btn.onmouseenter = () => { btn.style.background = 'rgba(68,170,255,0.15)'; btn.style.borderColor = '#4af'; };
      btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.06)'; btn.style.borderColor = 'rgba(255,255,255,0.1)'; };
      btn.onclick = () => launchGame(entry);
      menu.appendChild(btn);
    }

    container.appendChild(menu);
  }

  function launchGame(entry) {
    stopCurrentGame();
    container.innerHTML = '';

    // Create canvas sized to fill container
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;touch-action:none;';
    container.appendChild(canvas);

    // Size canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create game module wrapper
    const gameModule = { createGame: entry.createGame };

    // Init audio on first interaction
    if (!audioEngine) {
      audioEngine = createAudioEngine();
    }
    audioEngine.resume();

    // Create runner
    currentRunner = createBrowserRunner(gameModule, canvas, {});

    // Create renderer
    const renderer = createRenderer();
    currentRunner.setRenderer(renderer);

    // Create input
    currentInput = createInputCapture(canvas);
    currentInput.attach();
    currentRunner.setInput(currentInput);

    // Audio
    currentRunner.setAudio(audioEngine);

    // End handler
    currentRunner.setOnEnd((score, reason) => {
      showEndScreen(entry, score, reason);
    });

    currentRunner.start();
  }

  function showEndScreen(entry, score, reason) {
    // Overlay on top of final frame
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);gap:16px;z-index:10;';

    const title = document.createElement('div');
    title.textContent = 'GAME OVER';
    title.style.cssText = 'font-size:28px;font-weight:bold;color:#fff;letter-spacing:3px;';
    overlay.appendChild(title);

    const scoreEl = document.createElement('div');
    scoreEl.textContent = `${score.label || 'Score'}: ${score.primary}${score.unit || ''}`;
    scoreEl.style.cssText = 'font-size:18px;color:rgba(255,255,255,0.8);';
    overlay.appendChild(scoreEl);

    const reasonEl = document.createElement('div');
    reasonEl.textContent = reason;
    reasonEl.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.4);';
    overlay.appendChild(reasonEl);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:12px;';

    const retryBtn = makeButton('RETRY', () => {
      overlay.remove();
      currentRunner.restart();
    });
    btnRow.appendChild(retryBtn);

    const menuBtn = makeButton('MENU', () => {
      overlay.remove();
      showMenu();
    });
    btnRow.appendChild(menuBtn);

    overlay.appendChild(btnRow);
    container.style.position = 'relative';
    container.appendChild(overlay);
  }

  function makeButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = 'padding:10px 24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-family:monospace;font-size:14px;cursor:pointer;border-radius:4px;';
    btn.onmouseenter = () => { btn.style.background = 'rgba(68,170,255,0.2)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.1)'; };
    btn.onclick = onClick;
    return btn;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  function stopCurrentGame() {
    if (currentRunner) {
      currentRunner.stop();
      currentRunner = null;
    }
    if (currentInput) {
      currentInput.detach();
      currentInput = null;
    }
    window.removeEventListener('resize', resizeCanvas);
  }

  return { init, showMenu, launchGame };
}
