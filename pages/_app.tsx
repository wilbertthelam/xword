import "semantic-ui-css/semantic.min.css";
import { AppProps } from "next/app";
import { Provider as StyletronProvider } from "styletron-react";
import { styletron, debug } from "./utils/styletron";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StyletronProvider value={styletron} debug={debug} debugAfterHydration>
      <Component {...pageProps} />
    </StyletronProvider>
  );
}

export default MyApp;
