import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...chats[currentChatIndex].messages, userMessage];

    const newChats = [...chats];
    newChats[currentChatIndex].messages = updatedMessages;
    setChats(newChats);
    setInput('');
    setLoading(true);

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
      newChats[currentChatIndex].messages = [
        ...updatedMessages,
        { role: 'assistant', content: data.reply },
      ];
      setChats([...newChats]);
      setLoading(false);

      if (messagesForClaude.length === 1) {
        const topicRes = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preprompt:
              'Try to summarize the first user question into a session topic in 4 words. Keep it 1 line.',
            messages: [{ role: 'user', content: input }],
          }),
        });

        const topicData = await topicRes.json();
        const topic = topicData.reply?.replace(/['"]+/g, '') || 'New Chat';
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

  const startNewChat = () => {
    setChats([...chats, { title: 'New Chat', messages: [] }]);
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
              <img src="/icon-new-note.png" alt="New chat" className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-2">
            {chats.map((chat, i) => (
              <li
                key={i}
                className={`p-2 rounded cursor-pointer text-black ${
                  i === currentChatIndex ? 'bg-gray-200 font-semibold' : ''
                }`}
                onClick={() => setCurrentChatIndex(i)}
              >
                {chat.title}
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
        <div className="p-6 overflow-y-auto flex-1">
          {chats[currentChatIndex].messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-xl px-4 py-2 rounded-md mb-3 whitespace-pre-line text-black ${
                msg.role === 'user'
                  ? 'bg-gray-100 ml-auto'
                  : 'bg-white'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="max-w-xl px-4 py-2 rounded-md mb-3 bg-white text-black animate-pulse">
              PNWER AI is typing...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message PNWER AI"
            className="w-full border rounded-full px-4 py-2 placeholder-gray-400 text-black bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}