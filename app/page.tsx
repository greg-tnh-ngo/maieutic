import { isDemoMode } from './lib/mode-detector';
import MaieuticApp from './components/MaieuticApp';

export default function Page() {
  const isDemo = isDemoMode();
  return <MaieuticApp isDemo={isDemo} />;
}
