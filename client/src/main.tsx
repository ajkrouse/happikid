import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import vintage-modern fonts for HappiKid branding
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/crimson-text/400.css';
import '@fontsource/crimson-text/400-italic.css';
import '@fontsource/crimson-text/600.css';

createRoot(document.getElementById("root")!).render(<App />);
