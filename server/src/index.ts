import { createApp } from './app';
import { config } from './config/config';
import { createFileStore } from './store/fileStore';

const store = createFileStore(config.dataDir);
const app = createApp(store);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
