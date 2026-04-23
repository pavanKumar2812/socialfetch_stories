import { db, doc, getDoc } from "./firebase.js";
import {
  escapeHtml,
  splitIntoSentences,
  formatTimestamp,
  mountChrome,
  renderState,
  normalizePost
} from "./common.js";
import { SpeechController } from "./audio.js";

const $postView = window.$("#post-view");
const audioController = new SpeechController($postView);

function getPostIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "";
}

function createPostSkeleton() {
  return `
    <article class="card skeleton" aria-hidden="true">
      <div class="skel-image"></div>
      <div class="card-body">
        <div class="meta-row">
          <div class="skel-pill"></div>
          <div class="skel-line sm"></div>
        </div>
        <div class="skel-line lg"></div>
        <div class="skel-line md"></div>
        <div class="skel-line"></div>
        <div class="skel-line"></div>
        <div class="skel-btn"></div>
      </div>
    </article>
  `;
}

function renderPost(postRaw) {
  audioController.clearItems();

  const post = normalizePost(postRaw, "post");
  const title = escapeHtml(post.title);
  const content = escapeHtml(post.content);
  const type = escapeHtml(post.type);
  const timestamp = formatTimestamp(post.created_at);
  const imageUrl = escapeHtml(post.image_url);
  const sentenceSpans = splitIntoSentences(post.content)
    .map((sentence, sentenceIndex) => `<span class="sentence" data-idx="${sentenceIndex}">${escapeHtml(sentence)} </span>`)
    .join("");

  audioController.registerItem(post.id, post.content);

  $postView.html(`
    <article class="post-main" data-audio-id="${escapeHtml(post.id)}">
      <div class="post-hero">
        <img class="card-image" src="${imageUrl}" alt="${title}" loading="lazy" />
      </div>
      <div class="meta-row">
        <span class="badge">${type}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <h1 class="post-title">${title}</h1>
      <p class="post-reading speech-content" aria-live="polite">${sentenceSpans || content}</p>
      <div class="actions post-actions">
        <button class="control-btn play-btn" type="button" aria-label="Play audio for ${title}">▶ Play</button>
        <button class="control-btn pause-btn" type="button" aria-label="Pause audio for ${title}" disabled>⏸ Pause</button>
        <button class="control-btn stop-btn" type="button" aria-label="Stop audio for ${title}" disabled>⏹ Stop</button>
      </div>
    </article>
  `);

  if (!audioController.supportsSpeech) {
    audioController.setUnavailableUI($postView.find("[data-audio-id]").first());
  }
}

async function loadPost() {
  const postId = getPostIdFromUrl();
  if (!postId) {
    renderState($postView, "Post not found", "Missing post id in URL. Please return to Home and open a story again.", "alert");
    return;
  }

  $postView.html(createPostSkeleton());

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      renderState($postView, "Post not found", "This story does not exist or may have been removed.", "status");
      return;
    }

    renderPost({ id: postSnap.id, ...postSnap.data() });
  } catch (error) {
    console.error("Failed to fetch post", error);
    renderState($postView, "Unable to load post", "Please check your Firebase config and Firestore rules, then refresh.", "alert");
  }
}

function initPage() {
  mountChrome("home");
  loadPost();
}

window.$(document).ready(initPage);
