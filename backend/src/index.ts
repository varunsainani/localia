import { createApp } from "./app";
import { PORT } from "./lib/env";

const app = createApp();
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Localia API listening on http://localhost:${PORT}`);
});
