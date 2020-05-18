import App, { console } from './views/App';

/**
 * Main F-Twelve API
 */

// Root DOM ID
const id = 'f-twelve';

let appEl;
let customOnAttach;
let customOnDetach;
let keyDownStack;
let attached;
let active;

const enable = ({ show = true } = {}) => {
  active = true;
  if (show) {
    attach();
  }
  enableKeyboardTrigger();
  console.overrideWindowConsole();
  console.overrideWindowOnError();
};

const disable = () => {
  active = false;
  detach();
  disableKeyboardTrigger();
  console.restoreWindowConsole();
  console.restoreWindowOnError();
};

const attach = () => {
  if (attached === true || active !== true) {
    return;
  }
  const body = document.getElementsByTagName('body')[0];
  appEl = appEl || App({ id }); // Keep only 1 instance
  body.appendChild(appEl);
  attached = true;
  if (typeof customOnAttach === 'function') {
    customOnAttach();
  }
};

const detach = () => {
  if (attached !== true) {
    return;
  }
  const attachedEl = document.getElementById(id);
  attachedEl.parentNode.removeChild(attachedEl);
  attached = false;
  if (typeof customOnDetach === 'function') {
    customOnDetach();
  }
};

const enableKeyboardTrigger = () => {
  keyDownStack = '';
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
};

const disableKeyboardTrigger = () => {
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
};

const onKeyDown = (event) => {
  keyDownStack += event.key;
  if (event.key === 'F12' || keyDownStack.toUpperCase() !== 'F12') {
    return;
  }
  if (attached) {
    detach();
  } else {
    attach();
  }
};

const onKeyUp = () => {
  keyDownStack = '';
};

const getKeyDownStack = () => keyDownStack;
const onAttach = callback => (customOnAttach = callback);
const onDetach = callback => (customOnDetach = callback);

export {
  attach,
  detach,
  disable,
  disableKeyboardTrigger,
  enable,
  enableKeyboardTrigger,
  getKeyDownStack,
  onKeyDown,
  onKeyUp,
  onAttach,
  onDetach,
};
