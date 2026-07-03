import { render } from "ink";
import { App } from "./ui/App.js";

if (process.platform !== "darwin") {
  console.error("pkg-cleaner currently only supports macOS.");
  process.exit(1);
}

render(<App />);
