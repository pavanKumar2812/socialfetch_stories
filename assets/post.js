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
    <div class="skeleton" style="height: 400px; border-radius: 1.5rem; margin-bottom: 2rem;"></div>
    <div class="skeleton" style="height: 40px; width: 60%; margin: 0 auto 2rem; border-radius: 0.5rem;"></div>
    <div class="skeleton" style="height: 20px; width: 100%; margin-bottom: 1rem; border-radius: 0.25rem;"></div>
    <div class="skeleton" style="height: 20px; width: 100%; margin-bottom: 1rem; border-radius: 0.25rem;"></div>
    <div class="skeleton" style="height: 20px; width: 80%; margin-bottom: 1rem; border-radius: 0.25rem;"></div>
  `;
}

function renderPost(postRaw) {
  audioController.clearItems();

  const post = normalizePost(postRaw, "post");
  const title = escapeHtml(post.title);
  const type = escapeHtml(post.type);
  const timestamp = formatTimestamp(post.created_at);
  const imageUrl = escapeHtml(post.image_url);
  
  const sentenceSpans = splitIntoSentences(post.content)
    .map((sentence, sentenceIndex) => `<span class="sentence" data-idx="${sentenceIndex}">${escapeHtml(sentence)} </span>`)
    .join("");

  audioController.registerItem(post.id, post.content);

  $postView.html(`
    <article class="post-detail" data-audio-id="${escapeHtml(post.id)}">
      <header class="post-header">
        <div class="post-meta">
          <span class="badge" style="background: var(--primary-light); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600;">${type}</span>
          <span>${timestamp}</span>
        </div>
        <h1 class="post-title">${title}</h1>
      </header>

      <img class="post-hero-image" src="${imageUrl}" alt="${title}" />

      <div class="post-content speech-content">
        ${sentenceSpans}
      </div>

      <div class="post-audio-sticky">
        <button class="audio-btn play-btn" type="button" title="Play"><i data-lucide="play" size="24"></i></button>
        <button class="audio-btn pause-btn" type="button" title="Pause" disabled><i data-lucide="pause" size="24"></i></button>
        <button class="audio-btn stop-btn" type="button" title="Stop" disabled><i data-lucide="square" size="24"></i></button>
      </div>
    </article>
  `);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (!audioController.supportsSpeech) {
    audioController.setUnavailableUI($postView.find("[data-audio-id]").first());
  }
}

async function loadPost() {
  const postId = getPostIdFromUrl();
  if (!postId) {
    renderState($postView, "Post not found", "Please return to Home and try again.");
    return;
  }

  $postView.html(createPostSkeleton());

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      renderState($postView, "Post not found", "This story may have been removed.");
      return;
    }

    renderPost({ id: postSnap.id, ...postSnap.data() });
  } catch (error) {
    console.error("Failed to fetch post", error);
    renderState($postView, "Unable to load post", "Please check your connection and try again.");
  }
}

function initPage() {
  mountChrome("home");
  loadPost();
}

window.$(document).ready(initPage);
