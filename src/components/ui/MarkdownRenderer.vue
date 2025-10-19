<template>
  <div class="markdown-content" v-html="renderedMarkdown"></div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";

interface Props {
  content: string;
}

const props = defineProps<Props>();

// Batching optimization
let batchTimer: NodeJS.Timeout | null = null;
const BATCH_DELAY = 50; // 50ms batching delay

// Code block detection
const isInCodeBlock = ref(false);
const codeBlockStart = ref(-1);

// Enhanced markdown parser with code block handling
const parseMarkdown = (text: string): string => {
  let html = text;

  // Check if we're in a code block
  const codeBlockMatches = text.match(/```/g);
  const codeBlockCount = codeBlockMatches ? codeBlockMatches.length : 0;

  // Update code block state
  if (codeBlockCount % 2 === 1 && !isInCodeBlock.value) {
    // Starting a code block
    isInCodeBlock.value = true;
    codeBlockStart.value = text.lastIndexOf("```");
  } else if (codeBlockCount % 2 === 0 && isInCodeBlock.value) {
    // Ending a code block
    isInCodeBlock.value = false;
    codeBlockStart.value = -1;
  }

  // If we're in a code block, handle it specially
  if (isInCodeBlock.value) {
    const beforeCodeBlock = text.substring(0, codeBlockStart.value);
    const codeBlockContent = text.substring(codeBlockStart.value);

    // Parse the part before code block normally
    const parsedBefore = parseMarkdownContent(beforeCodeBlock);

    // Keep code block content as raw text
    const escapedCodeBlock = codeBlockContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    return parsedBefore + escapedCodeBlock;
  }

  // Normal parsing for non-code-block content
  return parseMarkdownContent(text);
};

// Core markdown parsing logic
const parseMarkdownContent = (text: string): string => {
  let html = text;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="md-italic">$1</em>');

  // Lists
  html = html.replace(/^- (.*$)/gim, '<li class="md-list-item">$1</li>');
  html = html.replace(
    /(<li class="md-list-item">.*<\/li>)/s,
    '<ul class="md-list">$1</ul>'
  );
  html = html.replace(
    /^(\d+)\. (.*$)/gim,
    '<li class="md-ordered-item">$2</li>'
  );
  html = html.replace(
    /(<li class="md-ordered-item">.*<\/li>)/s,
    '<ol class="md-ordered-list">$1</ol>'
  );

  // Code blocks (only when not in streaming code block)
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="md-code-block"><code>$1</code></pre>'
  );
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Line breaks
  html = html.replace(/\n/g, '<br class="md-break">');

  return html;
};

// Buffer system for continuous re-parsing
const contentBuffer = ref(props.content);
const renderedContent = ref(parseMarkdown(props.content));

// Continuous re-parsing with batching
const updateRenderedContent = () => {
  renderedContent.value = parseMarkdown(contentBuffer.value);
};

// Batching function for performance optimization
const scheduleUpdate = () => {
  if (batchTimer) {
    clearTimeout(batchTimer);
  }

  batchTimer = setTimeout(() => {
    updateRenderedContent();
    batchTimer = null;
  }, BATCH_DELAY);
};

// Watch for content changes and implement continuous re-parsing
watch(
  () => props.content,
  (newContent, oldContent) => {
    // Update buffer immediately
    contentBuffer.value = newContent;

    // Check if this is streaming (content is being appended)
    const isStreaming = oldContent && newContent.startsWith(oldContent);

    if (isStreaming) {
      // Use batching for streaming to improve performance
      scheduleUpdate();
    } else {
      // For completely new content, update immediately
      if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
      updateRenderedContent();

      // Reset code block state for new content
      isInCodeBlock.value = false;
      codeBlockStart.value = -1;
    }
  }
);

// Computed property for template
const renderedMarkdown = computed(() => {
  return renderedContent.value;
});

// Cleanup timers on unmount
onBeforeUnmount(() => {
  if (batchTimer) {
    clearTimeout(batchTimer);
  }
});
</script>

<style scoped>
.markdown-content {
  line-height: 1.6;
  color: inherit;
}

.markdown-content :deep(.md-h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem 0;
  color: #1e293b;
}

.markdown-content :deep(.md-h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.875rem 0 0.5rem 0;
  color: #1e293b;
}

.markdown-content :deep(.md-h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem 0;
  color: #1e293b;
}

.markdown-content :deep(.md-bold) {
  font-weight: 700;
  color: #1e293b;
}

.markdown-content :deep(.md-italic) {
  font-style: italic;
  color: #64748b;
}

.markdown-content :deep(.md-list) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(.md-ordered-list) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(.md-list-item),
.markdown-content :deep(.md-ordered-item) {
  margin: 0.25rem 0;
  list-style-type: disc;
}

.markdown-content :deep(.md-ordered-item) {
  list-style-type: decimal;
}

.markdown-content :deep(.md-code-block) {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.75rem 0;
  overflow-x: auto;
}

.markdown-content :deep(.md-code-block code) {
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
  color: #1e293b;
  background: transparent;
}

.markdown-content :deep(.md-inline-code) {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
  color: #dc2626;
}

.markdown-content :deep(.md-link) {
  color: #3b82f6;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.markdown-content :deep(.md-link:hover) {
  color: #1e40af;
}

.markdown-content :deep(.md-break) {
  display: block;
  margin: 0.25rem 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .markdown-content :deep(.md-h1),
  .markdown-content :deep(.md-h2),
  .markdown-content :deep(.md-h3),
  .markdown-content :deep(.md-bold) {
    color: #f8fafc;
  }

  .markdown-content :deep(.md-italic) {
    color: #94a3b8;
  }

  .markdown-content :deep(.md-code-block) {
    background: #1e293b;
    border-color: #334155;
  }

  .markdown-content :deep(.md-code-block code) {
    color: #f8fafc;
  }

  .markdown-content :deep(.md-inline-code) {
    background: #1e293b;
    border-color: #334155;
    color: #fca5a5;
  }
}
</style>
