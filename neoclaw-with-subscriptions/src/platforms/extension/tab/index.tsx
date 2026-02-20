import { createRoot } from 'react-dom/client';
import { TabPage } from './TabPage';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<TabPage />);
}
