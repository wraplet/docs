import React, {createRef, ReactNode, RefObject} from "react";
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {Exhibition, ExhibitionMonacoEditor, ExhibitionPreview} from 'exhibitionjs';
import MonacoEditor from "@site/src/components/MonacoEditor";
import {
  MonacoEditorRegistryContext,
  RegistryContext
} from "@site/src/components/RegistryContext";
import { WRAPLET_URL, WRAPLET_VERSION } from "../consts";

export interface ExampleProps {
  title?: string;
  style?: 'small';
  loadComments?: boolean;
  children?: ReactNode;
  previewHeight?: string;
}

export interface ExampleState {
  stripComments: boolean;
}

export default class Example extends React.Component<ExampleProps, ExampleState> {

  protected myRef: RefObject<HTMLDivElement | null> = createRef();
  protected iframeRef: RefObject<HTMLDivElement | null> = createRef();
  protected exhibition?: Exhibition;
  protected editors: ExhibitionMonacoEditor[] = [];
  protected editorsCount: number = 0;

  constructor(props: ExampleProps) {
    super(props);

    this.state = {
      stripComments: this.hasStripComments(props.children),
    };

    this.registerEditor = this.registerEditor.bind(this);
    this.onEditorContentChanged = this.onEditorContentChanged.bind(this);
  }

