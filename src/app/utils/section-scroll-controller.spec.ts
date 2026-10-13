import { SectionScrollController } from './section-scroll-controller';
import { SECTION_IDS } from './section-alignment';

describe('SectionScrollController lifecycle', () => {
  let controller: SectionScrollController;
  let view: Window;
  let doc: Document;
  let y: number;
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let root: HTMLElement;
  let sections: HTMLElement[];
  let scrollTo: jasmine.Spy;
  let push: jasmine.Spy;
  let synchronize: jasmine.Spy;

  const flush = (count = 1) => {
    for (let i = 0; i < count; i++) {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(performance.now()));
    }
  };
  const scroll = (top: number) => {
    y = top;
    view.dispatchEvent(new Event('scroll'));
    flush();
  };
  const end = () => {
    doc.dispatchEvent(new Event('scrollend'));
    flush(5);
  };
  const wheel = () => doc.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 }));

  beforeEach(() => {
    jasmine.clock().install();
    frames = new Map();
    nextFrame = 0;
    y = 0;
    root = document.createElement('html');
    Object.defineProperties(root, {
      clientWidth: { value: 1440 }, clientHeight: { value: 900 }, scrollHeight: { value: 5400 },
    });
    const location = new URL('http://localhost/');
    let historyState: unknown = { otherFeature: 'keep-me' };
    const history = {
      scrollRestoration: 'auto',
      get state() {
        return historyState;
      },
      replaceState: (_state: unknown, _title: string, url?: string | URL | null) => {
        historyState = _state;
        if (url) location.href = new URL(url, location.href).href;
      },
      pushState: (_state: unknown, _title: string, url?: string | URL | null) => {
        historyState = _state;
        if (url) location.href = new URL(url, location.href).href;
      },
    };
    push = spyOn(history, 'pushState').and.callThrough();
    const media = Object.assign(new EventTarget(), { matches: false });
    scrollTo = jasmine.createSpy('scrollTo').and.callFake((options: ScrollToOptions) => {
      if (options.behavior === 'instant') y = options.top ?? y;
    });
    view = Object.assign(new EventTarget(), {
      history,
      location,
      matchMedia: () => media,
      scrollTo,
      visualViewport: Object.assign(new EventTarget(), { height: 900, scale: 1 }),
      setTimeout: window.setTimeout.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      },
      cancelAnimationFrame: (id: number) => frames.delete(id),
    }) as unknown as Window;
    Object.defineProperty(view, 'scrollY', { get: () => y });
    sections = SECTION_IDS.map((id, index) => {
      const element = document.createElement('section');
      element.id = id;
      spyOn(element, 'getBoundingClientRect').and.callFake(
        () => new DOMRect(0, index * 900 - y, 1440, 900),
      );
      spyOn(element, 'scrollIntoView');
      return element;
    });
    doc = Object.assign(new EventTarget(), {
      defaultView: view,
      documentElement: root,
      onscrollend: null,
      getElementById: (id: string) => sections.find((section) => section.id === id),
      querySelector: () => null,
      fonts: { ready: Promise.resolve() },
    }) as unknown as Document;
    spyOn(window, 'ResizeObserver').and.returnValue({
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    });
    synchronize = jasmine.createSpy('synchronize');
    controller = new SectionScrollController(doc, {
      active: () => {},
      layout: () => {},
      synchronize,
    });
    flush(2);
  });
  afterEach(() => {
    controller.destroy();
    jasmine.clock().uninstall();
  });

  it('owns root snap for its lifetime and restores browser history policy', () => {
    expect(root.dataset['scrollCoordinator']).toBe('ready');
    expect(view.history.scrollRestoration).toBe('manual');
    controller.destroy();
    expect(root.dataset['scrollCoordinator']).toBeUndefined();
    expect(view.history.scrollRestoration).toBe('auto');
  });
  it('pushes only once for the same target and merges unrelated history state', () => {
    controller.navigate('invitation');
    controller.navigate('invitation');
    expect(push).toHaveBeenCalledTimes(1);
    expect(view.history.state.otherFeature).toBe('keep-me');
    expect(sections[1].scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
  });
  it('completes explicit navigation without another alignment', () => {
    controller.navigate('message');
    scroll(1800);
    end();
    expect(root.dataset['scrollState']).toBe('idle');
    expect(scrollTo).not.toHaveBeenCalled();
    expect(synchronize).toHaveBeenCalled();
  });
  it('cancels a pending smooth correction immediately at the actual offset on new input', () => {
    wheel();
    scroll(1400);
    end();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1800, behavior: 'smooth' });
    scroll(1450);
    wheel();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1450, behavior: 'instant' });
    expect(root.dataset['scrollState']).toBe('native-input');
  });
  it('retains the target lock when scrollend arrives before the destination', () => {
    controller.navigate('message');
    scroll(1650);
    end();
    expect(root.dataset['scrollState']).toBe('navigation');
    scroll(1800);
    end();
    expect(root.dataset['scrollState']).toBe('idle');
  });
  it('does not align while a scroll key remains held', () => {
    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    scroll(1400);
    end();
    expect(scrollTo).not.toHaveBeenCalled();
    doc.dispatchEvent(new KeyboardEvent('keyup', { key: 'PageDown' }));
    jasmine.clock().tick(180);
    flush(5);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1800, behavior: 'smooth' });
  });
  it('does not align a stationary click between chapter anchors', () => {
    scroll(1400);
    doc.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1 }));
    doc.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    jasmine.clock().tick(180);
    flush(5);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(root.dataset['scrollReason']).toBe('no-scroll');
  });
  it('does not settle a horizontal gallery gesture or a modifier zoom', () => {
    const target = document.createElement('div');
    target.id = 'memories';
    // Use the document event target while retaining the gallery origin for arbitration.
    const start = new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 200 });
    Object.defineProperty(start, 'target', { value: target });
    doc.dispatchEvent(start);
    doc.dispatchEvent(
      new PointerEvent('pointermove', { pointerId: 1, clientX: 150, clientY: 201 }),
    );
    scroll(1400);
    doc.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    end();
    expect(scrollTo).not.toHaveBeenCalled();
    doc.dispatchEvent(new WheelEvent('wheel', { deltaY: 20, ctrlKey: true }));
    scroll(1420);
    end();
    expect(scrollTo).not.toHaveBeenCalled();
  });
  it('deduplicates popstate/hashchange and restores saved reading position instead of just the anchor', () => {
    view.history.replaceState({ happyGradReading: { y: 1999 } }, '', '#message');
    view.dispatchEvent(new PopStateEvent('popstate'));
    view.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(scrollTo).toHaveBeenCalledOnceWith({ top: 1999, behavior: 'instant' });
    expect(sections[2].scrollIntoView).not.toHaveBeenCalled();
  });
  it('defers a deep link behind Intro and resumes without passive settling', () => {
    controller.suspend();
    controller.navigate('memories', 'none', false);
    expect(sections[3].scrollIntoView).not.toHaveBeenCalled();
    controller.resume();
    expect(sections[3].scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      behavior: 'instant',
    });
    scroll(2700);
    end();
    expect(root.dataset['scrollState']).toBe('idle');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
