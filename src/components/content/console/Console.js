/* eslint-disable no-console */
import jsx from '../../../utilities/jsx';
import styles from '../../App.module.css';
import Output from './Output';
import Prompt from './Prompt';

/**
 * The content of the Console tab
 */
const historyKey = 'fTwelve.history';
const originalConsole = Object.assign({}, window.console);
const originalOnError = window.onerror && typeof window.onerror === 'function' ? window.onerror.bind({}) : null;
export default () => {
  let output;

  const getHistory = () => {
    return window.localStorage
      ? (JSON.parse(window.localStorage.getItem(historyKey)) || [])
      : execHistory || [];
  };

  const setHistory = (command, maxSize = 50) => {
    execHistory.unshift(command);
    execHistory.splice(maxSize);
    if (window.localStorage) {
      window.localStorage.setItem(historyKey, JSON.stringify(execHistory));
    }
  };

  const parseStack = (stack) => {
    return stack.split('\n').map((line) => ({
      path: (line.match(/^( *at )(.*)/) || [])[2],
      url: (line.match(/(http:\/\/.*?):\d+:\d+/) || [])[1],
      fileName: (line.match(/.+[\\/(](.*?\.\w+)/) || [])[1],
      lineNumber: (line.split(':').slice(-2, -1) || [])[0],
      columnNumber: (line.split(':').slice(-1)[0].match(/\d+/) || [])[0],
    })).filter(frame => frame.path);
  };

  const overrideWindowConsole = () => {
    const verbs = ['log', 'warn', 'error', 'info'];
    verbs.forEach((verb) => {
      window.console[verb] = (...args) => {
        const isError = args.length === 1 && args[0] instanceof Error;
        const stackPreFtwelve = (Error().stack || '').split('\n').splice(2).join('\n');
        const stack = parseStack(isError ? args[0].stack : stackPreFtwelve);
        output.append({ verb, args, stack });
        return originalConsole[verb] && originalConsole[verb].apply(window.console, args);
      };
    });
  };

  const restoreWindowConsole = () => {
    window.console = Object.assign({}, originalConsole);
  };

  const overrideWindowOnError = () => {
    window.onerror = (message, source, lineNo, colNo, error) => {
      if (originalOnError && typeof originalOnError === 'function') {
        originalOnError.call(this, message, source, lineNo, colNo, error);
      }
      console.error(error);
      return true;
    };
  };

  const restoreWindowOnError = () => {
    window.onerror = originalOnError ? originalOnError.bind({}) : null;
  };

  const exec = (command) => {
    setHistory(command);
    console.log(command);
    try {
      console.log(parseCommand(command));
    } catch (e) {
      console.error(e);
    }
  };

  const execHistory = getHistory();

  return {
    exec,
    getHistory,
    overrideWindowConsole,
    overrideWindowOnError,
    parseCommand,
    parseStack,
    restoreWindowConsole,
    restoreWindowOnError,
    setHistory,
    el: (
      <div className={styles.content}>
        <Output ref={ref => (output = ref)}/>
        <Prompt exec={exec} getHistory={getHistory}/>
      </div>
    )
  };
};

const parseCommand = (command) => {
  command = command.trim();
  if ((command.startsWith('"') && command.endsWith('"')) ||
    (command.startsWith("'") && command.endsWith("'"))) {
    return command.slice(1, -1);
  }
  const expressions = command.split(/\s*=\s*/);
  const firstExpression = expressions.shift();
  return firstExpression.replace(/(?=\[)/g, '.').split('.').reduce((object, memberString, idx, array) => {
    const bracketMatch = memberString.match(/^\[([^\]]*)]$/);
    const memberName = bracketMatch ? bracketMatch[1].replace(/^["']|["']$/g, '') : memberString;
    if (expressions.length > 0 && idx === array.length - 1) {
      // If there are things to the right of the equals sign, assign it to the left
      (object || {})[memberName] = parseCommand(expressions.join('='));
    }
    return (object || {})[memberName];
  }, window);
};
