import React, {createRef, RefObject} from "react";
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import * as monaco from 'monaco-editor';
import {ExhibitionMonacoEditor, ExhibitionMonacoEditorOptions} from "exhibitionjs";
import { MonacoEditorRegistryContext } from "./RegistryContext";
import { WRAPLET_URL, WRAPLET_DIST_URL, WRAPLET_DIST_ESM_URL } from "../consts";

interface Props {
  contentUrl: string,
  language: "html" | "javascript" | "typescript" | "css",
  options?: Partial<ExhibitionMonacoEditorOptions>,
  height?: string,
  stripComments?: boolean,
  collapsible?: boolean,
  defaultCollapsed?: boolean,
}

interface State {
  collapsed: boolean,
}

export default class MonacoEditor extends React.Component<Props, State> {
  private myRef: RefObject<HTMLDivElement | null> = createRef();
  private editor?: ExhibitionMonacoEditor;
  static contextType = MonacoEditorRegistryContext;
  context: React.ContextType<typeof MonacoEditorRegistryContext> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      collapsed: props.collapsible ? (props.defaultCollapsed ?? true) : false,
    };
  }

  private toggleCollapsed = () => {
    this.setState((prev) => ({collapsed: !prev.collapsed}));
  };

  async componentDidMount() {
    if (!ExecutionEnvironment.canUseDOM) {
      return;
    }
    const ctx = this.context;
    if (!ctx) return;


    const element = this.myRef.current;

    monaco.typescript.typescriptDefaults.setCompilerOptions({
      module: monaco.typescript.ModuleKind.ESNext,
      target: monaco.typescript.ScriptTarget.ES2017,
      moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
    });
    await this.loadDeclarations(monaco);

    const response = await fetch(this.props.contentUrl);
    let content = await response.text();

    if (this.props.stripComments) {
      content = this.stripComments(content, this.props.language);
    }

    const defaultMonacoOptions: ExhibitionMonacoEditorOptions["monacoEditorOptions"] = {
      minimap: {
        enabled: false,
      },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      value: content,
      language: this.props.language,
    };

    const options: ExhibitionMonacoEditorOptions = {
      monaco: monaco,
      monacoEditorOptions: { ...defaultMonacoOptions, ...this.props.options },
    };


    if (["javascript", "typescript"].includes(options["monacoEditorOptions"]["language"])) {
      if (!options["tagAttributes"]) options["tagAttributes"] = {};
      options["tagAttributes"]["type"] = "module";
    }


    const editor = ExhibitionMonacoEditor.create(
      element,
      options,
    );

    await editor.initialize();
    await ctx.registerEditor(editor);

    this.editor = editor;

    const monacoEditor = monaco.editor.getEditors().find(e => e.getDomNode()?.parentElement === element);
    if (monacoEditor && ctx.onEditorContentChanged) {
      monacoEditor.onDidChangeModelContent(() => ctx.onEditorContentChanged!());
    }
  }

  private stripComments(text: string, language: string): string {
    if (language === "html") {
      return text
        .replace(/^[ \t]*<!--[\s\S]*?-->[ \t]*\n?/gm, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // JS/TS/CSS: remove lines that are only comments, then inline comments
    return text
      .replace(/^[ \t]*\/\/.*\n?/gm, '')
      .replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\n?/gm, '')
      .replace(/([^:])\/\/.*$/gm, '$1')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  componentWillUnmount() {
    this.editor?.wraplet.destroy();
  }

  render() {
    if (!this.props.collapsible) {
      return (
        <div
          ref={this.myRef}
          data-js-exhibition-editor
          className="bordered margin-bottom--md"
          style={{height: this.props.height ?? "500px", resize: "vertical", width: "100%", minWidth: 0, maxWidth: "100%"}}
        ></div>
      );
    }

    const collapsed = this.state.collapsed;

    return (
      <div className="margin-bottom--md" style={{width: "100%", minWidth: 0, maxWidth: "100%"}}>
        <div
          className="bordered"
          onClick={this.toggleCollapsed}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 8px",
            cursor: "pointer",
            borderBottom: collapsed ? undefined : "none",
          }}
        >
          <span>Editor</span>
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={(e) => { e.stopPropagation(); this.toggleCollapsed(); }}
            style={{cursor: "pointer", background: "transparent", border: "none", font: "inherit"}}
          >
            {collapsed ? "\u25BC Expand" : "\u25B2 Collapse"}
          </button>
        </div>
        <div
          ref={this.myRef}
          data-js-exhibition-editor
          className="bordered"
          style={{
            height: this.props.height ?? "500px",
            resize: "vertical",
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            display: collapsed ? "none" : "block",
          }}
        ></div>
      </div>
    );
  }

  private async loadDeclarations(monacoModule: typeof monaco) {
    async function loadTypeDeclarations(declarationString: string, filename: string) {
      monacoModule.typescript.javascriptDefaults.addExtraLib(declarationString, filename);
      if (!monacoModule.editor.getModel(monaco.Uri.parse(filename))) {
        monacoModule.editor.createModel(declarationString, "typescript", monaco.Uri.parse(filename));
      }
    }

    async function loadTypeDeclarationsFromFiles(module: string, module_dist_cdn: string, files: string[], filename: string) {
      let libSources = `declare module "${module}" {\n`;
      for (const file of files) {
        const libResource = await fetch(`${module_dist_cdn}/${file}`);
        const libSource = await libResource.text();
        libSources += libSource + '\n';
      }
      libSources += '}';
      await loadTypeDeclarations(libSources, filename);
    }

    const wrapletFiles = [
        "ambient.d.ts"
    ];

    // Load wraplet's type declarations.'
    await loadTypeDeclarationsFromFiles("@wraplet/core", WRAPLET_DIST_URL, wrapletFiles, "ts:wraplet.d.ts");
  }
}
