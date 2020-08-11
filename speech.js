const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
const $question = window.question;
const $result = window.result;
const $timer = window.timer;
const $body = document.body;
const $button = window.action;
const $points = window.points;

let maxTime = 10;

let points = 0;

let questions = [];
let answers = [];
let currentQuestion = 0;

let recognition = new SpeechRecognition();
let timer;
let ended = true;

async function getQuestions() {
  if (questions.length === 0) {
    questions = await fetch(
      "https://opentdb.com/api.php?amount=10&category=27&difficulty=easy&encode=url3986"
    )
      .then((response) => response.json())
      .then((response) => response.results);
  }

  nextQuestion();
}

function nextQuestion() {
  const question = questions[currentQuestion];

  const { question: copy } = question;

  answers = decodeURIComponent(question.correct_answer)
    .toLowerCase()
    .trim()
    .split(" ");

  const grammar = `#JSGF V1.0; grammar answers; public <answers> = ${answers.join(
    " | "
  )};`;

  $question.innerText = decodeURIComponent(copy);

  const speechRecognitionList = new SpeechGrammarList();

  speechRecognitionList.addFromString(grammar);
  recognition.grammars = speechRecognitionList;
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  currentQuestion++;

  ended = false;

  $result.innerText = "";
  $timer.classList.remove("resetting");
  $timer.classList.add("count");
}

$button.onclick = function () {
  $button.classList.add("hided");

  if (questions.length === 0) {
    getQuestions();
  } else {
    nextQuestion();
  }

  timer = setTimeout(() => {
    recognition.stop();

    ended = true;

    setResult("lose");
  }, maxTime * 1000);
};

recognition.onresult = function (event) {
  const results = event.results;

  const { transcript } = results[results.length - 1][0];

  const resultWords = transcript
    .split(" ")
    .filter((word) => answers.includes(word.toLowerCase()))
    .map((word) => word.toLowerCase());

  if (answers.filter((word) => !resultWords.includes(word)).length === 0) {
    setResult("win");

    recognition.stop();

    clearTimeout(timer);

    ended = true;
  } else if (ended) {
    setResult("lose");
  } else {
    setResult("try");
  }
};

function setResult(type) {
  if (ended) {
    if (type === "lose") {
      $result.className = "";
      $body.className = "";

      $result.innerText = "You Lose!";
      $result.classList.add("lose");
      $body.classList.add("error");

      $button.classList.remove("hided");
      $button.innerText = "Next";

      $question.innerText = "";

      $timer.classList.add("resetting");
      $timer.classList.remove("count");
    }
  } else {
    $result.className = "";
    $body.className = "";

    switch (type) {
      case "win": {
        $result.innerText = "You won!";
        $result.classList.add("win");

        $timer.className = "";
        $body.classList.add("success");

        $button.classList.remove("hided");
        $button.innerText = "Next";

        $question.innerText = "";

        $timer.classList.add("resetting");
        $timer.classList.remove("count");

        points++;

        $points.innerText = `Score: ${points}`;

        break;
      }
      case "try": {
        $result.innerText = "Try again!";
        $result.classList.add("try");
        $body.classList.add("try-again");

        break;
      }
      default:
        break;
    }
  }
}

recognition.onspeechend = function () {
  recognition.stop();
};
