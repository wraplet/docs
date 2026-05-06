import {ExhibitionMonacoEditor} from "exhibitionjs";
import React from "react";

export const MonacoEditorRegistryContext = React.createContext<RegistryContext | null>(null);

export type RegistryContext = {
  registerEditor(editor: ExhibitionMonacoEditor): Promise<void>;
  onEditorContentChanged?: () => void;
};
