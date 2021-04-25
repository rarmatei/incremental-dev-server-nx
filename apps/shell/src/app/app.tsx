import styles from './app.module.scss';

import { ReactComponent as Logo } from './logo.svg';
import star from './star.svg';

import { BuildableButton } from '@buildable-webpack-react/buildable-button';
import { BuildableHeader } from '@buildable-webpack-react/buildable-header';

export function App() {
  return (
    <div className={styles.app}>
      <header className="flex">
        <Logo width="75" height="75" />
        <h1>Welcome to shell!</h1>
      </header>
      <main>
        <BuildableHeader></BuildableHeader>
        <BuildableButton></BuildableButton>
      </main>
    </div>
  );
}

export default App;
