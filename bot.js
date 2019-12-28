function initHack() {
  /** UTILS */
  function promisifySetTimeout(cb, duration) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (typeof cb == 'function') cb();
        resolve();
      }, duration);
    });
  }

  async function sleep(duration) {
    await promisifySetTimeout(null, duration);
  }

  // Levenhstein distance
  // Returns matrix
  function getEditDistance(s, t) {
    if (s.length == 0) return null;
    if (t.length == 0) return null;

    let matrix = [];
    for (let i = 0; i <= t.length; i++) {
      matrix[i] = [i];
    }

    for (let i = 0; i <= s.length; i++) {
      matrix[0][i] = i;
    }

    for (let i = 1; i <= t.length; i++) {
      for (let j = 1; j <= s.length; j++) {
        let diagonal = matrix[i - 1][j - 1];
        let horizontal = matrix[i][j - 1];
        let vertical = matrix[i - 1][j];
        if (t.charAt(i - 1) == s.charAt(j - 1)) {
          matrix[i][j] = diagonal;
        } else {
          let min = Math.min(diagonal, Math.min(horizontal, vertical));
          matrix[i][j] = min + 1;
        }
      }
    }

    return matrix;
  }

  // Find transformations from calculating edit distance
  function findTransformations(s, t) {
    let matrix = getEditDistance(s, t);

    let rows = matrix.length - 1;
    let cols = matrix[0].length - 1;
    let i = rows,
      j = cols;
    let transformations = {};
    while (i > 0 || j > 0) {
      let diagonal = matrix[i - 1][j - 1];
      let horizontal = matrix[i][j - 1];
      let vertical = matrix[i - 1][j];
      let currElement = matrix[i][j];
      if (currElement - 1 == diagonal) {
        transformations[i] = {
          type: 'replace',
          value: t[i - 1]
        };
        i--;
        j--;
      } else if (currElement - 1 == horizontal) {
        transformations[i] = {
          type: 'delete',
          value: s[j - 1]
        };
        j--;
      } else if (currElement - 1 == vertical) {
        transformations[i] = {
          type: 'insert',
          value: t[i - 1]
        };
        i--;
      } else {
        i--;
        j--;
      }
    }

    return transformations;
  }

  function getTextElement() {
    return (
      document.querySelector('#row1 .highlight') || document.querySelector('#row1 .highlight-wrong')
    );
  }

  function getText() {
    let el = getTextElement();
    if (el != null) {
      return el.textContent;
    }
    return null;
  }

  function getTimerStatus() {
    let timerEl = document.querySelector('#timer.off');
    return timerEl == null ? 'running' : 'off';
  }

  function randomizeBoolean(multiplier = 100) {
    let number = ~~(Math.random() * multiplier);
    return number > multiplier - (multiplier / 2);
  }

  let keyboard = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '{', '}', '\\'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];

  function get2DimensionalIndex(arr, val) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[i].length; j++) {
        let el = arr[i][j];
        if (val == el) return [i, j];
      }
    }

    return -1;
  }

  function getAllNearestKeys(idx) {
    let [row, col] = idx;

    let possibleKeys = [];
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        if (keyboard[i] && keyboard[i][j] && keyboard[i][j] != keyboard[row][col]) {
          possibleKeys.push(keyboard[i][j]);
        }
      }
    }

    return possibleKeys.filter(key => key != undefined) || [];
  }

  function getRandomNearestKey(currKey) {
    let keyIdx = get2DimensionalIndex(keyboard, currKey);
    if (keyIdx != -1) {
      let nearestKeys = getAllNearestKeys(keyIdx);
      let randomNumber = ~~(Math.random() * nearestKeys.length);
      return nearestKeys[randomNumber];
    }
    return null;
  }

  let alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'{}\\;,./".split('');

  function handleInput(e) {
    if (e.key == 'Backspace') {
      let str = input.value;
      input.value = str.slice(0, str.length - 1);
    } else if (alphabets.includes(e.key)) {
      input.value += e.key;
    }

    let textEl = getTextElement();
    let currText = getText();
    if (isTypo(input.value, currText)) {
      textEl.classList.add('highlight-wrong');
    }
  }

  function isTypo(string, expected) {
    for (let i = 0; i < string.length; i++) {
      if (expected[i] != string[i]) {
        return true;
      }
    }

    return false;
  }

  function setInputListener() {
    input.addEventListener('keyup', handleInput);
  }

  function disposeInputListener() {
    input.removeEventListener('keyup', handleInput);
  }

  function sendKeyboardKey(opt) {
    input.dispatchEvent(new KeyboardEvent('keyup', opt));
  }

  async function fixTypo(string, expected) {
    console.log('fixing typo:', string, expected);
    let transformations = findTransformations(string, expected);
    let keys = Object.keys(transformations);
    for (let key of keys) {
      key = Number(key);
      let { type, value } = transformations[key];
      let fixedString;
      if (type == 'replace') {
        input.value = string.slice(0, key - 1) + string.slice(key);
        await sleep(Math.random() * 500);
        fixedString = string.slice(0, key - 1) + value + string.slice(key);
      } else if (type == 'insert') {
        fixedString = string.slice(0, key - 1) + value + string.slice(key - 1);
      } else {
        fixedString = string.slice(0, key) + string.slice(key + 2);
        await sleep(Math.random() * 500);
        fixedString = string.slice(0, key) + string.slice(key + 1);
      }
      string = fixedString;
      input.value = string;
      await sleep(Math.random() * 500);
    }
    console.log('string afterwards:', string);
  }

  let input = document.querySelector('#inputfield');
  let idx = 0;
  let prevWrong = false;
  let willIgnoreTypoFullWord;
  let prevWord;

  async function hack(opts) {
    let defaultOpts = {
      withTypo: true,
      randomTiming: true,
      randomMultiplier: 250,
      duration: 10
    };
    Object.assign(defaultOpts, opts);
    let { withTypo, randomTiming, randomMultiplier, duration } = defaultOpts;

    let timerStatus = getTimerStatus();
    let currText = getText();
    if (currText == null || timerStatus == 'off') {
      disposeInputListener();
      return;
    }

    let nextTiming = randomTiming ? Math.random() * randomMultiplier : duration;

    if (withTypo && prevWord != currText) {
      willIgnoreTypoFullWord = randomizeBoolean(nextTiming);
    }

    if (idx < currText.length) {
      let currKey = currText.slice(idx, idx + 1);

      if (!willIgnoreTypoFullWord && prevWrong) {
        sendKeyboardKey({
          key: 'Backspace'
        });
        await sleep(nextTiming);
        prevWrong = false;
      }

      let willCharWrong = randomizeBoolean(nextTiming);
      let willSkipChar = !willCharWrong && randomizeBoolean(nextTiming);
      if (withTypo && willCharWrong) {
        let key = getRandomNearestKey(currKey);
        if (key) {
          sendKeyboardKey({
            key
          });
          let willIgnoreTypo = randomizeBoolean(nextTiming);
          prevWrong = !willIgnoreTypo;
          if (!prevWrong) idx++;
        } else {
          idx++;
        }
      } else if (withTypo && willSkipChar) {
        idx++;
      } else {
        sendKeyboardKey({
          key: currKey
        });
        idx++;
      }
    } else {
      prevWord = currText;
      sendKeyboardKey({
        keyCode: 32
      });
      idx = 0;
    }

    let willFixTypoFullWord = randomizeBoolean();
    if (!willIgnoreTypoFullWord && willFixTypoFullWord && input.value && prevWrong) {
      await fixTypo(input.value, currText);
      sendKeyboardKey({
        keyCode: 32
      });
      idx = 0;
    }

    setTimeout(() => hack(...arguments), nextTiming);
  }

  setInputListener();
  hack({
    withTypo: true,
    randomTiming: true,
    randomMultiplier: 500
  }).then(
    onfullfilled => {},
    onrejected => {
      disposeInputListener();
    }
  );
}

initHack();
