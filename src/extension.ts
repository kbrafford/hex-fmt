'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import {HexLine} from './hexline';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "ihex" is now active!');

    // create a new HexDocument
    let hexDoc = new HexDocument();
    let controller = new HexDocumentController(hexDoc);

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(controller);
    context.subscriptions.push(hexDoc);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class HexDocument {
    private _hexLines: HexLine[];
    private _statusBarItem: StatusBarItem;
    private _size: number;

    public updateStatusBar() {

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        // Only update status if an Hex file
        if (doc.languageId === "hex") {
            this._updateDoc(doc);

            // Update the status bar
            if (this._size < 1024) {
                this._statusBarItem.text = `${this._size} B`;
            } else {
                let showableSize = this._size / 1024;
                this._statusBarItem.text = `${showableSize} KB`;
            }
            this._statusBarItem.show();
        } else { 
            this._statusBarItem.hide();
        }
    }

    private _updateDoc(doc: TextDocument) {
        this._hexLines = [];
        this._size = 0;        
        for (let i = 0; i < doc.lineCount; i++) {
            this._hexLines.push(new HexLine(doc.lineAt(i).text));
            this._size += this._hexLines[i].size()
        }
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class HexDocumentController {
    private _hexDoc: HexDocument;
    private _disposable: Disposable;

    constructor(hexDoc: HexDocument) {
        this._hexDoc = hexDoc;

        // Start right now by updating the document
        this._hexDoc.updateStatusBar();

        // Subscribe to text change event
        let subscriptions: Disposable[] = [];
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions)

        // Create a combined disposable
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._hexDoc.updateStatusBar();
    }
}