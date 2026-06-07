import { callMainWindow } from "../../index";
import { Utils } from "electrobun";

export function createSplitRPCService() {
  return {
    splitTriggerOpenFile: async () => {
      // Implement the logic to open a file dialog and return the selected file's information
      let filename = "";
      const fileId = Math.floor(Math.random() * 1000); // Placeholder file ID

      const file = await Utils.openFileDialog({
        // PDF files only for now, can be extended later
        allowedFileTypes: ".pdf",
        allowsMultipleSelection: false,
        canChooseDirectory: false,
        canChooseFiles: true,
        startingFolder: import.meta.dir, // Start in the current directory
      });

      file.forEach((f) => {
        filename = f;
        console.log("Selected file:", f);
      });

      const mainWindow = callMainWindow();

      mainWindow.webview.rpc?.send("onLogTest", {
        message: "Received file selection message in main process: " + filename,
      });

      if (!file) {
        return { filename, fileId };
      } else {
        return { filename: "", fileId: -1 }; // Indicate that no file was selected
      }
    },
  };
}
