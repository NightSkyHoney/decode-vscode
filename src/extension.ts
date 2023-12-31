import * as vscode from "vscode";
import { TreeViewProvider } from "./treeViewProvider";
import { createChatSession, openChatSession } from "./chatSessionManager";
import { getWebviewContent, handleWebviewMessage } from "./webviewManager";
import { IUser } from "./db";

export async function activate(context: vscode.ExtensionContext) {
  try {
    const treeViewProvider = new TreeViewProvider(context);
    vscode.window.registerTreeDataProvider("decode-vs-code", treeViewProvider);

    let createChatSessionDisposable = vscode.commands.registerCommand(
      "decode-vs-code.createChatSession",
      async () => {
        await createChatSession(context);
        treeViewProvider.refresh();
      }
    );
    context.subscriptions.push(createChatSessionDisposable);

    let openChatSessionDisposable = vscode.commands.registerCommand(
      "decode-vs-code.openChatSession",
      async (sessionId) => {
        console.log("Entered Open chat session Dispossable", sessionId);
        await openChatSession(sessionId, context);
        treeViewProvider.refresh();
      }
    );
    context.subscriptions.push(openChatSessionDisposable);

    let loginDisposable = vscode.commands.registerCommand(
      "decode-vs-code.openLogin",
      () => {
        const panel = vscode.window.createWebviewPanel(
          "decodeVscodeLogin",
          "Login",
          vscode.ViewColumn.One,
          {
            enableScripts: true,
          }
        );

        panel.webview.html = getWebviewContent(panel, context);

        // Send necessary data to the webview
        panel.webview.postMessage({
          command: "initialize",
          currentUser: context.globalState.get("currentUser") as IUser,
          // Add any necessary data here
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage((message) => {
          handleWebviewMessage(message, panel, context);
        });
      }
    );
    context.subscriptions.push(loginDisposable);

    let refreshTreeViewDisposable = vscode.commands.registerCommand(
      "decode-vs-code.refreshTreeView",
      () => {
        treeViewProvider.refresh();
      }
    );
    context.subscriptions.push(refreshTreeViewDisposable);

    let logoutDisposable = vscode.commands.registerCommand(
      "decode-vs-code.logout",
      () => {
        logout(context, treeViewProvider);
      }
    );
    context.subscriptions.push(logoutDisposable);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to activate the extension: ${error.message}`);
      vscode.window.showErrorMessage(
        `Failed to activate the extension: ${error.message}`
      );
    } else {
      console.error(`Failed to activate the extension: ${error}`);
      vscode.window.showErrorMessage(
        `Failed to activate the extension: ${error}`
      );
    }
  }
}

export function deactivate() {
  // Clean up any resources if needed
}

export function logout(
  context: vscode.ExtensionContext,
  treeViewProvider: TreeViewProvider
) {
  // Reset the user-related global state
  context.globalState.update("currentUser", undefined);

  // Refresh the tree view to show the login button
  treeViewProvider.refresh();
}
