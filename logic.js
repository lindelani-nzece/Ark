import { BridgeStorage } from './storage.js';

export class ArcBridgeEngine {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.proxyPrefix = ''; // Example: 'https://YOUR-WORKER.workers.dev/?url='
    this.state = {
      isSplit: false,
      splitRatio: 50,
      sidebarOpen: true,
      activePane: 1,
      pane1RawUrl: 'https://example.com',
      pane2RawUrl: 'https://en.wikipedia.org/wiki/Main_Page',
      pane1Url: 'https://example.com',
      pane2Url: 'https://en.wikipedia.org/wiki/Main_Page',
      pinnedSpaces: [
        { title: 'Example', url: 'https://example.com' },
        { title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' }
      ]
    };
  }

  async init() {
    const saved = await BridgeStorage.get('browser_state');
    if (saved) {
      this.state = { ...this.state, ...saved };
      this.state.pane1Url = this.applyProxy(this.state.pane1RawUrl);
      this.state.pane2Url = this.applyProxy(this.state.pane2RawUrl);
    }
    this.emit();
  }

  emit() {
    BridgeStorage.set('browser_state', this.state);
    this.onStateChange({ ...this.state });
  }

  normalizeTargetUrl(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return null;
    if (!trimmed.includes('.') || trimmed.includes(' ')) {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  applyProxy(rawUrl) {
    if (!this.proxyPrefix) return rawUrl;
    return `${this.proxyPrefix}${encodeURIComponent(rawUrl)}`;
  }

  getRawUrl(paneNum) {
    return paneNum === 1 ? this.state.pane1RawUrl : this.state.pane2RawUrl;
  }

  navigate(rawInput) {
    const cleanUrl = this.normalizeTargetUrl(rawInput);
    if (!cleanUrl) return;
    const framedUrl = this.applyProxy(cleanUrl);

    if (this.state.activePane === 1) {
      this.state.pane1RawUrl = cleanUrl;
      this.state.pane1Url = framedUrl;
    } else {
      this.state.pane2RawUrl = cleanUrl;
      this.state.pane2Url = framedUrl;
    }
    this.state.sidebarOpen = false;
    this.emit();
  }

  pinCurrent(title) {
    const url = this.getRawUrl(this.state.activePane);
    let label = title;
    if (!label) {
      try {
        label = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        label = url;
      }
    }
    this.state.pinnedSpaces.push({ title: label, url });
    this.emit();
  }

  toggleSplit() {
    this.state.isSplit = !this.state.isSplit;
    this.state.activePane = this.state.isSplit ? 2 : 1;
    this.emit();
  }

  toggleSidebar(forceState = null) {
    this.state.sidebarOpen = forceState !== null ? forceState : !this.state.sidebarOpen;
    this.emit();
  }

  setActivePane(paneNum) {
    this.state.activePane = paneNum;
    this.emit();
  }

  setSplitRatio(percent) {
    if (percent >= 20 && percent <= 80) {
      this.state.splitRatio = percent;
      this.emit();
    }
  }
}
