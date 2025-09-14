import { h, Fragment, render } from 'refreshjs';
import App from './App';
import './styles.css';

const root = document.getElementById('root')!;

render(
  <Fragment>
    <App />
  </Fragment>,
  root
);

