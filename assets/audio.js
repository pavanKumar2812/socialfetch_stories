import { splitIntoSentences } from "./common.js";

class SpeechController {
  constructor($root) {
    this.$root = $root;
    this.items = new Map();
    this.supportsSpeech = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    this.playback = {
      id: null,
      index: 0,
      sentences: [],
      isPaused: false
    };

    this.bindEvents();
  }

  registerItem(id, text) {
    if (!id) return;
    const normalized = typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
    this.items.set(id, normalized);
  }

  clearItems() {
    this.stop();
    this.items.clear();
  }

  stop() {
    if (this.supportsSpeech) {
      window.speechSynthesis.cancel();
    }

    if (this.playback.id) {
      const $item = this.getItem(this.playback.id);
      this.resetItemUI($item);
    }

    this.playback = {
      id: null,
      index: 0,
      sentences: [],
      isPaused: false
    };
  }

  bindEvents() {
    this.$root.on("click", ".play-btn", (event) => {
      const $item = window.$(event.currentTarget).closest("[data-audio-id]");
      const id = $item.data("audio-id");
      if (!id) return;

      if (!this.supportsSpeech) return;
      if (this.playback.id === id && this.playback.isPaused) {
        this.resume(id);
        return;
      }

      this.start(id);
    });

    this.$root.on("click", ".pause-btn", (event) => {
      const $item = window.$(event.currentTarget).closest("[data-audio-id]");
      const id = $item.data("audio-id");
      if (!id) return;
      this.pause(id);
    });

    this.$root.on("click", ".stop-btn", (event) => {
      const $item = window.$(event.currentTarget).closest("[data-audio-id]");
      const id = $item.data("audio-id");
      if (!id || this.playback.id !== id) return;
      this.stop();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stop();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.stop();
    });
  }

  getItem(id) {
    return this.$root.find(`[data-audio-id="${id}"]`).first();
  }

  setUnavailableUI($item) {
    $item.find(".play-btn").prop("disabled", true).text("Speech Unavailable");
    $item.find(".pause-btn, .stop-btn").prop("disabled", true);
  }

  resetItemUI($item) {
    if (!$item || !$item.length) return;
    $item.removeClass("is-speaking is-playing is-paused");
    $item.find(".sentence").removeClass("active");
    $item.find(".pause-btn, .stop-btn").prop("disabled", true);
    $item.find(".play-btn").prop("disabled", !this.supportsSpeech).text(this.supportsSpeech ? "▶ Play" : "Speech Unavailable");
  }

  setActiveUI($item, isPaused) {
    if (!$item || !$item.length) return;
    $item.addClass("is-speaking");
    $item.toggleClass("is-playing", !isPaused);
    $item.toggleClass("is-paused", isPaused);
    $item.find(".play-btn").text(isPaused ? "▶ Resume" : "▶ Restart");
    $item.find(".pause-btn").prop("disabled", isPaused);
    $item.find(".stop-btn").prop("disabled", false);
  }

  scrollSentenceIntoView($item, sentenceIndex) {
    const $container = $item.find(".speech-content");
    const $sentence = $container.find(`.sentence[data-idx="${sentenceIndex}"]`);
    if (!$container.length || !$sentence.length) return;

    $container.find(".sentence").removeClass("active");
    $sentence.addClass("active");

    const container = $container.get(0);
    const sentence = $sentence.get(0);

    const sentenceTop = sentence.offsetTop;
    const sentenceBottom = sentenceTop + sentence.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (sentenceTop < viewTop || sentenceBottom > viewBottom) {
      $container.stop(true).animate(
        { scrollTop: Math.max(sentenceTop - 20, 0) },
        220
      );
    }

    sentence.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $item.get(0).scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  start(id) {
    if (!this.supportsSpeech) return;

    const text = this.items.get(id) || "";
    const sentences = splitIntoSentences(text);
    if (!sentences.length) return;

    this.stop();
    this.playback.id = id;
    this.playback.index = 0;
    this.playback.sentences = sentences;
    this.playback.isPaused = false;

    this.speakCurrent();
  }

  speakCurrent() {
    const { id, index, sentences, isPaused } = this.playback;
    if (!id || isPaused) return;

    if (index >= sentences.length) {
      this.stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    const $item = this.getItem(id);
    this.setActiveUI($item, false);
    this.scrollSentenceIntoView($item, index);

    utterance.onend = () => {
      if (this.playback.id !== id || this.playback.isPaused) return;
      this.playback.index += 1;
      this.speakCurrent();
    };

    utterance.onerror = () => {
      if (this.playback.id !== id) return;
      this.playback.index += 1;
      this.speakCurrent();
    };

    window.speechSynthesis.speak(utterance);
  }

  pause(id) {
    if (!this.supportsSpeech) return;
    if (this.playback.id !== id || this.playback.isPaused) return;

    window.speechSynthesis.pause();
    this.playback.isPaused = true;
    this.setActiveUI(this.getItem(id), true);
  }

  resume(id) {
    if (!this.supportsSpeech) return;
    if (this.playback.id !== id || !this.playback.isPaused) return;

    window.speechSynthesis.resume();
    this.playback.isPaused = false;
    this.setActiveUI(this.getItem(id), false);
  }
}

export { SpeechController };
