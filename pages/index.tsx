import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize the first chat with an empty title.
  const [chats, setChats] = useState([
    {
      title: 'New Chat',
      messages: [
        {
          role: 'assistant',
          content: `Hi there! I'm PNWER AI — your internal guide for all things related to PNWER. Whether you're prepping for the event, exploring contacts, or need context on key topics, I'm here to help. Just let me know what you're working on!`,
        },
      ],
    },
  ]);

  const [currentChatIndex, setCurrentChatIndex] = useState(0);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add the user's message.
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [
      ...chats[currentChatIndex].messages,
      userMessage,
    ];
    const newChats = [...chats];
    newChats[currentChatIndex].messages = updatedMessages;
    setChats(newChats);
    setInput('');
    setLoading(true);

    // Count user messages (should be 1 for the very first message).
    const userMsgCount = updatedMessages.filter((m) => m.role === 'user').length;

    // Prepare messages for Claude.
    const messagesForClaude = updatedMessages.filter(
      (m) => m.role === 'user' || m.role === 'assistant'
    );

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preprompt: `You are PNWER AI, a helpful and friendly assistant for the 2026 PNWER Annual Summit.`,
          messages: messagesForClaude,
        }),
      });
      const data = await res.json();

      // Append Claude's reply.
      newChats[currentChatIndex].messages = [
        ...updatedMessages,
        { role: 'assistant', content: data.reply },
      ];
      setChats([...newChats]);
      setLoading(false);

      // Rename the chat if this is the very first user message.
      if (userMsgCount === 1) {
        const topicRes = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preprompt:
              'Summarize the user’s first question into a session topic in 5 words maximum, 1 line. If more than 5 words, end with "...".',
            messages: [{ role: 'user', content: input }],
          }),
        });

        const topicData = await topicRes.json();
        let topic = topicData.reply?.replace(/['"\n]/g, '') || '';

        // Force a maximum of 5 words.
        const words = topic.split(/\s+/);
        if (words.length > 5) {
          topic = words.slice(0, 5).join(' ') + '...';
        }

        const renamedChats = [...newChats];
        renamedChats[currentChatIndex].title = topic;
        setChats(renamedChats);
      }
    } catch (err) {
      console.error('Claude API error:', err);
      newChats[currentChatIndex].messages.push({
        role: 'assistant',
        content: '[Error fetching reply]',
      });
      setChats([...newChats]);
      setLoading(false);
    }
  };

  // Start a new blank chat.
  const startNewChat = () => {
    setChats([
      ...chats,
      {
        title: '',
        messages: [
          {
            role: 'assistant',
            content: `Hi there! I'm PNWER AI — your internal guide for all things related to PNWER. Whether you're prepping for the event, exploring contacts, or need context on key topics, I'm here to help. Just let me know what you're working on!`,
          },
        ],
      },
    ]);
    setCurrentChatIndex(chats.length);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4 flex flex-col justify-between">
        <div>
          <img src="/pnwer-logo.png" alt="PNWER Logo" className="w-32 mb-6" />
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600 font-bold">Chats History</p>
            <button onClick={startNewChat}>
              <img
                src="/icon-new-note.png"
                alt="New chat"
                className="w-4 h-4"
              />
            </button>
          </div>
          <ul className="space-y-2">
            {chats.map((chat, i) => (
              <li
                key={i}
                className={`p-2 rounded cursor-pointer text-black truncate ${
                  i === currentChatIndex ? 'bg-gray-200' : ''
                }`}
                onClick={() => setCurrentChatIndex(i)}
                title={chat.title}
              >
                {chat.title
                  ? chat.title.length > 35
                    ? chat.title.slice(0, 35) + '...'
                    : chat.title
                  : ''}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm mt-4 flex items-center gap-2">
          <img
            src="/avatar.png"
            alt="User profile"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-black">Matt Morrison</span>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Messages */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {chats[currentChatIndex].messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const alignment = isUser ? 'self-end' : 'self-start';
            const bgColor = isUser ? 'bg-gray-100' : 'bg-white';
            return (
              <div key={i} className={`${alignment} mb-3`}>
                <div
                  className={`inline-block p-3 rounded-md whitespace-pre-line text-black max-w-[408px] break-words box-border ${bgColor}`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="self-start mb-3">
              <div className="inline-block p-3 rounded-md bg-white text-black animate-pulse max-w-[408px] break-words box-border">
                PNWER AI is typing...
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message PNWER AI"
            className="w-full border border-gray-400 rounded-full px-4 py-2 placeholder-gray-400 text-black bg-gray-100 focus:outline-none focus:ring-0 focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  );
}