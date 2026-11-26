import { BridgeStorage } from './storage.js';

export class ArcBridgeEngine {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.proxyPrefix = 'https://red-salad-2b1a.domain-709.workers.dev/?url=';
    this.state = {
      isSplit: false,
      splitRatio: 50,
      sidebarOpen: true,
      activePane: 1,
      pane1RawUrl: 'https://example.com',
      pane2RawUrl: 'https://en.wikipedia.org/wiki/Main_Page',
      pane1Proxy: false,
      pane2Proxy: false,
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
    }
    this.syncUrls();
    this.emit();
  }

  syncUrls() {
    this.state.pane1Url = this.resolvePaneUrl(this.state.pane1RawUrl, this.state.pane1Proxy);
    this.state.pane2Url = this.resolvePaneUrl(this.state.pane2RawUrl, this.state.pane2Proxy);
  }

  emit() {
    BridgeStorage.set('browser_state', this.state);
    this.onStateChange({ ...this.state });
  }

  normalizeTargetUrl(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return null;
    if (!trimmed.includes('.') || trimmed.includes(' ')) {
      return `https://www.bing.com/search?q=${encodeURIComponent(trimmed)}`;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  resolvePaneUrl(rawUrl, useProxy) {
    if (!useProxy || !this.proxyPrefix) return rawUrl;
    return `${this.proxyPrefix}${encodeURIComponent(rawUrl)}`;
  }

  getRawUrl(paneNum) {
    return paneNum === 1 ? this.state.pane1RawUrl : this.state.pane2RawUrl;
  }

  isPaneProxied(paneNum) {
    return paneNum === 1 ? this.state.pane1Proxy : this.state.pane2Proxy;
  }

  togglePaneProxy(paneNum) {
    if (paneNum === 1) {
      this.state.pane1Proxy = !this.state.pane1Proxy;
    } else {
      this.state.pane2Proxy = !this.state.pane2Proxy;
    }
    this.syncUrls();
    this.emit();
  }

  navigate(rawInput) {
    const cleanUrl = this.normalizeTargetUrl(rawInput);
    if (!cleanUrl) return;

    if (this.state.activePane === 1) {
      this.state.pane1RawUrl = cleanUrl;
    } else {
      this.state.pane2RawUrl = cleanUrl;
    }
    this.syncUrls();
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
