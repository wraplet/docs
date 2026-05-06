import type { Plugin } from '@docusaurus/types';
import type { Configuration } from 'webpack';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

export default function monacoEditorPlugin(): Plugin {
  return {
    name: 'monaco-editor-plugin',

    configureWebpack(config: Configuration, isServer: boolean) {
      // Only apply on client-side bundle
      if (isServer) {
        return {};
      }

      return {
        plugins: [
          new MonacoWebpackPlugin({
            languages: ['javascript', 'typescript', 'css', 'html', 'json'],
          }),
        ],
        devServer: {
          client: {
            overlay: {
              runtimeErrors: (error: Error) => {
                // This supresses the ResizeObserver loop error that is a result of a benign
                // conflict between Monaco Editor's ResizeObserver and the Docusaurus' one.
                // The error was happening when hovering over some methods with large definitions
                // in monaco-editor.
                if (error?.message?.includes('ResizeObserver loop')) {
                  return false;
                }
                return true;
              },
            },
          },
        },
      };
    }
  };
}