  protected hasStripComments(children: ReactNode): boolean {
    let found = false;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === MonacoEditor && child.props.stripComments) {
        found = true;
      }
    });
    return found;
  }

  protected toggleComments = async () => {
    await this.exhibition?.wraplet.destroy();
    this.exhibition = undefined;
    this.editors = [];
    this.editorsCount = 0;
    this.setState(prev => ({ ...prev, stripComments: !prev.stripComments }));
  };

  protected processChildren(children: ReactNode): ReactNode {
    const { stripComments } = this.state;
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === MonacoEditor) {
        return React.cloneElement(child as React.ReactElement<any>, { stripComments });
      }
      return child;
    });
  }

  protected renderToggleButton(): ReactNode {
    const showButton = this.props.loadComments !== false;
    const { stripComments } = this.state;
    return (
      <div className="text--center" style={{marginTop: "0.75rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem"}}>
        <span>
          {showButton && (
            <button
              className="button button--secondary button--sm"
              onClick={this.toggleComments}
            >
              {stripComments ? "Load example with comments" : "Load example without comments"}
            </button>
          )}
        </span>
        <span style={{fontSize: "0.85rem", color: "var(--ifm-color-emphasis-600)"}}>
          Wraplet v{WRAPLET_VERSION}
        </span>
      </div>
    );
  }

  async registerEditor(editor: ExhibitionMonacoEditor): Promise<void> {
    this.editors.push(editor);

    if (this.editorsCount === this.editors.length) {
      await this.initExhibition();
    }
  }

  async initExhibition() {
    if (!ExecutionEnvironment.canUseDOM) {
      return;
    }

    const element = this.myRef.current;

    const map = Exhibition.getMap({ deferEditors: true });
    const exhibition = await Exhibition.create(element, map, {}, {init: false});

    this.registerPreviewAlterers(exhibition.getPreview());

    await exhibition.initialize();
    await exhibition.updatePreview();

    this.exhibition = exhibition;

    this.protectFromInfiniteLoop();
  }

  private intervalId: NodeJS.Timeout | undefined;
  private lastHeartbeat: number = Date.now();
  private messageListener: ((event: MessageEvent) => void) = (e) => {
    if (e.data?.type === 'heartbeat') {
      this.lastHeartbeat = Date.now();
    }
  };
  private visibilityListener: (() => void) | undefined;

  private protectFromInfiniteLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }

    window.addEventListener('message', this.messageListener);

    // When the tab becomes visible again, reset the heartbeat so we don't
    // immediately treat the preview as "frozen" just because the browser
    // throttled timers in the background.
    this.visibilityListener = () => {
      if (!document.hidden) {
        this.lastHeartbeat = Date.now();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);

    let replacing: boolean = false;
    this.intervalId = setInterval(async () => {
      // Don't try to detect a frozen preview while the tab is in the background:
      // the iframe's heartbeat is throttled too, so any decision based on
      // `lastHeartbeat` would be wrong.
      if (document.hidden) return;
      if (replacing) return;
      if ((Date.now() - this.lastHeartbeat) <= 3000) return;
      replacing = true;
      try {
        console.warn('Preview is frozen');

        if (!this.exhibition) {
          return;
        }

        const currentIframe = this.iframeRef.current as HTMLIFrameElement | null;
        if (!currentIframe) {
          return;
        }

        // Replace the frozen iframe with a fresh one.
        const parent = currentIframe.parentNode!;
        const newIframeElement = document.createElement('iframe');

        newIframeElement.setAttribute('sandbox', currentIframe.getAttribute("sandbox"));
        newIframeElement.setAttribute('data-js-exhibition-preview', currentIframe.getAttribute("data-js-exhibition-preview"));
        newIframeElement.className = currentIframe.className;
        newIframeElement.style.cssText = currentIframe.style.cssText;

        parent.replaceChild(newIframeElement, currentIframe);
        (this.iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = newIframeElement;

        const newPreview = new ExhibitionPreview(newIframeElement);

        // Replace the preview dependency inside the exhibition.
        const oldPreview = this.exhibition.getPreview();
        this.registerPreviewAlterers(newPreview);
        await newPreview.wraplet.initialize();
        this.exhibition.replacePreview(newPreview);
        if (oldPreview.wraplet.status.isInitialized && !oldPreview.wraplet.status.isGettingDestroyed) {
          await oldPreview.wraplet.destroy();
        }
        oldPreview.removeIFrame();

        // Reset the heartbeat timer so we don't immediately trigger the replacement
        // again. The new preview will only be updated on the next editor change.
        this.lastHeartbeat = Date.now();
      } finally {
        replacing = false;
      }
    }, 300);
  }

  private registerPreviewAlterers(preview: ExhibitionPreview): void {
    // Catch and display errors.
    preview.addDocumentAlterer((document: Document) => {
      const scriptEl = document.createElement('script');
      scriptEl.textContent = `
        window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
          document.head.innerHTML += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous"/><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"/>';
          document.body.innerHTML = \`<div class="alert alert-danger" role="alert">\${errorMsg}</div>\` + document.body.innerHTML;
        return false;
      }`;
      document.head.append(scriptEl);
    });

    // Heartbeat
    preview.addDocumentAlterer((document: Document) => {
      const scriptEl = document.createElement('script');
      scriptEl.textContent = `
        setInterval(() => {
          parent.postMessage({ type: 'heartbeat' }, '*');
        }, 200);
      `;
      document.body.append(scriptEl);
    }, 99);

    // Inject CDN urls.
    // We want this to be applied last, so we would have access to all script tags.
    preview.addDocumentAlterer((document: Document) => {
      document.body.querySelectorAll('script').forEach(scriptElement => {
        scriptElement.textContent = scriptElement.textContent.replace('from "wraplet"', `from "${WRAPLET_URL}"`)
      })
    }, -99);

    // Apply basic styles.
    preview.addDocumentAlterer((document: Document) => {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
      body {
        margin: 0;
        padding: 10px;
      }
      `;
      document.head.append(styleEl);
    });

    for (const editor of [...this.editors].reverse()) {
      preview.addDocumentAlterer(editor.getDocumentAlterer(), 0);
    }
  }

  async componentWillUnmount() {
    clearInterval(this.intervalId);
    window.removeEventListener('message', this.messageListener);
    await this.exhibition?.wraplet.destroy();
  }

  protected countEditors(children: ReactNode): void {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === MonacoEditor) {
        this.editorsCount++;
      }
    });
  }

  static lastEnteredChars: string = "";

  async onEditorContentChanged(): Promise<void> {
    await this.exhibition?.updatePreview();
  }

  protected getContextValue(): RegistryContext {
    return {
      registerEditor: this.registerEditor,
      onEditorContentChanged: this.onEditorContentChanged,
    };
  }

  protected renderWithContext(children: ReactNode, content: ReactNode): ReactNode {
    this.countEditors(children);

    const contextValue = this.getContextValue();

    return (
      <div ref={this.myRef} data-js-exhibition="" className="margin-bottom--lg">
        <MonacoEditorRegistryContext.Provider value={contextValue}>
          {content}
        </MonacoEditorRegistryContext.Provider>
      </div>
    );
  }

  render(): ReactNode {
    const { style } = this.props;

    if (style === 'small') {
      return this.renderSmall();
    }

    return this.renderDefault();
  }

  private renderDefault(): ReactNode {
    const { title, children } = this.props;
    const { stripComments } = this.state;
    const processedChildren = this.processChildren(children);
    const previewHeight = this.props.previewHeight || '100%';

    return this.renderWithContext(processedChildren, (
      <>
        <div className="example-editors-container" key={stripComments ? 'stripped' : 'full'}>
          {processedChildren}
          {this.renderToggleButton()}
          <div>
            <hr/>
            <h4 style={{display: "flex", justifyContent: "center"}}>Preview</h4>
            <hr/>
            <iframe
              ref={this.iframeRef}
              sandbox="allow-scripts"
              data-js-exhibition-preview
              className="w-100 rounded"
              style={{display: "block", height: previewHeight, width: "100%"}}
            ></iframe>
          </div>
        </div>
        <style>{`
          .example-editors-container {
            display: flex;
            flex-direction: column;
            border-radius: 0.75rem;
            border: 1px solid var(--ifm-color-emphasis-200);
            box-shadow: var(--ifm-global-shadow-lw);
            background: var(--ifm-background-surface-color);
            transition: box-shadow 0.2s ease;
            margin-bottom: 1rem;
            padding: 20px;
          }
          .example-editors-container:hover {
            box-shadow: var(--ifm-global-shadow-md);
          }
          [data-theme='dark'] .example-editors-container {
            border-color: var(--ifm-color-emphasis-300);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          [data-theme='dark'] .example-editors-container:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
          }
          .example-editors-container > * {
            border-radius: 0 !important;
            min-width: 0;
            max-width: 100%;
          }
        `}</style>
      </>
    ));
  }

  private renderSmall(): ReactNode {
    const { children } = this.props;
    const { stripComments } = this.state;
    const processedChildren = this.processChildren(children);

    return (
      <div>
        {this.renderWithContext(processedChildren, (
          <>
            <div className="example-small-grid" key={stripComments ? 'stripped' : 'full'}>
              <div className="example-small-editors" style={{padding: "20px"}}>
                {processedChildren}
                {this.renderToggleButton()}
              </div>
              <div className="example-small-preview">
                <iframe
                  ref={this.iframeRef}
                  sandbox="allow-scripts"
                  data-js-exhibition-preview
                  className="w-100"
                  style={{display: "block", width: "100%", height: "100%", border: "none"}}
                ></iframe>
              </div>
            </div>
            <style>{`
              .example-small-grid {
                display: grid;
                grid-template-columns: 3fr 1fr;
                gap: 0;
                border-radius: 0.75rem;
                border: 1px solid var(--ifm-color-emphasis-200);
                box-shadow: var(--ifm-global-shadow-lw);
                background: var(--ifm-background-surface-color);
                transition: box-shadow 0.2s ease;
                container-type: inline-size;
              }
              .example-small-grid:hover {
                box-shadow: var(--ifm-global-shadow-md);
              }
              [data-theme='dark'] .example-small-grid {
                border-color: var(--ifm-color-emphasis-300);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              }
              [data-theme='dark'] .example-small-grid:hover {
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
              }
              .example-small-editors {
                display: flex;
                flex-direction: column;
                min-width: 0;
              }
              .example-small-editors > * {
                border-radius: 0 !important;
              }
              .example-small-preview {
                min-width: 0;
                background: #fff;
                border-left: 20px solid var(--ifm-color-emphasis-200);
              }
              [data-theme='dark'] .example-small-preview {
                background: #1e1e1e;
                border-left-color: var(--ifm-color-emphasis-300);
              }
              @media (max-width: 768px) {
                .example-small-grid {
                  grid-template-columns: 1fr;
                }
                .example-small-preview {
                  border-left: none;
                  border-top: 1px solid var(--ifm-color-emphasis-200);
                }
                [data-theme='dark'] .example-small-preview {
                  border-top-color: var(--ifm-color-emphasis-300);
                }
              }
              @container (max-width: 700px) {
                .example-small-grid {
                  grid-template-columns: 1fr;
                }
                .example-small-preview {
                  border-left: none;
                  border-top: 20px solid var(--ifm-color-emphasis-200);
                }
                [data-theme='dark'] .example-small-preview {
                  border-top-color: var(--ifm-color-emphasis-300);
                }
              }
            `}</style>
          </>
        ))}
      </div>
    );
  }
}
