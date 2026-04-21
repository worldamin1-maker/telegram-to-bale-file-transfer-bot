// ==================== Configuration ====================

const BOT_TOKEN = "TELEGRAM_BOT_TOKEN_HERE"; // Replace with your Telegram bot token
const BALE_BOT_TOKEN = "BALE_BOT_TOKEN_HERE"; // Replace with your Bale bot token
const BOT_WEBHOOK = "/endpoint";

// User Mapping: Telegram Sender → Bale Recipient
// example: { "123456789": "987654321" } means Telegram user with ID 123456789 will have their files sent to Bale user with ID 987654321
const USER_MAPPING = {
  "tg_user_id": "bale_user_id",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 20 MB

// ==================== Event Listener ====================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === BOT_WEBHOOK) {
    return handleWebhook(request);
  }

  if (url.pathname === '/registerWebhook') {
    return registerWebhook(request);
  }

  return new Response('Not Found', { status: 404 });
}

// ==================== Webhook Handlers ====================

async function handleWebhook(request) {
  const update = await request.json();

  if (update.message) {
    await processMessage(update.message);
  }

  return new Response('OK');
}

async function registerWebhook(request) {
  const url = new URL(request.url);
  const webhookUrl = `${url.protocol}//${url.hostname}${BOT_WEBHOOK}`;

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl
    })
  });

  return new Response(await response.text(), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ==================== Message Processing ====================

async function processMessage(message) {
  const userId = message.chat.id;
  const recipientId = USER_MAPPING[userId];

  // Check if user is in mapping
  if (!recipientId) {
    await sendMessage(userId, message.message_id, '❌ You are not authorized to use this bot.');
    return;
  }

  // Handle /start command
  if (message.text && message.text === '/start') {
    const welcomeText = '👋 Welcome!\n\nSend a file to forward to the recipient.\n\n📁 Max file size: 20 MB';
    await sendMessage(userId, message.message_id, welcomeText);
    return;
  }

  // Handle file upload
  if (message.document) {
    await handleFileTransfer(userId, recipientId, message.document);
    return;
  }

  if (message.photo) {
    await handlePhotoTransfer(userId, recipientId, message.photo);
    return;
  }

  if (message.video) {
    await handleVideoTransfer(userId, recipientId, message.video);
    return;
  }

  if (message.audio) {
    await handleAudioTransfer(userId, recipientId, message.audio);
    return;
  }

  await sendMessage(userId, message.message_id, '❌ Please send a file.');
}

// ==================== File Transfer Handlers ====================

async function handleFileTransfer(senderId, recipientId, document) {
  if (document.file_size > MAX_FILE_SIZE) {
    await sendMessage(senderId, null, `❌ Error: File size (${formatSize(document.file_size)}) exceeds max limit (20 MB).`);
    return;
  }

  try {
    await sendMessage(senderId, null, '⏳ Processing...');

    const file = await getFile(document.file_id);
    const fileBuffer = await downloadFile(file.file_path);

    const formData = new FormData();
    formData.append('chat_id', recipientId);
    formData.append('document', new Blob([fileBuffer]), document.file_name || 'file');

    const response = await fetch(`https://tapi.bale.ai/bot${BALE_BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.ok) {
      await sendMessage(senderId, null, '✅ File sent successfully.');
    } else {
      await sendMessage(senderId, null, `❌ Error: ${result.description}`);
    }
  } catch (error) {
    console.error('Error transferring file:', error);
    await sendMessage(senderId, null, '❌ Error while transferring file.');
  }
}

async function handlePhotoTransfer(senderId, recipientId, photos) {
  try {
    await sendMessage(senderId, null, '⏳ Processing...');

    const largestPhoto = photos[photos.length - 1];
    const file = await getFile(largestPhoto.file_id);
    const fileBuffer = await downloadFile(file.file_path);

    const formData = new FormData();
    formData.append('chat_id', recipientId);
    formData.append('photo', new Blob([fileBuffer]), 'photo.jpg');

    const response = await fetch(`https://tapi.bale.ai/bot${BALE_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.ok) {
      await sendMessage(senderId, null, '✅ Photo sent successfully.');
    } else {
      await sendMessage(senderId, null, `❌ Error: ${result.description}`);
    }
  } catch (error) {
    console.error('Error transferring photo:', error);
    await sendMessage(senderId, null, '❌ Error while transferring photo.');
  }
}

async function handleVideoTransfer(senderId, recipientId, video) {
  if (video.file_size > MAX_FILE_SIZE) {
    await sendMessage(senderId, null, `❌ Error: Video size (${formatSize(video.file_size)}) exceeds max limit.`);
    return;
  }

  try {
    await sendMessage(senderId, null, '⏳ Processing...');

    const file = await getFile(video.file_id);
    const fileBuffer = await downloadFile(file.file_path);

    const formData = new FormData();
    formData.append('chat_id', recipientId);
    formData.append('video', new Blob([fileBuffer]), 'video.mp4');
    formData.append('supports_streaming', 'true');

    const response = await fetch(`https://tapi.bale.ai/bot${BALE_BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.ok) {
      await sendMessage(senderId, null, '✅ Video sent successfully.');
    } else {
      await sendMessage(senderId, null, `❌ Error: ${result.description}`);
    }
  } catch (error) {
    console.error('Error transferring video:', error);
    await sendMessage(senderId, null, '❌ Error while transferring video.');
  }
}

async function handleAudioTransfer(senderId, recipientId, audio) {
  if (audio.file_size > MAX_FILE_SIZE) {
    await sendMessage(senderId, null, `❌ Error: Audio file size exceeds max limit.`);
    return;
  }

  try {
    await sendMessage(senderId, null, '⏳ Processing...');

    const file = await getFile(audio.file_id);
    const fileBuffer = await downloadFile(file.file_path);

    const formData = new FormData();
    formData.append('chat_id', recipientId);
    formData.append('audio', new Blob([fileBuffer]), audio.file_name || 'audio.mp3');

    const response = await fetch(`https://tapi.bale.ai/bot${BALE_BOT_TOKEN}/sendAudio`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.ok) {
      await sendMessage(senderId, null, '✅ Audio sent successfully.');
    } else {
      await sendMessage(senderId, null, `❌ Error: ${result.description}`);
    }
  } catch (error) {
    console.error('Error transferring audio:', error);
    await sendMessage(senderId, null, '❌ Error while transferring audio.');
  }
}

// ==================== Telegram API Methods ====================

async function sendMessage(chatId, replyId, text) {
  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };

  if (replyId) {
    params.reply_to_message_id = replyId;
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

async function getFile(fileId) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
  const data = await response.json();
  return data.result;
}

async function downloadFile(filePath) {
  const response = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
  return await response.arrayBuffer();
}

// ==================== Utility Functions ====================

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
