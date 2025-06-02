const socket = io();

// UI элементы
const lobby = document.getElementById('lobby');
const game = document.getElementById('game');
const guessSection = document.getElementById('guessSection');
const guessInput = document.getElementById('guessInput');
const submitGuessBtn = document.getElementById('submitGuess');
const gameStatus = document.getElementById('gameStatus');
const evaluationSection = document.getElementById('evaluationSection');
const opponentGuess = document.getElementById('opponentGuess');
const submitEvaluationBtn = document.getElementById('submitEvaluation');
const guessHistory = document.getElementById('guessHistory');
const submitWordBtn = document.getElementById('submitWord');
const secretWordInput = document.getElementById('secretWord');
const myWordDisplay = document.getElementById('myWord');
const opponentWordDisplay = document.getElementById('opponentWord');
const gameInfo = document.getElementById('gameInfo');

let currentEvaluation = [];

socket.emit('wordly_join', { room: roomId, session_id: sessionId });

submitWordBtn.addEventListener('click', () => {
  const word = secretWordInput.value.trim();
  if (word.length === 5) {
    socket.emit('wordly_submit_word', { room: roomId, session_id: sessionId, word });
    document.getElementById('wordSubmission').style.display = 'none';
    myWordDisplay.textContent = word;
    gameInfo.classList.remove('hidden');
    gameStatus.textContent = 'Waiting for opponent...';
  }
});

submitGuessBtn.addEventListener('click', () => {
  const guess = guessInput.value.trim();
  if (guess.length === 5) {
    socket.emit('wordly_make_guess', { room: roomId, session_id: sessionId, guess });
    addGuessToHistory(guess, 'pending');
    guessInput.value = '';
  }
});

submitEvaluationBtn.addEventListener('click', () => {
  socket.emit('wordly_submit_evaluation', {
    room: roomId,
    session_id: sessionId,
    evaluation: currentEvaluation
  });
  evaluationSection.classList.add('hidden');
  guessSection.classList.remove('hidden');
  gameStatus.textContent = 'Waiting for opponent...';
});

function createLetterElement(letter, index) {
  const el = document.createElement('div');
  el.className = 'letter';
  el.textContent = letter;
  el.dataset.index = index;
  el.dataset.state = 'none';

  el.addEventListener('click', () => {
    const states = ['none', 'green', 'yellow', 'gray'];
    const currentIndex = states.indexOf(el.dataset.state);
    const nextState = states[(currentIndex + 1) % states.length];
    el.dataset.state = nextState;
    el.className = 'letter ' + nextState;
    currentEvaluation[index] = nextState === 'none' ? null : nextState;
  });

  return el;
}

function setupEvaluation(guess) {
  opponentGuess.innerHTML = '';
  currentEvaluation = Array(5).fill(null);
  guess.split('').forEach((letter, index) => {
    opponentGuess.appendChild(createLetterElement(letter, index));
  });
}

function addGuessToHistory(guess, result) {
  const div = document.createElement('div');
  div.className = 'guess';
  if (result === 'pending') {
    div.textContent = `Your guess: ${guess} (waiting for evaluation)`;
    div.style.color = '#999';
  } else {
    const resultStr = result.map((color, i) => `${guess[i]}: ${color || 'none'}`).join(', ');
    div.textContent = `Your guess: ${guess} - ${resultStr}`;
  }
  guessHistory.appendChild(div);
}

// Обработка событий от сервера
socket.on('wordly_word_submitted', (data) => {
  gameStatus.textContent = 'Waiting for opponent...';
});

socket.on('wordly_game_started', (data) => {
  gameStatus.textContent = 'Game started! Make your guess.';
  guessSection.classList.remove('hidden');
});

socket.on('wordly_guess_made', (data) => {
  gameStatus.textContent = 'Evaluate opponent\'s guess.';
  evaluationSection.classList.remove('hidden');
  guessSection.classList.add('hidden');
  setupEvaluation(data.guess);
});

socket.on('wordly_turn_changed', (data) => {
  gameStatus.textContent = 'Your turn to guess.';
  guessSection.classList.remove('hidden');
  evaluationSection.classList.add('hidden');
});

socket.on('wordly_game_over', (data) => {
  gameStatus.textContent = sessionId === data.winner ? 'You won!' : 'You lost.';
  guessSection.classList.add('hidden');
  evaluationSection.classList.add('hidden');
  myWordDisplay.textContent = data.words[sessionId];
  const opponent = Object.keys(data.words).find(k => k !== sessionId);
  opponentWordDisplay.textContent = data.words[opponent];
});

socket.on('wordly_player_left', (data) => {
  gameStatus.textContent = 'Opponent left the game.';
});
